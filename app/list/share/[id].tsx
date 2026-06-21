// app/list/share/[id].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { exportListToQR } from '../../../src/utils/qrPayloadManager';

export default function ShareListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [qrPayload, setQrPayload] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayload() {
      if (id) {
        const payload = await exportListToQR(id);
        setQrPayload(payload);
      }
    }
    loadPayload();
  }, [id]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Udostępnij listę' }} />
      
      {qrPayload ? (
        <View style={styles.qrContainer}>
          <Text style={styles.infoText}>
            Pokaż ten kod drugiej osobie.{'\n'}Może go zeskanować w zakładce "Wspólne".
          </Text>
          <View style={styles.qrWrapper}>
             {/* Rozmiar kodu dopasowany do telefonów, by ułatwić skanowanie z innej matrycy */}
            <QRCode value={qrPayload} size={250} />
          </View>
        </View>
      ) : (
        <ActivityIndicator size="large" color="#2f95dc" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  qrContainer: { alignItems: 'center', padding: 20 },
  infoText: { textAlign: 'center', fontSize: 16, marginBottom: 30, color: '#475569' },
  qrWrapper: { padding: 20, backgroundColor: 'white', borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }
});