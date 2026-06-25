// src/components/ThemeProvider.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { AccentColors, AccentTheme, Colors } from '../constants/theme';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themePreference: ThemeType;
  setThemePreference: (theme: ThemeType) => void;
  accentTheme: AccentTheme;                                 // NOWE
  setAccentTheme: (accent: AccentTheme) => void;            // NOWE
  colors: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themePreference: 'system',
  setThemePreference: () => {},
  accentTheme: 'blue',
  setAccentTheme: () => {},
  colors: Colors.light,
});

export const useAppTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemeType>('system');
  const [accentThemeState, setAccentThemeState] = useState<AccentTheme>('blue'); // Stan motywu kolorystycznego
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('themePreference');
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemePreferenceState(storedTheme as ThemeType);
        }

        // Wczytywanie motywu kolorystycznego
        const storedAccent = await AsyncStorage.getItem('accentTheme');
        if (storedAccent && Object.keys(AccentColors).includes(storedAccent)) {
          setAccentThemeState(storedAccent as AccentTheme);
        }
      } catch (e) {
        console.error('Failed to load theme preferences', e);
      } finally {
        setIsReady(true);
      }
    };
    loadSettings();
  }, []);

  const setThemePreference = async (newTheme: ThemeType) => {
    setThemePreferenceState(newTheme);
    try {
      await AsyncStorage.setItem('themePreference', newTheme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const setAccentTheme = async (newAccent: AccentTheme) => {
    setAccentThemeState(newAccent);
    try {
      await AsyncStorage.setItem('accentTheme', newAccent);
    } catch (e) {
      console.error('Failed to save accent theme', e);
    }
  };

  const currentTheme = themePreference === 'system' 
    ? (systemColorScheme === 'dark' ? 'dark' : 'light') 
    : themePreference;

  // Magia: Bierzemy bazowe kolory i nadpisujemy je wybranym motywem!
  const baseColors = Colors[currentTheme];
  const activeAccentColors = AccentColors[accentThemeState][currentTheme];
  const finalColors = { ...baseColors, ...activeAccentColors };

  if (!isReady) {
    return null; 
  }

  return (
    <ThemeContext.Provider value={{ 
      theme: currentTheme, 
      themePreference, 
      setThemePreference, 
      accentTheme: accentThemeState, 
      setAccentTheme, 
      colors: finalColors 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}