// src/database/database.ts
import * as SQLite from 'expo-sqlite';

export async function initDatabase() {
  const db = await SQLite.openDatabaseAsync('todolist.db');

  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Tworzymy tabele (dla nowych instalacji)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS todo_lists (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      due_date TEXT,
      primary_color TEXT DEFAULT '#ffffff',
      secondary_color TEXT DEFAULT '#f8fafc',
      spent_time_seconds INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      is_shared INTEGER DEFAULT 0
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

  // --- MIGRACJA SCHEMATU ---
  // Próbujemy dodać nową kolumnę dla użytkowników (np. Ciebie), 
  // którzy mają starą wersję tabeli z poprzednich etapów testów.
  try {
    await db.execAsync('ALTER TABLE todo_lists ADD COLUMN is_shared INTEGER DEFAULT 0;');
    console.log("Dodano brakującą kolumnę is_shared do bazy danych!");
  } catch (e) {
    // Błąd tutaj oznacza, że kolumna "is_shared" już istnieje (co jest pożądane).
    // Możemy go bezpiecznie zignorować.
  }

  return db;
}