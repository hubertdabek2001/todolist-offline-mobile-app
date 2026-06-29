// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'text-encoding';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { CustomAlertProvider } from '../src/components/CustomAlert';
import { initDatabase } from '../src/database/database';

// Importy dla synchronizacji
import { performSync } from '../src/services/syncService';

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

    // 2. Nasłuchiwacz AppState: Natychmiastowa synchronizacja, gdy tylko otwierasz aplikację!
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <CustomAlertProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </CustomAlertProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}