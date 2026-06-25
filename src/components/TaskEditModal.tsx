import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SubTask, Task } from '../database/repositories';
import BottomSheetModal from './BottomSheetModal';
import { useAppTheme } from './ThemeProvider';

interface TaskEditModalProps {
  visible: boolean;
  onClose: () => void;
  task?: Task | null;
  subTask?: SubTask | null;
  onSave: (id: string, title: string, priority: string, dueDate: string) => void;
}

export default function TaskEditModal({ visible, onClose, task, subTask, onSave }: TaskEditModalProps) {
  const { colors } = useAppTheme();
  
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');

  const isSubTask = !!subTask;
  const item = task || subTask;

  useEffect(() => {
    if (visible && item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(item.title);
      setPriority(item.priority || 'normal');
      setDueDate(item.due_date || '');
    }
  }, [visible, item]);

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

  const handleSave = () => {
    if (item && title.trim() !== '') {
      onSave(item.id, title.trim(), priority, dueDate);
      onClose();
    }
  };

  if (!item) return null;

  return (
    <BottomSheetModal 
      visible={visible} 
      onClose={onClose} 
      title={isSubTask ? "Edytuj podzadanie" : "Edytuj zadanie"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false} 
      >
        <Text style={[styles.label, { color: colors.text }]}>Tytuł</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.outlineVariant, color: colors.text }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Wpisz tytuł..."
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

        <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Priorytet</Text>
        <View style={styles.priorityContainer}>
          <TouchableOpacity 
            style={[
              styles.priorityButton, 
              priority === 'normal' ? { backgroundColor: colors.primary } : { backgroundColor: colors.surfaceVariant }
            ]}
            onPress={() => setPriority('normal')}
          >
            <Text style={[
              styles.priorityButtonText, 
              { color: priority === 'normal' ? colors.onPrimary : colors.text }
            ]}>Normalny</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.priorityButton, 
              priority === 'high' ? { backgroundColor: colors.error } : { backgroundColor: colors.surfaceVariant }
            ]}
            onPress={() => setPriority('high')}
          >
            <Text style={[
              styles.priorityButtonText, 
              { color: priority === 'high' ? colors.onError : colors.text }
            ]}>Wysoki</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary, marginTop: 30 }]} 
          onPress={handleSave}
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
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  priorityButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
