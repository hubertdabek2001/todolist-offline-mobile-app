// src/utils/qrPayloadManager.ts
import * as SQLite from 'expo-sqlite';

// Pobieranie instancji bazy
const getDb = async () => await SQLite.openDatabaseAsync('todolist.db');

export async function exportListToQR(listId: string): Promise<string> {
  const db = await getDb();
  
  // Pobieramy dane
  const listData = await db.getFirstAsync<{ id: string; name: string }>('SELECT id, name FROM todo_lists WHERE id = ?', listId);
  const tasks = await db.getAllAsync<{ id: string; title: string; is_completed: number }>('SELECT id, title, is_completed FROM tasks WHERE todo_list_id = ?', listId);
  const subTasks = await db.getAllAsync<{ id: string; task_id: string; title: string; is_completed: number }>(`
    SELECT st.id, st.task_id, st.title, st.is_completed 
    FROM sub_tasks st JOIN tasks t ON t.id = st.task_id WHERE t.todo_list_id = ?
  `, listId);

  if (!listData) throw new Error("Lista nie istnieje");

  // Kompresujemy JSON poprzez skrócenie nazw kluczy (l=list, t=tasks, s=subtasks, c=completed)
  const payload = {
    l: { i: listData.id, n: listData.name },
    t: tasks.map(task => ({ i: task.id, t: task.title, c: task.is_completed })),
    s: subTasks.map(sub => ({ i: sub.id, ti: sub.task_id, t: sub.title, c: sub.is_completed }))
  };

  return JSON.stringify(payload);
}

export async function importListFromQR(jsonString: string): Promise<{success: boolean, listId?: string, listName?: string}> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.l || !data.l.i) return { success: false };

    const db = await SQLite.openDatabaseAsync('todolist.db');

    // Używamy transakcji, aby w razie błędu nie zapisać uszkodzonych/niepełnych danych
    await db.runAsync(
        'INSERT OR IGNORE INTO todo_lists (id, name, is_archived, is_shared) VALUES (?, ?, 0, 1)', 
        data.l.i, 
        data.l.n ?? "Nieznana nazwa" // Zabezpieczenie
      );

      // 2. Zapis Zadań
      for (const task of data.t || []) {
        await db.runAsync(
          'INSERT OR IGNORE INTO tasks (id, todo_list_id, title, is_completed) VALUES (?, ?, ?, ?)', 
          task.i, 
          data.l.i, 
          task.t ?? "", // Zamień undefined na pusty string
          task.c ?? 0   // Zamień undefined na 0 (nieukończone)
        );
      }

      // 3. Zapis Podzadań
      for (const sub of data.s || []) {
        await db.runAsync(
          'INSERT OR IGNORE INTO sub_tasks (id, task_id, title, is_completed) VALUES (?, ?, ?, ?)', 
          sub.i, 
          sub.ti, 
          sub.t ?? "", 
          sub.c ?? 0
        );
      }

    // Zwracamy obiekt zawierający również ID i nazwę listy do nawigacji
    return { success: true, listId: data.l.i, listName: data.l.n };
  } catch (e) {
    console.error("Błąd importu z QR:", e);
    return { success: false };
  }
}