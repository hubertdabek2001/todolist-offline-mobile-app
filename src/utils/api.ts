// src/utils/api.ts
import * as SecureStore from 'expo-secure-store';

// Podmień na IP swojego komputera (widzę w logach, że to 192.168.0.105)
export const API_URL = 'http://192.168.0.105:8080/api'; 

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