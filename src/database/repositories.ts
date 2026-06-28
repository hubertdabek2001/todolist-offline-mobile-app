// src/database/repositories.ts
import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';


const getDb = () => getDatabase();

// 2. TARCZA OCHRONNA: Zmienia wszystko, co jest 'undefined' na bezpiecznego 'nulla' 
// Zapobiega to błędowi NullPointerException na moście Androida
const safe = (val: any) => val === undefined ? null : val;

export interface Task {
  id: string;
  todo_list_id: string;
  title: string;
  description: string;
  is_completed: number;
  spent_time_seconds: number;
  priority: string;
  due_date: string | null;
}

export interface SubTask {
  id: string;
  task_id: string;
  parent_subtask_id: string | null;
  title: string;
  is_completed: number;
  spent_time_seconds: number;
  priority: string;
  due_date: string | null;
}

export interface TodoList {
  id: string;
  name: string;
  is_archived: number;
  is_shared: number;
  primary_color: string;
  priority: string;
  due_date: string | null;
  auto_priority: number;
  edit_mode: number;
  icon?: string | null;
}

export async function createList(name: string) {
  const db = getDb();
  const id = Crypto.randomUUID(); 
  await db.runAsync(
    'INSERT INTO todo_lists (id, name, is_archived, is_shared) VALUES (?, ?, ?, ?)',
    [id, safe(name), 0, 0]
  );
  return id;
}

export async function getMyLists() {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM todo_lists WHERE is_archived = ? AND is_shared = ?', [0, 0]);
}

export async function getSharedLists() {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM todo_lists WHERE is_archived = ? AND is_shared = ?', [0, 1]);
}

export async function getTasksByList(listId: string | string[]): Promise<Task[]> {
  const safeId = Array.isArray(listId) ? listId[0] : listId;
  if (!safeId) return []; 
  
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM tasks WHERE todo_list_id = ?', [safe(safeId)]);
}

export async function getSubTasksForList(listId: string | string[]): Promise<SubTask[]> {
  const safeId = Array.isArray(listId) ? listId[0] : listId;
  if (!safeId) return [];

  const db = getDb();
  return await db.getAllAsync(
    `SELECT st.* FROM sub_tasks st JOIN tasks t ON t.id = st.task_id WHERE t.todo_list_id = ?`,
    [safe(safeId)]
  );
}

export async function createTask(listId: string | string[], title: string) {
  const safeId = Array.isArray(listId) ? listId[0] : listId;
  const db = getDb();
  const id = Crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO tasks (id, todo_list_id, title, is_completed) VALUES (?, ?, ?, ?)',
    [id, safe(safeId), safe(title), 0]
  );
  return id;
}

export async function createSubTask(taskId: string, title: string, parentSubTaskId?: string | null) {
  const db = getDb();
  const id = Crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO sub_tasks (id, task_id, parent_subtask_id, title, is_completed) VALUES (?, ?, ?, ?, ?)',
    [id, safe(taskId), safe(parentSubTaskId), safe(title), 0]
  );
  return id;
}

export async function toggleTaskStatus(taskId: string, currentStatus: number) {
  const db = getDb();
  const newStatus = currentStatus === 1 ? 0 : 1;
  await db.runAsync('UPDATE tasks SET is_completed = ? WHERE id = ?', [newStatus, safe(taskId)]);
  return newStatus;
}

export async function toggleSubTaskStatus(subTaskId: string, currentStatus: number) {
  const db = getDb();
  const newStatus = currentStatus === 1 ? 0 : 1;
  await db.runAsync('UPDATE sub_tasks SET is_completed = ? WHERE id = ?', [newStatus, safe(subTaskId)]);
  return newStatus;
}

export async function getListById(id: string) {
  const safeId = Array.isArray(id) ? id[0] : id;
  const db = getDb();
  return await db.getFirstAsync<{ id: string; name: string; primary_color: string; priority: string; due_date: string | null; auto_priority: number; edit_mode: number }>(
    'SELECT id, name, primary_color, priority, due_date, auto_priority, edit_mode FROM todo_lists WHERE id = ?', 
    [safe(safeId)]
  );
}

export async function updateListName(id: string, newName: string) {
  const safeId = Array.isArray(id) ? id[0] : id;
  const db = getDb();
  await db.runAsync('UPDATE todo_lists SET name = ? WHERE id = ?', [safe(newName), safe(safeId)]);
}

export async function updateListDetails(id: string, newName: string, newColor: string, editMode: number, autoPriority: number, priority: string, dueDate: string | null, icon?: string | null) {
  const safeId = Array.isArray(id) ? id[0] : id;
  const db = getDb();
  await db.runAsync('UPDATE todo_lists SET name = ?, primary_color = ?, edit_mode = ?, auto_priority = ?, priority = ?, due_date = ?, icon = ? WHERE id = ?', [safe(newName), safe(newColor), safe(editMode), safe(autoPriority), safe(priority), safe(dueDate), safe(icon ?? null), safe(safeId)]);
}

export async function updateTaskDetails(taskId: string, newTitle: string, newPriority: string, newDueDate: string | null) {
  const db = getDb();
  await db.runAsync('UPDATE tasks SET title = ?, priority = ?, due_date = ? WHERE id = ?', [safe(newTitle), safe(newPriority), safe(newDueDate), safe(taskId)]);
}

export async function updateSubTaskDetails(subTaskId: string, newTitle: string, newPriority: string, newDueDate: string | null) {
  const db = getDb();
  await db.runAsync('UPDATE sub_tasks SET title = ?, priority = ?, due_date = ? WHERE id = ?', [safe(newTitle), safe(newPriority), safe(newDueDate), safe(subTaskId)]);
}

export async function evaluateAutoPriority(listId: string) {
  const safeId = Array.isArray(listId) ? listId[0] : listId;
  const db = getDb();
  
  const list = await db.getFirstAsync<{ id: string; auto_priority: number; due_date: string | null }>('SELECT id, auto_priority, due_date FROM todo_lists WHERE id = ?', [safe(safeId)]);
  
  if (!list || list.auto_priority !== 1) return;

  const todayStr = new Date().toISOString().split('T')[0];

  // Update List Priority
  if (list.due_date && list.due_date <= todayStr) {
      await db.runAsync("UPDATE todo_lists SET priority = 'high' WHERE id = ?", [safe(safeId)]);
  }

  // Update Tasks Priority
  await db.runAsync("UPDATE tasks SET priority = 'high' WHERE todo_list_id = ? AND due_date IS NOT NULL AND due_date <= ?", [safe(safeId), todayStr]);
  
  // Update SubTasks Priority
  await db.runAsync(`
    UPDATE sub_tasks 
    SET priority = 'high' 
    WHERE due_date IS NOT NULL 
      AND due_date <= ? 
      AND task_id IN (SELECT id FROM tasks WHERE todo_list_id = ?)
  `, [todayStr, safe(safeId)]);
}

export async function deleteList(id: string) {
  const safeId = Array.isArray(id) ? id[0] : id;
  const db = getDb();
  // ON DELETE CASCADE usunie automatycznie zadania i podzadania
  await db.runAsync('DELETE FROM todo_lists WHERE id = ?', [safe(safeId)]);
}

export async function deleteTask(taskId: string) {
  const db = getDb();
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [safe(taskId)]);
}

export async function deleteSubTask(subTaskId: string) {
  const db = getDb();
  await db.runAsync('DELETE FROM sub_tasks WHERE id = ?', [safe(subTaskId)]);
}

export async function updateTaskTitle(taskId: string, newTitle: string) {
  const db = getDb();
  await db.runAsync('UPDATE tasks SET title = ? WHERE id = ?', [safe(newTitle), safe(taskId)]);
}

export async function updateSubTaskTitle(subTaskId: string, newTitle: string) {
  const db = getDb();
  await db.runAsync('UPDATE sub_tasks SET title = ? WHERE id = ?', [safe(newTitle), safe(subTaskId)]);
}

export async function applyPulledData(data: any): Promise<void> {
  const db = getDatabase();

  try {
    for (const list of data.lists || []) {
      if (list.isArchived) {
        // Jeśli lista jest w chmurze zarchiwizowana, USUŃ ją z lokalnego SQLite
        await db.runAsync('DELETE FROM todo_lists WHERE id = ?', list.id);
        // SQLite nie zawsze wspiera kaskady domyślnie, więc kasujemy też jej zadania
        await db.runAsync('DELETE FROM tasks WHERE todo_list_id = ?', list.id);
      } else {
        // Jeśli nie jest, wstaw/nadpisz tak jak dotychczas
        await db.runAsync(
          'INSERT OR REPLACE INTO todo_lists (id, name, is_archived, is_shared, spent_time_seconds, primary_color, icon, priority, due_date, auto_priority, edit_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          list.id, list.name, 0, list.isShared ? 1 : 0, list.spentTimeSeconds || 0,
          list.primaryColor || '#ffffff', list.icon || null, list.priority || 'normal', list.dueDate || null, list.autoPriority ? 1 : 0, list.editMode || 0
        );
      }
    }

    // Wstawianie lub nadpisywanie zadań
    for (const task of data.tasks || []) {
      await db.runAsync(
        'INSERT OR REPLACE INTO tasks (id, todo_list_id, title, is_completed, spent_time_seconds, description, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        task.id, task.todoListId, task.title, task.isCompleted ? 1 : 0, task.spentTimeSeconds || 0, task.description || "", task.priority || 'normal', task.dueDate || null
      );
    }

    // Wstawianie lub nadpisywanie podzadań
    for (const sub of data.subTasks || []) {
      await db.runAsync(
        'INSERT OR REPLACE INTO sub_tasks (id, task_id, title, is_completed, spent_time_seconds, parent_subtask_id, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        sub.id, sub.taskId, sub.title, sub.isCompleted ? 1 : 0, sub.spentTimeSeconds || 0, sub.parentSubTaskId || null, sub.priority || 'normal', sub.dueDate || null
      );
    }
    
    console.log("[SYNC] Pomyślnie zaciągnięto i zapisano stan z chmury do SQLite.");
  } catch (error) {
    console.error("[SYNC] Błąd podczas wgrywania zaciągniętych danych:", error);
  }
}


export async function clearAllLocalData() {
  const db = getDb();
  try {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    await db.execAsync('DELETE FROM sub_tasks;');
    await db.execAsync('DELETE FROM tasks;');
    await db.execAsync('DELETE FROM todo_lists;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    console.log("[DB] Pomyślnie usunięto wszystkie dane z bazy (tylko na tym urządzeniu).");
  } catch (error) {
    console.error("[DB] Błąd podczas usuwania wszystkich danych lokalnych:", error);
    throw error;
  }
}
