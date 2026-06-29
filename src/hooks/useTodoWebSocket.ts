// src/hooks/useTodoWebSocket.ts
import 'fast-text-encoding'; // 1. POLYFILL WYMAGANY PRZEZ REACT NATIVE DO RAMEK BINARNYCH

import { Client } from '@stomp/stompjs';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import { API_URL, refreshAccessToken } from '../utils/api';

export interface ActivityLog {
  id: string;
  listId: string;
  userId: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE';
  entityType: 'LIST' | 'TASK' | 'SUBTASK';
  entityName: string;
  timestamp: string;
}

export const useTodoWebSocket = (listId: string | undefined) => {
  const client = useRef<Client | null>(null);
  const [latestActivity, setLatestActivity] = useState<ActivityLog | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!listId) return;

    let isActive = true;

    const connect = async () => {
      let token = await SecureStore.getItemAsync('accessToken');
      if (!token) return;

      const wsUrl = API_URL.replace('http', 'ws').replace('/api', '') + '/ws-todo';

      client.current = new Client({
        brokerURL: wsUrl,
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        
        // --- 2. KLUCZOWE FLAGI NAPRAWIAJĄCE BŁĄD W REACT NATIVE ---
        forceBinaryWSFrames: true,         // Omija błąd gubienia znaku \0
        appendMissingNULLonIncoming: true, // Zabezpieczenie ramek przychodzących z serwera
        // ----------------------------------------------------------

        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        onWebSocketError: async (error) => {
           console.log("[WS] Błąd WebSocket. Próba odświeżenia tokenu...");
           const newToken = await refreshAccessToken();
           if (newToken && client.current && isActive) {
              client.current.connectHeaders = { Authorization: `Bearer ${newToken}` };
              client.current.activate(); 
           }
        }
      });

      client.current.onConnect = () => {
        console.log(`[WS] ✅ Połączono z kanałem listy: ${listId}`);
        setIsConnected(true);

        client.current?.subscribe(`/topic/list/${listId}`, (message) => {
          if (message.body && isActive) {
            const activity: ActivityLog = JSON.parse(message.body);
            setLatestActivity(activity);
          }
        });
      };

      client.current.onDisconnect = () => {
        if (isActive) setIsConnected(false);
      };

      client.current.activate();
    };

    connect();

    return () => {
      isActive = false;
      if (client.current) {
        client.current.deactivate();
      }
    };
  }, [listId]);

  return { latestActivity, isConnected };
};