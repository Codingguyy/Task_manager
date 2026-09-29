const { validateCreateTask, validateUpdateTask } = require('../src/utils/validators');
const goodTask={
  title:'Buy milk',
  status:'todo',
  priority:'low',
  dueDate:'2026-10-01T00:00:00.000Z',
};

describe('validateCreateTask',()=>{
  describe('valid input',()=>{
    it('accepts a fully valid task',()=>{
      expect(validateCreateTask(goodTask)).toBeNull();
    });

    it('accepts a task with only a title',()=>{
      expect(validateCreateTask({title:'Buy milk'})).toBeNull();
    });

    it.each(['todo','in_progress','done'])('accepts status %s',(status)=>{
      expect(validateCreateTask({...goodTask,status})).toBeNull();
    });
    it.each(['low','medium','high'])('accepts priority %s',(priority)=>{
      expect(validateCreateTask({...goodTask,priority})).toBeNull();
    });
  });

  describe('title',()=>{
    it('rejects a missing title',()=>{
      const {title,...noTitle}=goodTask;
      expect(validateCreateTask(noTitle)).toMatch(/title/);
    });
    it('rejects an empty title',()=>{
      expect(validateCreateTask({...goodTask,title:''})).toMatch(/title/);
    });
    it('rejects a spaces-only title',()=>{
      expect(validateCreateTask({...goodTask,title:'   '})).toMatch(/title/);
    });
    it('rejects a non-string title',()=>{
      expect(validateCreateTask({...goodTask,title:123})).toMatch(/title/);
    });
  });

  describe('other fields',()=>{
    it('rejects a bad status',()=>{
      expect(validateCreateTask({...goodTask,status:'pending'})).toMatch(/status/);
    });
    it('rejects a bad priority',()=>{
      expect(validateCreateTask({...goodTask,priority:'urgent'})).toMatch(/priority/);
    });
    it('rejects a bad dueDate',()=>{
      expect(validateCreateTask({...goodTask,dueDate:'abc'})).toMatch(/dueDate/);
    });
  });

  describe('error order',()=>{
    it('reports title before status',()=>{
      expect(validateCreateTask({...goodTask,title:'',status:'x' })).toMatch(/title/);
    });
    it('reports status before priority',()=>{
      expect(validateCreateTask({...goodTask,status:'x',priority:'y'})).toMatch(/status/);
    });
    it('reports priority before dueDate',()=>{
      expect(validateCreateTask({...goodTask,priority:'y',dueDate:'abc'})).toMatch(/priority/);
    });
  });
});

describe('validateUpdateTask',()=>{
  describe('valid input',()=>{
    it('accepts an empty body',()=>{
      expect(validateUpdateTask({})).toBeNull();
    });
    it('accepts a fully valid task',()=>{
      expect(validateUpdateTask(goodTask)).toBeNull();
    });
    it('accepts an update with only one field',()=>{
      expect(validateUpdateTask({priority:'high'})).toBeNull();
    });
  });

  describe('title',()=>{
    it('rejects an empty title',()=>{
      expect(validateUpdateTask({title:''})).toMatch(/title/);
    });
    it('rejects a spaces-only title',()=>{
      expect(validateUpdateTask({title:'   '})).toMatch(/title/);
    });
    it('rejects a non-string title',()=>{
      expect(validateUpdateTask({title:123})).toMatch(/title/);
    });
  });

  describe('other fields',()=>{
    it('rejects a bad status',()=>{
      expect(validateUpdateTask({...goodTask,status:'pending'})).toMatch(/status/);
    });
    it('rejects a bad priority',()=>{
      expect(validateUpdateTask({...goodTask,priority:'urgent'})).toMatch(/priority/);
    });
    it('rejects a bad dueDate',()=>{
      expect(validateUpdateTask({...goodTask,dueDate:'abc'})).toMatch(/dueDate/);
    });
  });
});
describe('known bugs in validators', () => {
  it('should reject an empty-string status (create)',()=>{
    expect(validateCreateTask({...goodTask,status:''})).toMatch(/status/);
  });
  it('should reject an empty-string status (update)',()=>{
    expect(validateUpdateTask({status:''})).toMatch(/status/);
  });
  it('should reject an empty-string priority',()=>{
    expect(validateCreateTask({...goodTask,priority:''})).toMatch(/priority/);
  });
  it('should report all errors at once',()=>{
    const result=validateCreateTask({title:'',status:'x',priority:'y'});
    expect(result).toMatch(/title/);
    expect(result).toMatch(/status/);
    expect(result).toMatch(/priority/);
  });
  it('should reject a non-ISO date string',()=>{
    expect(validateCreateTask({...goodTask,dueDate:'March 5, 2026'})).toMatch(/dueDate/);
  });
  it('should not crash when body is undefined',()=>{
    expect(() =>validateCreateTask(undefined)).not.toThrow();
  });
});