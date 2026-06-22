import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors } from '../constants/theme';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themePreference: ThemeType;
  setThemePreference: (theme: ThemeType) => void;
  colors: typeof Colors.light | typeof Colors.dark;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themePreference: 'system',
  setThemePreference: () => {},
  colors: Colors.light,
});

export const useAppTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemeType>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('themePreference');
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemePreferenceState(storedTheme as ThemeType);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, []);

  const setThemePreference = async (newTheme: ThemeType) => {
    setThemePreferenceState(newTheme);
    try {
      await AsyncStorage.setItem('themePreference', newTheme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const currentTheme = themePreference === 'system'
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : themePreference;

  const colors = Colors[currentTheme];

  if (!isReady) {
    return null; // Or some kind of loading spinner if appropriate
  }

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, themePreference, setThemePreference, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}
