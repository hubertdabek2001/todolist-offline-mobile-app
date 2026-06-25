import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TodoList, updateListDetails } from '../database/repositories';
import BottomSheetModal from './BottomSheetModal';
import { useAppTheme } from './ThemeProvider';

const PREDEFINED_COLORS = [
  '#ffffff',
  '#FF5733',
  '#33FF57',
  '#3357FF',
  '#F333FF',
  '#FFB533',
];

const PREDEFINED_ICONS = [
  'briefcase-outline',
  'cart-outline',
  'home-outline',
  'book-outline',
  'fitness-outline',
  'airplane-outline',
  'heart-outline',
  'star-outline',
];

interface ListSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  list: TodoList | null;
  onSave: () => void;
}

export default function ListSettingsModal({ visible, onClose, list, onSave }: ListSettingsModalProps) {
  const { colors } = useAppTheme();
  
  const [listName, setListName] = useState('');
  const [listColor, setListColor] = useState('#ffffff');
  const [dueDate, setDueDate] = useState('');
  const [icon, setIcon] = useState('briefcase-outline');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && list) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setListName(list.name);
      setListColor(list.primary_color || '#ffffff');
      setDueDate(list.due_date || '');
      setIcon(list.icon || 'briefcase-outline');
    }
  }, [visible, list]);

  const handleSave = async () => {
    if (!list || listName.trim() === '') return;
    setIsSaving(true);
    await updateListDetails(
      list.id,
      listName.trim(),
      listColor,
      list.edit_mode || 0,
      list.auto_priority || 0,
      list.priority || 'normal',
      dueDate || null,
      icon
    );
    setIsSaving(false);
    onSave();
    onClose();
  };

  const formatDateInput = (text: string) => {
    const numericText = text.replace(/\D/g, '');
    let formattedText = numericText;
    if (numericText.length > 2 && numericText.length <= 4) {
      formattedText = `${numericText.slice(0, 2)}-${numericText.slice(2)}`;
    } else if (numericText.length > 4) {
      formattedText = `${numericText.slice(0, 2)}-${numericText.slice(2, 4)}-${numericText.slice(4, 8)}`;
    }
    return formattedText;
  };

  if (!list) return null;

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title="Ustawienia listy">
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false} 
      >
        <Text style={[styles.label, { color: colors.text }]}>Nazwa listy</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.outlineVariant, color: colors.text }]}
          value={listName}
          onChangeText={setListName}
          placeholder="Wpisz nazwę..."
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.text }]}>Termin (DD-MM-YYYY)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.outlineVariant, color: colors.text }]}
          value={dueDate}
          onChangeText={(text) => setDueDate(formatDateInput(text))}
          placeholder="Opcjonalnie..."
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          maxLength={10}
        />

        <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Kolor listy</Text>
        <View style={styles.colorsContainer}>
          {PREDEFINED_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                listColor === c && styles.selectedColorCircle,
                listColor === c && { borderColor: colors.primary }
              ]}
              onPress={() => setListColor(c)}
            />
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Ikona listy</Text>
        <View style={styles.colorsContainer}>
          {PREDEFINED_ICONS.map(i => (
            <TouchableOpacity
              key={i}
              style={[
                styles.iconCircle,
                { backgroundColor: colors.background },
                icon === i && styles.selectedColorCircle,
                icon === i && { borderColor: colors.primary }
              ]}
              onPress={() => setIcon(i)}
            >
              <Ionicons name={i as any} size={24} color={icon === i ? colors.primary : colors.text} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary, marginTop: 20 }]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          <Ionicons name="save-outline" size={20} color={colors.onPrimary} />
          <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>Zapisz zmiany</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 20,
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
