// src/utils/qrPayloadManager.ts
import { getDatabase } from '../database/database';

const getDb = () => getDatabase();

// Zmniejszamy drastycznie rozmiar fragmentu, by QR kod był zawsze "luźny" i łatwy do skanowania
const CHUNK_SIZE = 150; 

export async function exportListToQRChunks(
  listId: string, 
  userEmail: string, 
  userName: string
): Promise<string[]> {
  const db = getDb();
  
  // Pobieramy dane
  const listData = await db.getFirstAsync<{ id: string; name: string }>('SELECT id, name FROM todo_lists WHERE id = ?', listId);
  const tasks = await db.getAllAsync<{ id: string; title: string; is_completed: number }>('SELECT id, title, is_completed FROM tasks WHERE todo_list_id = ?', listId);
  const subTasks = await db.getAllAsync<{ id: string; task_id: string; title: string; is_completed: number }>(`
    SELECT st.id, st.task_id, st.title, st.is_completed 
    FROM sub_tasks st JOIN tasks t ON t.id = st.task_id WHERE t.todo_list_id = ?
  `, listId);

  if (!listData) throw new Error("Lista nie istnieje");

  const payload = {
    l: { i: listData.id, n: listData.name },
    t: tasks.map(task => ({ i: task.id, t: task.title, c: task.is_completed })),
    s: subTasks.map(sub => ({ i: sub.id, ti: sub.task_id, t: sub.title, c: sub.is_completed }))
  };

  const jsonString = JSON.stringify(payload);
  
  // Generujemy krótkie, losowe ID sesji, by aparat wiedział, że to ta sama lista
  const sessionId = Math.random().toString(36).substring(2, 6);
  
  const chunks: string[] = [];
  for (let i = 0; i < jsonString.length; i += CHUNK_SIZE) {
    chunks.push(jsonString.substring(i, i + CHUNK_SIZE));
  }

  const totalChunks = chunks.length;
  
  // Zwracamy tablicę gotowych stringów dla kodów QR
  // Format: CHUNK | sesja | email | nazwa | indeks | suma | dane
  return chunks.map((chunkData, index) => 
    `CHUNK|${sessionId}|${userEmail}|${userName}|${index}|${totalChunks}|${chunkData}`
  );
}

// Funkcja importująca pozostaje taka sama - przyjmie "sklejony" JSON z powrotem
export async function importListFromQR(jsonString: string): Promise<{success: boolean, listId?: string, listName?: string}> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.l || !data.l.i) return { success: false };

    const db = getDb();

    await db.runAsync(
        'INSERT OR IGNORE INTO todo_lists (id, name, is_archived, is_shared) VALUES (?, ?, 0, 1)', 
        data.l.i, 
        data.l.n ?? "Nieznana nazwa"
    );

    for (const task of data.t || []) {
      await db.runAsync(
        'INSERT OR IGNORE INTO tasks (id, todo_list_id, title, is_completed) VALUES (?, ?, ?, ?)', 
        task.i, data.l.i, task.t ?? "", task.c ?? 0
      );
    }

    for (const sub of data.s || []) {
      await db.runAsync(
        'INSERT OR IGNORE INTO sub_tasks (id, task_id, title, is_completed) VALUES (?, ?, ?, ?)', 
        sub.i, sub.ti, sub.t ?? "", sub.c ?? 0
      );
    }

    return { success: true, listId: data.l.i, listName: data.l.n };
  } catch (e) {
    console.error("Błąd importu z QR:", e);
    return { success: false };
  }
}