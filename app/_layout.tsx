// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { initDatabase } from '../src/database/database';

// Importy dla zadań w tle i synchronizacji
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { performSync } from '../src/services/syncService';

// Unikalna nazwa dla naszego zadania w tle
const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

// 1. Definicja zadania w tle (MUSI znajdować się poza komponentem Reacta)
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log("[TASK MANAGER] Wybudzam aplikację do synchronizacji w tle...");
    await performSync();
    
    // Zwracamy status dla systemu operacyjnego telefonu
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    // Inicjalizacja SQLite
    async function setupDatabase() {
      try {
        await initDatabase();
        setIsDbReady(true);
      } catch (e) {
        console.error("Błąd inicjalizacji bazy danych:", e);
      }
    }
    setupDatabase();

    // 2. Rejestracja zadania cyklicznego w systemie
    async function registerBackgroundSync() {
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
          minimumInterval: 15 * 60, // Minimalny odstęp to 15 minut (narzucane przez iOS/Android)
          stopOnTerminate: false,   // Próbuj działać nawet po ubiciu apki (na Androidzie)
          startOnBoot: true,        // Wznów po zrestartowaniu telefonu (na Androidzie)
        });
        console.log("[INIT] Zadanie w tle pomyślnie zarejestrowane.");
      } catch (err) {
        console.log("[INIT] Błąd rejestracji zadania w tle:", err);
      }
    }
    registerBackgroundSync();

    // 3. Nasłuchiwacz AppState: Natychmiastowa synchronizacja, gdy tylko otwierasz aplikację!
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        console.log("[APP STATE] Aplikacja jest znowu aktywna. Wymuszam szybką synchronizację...");
        performSync();
      }
    });

    // Czyszczenie nasłuchiwaczy przy wyłączaniu aplikacji
    return () => {
      subscription.remove();
    };
  }, []);

  if (!isDbReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#006196" />
          <Text style={{ marginTop: 10 }}>Przygotowywanie bazy danych...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}