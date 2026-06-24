// app/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/components/ThemeProvider';
import { API_URL, refreshAccessToken } from '../src/utils/api';

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      let token = await SecureStore.getItemAsync('accessToken');
      if (!token) return;

      let response = await fetch(`${API_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        token = await refreshAccessToken();
        if (!token) { router.replace('/'); return; }
        response = await fetch(`${API_URL}/auth/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
      }

      if (response.ok) {
        const data = await response.json();
        setProfile({
          email: data.email || '',
          username: data.username || '',
          firstName: data.firstName || '',
          lastName: data.lastName || ''
        });
      }
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się pobrać danych profilu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let token = await SecureStore.getItemAsync('accessToken');
      
      let response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          username: profile.username,
          firstName: profile.firstName,
          lastName: profile.lastName
        })
      });

      if (response.status === 401) {
        token = await refreshAccessToken();
        response = await fetch(`${API_URL}/auth/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ username: profile.username, firstName: profile.firstName, lastName: profile.lastName })
        });
      }

      if (response.ok) {
        Alert.alert("Sukces", "Twój profil został zaktualizowany!");
        router.back();
      } else {
        const data = await response.json();
        Alert.alert("Błąd", data.error || "Nie udało się zapisać zmian.");
      }
    } catch (error) {
      Alert.alert("Błąd połączenia", "Sprawdź swoje połączenie z internetem.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: "Twój Profil", 
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }} 
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {profile.firstName ? profile.firstName.charAt(0).toUpperCase() : profile.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Adres E-mail (tylko do odczytu)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.icon} />
              <TextInput style={[styles.input, { color: colors.textSecondary }]} value={profile.email} editable={false} />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Nazwa Użytkownika (@nick)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="at-outline" size={20} color={colors.primary} style={styles.icon} />
              <TextInput 
                style={[styles.input, { color: colors.text }]} 
                value={profile.username} 
                onChangeText={(t) => setProfile({...profile, username: t})} 
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Imię</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="person-outline" size={20} color={colors.primary} style={styles.icon} />
              <TextInput 
                style={[styles.input, { color: colors.text }]} 
                value={profile.firstName} 
                onChangeText={(t) => setProfile({...profile, firstName: t})} 
                placeholder="Jan"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Nazwisko</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="people-outline" size={20} color={colors.primary} style={styles.icon} />
              <TextInput 
                style={[styles.input, { color: colors.text }]} 
                value={profile.lastName} 
                onChangeText={(t) => setProfile({...profile, lastName: t})} 
                placeholder="Kowalski"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Zapisz zmiany</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24, paddingBottom: 50 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8 },
  avatarText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  card: { padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16, height: 52 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  saveButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});