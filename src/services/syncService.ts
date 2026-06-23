// src/services/syncService.ts
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import { API_URL } from '../utils/api';

export async function performSync() {
  try {
    // 1. Sprawdzamy, czy użytkownik jest zalogowany
    let token = await SecureStore.getItemAsync('accessToken');
    if (!token) {
      console.log("[SYNC] Przerwano: Użytkownik działa w trybie Offline.");
      return; 
    }

    // 2. Sprawdzamy, czy w Ustawieniach nie wyłączono synchronizacji
    const syncEnabled = await SecureStore.getItemAsync('syncEnabled');
    if (syncEnabled === 'false') {
      console.log("[SYNC] Przerwano: Synchronizacja w tle wyłączona w opcjach.");
      return; 
    }

    console.log("[SYNC] Rozpoczynam pakowanie danych z SQLite...");
    const db = await SQLite.openDatabaseAsync('todolist.db');

    // 3. Zrzut wszystkich tabel z bazy SQLite
    const lists = await db.getAllAsync<any>('SELECT * FROM todo_lists');
    const tasks = await db.getAllAsync<any>('SELECT * FROM tasks');
    const subTasks = await db.getAllAsync<any>('SELECT * FROM sub_tasks');

    // 4. Tłumaczenie do formatu DTO (Data Transfer Object) używanego przez Spring Boot
    const payload = {
      lists: lists.map(l => ({
        id: l.id,
        name: l.name,
        isArchived: l.is_archived === 1,
        isShared: l.is_shared === 1,
        spentTimeSeconds: l.spent_time_seconds || 0
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        todoListId: t.todo_list_id,
        title: t.title,
        description: t.description || "",
        isCompleted: t.is_completed === 1,
        spentTimeSeconds: t.spent_time_seconds || 0
      })),
      subTasks: subTasks.map(st => ({
        id: st.id,
        taskId: st.task_id,
        parentSubTaskId: st.parent_subtask_id || null,
        title: st.title,
        isCompleted: st.is_completed === 1,
        spentTimeSeconds: st.spent_time_seconds || 0
      }))
    };

    // 5. Wysyłka do Huba backendowego
    let response = await fetch(`${API_URL}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    // Jeśli serwer wyrzucił nas z powodu starego tokenu
    if (response.status === 401) {
      console.log("[SYNC] Access Token wygasł. Odświeżam...");
      const newToken = await refreshAccessToken(); // zaimportuj tę funkcję z api.ts!
      if (newToken) {
         response = await fetch(`${API_URL}/sync/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` },
            body: JSON.stringify(payload)
         });
      } else {
         console.log("[SYNC] Przerwano: Wylogowano (brak ważnego odświeżania).");
         return;
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SYNC] Błąd synchronizacji. Serwer odpowiedział:", response.status, errorText);
    } else {
      console.log("[SYNC] ✅ Pomyślnie zsynchronizowano dane z chmurą!");
    }
  } catch (e) {
    console.error("[SYNC] ❌ Błąd połączenia sieciowego podczas synchronizacji:", e);
  }
}