// src/database/database.ts
import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function initDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync('todolist.db');
  dbInstance = db;

  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Tworzenie tabel dla nowych instalacji
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS todo_lists (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        due_date TEXT,
        primary_color TEXT DEFAULT '#ffffff',
        secondary_color TEXT DEFAULT '#f8fafc',
        spent_time_seconds INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        is_shared INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'normal',
        auto_priority INTEGER DEFAULT 0,
        edit_mode INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        todo_list_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        is_completed INTEGER DEFAULT 0,
        due_date TEXT,
        priority TEXT DEFAULT 'normal',
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
        priority TEXT DEFAULT 'normal',
        spent_time_seconds INTEGER DEFAULT 0,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
        FOREIGN KEY (parent_subtask_id) REFERENCES sub_tasks (id) ON DELETE CASCADE
      );
    `);

    // --- NIEZAWODNA MIGRACJA SCHEMATU ---
    // Odpytujemy SQLite o strukturę tabeli todo_lists
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(todo_lists);');
    
    // Sprawdzamy, czy nasza nowa kolumna znajduje się na liście
    const hasIsShared = columns.some(col => col.name === 'is_shared');
    const hasPrimaryColor = columns.some(col => col.name === 'primary_color');
    const hasPriority = columns.some(col => col.name === 'priority');
    const hasDueDate = columns.some(col => col.name === 'due_date');
    const hasAutoPriority = columns.some(col => col.name === 'auto_priority');
    const hasEditMode = columns.some(col => col.name === 'edit_mode');

    if (!hasIsShared) {
      console.log("Wykryto brakującą kolumnę! Trwa aktualizacja bazy...");
      // Używamy runAsync, co na Androidzie działa stabilniej dla operacji strukturalnych
      await db.runAsync('ALTER TABLE todo_lists ADD COLUMN is_shared INTEGER DEFAULT 0;');
      console.log("Kolumna is_shared została pomyślnie dodana.");
    }

    if (!hasPrimaryColor) {
      console.log("Wykryto brakującą kolumnę primary_color! Trwa aktualizacja bazy...");
      await db.runAsync("ALTER TABLE todo_lists ADD COLUMN primary_color TEXT DEFAULT '#ffffff';");
      console.log("Kolumna primary_color została pomyślnie dodana.");
    }

    if (!hasPriority) {
      console.log("Wykryto brakującą kolumnę priority! Trwa aktualizacja bazy...");
      await db.runAsync("ALTER TABLE todo_lists ADD COLUMN priority TEXT DEFAULT 'normal';");
      console.log("Kolumna priority została pomyślnie dodana do todo_lists.");
    }

    if (!hasDueDate) {
      console.log("Wykryto brakującą kolumnę due_date! Trwa aktualizacja bazy...");
      await db.runAsync("ALTER TABLE todo_lists ADD COLUMN due_date TEXT;");
      console.log("Kolumna due_date została pomyślnie dodana do todo_lists.");
    }

    if (!hasAutoPriority) {
      console.log("Wykryto brakującą kolumnę auto_priority! Trwa aktualizacja bazy...");
      await db.runAsync("ALTER TABLE todo_lists ADD COLUMN auto_priority INTEGER DEFAULT 0;");
      console.log("Kolumna auto_priority została pomyślnie dodana.");
    }

    if (!hasEditMode) {
      console.log("Wykryto brakującą kolumnę edit_mode! Trwa aktualizacja bazy...");
      await db.runAsync("ALTER TABLE todo_lists ADD COLUMN edit_mode INTEGER DEFAULT 0;");
      console.log("Kolumna edit_mode została pomyślnie dodana.");
    }

    const hasIconColumn = columns.some(col => col.name === 'icon');
    if (!hasIconColumn) {
      console.log("Wykryto brakującą kolumnę icon! Trwa aktualizacja bazy...");
      await db.runAsync("ALTER TABLE todo_lists ADD COLUMN icon TEXT;");
      console.log("Kolumna icon została pomyślnie dodana.");
    }

    const tasksColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(tasks);');
    const tasksHasPriority = tasksColumns.some(col => col.name === 'priority');
    if (!tasksHasPriority) {
      console.log("Wykryto brakującą kolumnę priority! Trwa aktualizacja bazy...");
      await db.runAsync("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'normal';");
      console.log("Kolumna priority została pomyślnie dodana do tasks.");
    }

    const subTasksColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(sub_tasks);');
    const subTasksHasPriority = subTasksColumns.some(col => col.name === 'priority');
    if (!subTasksHasPriority) {
      console.log("Wykryto brakującą kolumnę priority! Trwa aktualizacja bazy...");
      await db.runAsync("ALTER TABLE sub_tasks ADD COLUMN priority TEXT DEFAULT 'normal';");
      console.log("Kolumna priority została pomyślnie dodana do sub_tasks.");
    }
  } catch (error) {
    console.error("Błąd podczas inicjalizacji bazy danych:", error);
    dbInstance = null;
    throw error;
  }

  return db;
}

export function getDatabase() {
  if (!dbInstance) {
    throw new Error("Baza danych nie została zainicjalizowana. Upewnij się, że initDatabase() zostało wywołane.");
  }
  return dbInstance;
}