import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../src/utils/api';

export default function SetupProfileScreen({ token, onSuccess }: { token: string, onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (username.trim().length < 3) {
      Alert.alert("Błąd", "Nazwa musi mieć minimum 3 znaki.");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/setup-profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        Alert.alert("Błąd", "Ta nazwa użytkownika jest już zajęta.");
      }
    } catch (e) {
      Alert.alert("Błąd połączenia", "Nie można połączyć się z serwerem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="person-circle" size={80} color="#006196" style={{ alignSelf: 'center', marginBottom: 20 }} />
      <Text style={styles.title}>Ostatni krok!</Text>
      <Text style={styles.subtitle}>Jak mamy się do Ciebie zwracać?</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nazwa użytkownika"
        value={username}
        onChangeText={setUsername}
        autoFocus={true}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Zapisz profil</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fb', padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#191c1e' },
  subtitle: { fontSize: 14, color: '#3f4850', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: 'white', height: 56, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  button: { backgroundColor: '#006196', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});