import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../src/components/ThemeProvider';
import { useCustomAlert } from '../src/components/CustomAlert';
import { performSync } from '../src/services/syncService';
import { confirmJoinLinkAPI } from '../src/utils/api';

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    async function processJoin() {
      if (!token) {
        showAlert("Błąd", "Brak tokena w linku.");
        router.replace('/(tabs)');
        return;
      }

      setIsProcessing(true);
      const result = await confirmJoinLinkAPI(token);

      if (result.success) {
        showAlert("Sukces", "Pomyślnie dołączono do listy!");
        performSync();
      } else {
        showAlert("Błąd", result.message || "Nie udało się dołączyć.");
      }

      router.replace('/(tabs)');
    }

    processJoin();
  }, [token, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isProcessing && (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.text, { color: colors.text }]}>Przetwarzanie zaproszenia...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});
