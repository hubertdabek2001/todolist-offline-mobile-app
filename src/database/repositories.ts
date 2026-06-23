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
}

export interface SubTask {
  id: string;
  task_id: string;
  parent_subtask_id: string | null;
  title: string;
  is_completed: number;
  spent_time_seconds: number;
}

export async function createList(name: string) {
  const db = getDb();
  const id = Crypto.randomUUID(); 
  await db.runAsync(
    'INSERT INTO todo_lists (id, name, is_archived, is_shared) VALUES (?, ?, ?, ?)',
    id, safe(name), 0, 0
  );
  return id;
}

export async function getMyLists() {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM todo_lists WHERE is_archived = ? AND is_shared = ?', 0, 0);
}

export async function getSharedLists() {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM todo_lists WHERE is_archived = ? AND is_shared = ?', 0, 1);
}

export async function getTasksByList(listId: string | string[]): Promise<Task[]> {
  const safeId = Array.isArray(listId) ? listId[0] : listId;
  if (!safeId) return []; 
  
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM tasks WHERE todo_list_id = ?', safe(safeId));
}

export async function getSubTasksForList(listId: string | string[]): Promise<SubTask[]> {
  const safeId = Array.isArray(listId) ? listId[0] : listId;
  if (!safeId) return [];

  const db = getDb();
  return await db.getAllAsync(
    `SELECT st.* FROM sub_tasks st JOIN tasks t ON t.id = st.task_id WHERE t.todo_list_id = ?`,
    safe(safeId)
  );
}

export async function createTask(listId: string | string[], title: string) {
  const safeId = Array.isArray(listId) ? listId[0] : listId;
  const db = getDb();
  const id = Crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO tasks (id, todo_list_id, title, is_completed) VALUES (?, ?, ?, ?)',
    id, safe(safeId), safe(title), 0
  );
  return id;
}

export async function createSubTask(taskId: string, title: string, parentSubTaskId?: string | null) {
  const db = getDb();
  const id = Crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO sub_tasks (id, task_id, parent_subtask_id, title, is_completed) VALUES (?, ?, ?, ?, ?)',
    id, safe(taskId), safe(parentSubTaskId), safe(title), 0
  );
  return id;
}

export async function toggleTaskStatus(taskId: string, currentStatus: number) {
  const db = getDb();
  const newStatus = currentStatus === 1 ? 0 : 1;
  await db.runAsync('UPDATE tasks SET is_completed = ? WHERE id = ?', newStatus, safe(taskId));
  return newStatus;
}

export async function toggleSubTaskStatus(subTaskId: string, currentStatus: number) {
  const db = getDb();
  const newStatus = currentStatus === 1 ? 0 : 1;
  await db.runAsync('UPDATE sub_tasks SET is_completed = ? WHERE id = ?', newStatus, safe(subTaskId));
  return newStatus;
}

export async function getListById(id: string) {
  const safeId = Array.isArray(id) ? id[0] : id;
  const db = getDb();
  return await db.getFirstAsync<{ id: string; name: string; primary_color: string }>(
    'SELECT id, name, primary_color FROM todo_lists WHERE id = ?', 
    safe(safeId)
  );
}

export async function updateListName(id: string, newName: string) {
  const safeId = Array.isArray(id) ? id[0] : id;
  const db = getDb();
  await db.runAsync('UPDATE todo_lists SET name = ? WHERE id = ?', safe(newName), safe(safeId));
}

export async function updateListDetails(id: string, newName: string, newColor: string) {
  const safeId = Array.isArray(id) ? id[0] : id;
  const db = getDb();
  await db.runAsync('UPDATE todo_lists SET name = ?, primary_color = ? WHERE id = ?', safe(newName), safe(newColor), safe(safeId));
}

export async function deleteList(id: string) {
  const safeId = Array.isArray(id) ? id[0] : id;
  const db = getDb();
  // ON DELETE CASCADE usunie automatycznie zadania i podzadania
  await db.runAsync('DELETE FROM todo_lists WHERE id = ?', safe(safeId));
}

export async function deleteTask(taskId: string) {
  const db = getDb();
  await db.runAsync('DELETE FROM tasks WHERE id = ?', safe(taskId));
}

export async function deleteSubTask(subTaskId: string) {
  const db = getDb();
  await db.runAsync('DELETE FROM sub_tasks WHERE id = ?', safe(subTaskId));
}

export async function updateTaskTitle(taskId: string, newTitle: string) {
  const db = getDb();
  await db.runAsync('UPDATE tasks SET title = ? WHERE id = ?', safe(newTitle), safe(taskId));
}

export async function updateSubTaskTitle(subTaskId: string, newTitle: string) {
  const db = getDb();
  await db.runAsync('UPDATE sub_tasks SET title = ? WHERE id = ?', safe(newTitle), safe(subTaskId));
}