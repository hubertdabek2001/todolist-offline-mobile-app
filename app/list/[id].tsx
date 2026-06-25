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
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ActivityModal from '../../src/components/ActivityModal';
import TaskEditModal from '../../src/components/TaskEditModal';
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
import { useTodoWebSocket } from '../../src/hooks/useTodoWebSocket';
import { archiveListAPI, fetchActivityLogs } from '../../src/utils/api';

export default function ListDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useAppTheme();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [selectedTaskForSubtask, setSelectedTaskForSubtask] = useState<Task | null>(null);
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);
  const [selectedSubTaskToEdit, setSelectedSubTaskToEdit] = useState<SubTask | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [editMode, setEditMode] = useState(0);

  // --- STANY WEBSOCKET I AKTYWNOŚCI ---
  const { latestActivity, isConnected } = useTodoWebSocket(id as string);
  const [isActivityFeedVisible, setIsActivityFeedVisible] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const router = useRouter();

  

  // --- LOKALNE LOGOWANIE AKTYWNOŚCI ---
  const addLocalLog = useCallback((action: 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE', entityType: 'LIST' | 'TASK' | 'SUBTASK', entityName: string) => {
    const newLog = {
      id: Date.now().toString() + Math.random().toString(), // Tymczasowe ID
      actionType: action,
      entityType: entityType,
      entityName: entityName,
      timestamp: new Date().toISOString(),
      authorName: "Ty" // Od razu widać, że to Twoja akcja
    };
     
      setActivityLogs(prev => [newLog, ...prev]);
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;
    const { getListById } = await import('../../src/database/repositories');
    const listData = await getListById(id);
    if (listData) {
      setEditMode(listData.edit_mode || 0);
    }

    const fetchedTasks = await getTasksByList(id);
    const fetchedSubTasks = await getSubTasksForList(id);

    // --- UKRYTE SORTOWANIE ---
    const sortedTasks = fetchedTasks.sort((a, b) => {
      const isCompletedA = a.is_completed ? 1 : 0;
      const isCompletedB = b.is_completed ? 1 : 0;
      
      if (isCompletedA !== isCompletedB) {
        return isCompletedA - isCompletedB; 
      }

      const priorityA = a.priority === 'high' ? 1 : 0;
      const priorityB = b.priority === 'high' ? 1 : 0;

      return priorityB - priorityA;
    });

    setTasks(sortedTasks);
    setSubTasks(fetchedSubTasks);
  }, [id]);

  const loadActivityHistory = async () => {
    if (id) {
      const logs = await fetchActivityLogs(id as string);
      if (logs) setActivityLogs(logs);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  // JEDEN POPRAWNY USE_EFFECT DLA WEBSOCKETA
  useEffect(() => {
    if (latestActivity) {
      const newLog = {
        id: latestActivity.id,
        actionType: latestActivity.actionType,
        entityType: latestActivity.entityType,
        entityName: latestActivity.entityName,
        timestamp: new Date().toISOString(),
        authorName: "Ktoś" 
      };
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActivityLogs(prev => [newLog, ...prev]);
      
      if (!isActivityFeedVisible) {
         Alert.alert("Aktualizacja", `Pojawiła się nowa aktywność ("${latestActivity.entityName}"). Sprawdź oś czasu!`);
      }
      setTimeout(() => {
        setActivityLogs(prev => [newLog, ...prev]);
      }, 0);
    }
  }, [latestActivity, isActivityFeedVisible]);

  const handleAddItem = async () => {
    if (inputText.trim() === '' || !id || isSubmitting) return;

    setIsSubmitting(true);
    const title = inputText.trim();

    try {
      if (selectedTaskForSubtask) {
        await createSubTask(selectedTaskForSubtask.id, title);
        addLocalLog('CREATE', 'SUBTASK', title); // LOKALNY LOG
        setSelectedTaskForSubtask(null);
      } else {
        await createTask(id, title);
        addLocalLog('CREATE', 'TASK', title); // LOKALNY LOG
      }
      
      setInputText('');
      setIsInputVisible(false);
      await loadData();
    } catch (e) {
      console.error("Błąd podczas dodawania:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.is_completed ? 0 : 1;
    await toggleTaskStatus(task.id, task.is_completed);
    addLocalLog(newStatus === 1 ? 'COMPLETE' : 'UPDATE', 'TASK', task.title); // LOKALNY LOG
    await loadData();
  };

  const handleToggleSubTask = async (subTask: SubTask) => {
    const newStatus = subTask.is_completed ? 0 : 1;
    await toggleSubTaskStatus(subTask.id, subTask.is_completed);
    addLocalLog(newStatus === 1 ? 'COMPLETE' : 'UPDATE', 'SUBTASK', subTask.title); // LOKALNY LOG
    await loadData();
  };

  const handleArchive = () => {
    Alert.alert(
      "Zakończenie listy",
      "Czy na pewno chcesz zarchiwizować tę listę? Zostanie ona bezpowrotnie usunięta z pamięci urządzenia i przeniesiona do archiwum w chmurze.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Zakończ Listę",
          style: "destructive",
          onPress: async () => {
            const success = await archiveListAPI(id as string);
            if (success) {
              await deleteTask(id as string); // Użyj deleteList jeśli posiadasz taką w repositories, w przeciwnym razie:
              const { deleteList } = await import('../../src/database/repositories');
              await deleteList(id as string); 
              
              Alert.alert("Sukces", "Lista pomyślnie zarchiwizowana.");
              router.replace('/(tabs)');
            } else {
              Alert.alert("Błąd", "Do zarchiwizowania tej listy niezbędne jest połączenie z serwerem.");
            }
          }
        }
      ]
    );
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
            addLocalLog('DELETE', 'TASK', task.title); // LOKALNY LOG
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
            addLocalLog('DELETE', 'SUBTASK', subTask.title); // LOKALNY LOG
            await loadData();
          }
        }
      ]
    );
  };

  const handleEditTask = (task: Task) => {
    setSelectedTaskToEdit(task);
  };

  const handleSaveTaskEdit = async (taskId: string, title: string, priority: string, dueDate: string) => {
    const { updateTaskDetails } = await import('../../src/database/repositories');
    await updateTaskDetails(taskId, title, priority, dueDate || null);
    addLocalLog('UPDATE', 'TASK', title);
    setSelectedTaskToEdit(null);
    await loadData();
  };

  const handleEditSubTask = (subTask: SubTask) => {
    setSelectedSubTaskToEdit(subTask);
  };

  const handleSaveSubTaskEdit = async (subTaskId: string, title: string, priority: string, dueDate: string) => {
    const { updateSubTaskDetails } = await import('../../src/database/repositories');
    await updateSubTaskDetails(subTaskId, title, priority, dueDate || null);
    addLocalLog('UPDATE', 'SUBTASK', title);
    setSelectedSubTaskToEdit(null);
    await loadData();
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const currentSubTasks = subTasks.filter(st => st.task_id === item.id);

    const renderRightActions = () => (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity 
          style={styles.swipeActionButton} 
          onPress={() => setSelectedTaskForSubtask(item)}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );

    const renderLeftActions = () => (
      <View style={[styles.swipeActionContainer, { alignItems: 'flex-start', paddingLeft: 16 }]}>
        <TouchableOpacity 
          style={styles.swipeActionButton} 
          onPress={() => setSelectedTaskForSubtask(item)}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );

    return (
      <View style={[styles.taskGroupContainer, { backgroundColor: colors.surface, shadowColor: theme === 'dark' ? '#000' : '#000' }]}>
        <Swipeable 
          renderRightActions={renderRightActions}
          renderLeftActions={renderLeftActions}
        >
          <View style={[styles.taskRow, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => handleToggleTask(item)} style={styles.checkbox}>
              <Ionicons 
                name={item.is_completed ? "checkbox" : "square-outline"} 
                size={24} 
                color={item.is_completed ? colors.success : colors.textSecondary} 
              />
            </TouchableOpacity>
            
            <View style={{ flex: 1 }}>
              <Text 
                style={[styles.taskTitle, { color: item.priority === 'high' ? colors.error : colors.text }, item.is_completed ? [styles.completedText, { color: colors.textSecondary }] : undefined]}
                onLongPress={() => { handleEditTask(item); }}
              >
                {item.title}
              </Text>
              {item.due_date && <Text style={{ fontSize: 12, color: colors.textSecondary }}>Due: {item.due_date}</Text>}
            </View>

            {editMode === 1 && (
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
        </Swipeable>

        {currentSubTasks.map((subTask) => {
          return (
            <View key={subTask.id} style={[styles.subTaskRow, { borderLeftColor: colors.connector }]}>
              <TouchableOpacity onPress={() => handleToggleSubTask(subTask)} style={styles.checkbox}>
                <Ionicons 
                  name={subTask.is_completed ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={subTask.is_completed ? colors.success : colors.textSecondary} 
                />
              </TouchableOpacity>
              
              <View style={{ flex: 1 }}>
                <Text 
                  style={[styles.subTaskTitle, { color: subTask.priority === 'high' ? colors.error : colors.textSecondary }, subTask.is_completed ? [styles.completedText, { color: colors.textSecondary }] : undefined]}
                  onLongPress={() => { handleEditSubTask(subTask); }}
                >
                  {subTask.title}
                </Text>
                {subTask.due_date && <Text style={{ fontSize: 10, color: colors.textSecondary }}>Due: {subTask.due_date}</Text>}
              </View>

              {editMode === 1 && (
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
          title: name || 'Lista',
          headerShown: true, // ZOSTAWIONE ZGODNIE Z TWOIM PLIKIEM
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              {/* --- PRZYCISK ARCHIWIZACJI --- */}
              <TouchableOpacity onPress={handleArchive}>
                <Ionicons name="archive-outline" size={24} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setIsActivityFeedVisible(true);
                loadActivityHistory();
              }}>
                <Ionicons name="notifications-outline" size={24} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.push(`/list/share/${id}`)}>
                <Ionicons name="qr-code-outline" size={24} color={colors.text} />
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
                  autoFocus={true}
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

      <ActivityModal 
        visible={isActivityFeedVisible} 
        onClose={() => setIsActivityFeedVisible(false)} 
        activityLogs={activityLogs} 
      />
      <TaskEditModal
        visible={!!selectedTaskToEdit}
        onClose={() => setSelectedTaskToEdit(null)}
        task={selectedTaskToEdit}
        onSave={handleSaveTaskEdit}
      />
      <TaskEditModal
        visible={!!selectedSubTaskToEdit}
        onClose={() => setSelectedSubTaskToEdit(null)}
        subTask={selectedSubTaskToEdit}
        onSave={handleSaveSubTaskEdit}
      />
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

  
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  swipeActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeActionText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: 'bold',
  },
});