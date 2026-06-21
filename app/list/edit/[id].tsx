// app/list/edit/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteList, getListById, updateListName } from '../../../src/database/repositories';

export default function EditListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [listName, setListName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      const listData = await getListById(id);
      if (listData) {
        setListName(listData.name);
      }
    }
    loadData();
  }, [id]);

  const handleSave = async () => {
    if (listName.trim() === '' || !id) return;
    setIsSaving(true);
    await updateListName(id, listName.trim());
    setIsSaving(false);
    Alert.alert("Zapisano", "Nazwa listy została zaktualizowana.", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      "Usuwanie listy",
      "Czy na pewno chcesz usunąć tę listę? Wszystkie zadania i podzadania zostaną bezpowrotnie utracone.",
      [
        { text: "Anuluj", style: "cancel" },
        { 
          text: "Usuń", 
          style: "destructive", 
          onPress: async () => {
            if (id) {
              await deleteList(id);
              router.replace('/');
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Ustawienia listy' }} />
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Nazwa listy</Text>
        <TextInput
          style={styles.input}
          value={listName}
          onChangeText={setListName}
          placeholder="Wpisz nazwę..."
        />

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={isSaving}
        >
          <Ionicons name="save-outline" size={20} color="white" />
          <Text style={styles.saveButtonText}>Zapisz zmiany</Text>
        </TouchableOpacity>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Strefa niebezpieczna</Text>
          <Text style={styles.dangerDescription}>
            Usunięcie listy kasuje również wszystkie jej logi czasu i zagnieżdżone zadania.
          </Text>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text style={styles.deleteButtonText}>Usuń listę</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  formContainer: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: {
    backgroundColor: 'white',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#2f95dc',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  dangerZone: {
    marginTop: 50,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  dangerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ef4444', marginBottom: 8 },
  dangerDescription: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  deleteButton: {
    backgroundColor: '#ef4444',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});