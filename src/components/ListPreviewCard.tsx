// src/components/ListPreviewCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTasksByList, Task } from '../database/repositories';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = width * 0.82; 
export const CARD_MARGIN = 10;
export const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

interface ListPreviewCardProps {
  list: { id: string; name: string };
  onPress: () => void;
}

export default function ListPreviewCard({ list, onPress }: ListPreviewCardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTasksByList(list.id).then(setTasks);
    }, [list.id])
  );

  return (
    // Zmieniono: Cała karta jest teraz klikalna
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      style={styles.cardContainer}
    >
      {/* Nagłówek bez zmiany struktury, ale usunięto starą funkcję Touchable */}
      <View style={styles.header}>
        <Text style={styles.listTitle} numberOfLines={1}>{list.name}</Text>
        <Ionicons name="expand-outline" size={24} color="#64748b" />
      </View>

      <ScrollView 
        style={styles.scrollArea} 
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>Brak zadań. Kliknij, aby dodać.</Text>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <Ionicons 
                name={task.is_completed ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={task.is_completed ? "#10b981" : "#94a3b8"} 
              />
              <Text style={[styles.taskTitle, task.is_completed && styles.completedTask]}>
                {task.title}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    flex: 1, 
    justifyContent: 'space-between'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 15,
    marginLeft: 10,
    color: '#334155',
    flex: 1,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  }
  // Usunięto style przycisku, który nie jest już potrzebny
});