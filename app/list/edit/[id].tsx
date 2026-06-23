// app/list/edit/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../src/components/ThemeProvider';
import { deleteList, evaluateAutoPriority, getListById, updateListDetails } from '../../../src/database/repositories';

const PREDEFINED_COLORS = [
  '#ffffff', // Domyślny
  '#FF5733', // Czerwono-pomarańczowy
  '#33FF57', // Zielony
  '#3357FF', // Niebieski
  '#F333FF', // Fioletowy
  '#FFB533', // Żółty
];

export default function EditListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [listName, setListName] = useState('');
  const [listColor, setListColor] = useState('#ffffff');
  const [editMode, setEditMode] = useState(0);
  const [autoPriority, setAutoPriority] = useState(0);
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { colors } = useAppTheme();

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      const listData = await getListById(id);
      if (listData) {
        setListName(listData.name);
        if (listData.primary_color) {
          setListColor(listData.primary_color);
        }
        setEditMode(listData.edit_mode || 0);
        setAutoPriority(listData.auto_priority || 0);
        setPriority(listData.priority || 'normal');
        setDueDate(listData.due_date || '');
      }
    }
    loadData();
  }, [id]);

  const handleSave = async () => {
    if (listName.trim() === '' || !id) return;
    setIsSaving(true);
    await updateListDetails(id, listName.trim(), listColor, editMode, autoPriority, priority, dueDate || null);
    if (autoPriority === 1) {
      await evaluateAutoPriority(id);
    }
    setIsSaving(false);
    Alert.alert("Zapisano", "Ustawienia listy zostały zaktualizowane.", [
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
      
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Nazwa listy</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.outlineVariant, color: colors.text }]}
          value={listName}
          onChangeText={setListName}
          placeholder="Wpisz nazwę..."
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.text }]}>Termin (YYYY-MM-DD)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.outlineVariant, color: colors.text }]}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="Opcjonalnie..."
          placeholderTextColor={colors.textSecondary}
        />

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>Wysoki priorytet</Text>
          <Switch 
            value={priority === 'high' ? true : false} 
            onValueChange={(val) => setPriority(val ? 'high' : 'normal')} 
          />
        </View>

        <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Kolor listy</Text>
        <View style={styles.colorsContainer}>
          {PREDEFINED_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorCircle,
                { backgroundColor: color },
                listColor === color && styles.selectedColorCircle,
                listColor === color && { borderColor: colors.primary }
              ]}
              onPress={() => setListColor(color)}
            />
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>Tryb edycji włączony</Text>
          <Switch 
            value={editMode === 1 ? true : false} 
            onValueChange={(val) => setEditMode(val ? 1 : 0)} 
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>Automatyczny wysoki priorytet dla przeterminowanych</Text>
          <Switch 
            value={autoPriority === 1 ? true : false} 
            onValueChange={(val) => setAutoPriority(val ? 1 : 0)} 
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary, marginTop: 20 }]} 
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    flex: 1,
    paddingRight: 10,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedColorCircle: {
    borderWidth: 3,
  },
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