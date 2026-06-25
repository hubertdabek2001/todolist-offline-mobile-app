// app/SetupProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/components/ThemeProvider';
import { API_URL } from '../src/utils/api';

interface SetupProfileScreenProps {
  token: string;
  onSuccess: () => void;
}

export default function SetupProfileScreen({ token, onSuccess }: SetupProfileScreenProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    const trimmedUsername = username.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    // --- REGUŁY WALIDACJI ---
    
    // 1. Minimum jedno: Imię lub Nick musi zostać podane
    if (!trimmedUsername && !trimmedFirstName) {
      Alert.alert(
        "Brak danych", 
        "Abyśmy wiedzieli jak się do Ciebie zwracać, musisz podać nazwę użytkownika (nick) lub swoje imię."
      );
      return;
    }

    // 2. Jeśli podano nazwisko, imię jest bezwzględnie wymagane
    if (trimmedLastName && !trimmedFirstName) {
      Alert.alert(
        "Brak imienia", 
        "Skoro podajesz nazwisko, pole Imię również staje się obowiązkowe."
      );
      return;
    }

    setIsLoading(true);

    try {
      // Używamy naszego endpointu z Fazy Profilu, aby nadpisać nowo utworzone konto
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          username: trimmedUsername,
          firstName: trimmedFirstName,
          lastName: trimmedLastName
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        Alert.alert("Błąd", data.error || "Wystąpił problem z zapisem danych.");
      }
    } catch (error) {
      Alert.alert("Błąd połączenia", "Sprawdź swoje połączenie internetowe i spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}>
        
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="person-add" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Witaj w aplikacji!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Dokończ konfigurację swojego profilu, by móc łatwo współpracować z innymi.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          
          {/* Nazwa użytkownika */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Nazwa Użytkownika <Text style={{fontWeight: 'normal', fontSize: 11}}>(Opcjonalnie, jeśli podasz imię)</Text>
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
            <Ionicons name="at" size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput 
              style={[styles.input, { color: colors.text }]}
              placeholder="np. szalony_kaktus"
              placeholderTextColor={colors.outlineVariant}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Imię */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Imię <Text style={{fontWeight: 'normal', fontSize: 11}}>(Wymagane z nazwiskiem)</Text>
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput 
              style={[styles.input, { color: colors.text }]}
              placeholder="Jan"
              placeholderTextColor={colors.outlineVariant}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* Nazwisko */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Nazwisko <Text style={{fontWeight: 'normal', fontSize: 11}}>(Opcjonalnie)</Text>
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
            <Ionicons name="people-outline" size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput 
              style={[styles.input, { color: colors.text }]}
              placeholder="Kowalski"
              placeholderTextColor={colors.outlineVariant}
              value={lastName}
              onChangeText={setLastName}
              onSubmitEditing={handleSave} // Kliknięcie enter na klawiaturze zapisuje form
            />
          </View>

        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary }]} 
          onPress={handleSave} 
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>Rozpocznij korzystanie</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconBox: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  card: { padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 30 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, marginBottom: 20, height: 56 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  saveButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveButtonText: { fontSize: 16, fontWeight: 'bold' }
});