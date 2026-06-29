// src/hooks/useTodoWebSocket.ts
import { Client } from '@stomp/stompjs';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
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

export interface Viewer {
  userId: string;
  username: string;
  email: string;
}

export const useTodoWebSocket = (listId: string | undefined) => {
  const client = useRef<Client | null>(null);
  const [latestActivity, setLatestActivity] = useState<ActivityLog | null>(null);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useFocusEffect(
    useCallback(() => {
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
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        onWebSocketError: async (error) => {
           // Jeśli połączenie padło przez błąd 401 (wygaśnięcie), spróbujmy odświeżyć w tle
           console.log("[WS] Błąd WebSocket. Próba odświeżenia tokenu...");
           const newToken = await refreshAccessToken();
           if (newToken && client.current && isActive) {
              client.current.connectHeaders = { Authorization: `Bearer ${newToken}` };
              client.current.activate(); // Wymuszenie restartu STOMP
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

        client.current?.subscribe(`/topic/list/${listId}/presence`, (message) => {
          if (message.body && isActive) {
            const presenceViewers: Viewer[] = JSON.parse(message.body);
            setViewers(presenceViewers);
          }
        });
      };

      client.current.onDisconnect = () => {
        if (isActive) setIsConnected(false);
      };

      client.current.activate();
    };

      connect();

      const appStateListener = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          if (client.current) {
            client.current.deactivate();
          }
        } else if (nextAppState === 'active') {
          if (client.current && !client.current.active) {
            client.current.activate();
          }
        }
      });

      return () => {
        isActive = false;
        appStateListener.remove();
        if (client.current) {
          client.current.deactivate();
        }
      };
    }, [listId])
  );

  return { latestActivity, viewers, isConnected };
};