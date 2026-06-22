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
    toggleTaskStatus,
    updateSubTaskTitle,
    updateTaskTitle
} from '../../src/database/repositories';

export default function ListDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const insets = useSafeAreaInsets();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [selectedTaskForSubtask, setSelectedTaskForSubtask] = useState<Task | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [editingSubTaskTitle, setEditingSubTaskTitle] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const router = useRouter();

  const loadData = useCallback(async () => {
    if (!id) return;
    const fetchedTasks = await getTasksByList(id);
    const fetchedSubTasks = await getSubTasksForList(id);
    setTasks(fetchedTasks);
    setSubTasks(fetchedSubTasks);
  }, [id]);

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
  };

  const handleSaveTaskEdit = async (taskId: string) => {
    if (editingTaskTitle.trim() === '') return;
    await updateTaskTitle(taskId, editingTaskTitle.trim());
    setEditingTaskId(null);
    await loadData();
  };

  const handleEditSubTask = (subTask: SubTask) => {
    setEditingSubTaskId(subTask.id);
    setEditingSubTaskTitle(subTask.title);
  };

  const handleSaveSubTaskEdit = async (subTaskId: string) => {
    if (editingSubTaskTitle.trim() === '') return;
    await updateSubTaskTitle(subTaskId, editingSubTaskTitle.trim());
    setEditingSubTaskId(null);
    await loadData();
  };

  // Komponent renderujący zadanie wraz z jego przypisanymi podzadaniami
  const renderTaskItem = ({ item }: { item: Task }) => {
    // Filtrujemy podzadania należące do tego konkretnego zadania głównego
    const currentSubTasks = subTasks.filter(st => st.task_id === item.id);
    const isEditing = editingTaskId === item.id;

    return (
      <View style={styles.taskGroupContainer}>
        {/* Wiersz Zadania Głównego */}
        <View style={styles.taskRow}>
          <TouchableOpacity onPress={() => handleToggleTask(item)} style={styles.checkbox}>
            <Ionicons 
              name={item.is_completed ? "checkbox" : "square-outline"} 
              size={24} 
              color={item.is_completed ? "#10b981" : "#475569"} 
            />
          </TouchableOpacity>
          
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editingTaskTitle}
              onChangeText={setEditingTaskTitle}
              onBlur={() => handleSaveTaskEdit(item.id)}
              autoFocus
            />
          ) : (
            <Text 
              style={[styles.taskTitle, item.is_completed ? styles.completedText : undefined]}
              onLongPress={() => handleEditTask(item)}
            >
              {item.title}
            </Text>
          )}

          {/* Kontener ikon akcji */}
          <TouchableOpacity 
            onPress={() => setSelectedTaskForSubtask(item)} 
            style={styles.actionIcon}
          >
            <Ionicons name="git-branch-outline" size={20} color="#2f95dc" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleEditTask(item)} 
            style={styles.actionIcon}
          >
            <Ionicons name="pencil-outline" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleDeleteTask(item)} 
            style={styles.actionIcon}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Lista podzadań - renderowana z wcięciem po prawej stronie */}
        {currentSubTasks.map((subTask) => {
          const isEditingSubTask = editingSubTaskId === subTask.id;
          return (
            <View key={subTask.id} style={styles.subTaskRow}>
              <TouchableOpacity onPress={() => handleToggleSubTask(subTask)} style={styles.checkbox}>
                <Ionicons 
                  name={subTask.is_completed ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={subTask.is_completed ? "#10b981" : "#64748b"} 
                />
              </TouchableOpacity>
              
              {isEditingSubTask ? (
                <TextInput
                  style={styles.editInput}
                  value={editingSubTaskTitle}
                  onChangeText={setEditingSubTaskTitle}
                  onBlur={() => handleSaveSubTaskEdit(subTask.id)}
                  autoFocus
                />
              ) : (
                <Text 
                  style={[styles.subTaskTitle, subTask.is_completed ? styles.completedText : undefined]}
                  onLongPress={() => handleEditSubTask(subTask)}
                >
                  {subTask.title}
                </Text>
              )}

              <TouchableOpacity 
                onPress={() => handleEditSubTask(subTask)} 
                style={styles.actionIcon}
              >
                <Ionicons name="pencil-outline" size={16} color="#64748b" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleDeleteSubTask(subTask)} 
                style={styles.actionIcon}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      {/* Konfiguracja paska nagłówka systemu operacyjnego */}
      <Stack.Screen 
        options={{ 
          title: name || 'Szczegóły listy', 
          headerShown: true,
          headerRight: () => (
            // Zmiana: kontener otulający dwie ikony
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              
              {/* Ikona udostępniania */}
              <TouchableOpacity 
                onPress={() => router.push(`/list/share/${id}`)} 
                style={{ marginRight: 15, padding: 5 }}
              >
                <Ionicons name="qr-code-outline" size={26} color="#2f95dc" />
              </TouchableOpacity>
              
              {/* Ikona ustawień / edycji */}
              <TouchableOpacity 
                onPress={() => router.push(`/list/edit/${id}`)} 
                style={{ marginRight: 5, padding: 5 }}
              >
                <Ionicons name="settings-outline" size={26} color="#475569" />
              </TouchableOpacity>
            </View>
          )
        }} 
      />

      {/* KLUCZOWY ELEMENT: Zapewnia unoszenie się inputu nad klawiaturą ekranową */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} 
      >
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Brak zadań na tej liście. Wpisz coś poniżej.</Text>
          }
        />

        {/* Kontener wprowadzania danych automatycznie przesuwany przez KeyboardAvoidingView */}
        <View style={[styles.inputWrapper, { paddingBottom: insets.bottom + 12 }]}>
          {selectedTaskForSubtask && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                Dodajesz podzadanie do: <Text style={{fontWeight: '600'}}>{selectedTaskForSubtask.title}</Text>
              </Text>
              <TouchableOpacity onPress={() => setSelectedTaskForSubtask(null)}>
                <Ionicons name="close-circle" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder={selectedTaskForSubtask ? "Nazwa podzadania..." : "Nazwa nowego zadania..."}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleAddItem}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleAddItem}>
              <Ionicons name="arrow-up" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  listContent: { padding: 16 },
  taskGroupContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
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
    borderLeftColor: '#cbd5e1',
    paddingLeft: 12,
    marginTop: 4,
  },
  checkbox: { marginRight: 10 },
  taskTitle: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '500' },
  subTaskTitle: { flex: 1, fontSize: 14, color: '#475569' },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2f95dc',
  },
  actionIcon: { padding: 6, marginLeft: 4 },
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 40 },
  
  // Stylizacja dolnego paska z inputem uniesionym nad klawiaturę
  inputWrapper: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center'
  },
  badgeText: { fontSize: 12, color: '#1d4ed8', flex: 1 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#f1f5f9',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2f95dc',
    justifyContent: 'center',
    alignItems: 'center',
  },
});