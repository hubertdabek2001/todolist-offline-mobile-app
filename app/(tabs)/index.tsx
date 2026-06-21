// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createList, getMyLists } from '../../src/database/repositories';
// Definiujemy prosty interfejs pod to, co zwraca nam zapytanie SQLite
interface TodoList {
  id: string;
  name: string;
  is_archived: number;
}

export default function MyListsScreen() {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [newListName, setNewListName] = useState('');
  const router = useRouter();

  

  // Funkcja pobierająca listy z lokalnej bazy
 const loadLists = async () => {
    try {
      const data = await getMyLists(); // Zmiana tutaj
      setLists(data as TodoList[]);
    } catch (error) {
      console.error("Błąd pobierania list:", error);
    }
  };

  // Ładujemy dane przy zamontowaniu komponentu
  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  // Obsługa dodawania nowej listy
  const handleAddList = async () => {
    if (newListName.trim() === '') return;
    
    await createList(newListName.trim());
    setNewListName('');
    await loadLists(); // Odświeżenie widoku
  };

  // Renderowanie pojedynczego kafelka listy
  const renderItem = ({ item }: { item: TodoList }) => (
  <TouchableOpacity 
    style={styles.listCard} 
    onPress={() => router.push({
      pathname: `/list/${item.id}`,
      params: { name: item.name }
    })}
  >
    <Text style={styles.listName}>{item.name}</Text>
    <Ionicons name="chevron-forward" size={24} color="#666" />
  </TouchableOpacity>
);


  return (
    <View style={styles.container}>
      {/* Lista elementów */}
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Brak list. Dodaj swoją pierwszą listę poniżej!</Text>
        }
      />

      {/* Pasek dodawania nowej listy na dole ekranu */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nazwa nowej listy..."
          value={newListName}
          onChangeText={setNewListName}
          onSubmitEditing={handleAddList}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddList}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Twój secondaryColor z backendu
  },
  listContainer: {
    padding: 16,
  },
  listCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  listName: {
    fontSize: 18,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    backgroundColor: '#2f95dc',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});