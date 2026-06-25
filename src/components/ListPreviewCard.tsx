// src/components/ListPreviewCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTasksByList, Task } from '../database/repositories';
import { fetchListCollaborators, API_URL, refreshAccessToken } from '../utils/api'; // DODANY IMPORT
import { useAppTheme } from './ThemeProvider';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = width * 0.85; 
export const CARD_MARGIN = 8;
export const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

// Dodano is_shared do Propsów
interface ListPreviewCardProps {
  list: { id: string; name: string; primary_color?: string | null; priority?: string; due_date?: string | null; icon?: string | null; is_shared?: number };
  onPress: () => void;
  onLongPress?: () => void;
}

export default function ListPreviewCard({ list, onPress, onLongPress }: ListPreviewCardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collaborators, setCollaborators] = useState<{id: string, initial: string}[]>([]); // STAN WSPÓŁPRACOWNIKÓW
  const { colors, theme } = useAppTheme();

  useFocusEffect(
    useCallback(() => {
      // Pobieranie zadań
      getTasksByList(list.id).then(setTasks);

      // Pobieranie współpracowników TYLKO jeśli lista jest udostępniona (lub dla pewności przy braku flagi)
      if (list.is_shared === 1 || list.is_shared === undefined) {
        fetchListCollaborators(list.id).then((users) => {
          if (users && users.length > 0) {
            setCollaborators(users);
          }
        });
      }
    }, [list.id, list.is_shared])
  );

  const cardColor = list.primary_color && list.primary_color !== '#ffffff' 
    ? list.primary_color 
    : colors.surface;

  const defaultIcon = list.icon ? list.icon as any : (list.name.toLowerCase().includes('zakup') ? 'cart-outline' : 'briefcase-outline');

  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      onLongPress={onLongPress}
      style={[
        styles.cardContainer, 
        { 
          backgroundColor: cardColor,
          shadowColor: theme === 'dark' ? '#000' : '#000' 
        }
      ]}
    >
      <View style={styles.innerContainer}>
        <View style={styles.headerSection}>
          {/* GÓRNY PASEK: Ikona (Lewo) i Awatary (Prawo) */}
          <View style={styles.topRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]} >
              <Ionicons name={defaultIcon} size={28} color={colors.onPrimary} />
            </View>

            {/* ZACHODZĄCE NA SIEBIE AWATARY */}
            {collaborators.length > 1 && (
              <View style={styles.collaboratorsWrapper}>
                {collaborators.slice(0, 3).map((collab, index) => (
                  <View 
                    key={collab.id} 
                    style={[styles.avatarCircle, { backgroundColor: colors.primary, borderColor: cardColor, zIndex: 10 - index }]}
                  >
                    <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{collab.initial}</Text>
                  </View>
                ))}
                {/* Jeśli jest więcej niż 3 osoby, pokazujemy "+X" */}
                {collaborators.length > 3 && (
                  <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceVariant, borderColor: cardColor, zIndex: 0 }]}>
                    <Text style={[styles.avatarText, { color: colors.textSecondary }]}>+{collaborators.length - 3}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.listTitle, { color: list.priority === 'high' ? colors.error : colors.text }]} numberOfLines={2}>
              {list.name}
            </Text>
            {list.due_date && <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 2 }}>Due: {list.due_date}</Text>}
            <Text style={[styles.taskCount, { color: colors.textSecondary }]}>
              {totalCount} zadań
            </Text>
          </View>
        </View>

        <ScrollView style={styles.tasksContainer} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <Ionicons 
                name={task.is_completed ? 'checkbox-outline' : 'square-outline'} 
                size={18} 
                color={task.is_completed ? colors.success : colors.outline} 
              />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text 
                  style={[
                    styles.taskText, 
                    { color: task.is_completed ? colors.textSecondary : (task.priority === 'high' ? colors.error : colors.text) },
                    task.is_completed ? styles.taskTextCompleted : undefined
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                {task.due_date && <Text style={{ fontSize: 10, color: colors.textSecondary }}>Due: {task.due_date}</Text>}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBackground, { backgroundColor: colors.surfaceVariant }]} />
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: colors.primary, 
                width: `${progress * 100}%` 
              }
            ]} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    borderRadius: 16,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    flex: 1,
    minHeight: 100, 
    marginBottom: 12, 
  },
  innerContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  headerSection: {
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  // --- STYLE DLA AWATARÓW ---
  collaboratorsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8, // Ujemny margines sprawia, że kółka na siebie zachodzą!
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // -------------------------
  textContainer: {
    justifyContent: 'center',
  },
  tasksContainer: {
    flex: 1,
    marginTop: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskText: {
    fontSize: 14,
    flex: 1,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  taskCount: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarBackground: {
    ...StyleSheet.absoluteFill,
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

// --- ARCHIWIZACJA ---
export const archiveListAPI = async (listId: string) => {
  let token = await SecureStore.getItemAsync('accessToken');
  if (!token) return false;
  try {
    let response = await fetch(`${API_URL}/lists/${listId}/archive`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    if (response.status === 401) {
      token = await refreshAccessToken();
      response = await fetch(`${API_URL}/lists/${listId}/archive`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    }
    return response.ok;
  } catch (e) { return false; }
};

export const restoreListAPI = async (listId: string) => {
  let token = await SecureStore.getItemAsync('accessToken');
  if (!token) return false;
  try {
    let response = await fetch(`${API_URL}/lists/${listId}/restore`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    if (response.status === 401) {
      token = await refreshAccessToken();
      response = await fetch(`${API_URL}/lists/${listId}/restore`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    }
    return response.ok;
  } catch (e) { return false; }
};

export const fetchArchivedListsAPI = async () => {
  let token = await SecureStore.getItemAsync('accessToken');
  if (!token) return [];
  try {
    let response = await fetch(`${API_URL}/lists/archived`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
    if (response.status === 401) {
      token = await refreshAccessToken();
      response = await fetch(`${API_URL}/lists/archived`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
    }
    if (response.ok) return await response.json();
    return [];
  } catch (e) { return []; }
};