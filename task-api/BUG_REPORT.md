# Bug Report

Found these while writing tests for `taskService.js`,`validators.js`,and the routes.Listed roughly worst to least bad.Most of them I found because I wrote a test for what I *expected* to happen,and it failed.


### Bug 1—Pagination skips the first page

**File:**`src/services/taskService.js`→`getPaginated()`

```js
const offset=page*limit;
```
If you ask for page 1 (the first thing anyone would try),this skips the first set of results and gives you the second batch instead. With tasks A,B,C,D,E and`page=1&limit=2`,you'd expect `[A,B]` but actually get `[C,D]`.

The math assumes page starts at 0,but nothing tells the caller that,so page 1 behaves like page 2.

**How I found it:** created 5 tasks, called `/tasks?page=1&limit=2`,expected A and B,got C and D.

**Fix:**`const offset=(page - 1)*limit;`

This is the worst one to me,since it's the very first thing someone hits when trying pagination.
### Bug 2—Completing a task resets its priority

**File:** `src/services/taskService.js →`completeTask()`

```js
const updated={
  ...task,
  priority:'medium',
  status:'done',
  completedAt:new Date().toISOString(),
};
```
Not sure why priority gets reset here.Mark a high priority task as done, and it silently becomes medium.No comment explaining it,so it reads like an accident rather than something intentional.

**How I found it:**made a task with `priority:'high'`,hit the complete endpoint,response came back `medium`.

**Fix:**remove the `priority:'medium',`line,leave priority untouched when completing.

**This is the one I actually fixed**—one line,doesn't affect anything else.
### Bug 3—Empty string sneaks past validation

**File:**`src/utils/validators.js`,both`validateCreateTask`and`validateUpdateTask`

```js
if (body.status && !VALID_STATUSES.includes(body.status)){
```

Sending `status: ""`skips this whole check,since an empty string is falsy in JS.So it doesn't even get checked against the valid list.Same thing happens with priority.

**How I found it:** `validateCreateTask({title:'A',status:''})`returned`null`(no error) when it should have flagged status.

**Fix:** check `body.status!==undefined&&...` instead of relying on truthiness.Same fix for priority.

---

### Bug 4—getByStatus` uses `includes()` instead of an exact match

**File:**`src/services/taskService.js`→`getByStatus()`

```js
const getByStatus=(status)=>tasks.filter((t)=>t.status.includes(status));
``` 

`.includes()`checks if the string *contains* something,not if it equals it.So filtering by `status=in`also matches`in_progress`,and`status=`(empty) matches everything.

**Fix:**change `.includes(status)`to`=== status`.

Connects a bit to Bug 3—if an empty status ever gets saved because of that one,filtering could return it unexpectedly too.

---

### Bug 5—`update` lets you overwrite `id` and `createdAt`

**File:**`src/services/taskService.js`→`update()`

```js
const updated={...tasks[index],...fields};
```

This merges whatever gets sent in the body straight over the existing task,no filtering.So sending `{ "id": "something-else" }` in a PUT actually changes the task's id in the store. Probably not something anyone hits by accident,but it shouldn't be possible at all.

**Fix:**pull `id` and `createdAt` out of `fields` before merging,so they can never be changed.

---

### Bug 6—`dueDate` accepts non-ISO formats

**File:**`src/utils/validators.js`

```js
if (body.dueDate && isNaN(Date.parse(body.dueDate))){
  return 'dueDate must be a valid ISO date string';
}
```

The error message says "ISO date string," but `Date.parse` is much more lenient—it happily accepts things like `"March 5, 2026"` or just `"2026"`.So the message promises more than the check actually enforces.

Minor one—more of a consistency issue than something that actually breaks.



### Other things I noticed (not bugs,just worth flagging)

- Validators only return the *first* error they find. Mess up both title and status,and you only find out about title—fix it,resubmit,then find out about status.
- There's no way to `GET` a single task by id—only the full list or filter by status.Feels like a gap.
- You can't filter by status and paginate at the same time—the route checks status first and ignores page/limit if it's present.

### Summary

 Bug | File | Severity | Fixed? 
 Pagination off by one page|taskService.js|High|No 
 Priority resets on complete|taskService.js|Medium|**Yes**
 Empty string skips validation|validators.js|Medium|No
 `includes()` instead of exact match|taskService.js|Low|No 
 `update` can overwrite id|taskService.js|Low|No 
 `dueDate` accepts non-ISO|validators.js|Low|No|

Fixed Bug 2 since it was the simplest most self-contained change.Left the rest as failing tests with comments pointing back to this file.