# Notes

## What I'd test next with more time

- Concurrent requests—the store is a plain in-memory array with no locking,so I'd want to check what happens if two requests hit `update` or `remove` on the same id at nearly the same time.
- More validation edge cases on `dueDate`—right now `Date.parse` accepts a lot of loose formats that don't really count as "ISO",so I'd want a proper regex or a stricter check there.
- The new `/assign` endpoint against very long assignee names,whitespace-only names,and non-ASCII characters,since I only handled the obvious empty-string case.
- Load/volume:what happens with a few thousand tasks in `getAll`/`getPaginated`—no indexing,so this is a plain array scan every time.

## What surprised me

- Pagination math (`page*limit`) assumes 0-indexed pages,but nothing in the API or docs says to start at page 0—so`page=1`,the value anyone would naturally try first,actually returns the second page of results.
- The README and ASSIGNMENT.md disagree on the task `status` values (`pending/in-progress/completed`vs`todo/in_progress/done`)—the code uses the latter,so the README looks like it's out of date.
- `completeTask` resets `priority` back to `medium` on completion,with no comment explaining why—that felt like an accidental side effect rather than an intentional design choice,so I fixed it.
- Validation functions short-circuit on falsy values (`body.status&&...`),which means an empty string quietly skips validation instead of getting rejected.Small thing,easy to miss.

## Questions I'd ask before shipping this to production

- Should `PUT /tasks/:id` be a full replace or a partial update?Right now it behaves like a partial update (merges fields) but is exposed under the semantics of `PUT`,which usually implies a full replacement.
- Is there any auth/authorization planned? Right now anyone who can reach the API can create, edit,delete,or assign any task.
- Is the in-memory store intentional for now (e.g. this is a prototype),or is a real database expected before this goes live?Losing all data on every restart seems fine for a take-home but not for production.
- For `/assign`,should a task support multiple assignees,or is one name always enough?I assumed one for now.