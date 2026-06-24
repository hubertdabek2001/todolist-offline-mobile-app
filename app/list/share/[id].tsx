// app/list/share/[id].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { exportListToQRChunks } from '../../../src/utils/qrPayloadManager';

export default function ShareListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chunks, setChunks] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function loadPayload() {
      if (id) {
        try {
          // TODO: W przyszłości pobierz te dane z SecureStore / lokalnego stanu profilu
          const userEmail = "twoj@email.com"; 
          const userName = "Użytkownik";

          const generatedChunks = await exportListToQRChunks(id, userEmail, userName);
          setChunks(generatedChunks);
        } catch (error) {
          console.error("Błąd generowania ładunku:", error);
        }
      }
    }
    loadPayload();
  }, [id]);

  // Animacja kodu QR
  useEffect(() => {
    if (chunks.length <= 1) return; // Brak potrzeby animacji dla 1 klatki

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % chunks.length);
    }, 250); // Zmiana klatki co 250ms (4 FPS) - idealne dla aparatów
    
    return () => clearInterval(interval);
  }, [chunks]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Udostępnij listę', headerShown: true }} />
      
      {chunks.length > 0 ? (
        <View style={styles.qrContainer}>
          <Text style={styles.infoText}>
            Pokaż ten animowany kod drugiej osobie. {'\n'}Aparat automatycznie zbierze wszystkie części.
          </Text>
          
          <View style={styles.qrWrapper}>
            {/* Wyświetlamy obecną "klatkę" animacji */}
            <QRCode value={chunks[currentIndex]} size={280} />
          </View>
          
          <Text style={styles.progressText}>
            Wysyłanie klatki {currentIndex + 1} z {chunks.length}
          </Text>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006196" />
          <Text style={styles.loadingText}>Pakowanie zadań do wysyłki...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fb', justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748b' },
  qrContainer: { alignItems: 'center', padding: 20 },
  infoText: { textAlign: 'center', fontSize: 16, marginBottom: 30, color: '#475569' },
  progressText: { marginTop: 30, fontSize: 18, fontWeight: 'bold', color: '#006196' },
  qrWrapper: { padding: 20, backgroundColor: 'white', borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }
});