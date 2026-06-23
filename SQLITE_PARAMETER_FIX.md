# SQLite Parameter Format Fix

## Issue
Error: "The 2nd argument cannot be cast to type class expo.modules.sqlite.NativeStatement (received class java.lang.Integer)"

This error occurred because SQLite query parameters were being passed as positional arguments instead of as an array.

## Root Cause
Expo SQLite v56 requires all query parameters to be passed as an **array**, not as individual positional arguments.

### ❌ WRONG (Old Code)
```typescript
await db.getAllAsync('SELECT * FROM todo_lists WHERE is_archived = ? AND is_shared = ?', 0, 0);
await db.runAsync('INSERT INTO tasks (...) VALUES (?, ?, ?, ?)', id, safeId, title, 0);
```

### ✅ CORRECT (Fixed Code)
```typescript
await db.getAllAsync('SELECT * FROM todo_lists WHERE is_archived = ? AND is_shared = ?', [0, 0]);
await db.runAsync('INSERT INTO tasks (...) VALUES (?, ?, ?, ?)', [id, safeId, title, 0]);
```

## Changes Made

### File: `src/database/repositories.ts`

All database query calls updated to use array syntax:

1. **`createList()`** - Added array syntax to `runAsync`
2. **`getMyLists()`** - Added array syntax to `getAllAsync`
3. **`getSharedLists()`** - Added array syntax to `getAllAsync`
4. **`getTasksByList()`** - Added array syntax to `getAllAsync`
5. **`getSubTasksForList()`** - Added array syntax to `getAllAsync`
6. **`createTask()`** - Added array syntax to `runAsync`
7. **`createSubTask()`** - Added array syntax to `runAsync`
8. **`toggleTaskStatus()`** - Added array syntax to `runAsync`
9. **`toggleSubTaskStatus()`** - Added array syntax to `runAsync`
10. **`getListById()`** - Added array syntax to `getFirstAsync`
11. **`updateListName()`** - Added array syntax to `runAsync`
12. **`updateListDetails()`** - Added array syntax to `runAsync`
13. **`updateTaskDetails()`** - Added array syntax to `runAsync`
14. **`updateSubTaskDetails()`** - Added array syntax to `runAsync`
15. **`evaluateAutoPriority()`** - Added array syntax to all `runAsync` and `getFirstAsync` calls
16. **`deleteList()`** - Added array syntax to `runAsync`
17. **`deleteTask()`** - Added array syntax to `runAsync`
18. **`deleteSubTask()`** - Added array syntax to `runAsync`
19. **`updateTaskTitle()`** - Added array syntax to `runAsync`
20. **`updateSubTaskTitle()`** - Added array syntax to `runAsync`

## Pattern Applied
```typescript
// All database methods now use this pattern:
db.runAsync(sqlQuery, [param1, param2, param3])
db.getAllAsync(sqlQuery, [param1, param2])
db.getFirstAsync(sqlQuery, [param1])
```

## Verification
All query methods now properly pass parameters as arrays to the Expo SQLite native bridge, eliminating the type casting error.
