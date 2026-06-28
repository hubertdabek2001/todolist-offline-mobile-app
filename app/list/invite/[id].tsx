import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../src/components/ThemeProvider';
import { sendEmailInvitationAPI } from '../../../src/utils/api';

export default function InviteListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const router = useRouter();

  const handleSendInvite = async () => {
    if (!email.trim() || !id) return;
    setIsSending(true);

    const result = await sendEmailInvitationAPI(id, email.trim(), "READ_WRITE");

    setIsSending(false);

    if (result.success) {
      Alert.alert("Sukces", "Zaproszenie zostało wysłane pomyślnie.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("Błąd", result.message || "Nie udało się wysłać zaproszenia.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        title: 'Zaproś do listy',
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text
      }} />

      <View style={styles.formContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Adres E-mail</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.outlineVariant, color: colors.text }]}
          value={email}
          onChangeText={setEmail}
          placeholder="Wpisz e-mail współpracownika..."
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus={true}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary, marginTop: 20 }]}
          onPress={handleSendInvite}
          disabled={isSending || !email.trim()}
        >
          <Ionicons name="send-outline" size={20} color={colors.onPrimary} />
          <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
            {isSending ? "Wysyłanie..." : "Wyślij zaproszenie"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
