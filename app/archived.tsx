// app/archived.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../src/components/ThemeProvider';
import { applyPulledData } from '../src/database/repositories';
import { fetchArchivedListsAPI, fetchSyncPull, restoreListAPI } from '../src/utils/api';

export default function ArchivedListsScreen() {
  const { colors } = useAppTheme();
  const [archivedLists, setArchivedLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadArchived = async () => {
    setIsLoading(true);
    const lists = await fetchArchivedListsAPI();
    setArchivedLists(lists || []);
    setIsLoading(false);
  };

  useEffect(() => {
    let isActive = true;
    const fetchLists = async () => {
      setIsLoading(true);
      const lists = await fetchArchivedListsAPI();
      if (isActive) {
        setArchivedLists(lists || []);
        setIsLoading(false);
      }
    };
    fetchLists();
    return () => { isActive = false; };
  }, []);

  const handleRestore = async (id: string, name: string) => {
    Alert.alert(
      "Przywracanie listy", 
      `Czy chcesz przywrócić "${name}" na swoje urządzenie?`, 
      [
        { text: "Anuluj", style: "cancel" },
        { text: "Przywróć", onPress: async () => {
            const success = await restoreListAPI(id);
            if (success) {
                // Wymuszamy PULL! Magia polega na tym, że po zmianie flagi w backendzie, 
                // telefon od razu ściągnie tę listę i wstrzyknie ją z powrotem do SQLite.
                const pulledData = await fetchSyncPull();
                if (pulledData) await applyPulledData(pulledData);
                
                Alert.alert("Sukces", "Lista jest znów dostępna na Twoim ekranie głównym!");
                loadArchived();
            } else {
                Alert.alert("Błąd", "Nie udało się przywrócić listy.");
            }
        }}
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: "Zarchiwizowane", 
          headerStyle: { backgroundColor: colors.surface }, 
          headerTintColor: colors.text 
        }} 
      />
      
      {isLoading ? (
        <ActivityIndicator style={{marginTop: 50}} color={colors.primary} />
      ) : archivedLists.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={60} color={colors.surfaceVariant} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Twoje archiwum jest puste.</Text>
        </View>
      ) : (
        <FlatList
          data={archivedLists}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
              <TouchableOpacity 
                style={[styles.restoreBtn, { backgroundColor: colors.primaryContainer }]} 
                onPress={() => handleRestore(item.id, item.name)}
              >
                <Ionicons name="refresh" size={16} color={colors.primary} />
                <Text style={[styles.restoreBtnText, { color: colors.primary }]}>Przywróć</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  title: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 12 },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  restoreBtnText: { fontSize: 13, fontWeight: 'bold', marginLeft: 4 }
});