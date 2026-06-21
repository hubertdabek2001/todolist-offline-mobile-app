# Task Edit/Delete & SafeAreaView Deprecation Fix

## Issues Fixed

### 1. SafeAreaView Deprecation Warning
**Problem**: React Native deprecated `SafeAreaView` in favor of using the `useSafeAreaInsets()` hook from `react-native-safe-area-context`.

**Solution**: Replaced all `SafeAreaView` components with `View` + `useSafeAreaInsets()` hook.

**Files Updated**:
- ✅ `app/index.tsx` - Uses hook for paddingBottom
- ✅ `app/list/[id].tsx` - Uses hook for top and bottom padding (keyboard)
- ✅ `app/list/edit/[id].tsx` - Uses hook for top padding

### 2. Task Edit & Delete Functionality
**New Database Functions** in `src/database/repositories.ts`:
- ✅ `deleteTask(taskId)` - Delete a task
- ✅ `deleteSubTask(subTaskId)` - Delete a subtask
- ✅ `updateTaskTitle(taskId, newTitle)` - Edit task name
- ✅ `updateSubTaskTitle(subTaskId, newTitle)` - Edit subtask name

**UI Changes** in `app/list/[id].tsx`:
- ✅ Added edit mode state management
- ✅ Pencil icon for editing tasks/subtasks (appears on each task)
- ✅ Trash icon for deleting tasks/subtasks (with confirmation)
- ✅ Long-press task to activate edit mode
- ✅ Inline text editing with blue highlight background
- ✅ Save on blur (auto-save when tapping away)
- ✅ Alert confirmation dialogs for destructive actions
- ✅ New `editInput` style for inline editing

## User Interface

### Editing Tasks
- **Method 1**: Tap the pencil ✏️ icon next to any task
- **Method 2**: Long-press on task title to enter edit mode
- Type new name and tap away to auto-save
- Works for both main tasks and subtasks

### Deleting Tasks
- Tap the trash 🗑️ icon next to any task
- Confirm in the popup dialog
- Deletion cascades for main tasks (removes subtasks automatically)
- Works for both main tasks and subtasks

### New UI Elements
- Pencil icon: Edit mode
- Trash icon: Delete (with confirmation)
- Blue highlight input: Active edit field
- Two new icons appear next to the existing "add subtask" button

## Technical Details

### SafeAreaView Hook Pattern
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Component() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ paddingTop: insets.top }}>
      {/* content */}
    </View>
  );
}
```

### Edit State Management
- `editingTaskId` / `editingSubTaskId` - Track which item is being edited
- `editingTaskTitle` / `editingSubTaskTitle` - Store the edited text
- Inline TextInput with auto-save on blur
- Visual feedback with blue border and light blue background

### Delete Flow
- Alert confirmation dialog shows task title
- "Delete" button marked as destructive (red)
- After deletion, list reloads automatically
- Cascading deletes handled by database schema

## Testing Checklist
- [ ] Edit task - tap pencil icon
- [ ] Edit task - long press title
- [ ] Edit subtask - tap pencil icon
- [ ] Delete task - confirm dialog appears
- [ ] Delete subtask - confirm dialog appears
- [ ] Keyboard positioning works on task list
- [ ] Bottom padding applies correctly on iOS
- [ ] No SafeAreaView warnings in console
