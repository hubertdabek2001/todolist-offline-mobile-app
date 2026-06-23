// app/list/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/components/ThemeProvider';
import {
    createSubTask,
    createTask,
    deleteSubTask,
    deleteTask,
    getSubTasksForList,
    getTasksByList,
    SubTask,
    Task,
    toggleSubTaskStatus,
    toggleTaskStatus
} from '../../src/database/repositories';

export default function ListDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useAppTheme();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [selectedTaskForSubtask, setSelectedTaskForSubtask] = useState<Task | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [editingSubTaskTitle, setEditingSubTaskTitle] = useState('');
  
  const [editingTaskPriority, setEditingTaskPriority] = useState('normal');
  const [editingTaskDueDate, setEditingTaskDueDate] = useState('');
  const [editingSubTaskPriority, setEditingSubTaskPriority] = useState('normal');
  const [editingSubTaskDueDate, setEditingSubTaskDueDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isInputVisible, setIsInputVisible] = useState(false); // NOWY STAN
  const [editMode, setEditMode] = useState(0);
  const router = useRouter();

  const loadData = useCallback(async () => {
    if (!id) return;
    const { getListById } = await import('../../src/database/repositories');
    const listData = await getListById(id);
    if (listData) {
      setEditMode(listData.edit_mode || 0);
    }

    const fetchedTasks = await getTasksByList(id);
    const fetchedSubTasks = await getSubTasksForList(id);
    setTasks(fetchedTasks);
    setSubTasks(fetchedSubTasks);
  }, [id]);

  // W expo-router zamiast useEffect z setState rekomendowany jest useFocusEffect lub uruchomienie asynchroniczne nie-bezpośrednie,
  // Ale dla prostoty wyłączamy tutaj regułę dla tego konkretnego bloku (ponieważ getTasksByList itd. to zewnętrzne API bazy, z którymi się synchronizujemy, więc nie ma tu stricte anti-patternu wg dokumentacji React o zewnętrznych store'ach - choć oficjalny jest useSyncExternalStore).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const handleAddItem = async () => {
    if (inputText.trim() === '' || !id || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (selectedTaskForSubtask) {
        await createSubTask(selectedTaskForSubtask.id, inputText.trim());
        setSelectedTaskForSubtask(null);
      } else {
        await createTask(id, inputText.trim());
      }
      
      setInputText('');
      setIsInputVisible(false); // Zamknięcie po dodaniu
      await loadData();
    } catch (e) {
      console.error("Błąd podczas dodawania:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    await toggleTaskStatus(task.id, task.is_completed);
    await loadData();
  };

  const handleToggleSubTask = async (subTask: SubTask) => {
    await toggleSubTaskStatus(subTask.id, subTask.is_completed);
    await loadData();
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      "Usuwanie zadania",
      `Czy na pewno chcesz usunąć "${task.title}"? Wszystkie podzadania zostaną również usunięte.`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            await deleteTask(task.id);
            await loadData();
          }
        }
      ]
    );
  };

  const handleDeleteSubTask = (subTask: SubTask) => {
    Alert.alert(
      "Usuwanie podzadania",
      `Czy na pewno chcesz usunąć "${subTask.title}"?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            await deleteSubTask(subTask.id);
            await loadData();
          }
        }
      ]
    );
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
    setEditingTaskPriority(task.priority || 'normal');
    setEditingTaskDueDate(task.due_date || '');
  };

  const handleSaveTaskEdit = async (taskId: string) => {
    if (editingTaskTitle.trim() === '') return;
    const { updateTaskDetails } = await import('../../src/database/repositories');
    await updateTaskDetails(taskId, editingTaskTitle.trim(), editingTaskPriority, editingTaskDueDate || null);
    setEditingTaskId(null);
    await loadData();
  };

  const handleEditSubTask = (subTask: SubTask) => {
    setEditingSubTaskId(subTask.id);
    setEditingSubTaskTitle(subTask.title);
    setEditingSubTaskPriority(subTask.priority || 'normal');
    setEditingSubTaskDueDate(subTask.due_date || '');
  };

  const handleSaveSubTaskEdit = async (subTaskId: string) => {
    if (editingSubTaskTitle.trim() === '') return;
    const { updateSubTaskDetails } = await import('../../src/database/repositories');
    await updateSubTaskDetails(subTaskId, editingSubTaskTitle.trim(), editingSubTaskPriority, editingSubTaskDueDate || null);
    setEditingSubTaskId(null);
    await loadData();
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const currentSubTasks = subTasks.filter(st => st.task_id === item.id);
    const isEditing = editingTaskId === item.id;

    return (
      <View style={[styles.taskGroupContainer, { backgroundColor: colors.surface, shadowColor: theme === 'dark' ? '#000' : '#000' }]}>
        <View style={styles.taskRow}>
          <TouchableOpacity onPress={() => handleToggleTask(item)} style={styles.checkbox}>
            <Ionicons 
              name={item.is_completed ? "checkbox" : "square-outline"} 
              size={24} 
              color={item.is_completed ? colors.success : colors.textSecondary} 
            />
          </TouchableOpacity>
          
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.editInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.primary }]}
                value={editingTaskTitle}
                onChangeText={setEditingTaskTitle}
                placeholder="Tytuł zadania"
                autoFocus
              />
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.editInputSmall, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.primary }]}
                  value={editingTaskDueDate}
                  onChangeText={setEditingTaskDueDate}
                  placeholder="YYYY-MM-DD"
                />
                <TouchableOpacity 
                  onPress={() => setEditingTaskPriority(editingTaskPriority === 'normal' ? 'high' : 'normal')}
                  style={[styles.priorityToggle, { backgroundColor: editingTaskPriority === 'high' ? colors.error : colors.surfaceVariant }]}
                >
                  <Text style={{ color: editingTaskPriority === 'high' ? colors.onError : colors.text, fontSize: 12 }}>
                    {editingTaskPriority === 'high' ? 'High' : 'Normal'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSaveTaskEdit(item.id)} style={{ marginLeft: 8 }}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text 
                style={[styles.taskTitle, { color: item.priority === 'high' ? colors.error : colors.text }, item.is_completed ? [styles.completedText, { color: colors.textSecondary }] : undefined]}
                onLongPress={() => { if (editMode === 1) handleEditTask(item); }}
              >
                {item.title}
              </Text>
              {item.due_date && <Text style={{ fontSize: 12, color: colors.textSecondary }}>Due: {item.due_date}</Text>}
            </View>
          )}

          {editMode === 1 && !isEditing && (
            <>
              <TouchableOpacity 
                onPress={() => {
                  setSelectedTaskForSubtask(item);
                  setIsInputVisible(true);
                }} 
                style={styles.actionIcon}
              >
                <Ionicons name="git-branch-outline" size={20} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleEditTask(item)} 
                style={styles.actionIcon}
              >
                <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleDeleteTask(item)} 
                style={styles.actionIcon}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {currentSubTasks.map((subTask) => {
          const isEditingSubTask = editingSubTaskId === subTask.id;
          return (
            <View key={subTask.id} style={[styles.subTaskRow, { borderLeftColor: colors.connector }]}>
              <TouchableOpacity onPress={() => handleToggleSubTask(subTask)} style={styles.checkbox}>
                <Ionicons 
                  name={subTask.is_completed ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={subTask.is_completed ? colors.success : colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {isEditingSubTask ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.primary }]}
                    value={editingSubTaskTitle}
                    onChangeText={setEditingSubTaskTitle}
                    placeholder="Tytuł podzadania"
                    autoFocus
                  />
                  <View style={styles.editRow}>
                    <TextInput
                      style={[styles.editInputSmall, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.primary }]}
                      value={editingSubTaskDueDate}
                      onChangeText={setEditingSubTaskDueDate}
                      placeholder="YYYY-MM-DD"
                    />
                    <TouchableOpacity 
                      onPress={() => setEditingSubTaskPriority(editingSubTaskPriority === 'normal' ? 'high' : 'normal')}
                      style={[styles.priorityToggle, { backgroundColor: editingSubTaskPriority === 'high' ? colors.error : colors.surfaceVariant }]}
                    >
                      <Text style={{ color: editingSubTaskPriority === 'high' ? colors.onError : colors.text, fontSize: 12 }}>
                        {editingSubTaskPriority === 'high' ? 'High' : 'Normal'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleSaveSubTaskEdit(subTask.id)} style={{ marginLeft: 8 }}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <Text 
                    style={[styles.subTaskTitle, { color: subTask.priority === 'high' ? colors.error : colors.textSecondary }, subTask.is_completed ? [styles.completedText, { color: colors.textSecondary }] : undefined]}
                    onLongPress={() => { if (editMode === 1) handleEditSubTask(subTask); }}
                  >
                    {subTask.title}
                  </Text>
                  {subTask.due_date && <Text style={{ fontSize: 10, color: colors.textSecondary }}>Due: {subTask.due_date}</Text>}
                </View>
              )}

              {editMode === 1 && !isEditingSubTask && (
                <>
                  <TouchableOpacity 
                    onPress={() => handleEditSubTask(subTask)} 
                    style={styles.actionIcon}
                  >
                    <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleDeleteSubTask(subTask)} 
                    style={styles.actionIcon}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: name || 'Szczegóły listy', 
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                onPress={() => router.push(`/list/share/${id}`)} 
                style={{ marginRight: 15, padding: 5 }}
              >
                <Ionicons name="qr-code-outline" size={26} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push(`/list/edit/${id}`)} 
                style={{ marginRight: 5, padding: 5 }}
              >
                <Ionicons name="settings-outline" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )
        }} 
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'android' ? 'padding' : 'height'} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'android' ? 90 : 0} 
      >
        {/* Kontener listy rozpychający się na ekranie */}
        <View style={{ flex: 1 }}>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Brak zadań na tej liście. Wpisz coś poniżej.</Text>
            }
          />
        </View>

        {/* Dolny kontener w naturalnym układzie (bez position absolute) */}
        <View style={[styles.floatingInputWrapper, { paddingBottom: Math.max(24, insets.bottom + 10) }]}>
          {!isInputVisible && !selectedTaskForSubtask ? (
            <TouchableOpacity 
              style={[styles.fabButton, { backgroundColor: colors.primary }]} 
              onPress={() => setIsInputVisible(true)}
            >
              <Ionicons name="add" size={28} color={colors.onPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.inputWrapperBox, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              {selectedTaskForSubtask && (
                <View style={[styles.badgeContainer, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.badgeText, { color: colors.onPrimaryContainer }]}>
                    Dodajesz podzadanie do: <Text style={{fontWeight: '600'}}>{selectedTaskForSubtask.title}</Text>
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setSelectedTaskForSubtask(null);
                    // Jeśli chcemy również schować klawiaturę: setIsInputVisible(false);
                  }}>
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputBar}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
                  placeholder={selectedTaskForSubtask ? "Nazwa podzadania..." : "Nazwa nowego zadania..."}
                  placeholderTextColor={colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleAddItem}
                  autoFocus={true} // Automatycznie wywołuje klawiaturę
                />
                <TouchableOpacity 
                  style={[styles.floatingCloseButton, { backgroundColor: colors.surfaceVariant, marginRight: 8 }]} 
                  onPress={() => {
                    setIsInputVisible(false);
                    setSelectedTaskForSubtask(null);
                    setInputText('');
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={handleAddItem}>
                  <Ionicons name="arrow-up" size={22} color={colors.onPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  listContent: { padding: 16 },
  taskGroupContainer: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    elevation: 1,
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  subTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginLeft: 32,
    borderLeftWidth: 1,
    paddingLeft: 12,
    marginTop: 4,
  },
  checkbox: { marginRight: 10 },
  taskTitle: { flex: 1, fontSize: 16, fontWeight: '500' },
  subTaskTitle: { flex: 1, fontSize: 14 },
  completedText: {
    textDecorationLine: 'line-through',
  },
  editContainer: { flex: 1 },
  editRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  editInputSmall: { flex: 1, fontSize: 12, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, marginRight: 8 },
  priorityToggle: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  editInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionIcon: { padding: 6, marginLeft: 4 },
  emptyText: { textAlign: 'center', marginTop: 40 },
  
  // --- Style dla FAB i paska wejściowego ---
  floatingInputWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  inputWrapperBox: {
    padding: 10,
    borderRadius: 24,
    borderWidth: 1,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center'
  },
  badgeText: { fontSize: 12, flex: 1 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    marginRight: 10,
  },
  floatingCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});