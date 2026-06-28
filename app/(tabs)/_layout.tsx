// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/components/ThemeProvider';
import { fetchPendingInvitationsAPI } from '../../src/utils/api';

export default function TabLayout() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [invitationsCount, setInvitationsCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadInvitationsCount = async () => {
        const pendingInvitations = await fetchPendingInvitationsAPI();
        setInvitationsCount(pendingInvitations.length);
      };
      loadInvitationsCount();
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary, // Kolor aktywnej zakładki
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { 
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 5 : 0), 
          backgroundColor: colors.surface,
          borderTopColor: colors.outlineVariant
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Moje Listy',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shared"
        options={{
          title: 'Wspólne',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
          tabBarBadge: invitationsCount > 0 ? invitationsCount : undefined,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ustawienia',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}