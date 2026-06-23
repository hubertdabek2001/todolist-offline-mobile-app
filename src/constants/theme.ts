/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#191c1e',
    background: '#f8fafc',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#64748b',
    surface: '#ffffff',
    surfaceDim: '#d8dadc',
    surfaceBright: '#f7f9fb',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f2f4f6',
    surfaceContainer: '#eceef0',
    surfaceContainerHigh: '#e6e8ea',
    surfaceContainerHighest: '#e0e3e5',
    onSurface: '#191c1e',
    onSurfaceVariant: '#3f4850',
    inverseSurface: '#2d3133',
    inverseOnSurface: '#eff1f3',
    outline: '#707882',
    outlineVariant: '#bfc7d2',
    surfaceTint: '#00639a',
    primary: '#2f95dc',
    onPrimary: '#ffffff',
    primaryContainer: '#007abc',
    onPrimaryContainer: '#fdfcff',
    inversePrimary: '#95ccff',
    secondary: '#545f73',
    onSecondary: '#ffffff',
    secondaryContainer: '#d5e0f8',
    onSecondaryContainer: '#586377',
    tertiary: '#4d5d73',
    onTertiary: '#ffffff',
    tertiaryContainer: '#66768d',
    onTertiaryContainer: '#fdfcff',
    error: '#ef4444',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',
    primaryFixed: '#cde5ff',
    primaryFixedDim: '#95ccff',
    onPrimaryFixed: '#001d32',
    onPrimaryFixedVariant: '#004a75',
    secondaryFixed: '#d8e3fb',
    secondaryFixedDim: '#bcc7de',
    onSecondaryFixed: '#111c2d',
    onSecondaryFixedVariant: '#3c475a',
    tertiaryFixed: '#d3e4fe',
    tertiaryFixedDim: '#b7c8e1',
    onTertiaryFixed: '#0b1c30',
    onTertiaryFixedVariant: '#38485d',
    onBackground: '#191c1e',
    surfaceVariant: '#e0e3e5',
    success: '#10b981',
    warning: '#f59e0b',
    inputBg: '#f1f5f9',
    connector: '#cbd5e1',
  },
  dark: {
    text: '#f8fafc',
    background: '#10131a',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#94a3b8',
    surface: '#121212',
    surfaceDim: '#1a1a1a',
    surfaceBright: '#242424',
    surfaceContainerLowest: '#0a0a0a',
    surfaceContainerLow: '#1e1e1e',
    surfaceContainer: '#2c2c2c',
    surfaceContainerHigh: '#3d3d3d',
    surfaceContainerHighest: '#4a4a4a',
    onSurface: '#e2e8f0',
    onSurfaceVariant: '#94a3b8',
    outline: '#475569',
    outlineVariant: '#334155',
    primary: '#3b82f6',
    onPrimary: '#ffffff',
    primaryContainer: '#1d4ed8',
    onPrimaryContainer: '#dbeafe',
    inverseSurface: '#e1e2ec',
    inverseOnSurface: '#2e3038',
    surfaceTint: '#adc6ff',
    inversePrimary: '#005ac2',
    secondary: '#10b981',
    onSecondary: '#ffffff',
    secondaryContainer: '#065f46',
    onSecondaryContainer: '#d1fae5',
    tertiary: '#ffb786',
    onTertiary: '#502400',
    tertiaryContainer: '#df7412',
    onTertiaryContainer: '#461f00',
    error: '#ef4444',
    onError: '#ffffff',
    errorContainer: '#991b1b',
    onErrorContainer: '#fee2e2',
    primaryFixed: '#d8e2ff',
    primaryFixedDim: '#adc6ff',
    onPrimaryFixed: '#001a42',
    onPrimaryFixedVariant: '#004395',
    secondaryFixed: '#6ffbbe',
    secondaryFixedDim: '#4edea3',
    onSecondaryFixed: '#002113',
    onSecondaryFixedVariant: '#005236',
    tertiaryFixed: '#ffdcc6',
    tertiaryFixedDim: '#ffb786',
    onTertiaryFixed: '#311400',
    onTertiaryFixedVariant: '#723600',
    onBackground: '#e1e2ec',
    surfaceVariant: '#32353c',
    success: '#10b981',
    warning: '#f59e0b',
    inputBg: '#1e1e1e',
    connector: '#475569',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const AccentColors = {
  blue: {
    light: { primary: '#2f95dc', secondary: '#545f73', surfaceTint: '#00639a' },
    dark: { primary: '#3b82f6', secondary: '#10b981', surfaceTint: '#adc6ff' },
    name: 'Niebieski'
  },
  green: {
    light: { primary: '#10b981', secondary: '#047857', surfaceTint: '#059669' },
    dark: { primary: '#34d399', secondary: '#059669', surfaceTint: '#6ee7b7' },
    name: 'Zielony'
  },
  purple: {
    light: { primary: '#8b5cf6', secondary: '#6d28d9', surfaceTint: '#7c3aed' },
    dark: { primary: '#a78bfa', secondary: '#7c3aed', surfaceTint: '#c4b5fd' },
    name: 'Fioletowy'
  },
  rose: {
    light: { primary: '#f43f5e', secondary: '#be123c', surfaceTint: '#e11d48' },
    dark: { primary: '#fb7185', secondary: '#e11d48', surfaceTint: '#fda4af' },
    name: 'Różowy'
  },
  orange: {
    light: { primary: '#f97316', secondary: '#c2410c', surfaceTint: '#ea580c' },
    dark: { primary: '#fb923c', secondary: '#ea580c', surfaceTint: '#fdba74' },
    name: 'Pomarańczowy'
  }
};

export type AccentTheme = keyof typeof AccentColors;