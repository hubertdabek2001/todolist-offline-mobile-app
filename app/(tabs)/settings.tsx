// app/(tabs)/settings.tsx
import { StyleSheet, Text, View, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/components/ThemeProvider';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { themePreference, setThemePreference, colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Text style={[styles.title, { color: colors.text }]}>Ustawienia</Text>

      <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Tryb Ciemny</Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            Aktualny tryb: {themePreference === 'system' ? 'Systemowy' : themePreference === 'dark' ? 'Ciemny' : 'Jasny'}
          </Text>
        </View>
        <Switch
          value={themePreference === 'dark' || (themePreference === 'system' && colors.background === '#10131a')}
          onValueChange={(value) => setThemePreference(value ? 'dark' : 'light')}
          trackColor={{ false: colors.outlineVariant, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      <View style={styles.systemToggleContainer}>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
           Użyj trybu systemowego?
        </Text>
        <Switch
          value={themePreference === 'system'}
          onValueChange={(value) => setThemePreference(value ? 'system' : 'light')}
          trackColor={{ false: colors.outlineVariant, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    marginTop: 16
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4
  },
  settingDescription: {
    fontSize: 14,
  },
  systemToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8
  }
});