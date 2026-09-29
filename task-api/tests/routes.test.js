const request = require('supertest');
const app = require('../src/app');           
const taskService = require('../src/services/taskService');
beforeEach(()=>{
  taskService._reset();
});
// X -> For dummy title
describe('POST /tasks',()=>{
  it('create a task and returns 201',async()=>{
    const res=await request(app)
      .post('/tasks')
      .send({title:'Buy milk',priority:'high'});
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Buy milk');
    expect(res.body.id).toBeDefined();
  });
  it('return 400 for a missing title',async()=>{
    const res=await request(app).post('/tasks').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
  });
  it('return 400 for an invalid priority',async()=>{
    const res=await request(app).post('/tasks').send({title:'X',priority:'urgent'});
    expect(res.status).toBe(400);
  });
});
describe('GET /tasks',()=>{
  it('return an empty array when there are no tasks',async()=>{
    const res=await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
  it('return all tasks',async()=>{
    await request(app).post('/tasks').send({title:'A'});
    await request(app).post('/tasks').send({title:'B'});
    const res=await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
  it('filter by status',async()=>{
    await request(app).post('/tasks').send({title:'A',status:'done'});
    await request(app).post('/tasks').send({title:'B',status:'todo'});
    const res=await request(app).get('/tasks?status=done');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('A');
  });
  it('paginate results',async()=>{
    for (const title of ['A','B','C','D','E']){
      await request(app).post('/tasks').send({title});
    }
    const res=await request(app).get('/tasks?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.map((t)=>t.title)).toEqual(['A','B']);
  });
});
describe('GET /tasks/stats',()=>{
  it('return counts and overdue',async()=>{
    await request(app).post('/tasks').send({title:'A',status:'todo'});
    await request(app).post('/tasks').send({title:'B',status:'done'});
    const res = await request(app).get('/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body.todo).toBe(1);
    expect(res.body.done).toBe(1);
    expect(res.body.overdue).toBe(0);
  });
});
describe('PUT /tasks/:id',()=>{
  it('update a task',async()=>{
    const created=await request(app).post('/tasks').send({title:'Old'});
    const res=await request(app).put(`/tasks/${created.body.id}`).send({title:'New'});
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New');
  });
  it('returns 404 for an unknown id',async()=>{
    const res=await request(app).put('/tasks/does-not-exist').send({title:'New'});
    expect(res.status).toBe(404);
  });
  it('returns 400 for invalid update data',async()=>{
    const created=await request(app).post('/tasks').send({title:'Old'});
    const res=await request(app).put(`/tasks/${created.body.id}`).send({status:'bad'});
    expect(res.status).toBe(400);
  });
});
describe('DELETE /tasks/:id',()=>{
  it('deletes a task and returns 204',async()=>{
    const created=await request(app).post('/tasks').send({title:'X'});
    const res=await request(app).delete(`/tasks/${created.body.id}`);
    expect(res.status).toBe(204);
    const list=await request(app).get('/tasks');
    expect(list.body).toHaveLength(0);
  });
  it('returns 404 for an unknown id',async()=>{
    const res=await request(app).delete('/tasks/does-not-exist');
    expect(res.status).toBe(404);
  });
});
describe('PATCH /tasks/:id/assign',()=>{
  it('assigns a task and returns it with the assignee set',async()=>{
    const created=await request(app).post('/tasks').send({title:'X'});
    const res=await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({assignee:'John'});
    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe('John');
  });
  it('returns 404 for an unknown id',async()=>{
    const res=await request(app)
      .patch('/tasks/does-not-exist/assign')
      .send({assignee:'John'});
    expect(res.status).toBe(404);
  });
  it('returns 400 for an empty assignee',async()=>{
    const created=await request(app).post('/tasks').send({title:'X'});
    const res=await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({assignee:''});
    expect(res.status).toBe(400);
  });
});
describe('PATCH /tasks/:id/complete',()=>{
  it('marks a task as complete',async()=>{
    const created=await request(app).post('/tasks').send({title:'X'});
    const res=await request(app).patch(`/tasks/${created.body.id}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).not.toBeNull();
  });
  it('returns 404 for an unknown id',async()=>{
    const res=await request(app).patch('/tasks/does-not-exist/complete');
    expect(res.status).toBe(404);
  });
  it('should keep the original priority after completing',async()=>{
    const created=await request(app).post('/tasks').send({title:'X',priority:'high'});
    const res=await request(app).patch(`/tasks/${created.body.id}/complete`);
    expect(res.body.priority).toBe('high');
  });
});
