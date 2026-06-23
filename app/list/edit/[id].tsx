// app/list/edit/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../src/components/ThemeProvider';
import { deleteList, getListById, updateListName } from '../../../src/database/repositories';

export default function EditListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [listName, setListName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { colors } = useAppTheme();

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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: 'Ustawienia listy', 
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text
      }} />
      
      <View style={styles.formContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Nazwa listy</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.outlineVariant, color: colors.text }]}
          value={listName}
          onChangeText={setListName}
          placeholder="Wpisz nazwę..."
          placeholderTextColor={colors.textSecondary}
        />

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary }]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          <Ionicons name="save-outline" size={20} color={colors.onPrimary} />
          <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>Zapisz zmiany</Text>
        </TouchableOpacity>

        <View style={[styles.dangerZone, { borderColor: colors.outlineVariant }]}>
          <Text style={[styles.dangerTitle, { color: colors.error }]}>Strefa niebezpieczna</Text>
          <Text style={[styles.dangerDescription, { color: colors.textSecondary }]}>
            Usunięcie listy kasuje również wszystkie jej logi czasu i zagnieżdżone zadania.
          </Text>
          
          <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.error }]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.onError} />
            <Text style={[styles.deleteButtonText, { color: colors.onError }]}>Usuń listę</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  dangerZone: {
    marginTop: 50,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  dangerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  dangerDescription: { fontSize: 14, marginBottom: 20 },
  deleteButton: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});