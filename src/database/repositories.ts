// src/database/repositories.ts
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

// Pobieramy instancję bazy
const getDb = async () => await SQLite.openDatabaseAsync('todolist.db');

export async function createList(name: string) {
  const db = await getDb();
  // Generujemy losowy identyfikator UUID (odpowiednik ułamkowych sekund na kolizje)
  const id = Crypto.randomUUID(); 

  await db.runAsync(
    'INSERT INTO todo_lists (id, name, is_archived) VALUES (?, ?, ?)',
    id, name, 0
  );
  return id;
}

export async function getMyLists() {
  const db = await SQLite.openDatabaseAsync('todolist.db');
  // Pobieramy tylko listy NIEarchiwizowane i NIEwspółdzielone
  return await db.getAllAsync('SELECT * FROM todo_lists WHERE is_archived = 0 AND is_shared = 0');
}

export async function getSharedLists() {
  const db = await SQLite.openDatabaseAsync('todolist.db');
  // Pobieramy tylko listy współdzielone (z kodów QR)
  return await db.getAllAsync('SELECT * FROM todo_lists WHERE is_archived = 0 AND is_shared = 1');
}

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

// Pobieranie zadań dla danej listy
export async function getTasksByList(listId: string): Promise<Task[]> {
  if (!listId) return []; // Dodaj to zabezpieczenie
  
  const db = await SQLite.openDatabaseAsync('todolist.db');
  return await db.getAllAsync('SELECT * FROM tasks WHERE todo_list_id = ?', listId);
}

export async function getSubTasksForList(listId: string): Promise<SubTask[]> {
  if (!listId) return []; // Dodaj to zabezpieczenie

  const db = await SQLite.openDatabaseAsync('todolist.db');
  return await db.getAllAsync(
    `SELECT st.* FROM sub_tasks st 
     JOIN tasks t ON t.id = st.task_id 
     WHERE t.todo_list_id = ?`,
    listId
  );
}

// Dodawanie nowego zadania
export async function createTask(listId: string, title: string) {
  const db = await SQLite.openDatabaseAsync('todolist.db');
  const id = Crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO tasks (id, todo_list_id, title, is_completed) VALUES (?, ?, ?, 0)',
    id, listId, title
  );
  return id;
}

// Dodawanie nowego podzadania
export async function createSubTask(taskId: string, title: string, parentSubTaskId?: string | null) {
  const db = await SQLite.openDatabaseAsync('todolist.db');
  const id = Crypto.randomUUID();
  
  await db.runAsync(
    'INSERT INTO sub_tasks (id, task_id, parent_subtask_id, title, is_completed) VALUES (?, ?, ?, ?, 0)',
    id, 
    taskId, 
    parentSubTaskId ?? null, // KRYTYCZNE: wymuszenie null zamiast undefined
    title
  );
  return id;
}

// Zmiana statusu ukończenia zadania
export async function toggleTaskStatus(taskId: string, currentStatus: number) {
  const db = await SQLite.openDatabaseAsync('todolist.db');
  const newStatus = currentStatus === 1 ? 0 : 1;
  await db.runAsync('UPDATE tasks SET is_completed = ? WHERE id = ?', newStatus, taskId);
  return newStatus;
}

// Zmiana statusu ukończenia podzadania
export async function toggleSubTaskStatus(subTaskId: string, currentStatus: number) {
  const db = await SQLite.openDatabaseAsync('todolist.db');
  const newStatus = currentStatus === 1 ? 0 : 1;
  await db.runAsync('UPDATE sub_tasks SET is_completed = ? WHERE id = ?', newStatus, subTaskId);
  return newStatus;
}