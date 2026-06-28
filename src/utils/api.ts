// src/utils/api.ts
import * as SecureStore from 'expo-secure-store';

console.log("=== DIAGNOSTYKA ENV ===");
console.log("Mój plik .env ładuje API_URL jako:", process.env.EXPO_PUBLIC_API_URL);
console.log("=======================");

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) return null;

    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      // Zapisujemy też nowy refresh token, jeśli serwer go odświeżył (opcjonalne, zależne od backendu)
      if (data.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      }
      console.log("[AUTH] ✅ Pomyślnie odświeżono Access Token w tle.");
      return data.accessToken;
    } else {
      console.log("[AUTH] ❌ Refresh Token wygasł lub jest nieważny. Konieczne logowanie.");
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      return null;
    }
  } catch (e) {
    console.error("[AUTH] Błąd podczas odświeżania tokena:", e);
    return null;
  }

  
};

export const fetchActivityLogs = async (listId: string) => {
  let token = await SecureStore.getItemAsync('accessToken');
  if (!token) return null;

  try {
    let response = await fetch(`${API_URL}/activity/${listId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) {
      token = await refreshAccessToken();
      if (!token) return null;
      response = await fetch(`${API_URL}/activity/${listId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (e) {
    console.error("[API] Błąd pobierania aktywności:", e);
    return [];
  }
};

export const fetchSyncPull = async () => {
  let token = await SecureStore.getItemAsync('accessToken');
  if (!token) return null;

  try {
    let response = await fetch(`${API_URL}/sync/pull`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) {
      token = await refreshAccessToken();
      if (!token) return null;
      response = await fetch(`${API_URL}/sync/pull`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (e) {
    console.error("[API] Błąd pobierania bazy (PULL):", e);
    return null;
  }
};

export const fetchListCollaborators = async (listId: string) => {
  let token = await SecureStore.getItemAsync('accessToken');
  if (!token) return [];

  try {
    let response = await fetch(`${API_URL}/lists/${listId}/collaborators`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) {
      token = await refreshAccessToken();
      if (!token) return [];
      response = await fetch(`${API_URL}/lists/${listId}/collaborators`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    if (response.ok) {
      return await response.json(); // Zwraca tablicę: [{ id: "...", initial: "A" }, ...]
    }
    return [];
  } catch (e) {
    console.error("[API] Błąd pobierania współpracowników:", e);
    return [];
  }
};

// --- ARCHIWIZACJA ---
export const archiveListAPI = async (listId: string) => {
  let token = await SecureStore.getItemAsync('accessToken');
  if (!token) return false;
  try {
    let response = await fetch(`${API_URL}/lists/${listId}/archive`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    if (response.status === 401) {
      token = await refreshAccessToken();
      response = await fetch(`${API_URL}/lists/${listId}/archive`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    }
    return response.ok;
  } catch (e) { return false; }
};

export const restoreListAPI = async (listId: string) => {
  let token = await SecureStore.getItemAsync('accessToken');
  if (!token) return false;
  try {
    let response = await fetch(`${API_URL}/lists/${listId}/restore`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    if (response.status === 401) {
      token = await refreshAccessToken();
      response = await fetch(`${API_URL}/lists/${listId}/restore`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    }
    return response.ok;
  } catch (e) { return false; }
};

export const fetchArchivedListsAPI = async () => {
  let token = await SecureStore.getItemAsync('accessToken');
  if (!token) return [];
  try {
    let response = await fetch(`${API_URL}/lists/archived`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
    if (response.status === 401) {
      token = await refreshAccessToken();
      response = await fetch(`${API_URL}/lists/archived`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
    }
    if (response.ok) return await response.json();
    return [];
  } catch (e) { return []; }
};