// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ListPreviewCard, { SNAP_INTERVAL } from '../../src/components/ListPreviewCard';
import { useAppTheme } from '../../src/components/ThemeProvider';
import { createList, getMyLists } from '../../src/database/repositories';

const { width } = Dimensions.get('window');

interface TodoList {
  id: string;
  name: string;
  is_archived: number;
  primary_color: string;
}

export default function MyListsScreen() {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [newListName, setNewListName] = useState('');
  const router = useRouter();
  const { colors } = useAppTheme();

  const loadLists = async () => {
    try {
      const data = await getMyLists();
      setLists(data as TodoList[]);
    } catch (error) {
      console.error("Błąd pobierania list:", error);
    }
  };

  useFocusEffect(
    useCallback(() => { loadLists(); }, [])
  );

  const handleAddList = async () => {
    if (newListName.trim() === '') return;
    await createList(newListName.trim());
    setNewListName('');
    await loadLists(); 
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* KARUZELA LIST */}
      <View style={styles.carouselContainer}>
        {lists.length === 0 ? (
          <Text style={[styles.emptyGlobalText, { color: colors.textSecondary }]}>Brak list. Utwórz pierwszą listę poniżej!</Text>
        ) : (
          <FlatList
            horizontal
            data={lists}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            
            // 1. Zmiana: Precyzyjne zatrzaskiwanie na środku bez błędu Androida
            snapToOffsets={lists.map((_, i) => i * SNAP_INTERVAL)}
            
            // 2. Zmiana: Blokuje przeskakiwanie kilku list na raz przy mocnym machnięciu palcem
            disableIntervalMomentum={true} 
            
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: (width - SNAP_INTERVAL) / 2 }}
            
            renderItem={({ item }) => (
              <ListPreviewCard 
                list={item} 
                onPress={() => router.push({
                  pathname: `/list/${item.id}`,
                  params: { name: item.name }
                } as any)}
              />
            )}
          />
        )}
      </View>

      {/* PASEK DODAWANIA */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
          placeholder="Nazwa nowej listy..."
          placeholderTextColor={colors.textSecondary}
          value={newListName}
          onChangeText={setNewListName}
          onSubmitEditing={handleAddList}
        />
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddList}>
          <Ionicons name="add" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselContainer: {
    flex: 1, // Zajmuje całą dostępną przestrzeń nad paskiem dodawania
    paddingVertical: 20, // Odsunięcie od góry i dołu
  },
  emptyGlobalText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});