// app/(tabs)/settings.tsx
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/components/ThemeProvider';
import { AccentColors, AccentTheme } from '../../src/constants/theme';
import { API_URL, refreshAccessToken } from '../../src/utils/api';

export default function SettingsScreen() {
  const { colors, theme, setThemePreference, accentTheme, setAccentTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [isPaletteVisible, setIsPaletteVisible] = useState(false); // STAN DLA MODALA KOLORÓW
  
  const [profileName, setProfileName] = useState('Ładowanie...');
  const [avatarInitial, setAvatarInitial] = useState('U');

  useFocusEffect(
    useCallback(() => {
      const loadSettingsAndProfile = async () => {
        const syncOption = await SecureStore.getItemAsync('syncEnabled');
        if (syncOption !== null) {
          setIsSyncEnabled(syncOption === 'true');
        }

        let token = await SecureStore.getItemAsync('accessToken');
        if (!token) {
          setIsLoggedIn(false);
          return;
        }

        setIsLoggedIn(true);

        try {
          let response = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.status === 401) {
            token = await refreshAccessToken();
            if (token) {
              response = await fetch(`${API_URL}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
            } else {
              setIsLoggedIn(false);
              return;
            }
          }

          if (response.ok) {
            const data = await response.json();
            const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            
            if (fullName) {
              setProfileName(fullName);
              setAvatarInitial(data.firstName.charAt(0).toUpperCase());
            } else if (data.username) {
              setProfileName(`@${data.username}`);
              setAvatarInitial(data.username.charAt(0).toUpperCase());
            } else {
              setProfileName('Zalogowany użytkownik');
              setAvatarInitial('U');
            }
          }
        } catch (error) {
          console.log("[SETTINGS] Błąd pobierania profilu (tryb offline z tokenem)", error);
          setProfileName('Połączono (Offline)');
        }
      };

      loadSettingsAndProfile();
    }, [])
  );

  const handleToggleSync = async (value: boolean) => {
    setIsSyncEnabled(value);
    await SecureStore.setItemAsync('syncEnabled', String(value));
  };

  const handleToggleTheme = (value: boolean) => {
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
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    router.replace('/'); 
  };

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
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ustawienia</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Karta Profilu */}
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: theme === 'dark' ? '#000' : '#000' }]}>
          {isLoggedIn ? (
            <View style={styles.profileContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{avatarInitial}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                  {profileName}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>Połączono z chmurą</Text>
              </View>
              <TouchableOpacity style={styles.editProfileButton} onPress={() => router.push('/profile')}>
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.profileContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="cloud-offline" size={28} color={colors.textSecondary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>Użytkownik</Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>Tylko na tym urządzeniu</Text>
              </View>
              <TouchableOpacity style={[styles.loginBadge, { backgroundColor: colors.primary }]} onPress={handleLogin}>
                <Text style={styles.loginBadgeText}>Zaloguj się</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sekcja: Konto */}
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

        {/* Sekcja: Wygląd */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Wygląd</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow 
            icon="moon-outline" 
            title="Tryb ciemny" 
            rightElement={
              <Switch 
                value={theme === 'dark'} 
                onValueChange={handleToggleTheme} 
                trackColor={{ false: colors.outlineVariant, true: colors.primary + '80' }}
                thumbColor={theme === 'dark' ? colors.primary : '#f4f3f4'}
              />
            }
          />
          
          {/* NOWY WIERSZ DLA MOTYWU KOLORYSTYCZNEGO */}
          <SettingRow 
            icon="color-palette-outline" 
            title="Motyw" 
            isLast={true}
            onPress={() => setIsPaletteVisible(true)} // Otwiera Modal
            rightElement={
              <View style={styles.rowRight}>
                {/* Wskaźnik z kropką obecnego koloru */}
                <View style={{
                  width: 16, height: 16, borderRadius: 8,
                  backgroundColor: AccentColors[accentTheme][theme].primary,
                  marginRight: 8
                }} />
                <Text style={[styles.valueText, { color: colors.textSecondary }]}>
                  {AccentColors[accentTheme].name}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.outlineVariant} style={{ marginLeft: 8 }} />
              </View>
            }
          />
        </View>

        {/* Sekcja: Informacje */}
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

      {/* --- MODAL WYSUWANY Z DOŁU (BOTTOM SHEET) DLA KOLORÓW --- */}
      <Modal
        visible={isPaletteVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPaletteVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsPaletteVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 24 }]}
          >
            <View style={styles.modalDragIndicator} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Wybierz motyw aplikacji</Text>
            
            <View style={styles.swatchContainer}>
              {Object.entries(AccentColors).map(([key, value]) => {
                const isSelected = accentTheme === key;
                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.7}
                    onPress={() => {
                      setAccentTheme(key as AccentTheme);
                      setIsPaletteVisible(false); // Automatycznie zamyka panel po wyborze
                    }}
                    style={[
                      styles.swatchCircle,
                      {
                        backgroundColor: value[theme].primary,
                        borderColor: theme === 'dark' ? '#fff' : '#191c1e',
                        borderWidth: isSelected ? 3 : 0,
                        shadowColor: value[theme].primary,
                        shadowOpacity: isSelected ? 0.5 : 0.1,
                        elevation: isSelected ? 6 : 2,
                      }
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={24} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 12, marginLeft: 12 },
  card: { borderRadius: 20, overflow: 'hidden', elevation: 2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 8 },
  profileContainer: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
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
  valueText: { fontSize: 15 },
  
  // Style dla Modala
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalDragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  swatchContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  swatchCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  }
});