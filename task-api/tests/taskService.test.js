const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});
const make=(overridechanges={}) => taskService.create({ title: 'Task', ...overridechanges });

const PAST = '2020-01-01T00:00:00.000Z';
const FUTURE = '2999-01-01T00:00:00.000Z';

describe('create',() => {
  it('applies default values',()=>{
    const task=taskService.create({title:'Buy milk'});
    expect(task.title).toBe('Buy milk');
    expect(task.description).toBe('');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.dueDate).toBeNull();
    expect(task.completedAt).toBeNull();
  });
  it('generates an id and createdAt',()=>{
    const task=make();
    expect(task.id).toBeDefined();
    expect(new Date(task.createdAt).toString()).not.toBe('Invalid date');
  });
  it('uses the values that are passed in',()=>{
    const task=make({status:'in_progress',priority:'high',dueDate:FUTURE});
    expect(task.status).toBe('in_progress');
    expect(task.priority).toBe('high');
    expect(task.dueDate).toBe(FUTURE);
  });
  it('gives every task a unique id',()=>{
    expect(make().id).not.toBe(make().id);
  });
  it('saves the task in the store',()=>{
    const task=make();
    expect(taskService.getAll()).toHaveLength(1);
    expect(taskService.findById(task.id)).toBeDefined();
  });
});

describe('getAll',()=>{
  it('returns an empty array of tasks when there are no tasks',()=>{
    expect(taskService.getAll()).toEqual([]);
  });
  it('returns all tasks',()=>{
    make();make();make();
    expect(taskService.getAll()).toHaveLength(3);
  });
  it('returns a copy, so changing the result does not change the store',()=>{
    make();
    const list=taskService.getAll();
    list.push({fake_task:true});
    expect(taskService.getAll()).toHaveLength(1);
  });
});

describe('findById',()=>{
  it('finds an existing task',()=>{
    const task=make({title:'find me'});
    expect(taskService.findById(task.id).title).toBe('find me');
  });

  it('returns undefined for an unknown id',()=>{
    expect(taskService.findById('doesnt-exist')).toBeUndefined();
  });
});

describe('getByStatus',()=>{
  it('returns only tasks with that exact status',()=>{
    make({status:'todo'});
    make({status:'done'});
    make({status:'done'});
    expect(taskService.getByStatus('done')).toHaveLength(2);
    expect(taskService.getByStatus('todo')).toHaveLength(1);
  });

  it('returns an empty array of tasks when nothing matches',()=>{
    make({status:'todo'});
    expect(taskService.getByStatus('done')).toEqual([]);
  });
});

describe('getPaginated',()=>{
  it('returns less items when the limit is bigger than the list',()=>{
    make();make();
    expect(taskService.getPaginated(1, 10)).toHaveLength(2);
  });
  it('returns an empty array of tasks for a page past the end',()=>{
    make();
    expect(taskService.getPaginated(99, 10)).toEqual([]);
  });
});
describe('getStats',()=>{
  it('returns zeros when there are no tasks',()=>{
    expect(taskService.getStats()).toEqual({todo:0,in_progress:0,done:0,overdue:0});
  });

  it('counts tasks by status',()=>{
    make({status:'todo'});
    make({status:'todo'});
    make({status:'in_progress'});
    make({status:'done'});
    const stats = taskService.getStats();
    expect(stats.todo).toBe(2);
    expect(stats.in_progress).toBe(1);
    expect(stats.done).toBe(1);
  });
  it('counts a past unfinished task as overdue',()=>{
    make({dueDate:PAST});
    expect(taskService.getStats().overdue).toBe(1);
  });
  it('does not count a future due date as overdue',()=>{
    make({dueDate:FUTURE});
    expect(taskService.getStats().overdue).toBe(0);
  });
  it('does not count a done task as overdue',()=>{
    make({dueDate:PAST,status:'done'});
    expect(taskService.getStats().overdue).toBe(0);
  });
  it('does not count a task with no due date as overdue',()=>{
    make();
    expect(taskService.getStats().overdue).toBe(0);
  });
});
describe('update',()=>{
  it('changes the given fields and keeps the rest',()=>{
    const task=make({title:'Old',priority:'low'});
    const updated=taskService.update(task.id,{title:'New'});
    expect(updated.title).toBe('New');
    expect(updated.priority).toBe('low');
  });
  it('saves the change in the store',()=>{
    const task=make({title:'Old'});
    taskService.update(task.id,{title:'New'});
    expect(taskService.findById(task.id).title).toBe('New');
  });
  it('returns null for an unknown id',()=>{
    expect(taskService.update('nope',{title:'X'})).toBeNull();
  });
});
describe('remove',()=>{
  it('deletes the task and returns true',()=>{
    const task=make();
    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.getAll()).toHaveLength(0);
  });
  it('returns false for an unknown id',()=>{
    expect(taskService.remove('nope')).toBe(false);
  });
  it('only removes the requested task',()=>{
    const a=make();make();
    taskService.remove(a.id);
    expect(taskService.getAll()).toHaveLength(1);
  });
});
describe('completeTask',()=>{
  it('sets status to done and fills completedAt',()=>{
    const task=make();
    const done=taskService.completeTask(task.id);
    expect(done.status).toBe('done');
    expect(done.completedAt).not.toBeNull();
  });
  it('saves the change in the store',()=>{
    const task=make();
    taskService.completeTask(task.id);
    expect(taskService.findById(task.id).status).toBe('done');
  });
  it('returns null for an unknown id',()=>{
    expect(taskService.completeTask('nope')).toBeNull();
  });
});
// Bugs
describe('known bugs in taskService',()=>{
  it('getPaginated:page 1 should return the FIRST items',()=>{
    ['A','B','C','D','E'].forEach((title)=>make({title}));
    const titles=taskService.getPaginated(1, 2).map((t)=>t.title);
    expect(titles).toEqual(['A','B']);
  });
  it('getPaginated:page 3 should return the last item',()=>{
    ['A','B','C','D','E'].forEach((title)=>make({title}));
    const titles=taskService.getPaginated(3, 2).map((t)=>t.title);
    expect(titles).toEqual(['E']);
  });
  it('getByStatus:a partial status should not match',()=>{
    make({status:'in_progress'});
    expect(taskService.getByStatus('in')).toEqual([]);
  });
  it('completeTask:should keep the original priority',()=>{
    const task=make({priority:'high'});
    expect(taskService.completeTask(task.id).priority).toBe('high');
  });
  it('update:should not allow changing the id',()=>{
    const task=make();
    const updated=taskService.update(task.id,{id:'hacked'});
    expect(updated.id).toBe(task.id);
  });
});