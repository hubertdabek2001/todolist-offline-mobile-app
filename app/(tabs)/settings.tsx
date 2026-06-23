// app/(tabs)/settings.tsx
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/components/ThemeProvider';

export default function SettingsScreen() {
  // POBIERAMY setThemePreference z naszego globalnego kontekstu
  const { colors, theme, setThemePreference } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    // Sprawdzenie, czy jesteśmy w trybie Online (zalogowani)
    const token = await SecureStore.getItemAsync('userToken');
    setIsLoggedIn(!!token);

    // Pobranie preferencji synchronizacji
    const syncOption = await SecureStore.getItemAsync('syncEnabled');
    if (syncOption !== null) {
      setIsSyncEnabled(syncOption === 'true');
    }
  };

  const handleToggleSync = async (value: boolean) => {
    setIsSyncEnabled(value);
    await SecureStore.setItemAsync('syncEnabled', String(value));
  };

  // PRAWDZIWA LOGIKA ZMIANY MOTYWU
  const handleToggleTheme = (value: boolean) => {
    // Wywołujemy funkcję z ThemeProvider, która aktualizuje AsyncStorage i odświeża całą aplikację
    setThemePreference(value ? 'dark' : 'light');
  };

  const handleLogout = () => {
    Alert.alert(
      "Wylogowywanie",
      "Czy na pewno chcesz się wylogować? Twoje dane pozostaną bezpieczne na urządzeniu, ale synchronizacja zostanie wstrzymana.",
      [
        { text: "Anuluj", style: "cancel" },
        { 
          text: "Wyloguj", 
          style: "destructive", 
          onPress: async () => {
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('refreshToken');
            setIsLoggedIn(false);
          } 
        }
      ]
    );
  };

  const handleLogin = async () => {
    // Przenosi użytkownika do ekranu początkowego, by przeszedł proces logowania OTP
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    router.replace('/'); 
  };

  // --- Komponent Pomocniczy: Wiersz Ustawień ---
  const SettingRow = ({ icon, title, rightElement, onPress, destructive = false, isLast = false }: any) => (
    <TouchableOpacity
      style={[
        styles.row, 
        { borderBottomColor: colors.outlineVariant },
        !isLast && { borderBottomWidth: 1 }
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: destructive ? colors.error + '20' : colors.primary + '20' }]}>
          <Ionicons name={icon} size={20} color={destructive ? colors.error : colors.primary} />
        </View>
        <Text style={[styles.rowTitle, { color: destructive ? colors.error : colors.text }]}>{title}</Text>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      
      {/* Nagłówek */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ustawienia</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- Karta Profilu --- */}
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: theme === 'dark' ? '#000' : '#000' }]}>
          {isLoggedIn ? (
            <View style={styles.profileContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>US</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>Zalogowany użytkownik</Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>Połączono z chmurą</Text>
              </View>
              <TouchableOpacity style={styles.editProfileButton}
              onPress={() => router.push('/profile')}>
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.profileContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="cloud-offline" size={28} color={colors.textSecondary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>Tryb Offline</Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>Dane tylko na tym urządzeniu</Text>
              </View>
              <TouchableOpacity style={[styles.loginBadge, { backgroundColor: colors.primary }]} onPress={handleLogin}>
                <Text style={styles.loginBadgeText}>Zaloguj się</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* --- Sekcja: Konto --- */}
        {isLoggedIn && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Konto</Text>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <SettingRow 
                icon="sync-outline" 
                title="Synchronizacja w tle" 
                rightElement={
                  <Switch 
                    value={isSyncEnabled} 
                    onValueChange={handleToggleSync} 
                    trackColor={{ false: colors.outlineVariant, true: colors.primary + '80' }}
                    thumbColor={isSyncEnabled ? colors.primary : '#f4f3f4'}
                  />
                }
              />
              <SettingRow 
                icon="log-out-outline" 
                title="Wyloguj się" 
                onPress={handleLogout}
                destructive={true}
                isLast={true}
                rightElement={<Ionicons name="chevron-forward" size={20} color={colors.outlineVariant} />}
              />
            </View>
          </>
        )}

        {/* --- Sekcja: Wygląd --- */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Wygląd</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow 
            icon="moon-outline" 
            title="Tryb ciemny" 
            rightElement={
              <Switch 
                value={theme === 'dark'} // Pobieramy wprost z globalnego kontekstu
                onValueChange={handleToggleTheme} 
                trackColor={{ false: colors.outlineVariant, true: colors.primary + '80' }}
                thumbColor={theme === 'dark' ? colors.primary : '#f4f3f4'}
              />
            }
          />
          <SettingRow 
            icon="color-palette-outline" 
            title="Motyw kolorystyczny" 
            isLast={true}
            rightElement={
              <View style={styles.rowRight}>
                <Text style={[styles.valueText, { color: colors.textSecondary }]}>Niebieski</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.outlineVariant} style={{ marginLeft: 8 }} />
              </View>
            }
          />
        </View>

        {/* --- Sekcja: Informacje --- */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Informacje</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow 
  icon="information-circle-outline" 
  title="O aplikacji" 
  isLast={true}
  rightElement={<Text style={[styles.valueText, { color: colors.textSecondary }]}>Wersja {Constants.expoConfig?.version || '1.0.0'}</Text>}
/>
        </View>

      </ScrollView>
    </View>
  );
}

// ... Style pozostają bez zmian (wklej poniżej te same style, co poprzednio)
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 12, marginLeft: 12 },
  card: { borderRadius: 20, overflow: 'hidden', elevation: 2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 8 },
  profileContainer: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  profileEmail: { fontSize: 14 },
  editProfileButton: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },
  loginBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  loginBadgeText: { color: 'white', fontWeight: '600', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rowTitle: { fontSize: 16, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  valueText: { fontSize: 15 }
});