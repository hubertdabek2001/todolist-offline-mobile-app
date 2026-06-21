// src/database/database.ts
import * as SQLite from 'expo-sqlite';

// Funkcja otwierająca bazę danych i tworząca schemat
export async function initDatabase() {
  // Otwieramy bazę asynchronicznie
  const db = await SQLite.openDatabaseAsync('todolist.db');

  // Włączamy obsługę kluczy obcych (wymagane w SQLite, by relacje zadziałały)
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Tworzymy tabele
  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS todo_lists (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        due_date TEXT,
        primary_color TEXT DEFAULT '#ffffff',
        secondary_color TEXT DEFAULT '#f8fafc',
        spent_time_seconds INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        is_shared INTEGER DEFAULT 0 -- NOWA KOLUMNA (0 = Moja lista, 1 = Współdzielona)
      );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      todo_list_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_completed INTEGER DEFAULT 0,
      due_date TEXT,
      spent_time_seconds INTEGER DEFAULT 0,
      FOREIGN KEY (todo_list_id) REFERENCES todo_lists (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sub_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      parent_subtask_id TEXT,
      title TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      due_date TEXT,
      spent_time_seconds INTEGER DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
      FOREIGN KEY (parent_subtask_id) REFERENCES sub_tasks (id) ON DELETE CASCADE
    );
  `);

  return db;
}