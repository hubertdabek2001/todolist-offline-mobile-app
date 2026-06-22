// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from '../src/database/database';
import { ThemeProvider } from '../src/components/ThemeProvider';

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    async function setupDatabase() {
      try {
        await initDatabase();
        setIsDbReady(true);
      } catch (e) {
        console.error("Błąd inicjalizacji bazy danych:", e);
      }
    }
    setupDatabase();
  }, []);

  // Ekran ładowania, dopóki baza nie będzie gotowa
  if (!isDbReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text>Przygotowywanie bazy danych...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Gdy baza jest gotowa, renderujemy główną nawigację
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}