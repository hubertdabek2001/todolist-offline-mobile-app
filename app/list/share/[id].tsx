// app/list/share/[id].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { exportListToQR } from '../../../src/utils/qrPayloadManager';

export default function ShareListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadPayload() {
      if (id) {
        try {
          const payload = await exportListToQR(id);
          
          // Zabezpieczenie przed crashem - limit znaków w ładunku
          // Więcej niż ~2000-2500 znaków powoduje, że kod QR jest nieczytelny dla aparatów 
          // i może spowodować crash renderera na niektórych telefonach z systemem Android.
          if (payload.length > 2000) {
            Alert.alert(
              "Lista jest za duża",
              "Masz zbyt wiele zadań na tej liście, by zmieścić je na jednym kodzie QR. Oczyść listę lub usuń ukończone zadania.",
              [
                { 
                  text: "Przejdź do edycji", 
                  // replace zamiast push, aby zamknąć ten ekran udostępniania i wejść prosto do edycji
                  onPress: () => router.replace(`/list/edit/${id}`) 
                }
              ]
            );
            return; // Prerywamy renderowanie kodu QR
          }

          setQrPayload(payload);
        } catch (error) {
          console.error("Błąd generowania ładunku:", error);
        }
      }
    }
    loadPayload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Udostępnij listę' }} />
      
      {qrPayload ? (
        <View style={styles.qrContainer}>
          <Text style={styles.infoText}>
            Pokaż ten kod drugiej osobie.{'\n'}Może go zeskanować w zakładce &quot;Wspólne&quot;.
          </Text>
          <View style={styles.qrWrapper}>
            <QRCode value={qrPayload} size={250} />
          </View>
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