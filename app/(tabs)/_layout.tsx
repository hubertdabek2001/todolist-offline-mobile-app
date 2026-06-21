// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2f95dc', // Kolor aktywnej zakładki
        tabBarStyle: { paddingBottom: 5, height: 60, marginBottom: 50 },
      }}
    >
      <Tabs.Screen
        name="shared"
        options={{
          title: 'Wspólne',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Moje Listy',
          // Ten ekran jest główny, upewniamy się, że ikona to odzwierciedla
          tabBarIcon: ({ color }) => <Ionicons name="list-circle" size={32} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ustawienia',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}