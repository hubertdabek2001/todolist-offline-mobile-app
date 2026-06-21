// app/list/share/[id].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { exportListToQR } from '../../../src/utils/qrPayloadManager';

export default function ShareListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [qrPayload, setQrPayload] = useState<string[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function loadPayload() {
      if (id) {
        try {
          const payload = await exportListToQR(id);
          setQrPayload(payload);
          setCurrentIndex(0);
        } catch (error) {
          console.error("Błąd generowania ładunku:", error);
        }
      }
    }
    loadPayload();
  }, [id]);

  useEffect(() => {
    if (qrPayload && qrPayload.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % qrPayload.length);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [qrPayload]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Udostępnij listę' }} />
      
      {qrPayload ? (
        <View style={styles.qrContainer}>
          <Text style={styles.infoText}>
            Pokaż ten kod drugiej osobie.{'\n'}Może go zeskanować w zakładce "Wspólne".
          </Text>
          <View style={styles.qrWrapper}>
            <QRCode value={qrPayload[currentIndex]} size={250} />
          </View>
          {qrPayload.length > 1 && (
            <Text style={{ marginTop: 15, color: '#64748b' }}>
              Wyświetlanie klatki {currentIndex + 1} z {qrPayload.length}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2f95dc" />
          <Text style={styles.loadingText}>Pakowanie zadań...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748b' },
  qrContainer: { alignItems: 'center', padding: 20 },
  infoText: { textAlign: 'center', fontSize: 16, marginBottom: 30, color: '#475569' },
  qrWrapper: { padding: 20, backgroundColor: 'white', borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }
});