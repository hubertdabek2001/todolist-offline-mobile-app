// src/components/ListPreviewCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTasksByList, Task } from '../database/repositories';
import { useAppTheme } from './ThemeProvider';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = width * 0.45; 
export const CARD_MARGIN = 8;
export const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

interface ListPreviewCardProps {
  list: { id: string; name: string; primary_color?: string | null };
  onPress: () => void;
}

export default function ListPreviewCard({ list, onPress }: ListPreviewCardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { colors, theme } = useAppTheme();

  useFocusEffect(
    useCallback(() => {
      getTasksByList(list.id).then(setTasks);
    }, [list.id])
  );

  const cardColor = list.primary_color && list.primary_color !== '#ffffff' 
    ? list.primary_color 
    : colors.surface;

  // Assuming an arbitrary icon logic, default to brief-case
  const defaultIcon = list.name.toLowerCase().includes('zakup') ? 'cart-outline' : 'briefcase-outline';

  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
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
          <View style={styles.iconContainer}>
            <Ionicons name={defaultIcon} size={28} color={colors.onPrimary} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={2}>
              {list.name}
            </Text>
            <Text style={[styles.taskCount, { color: colors.textSecondary }]}>
              {totalCount} zadań
            </Text>
          </View>
        </View>

        <ScrollView style={styles.tasksContainer} showsVerticalScrollIndicator={false}>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <Ionicons
                name={task.is_completed ? 'checkbox-outline' : 'square-outline'}
                size={18}
                color={task.is_completed ? colors.success : colors.outline}
              />
              <Text
                style={[
                  styles.taskText,
                  { color: task.is_completed ? colors.textSecondary : colors.text },
                  task.is_completed ? styles.taskTextCompleted : undefined
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
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
    height: 360,
  },
  innerContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  headerSection: {
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007abc', // TBD, color matching design
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
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
    marginLeft: 8,
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