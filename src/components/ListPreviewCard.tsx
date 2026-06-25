// src/components/ListPreviewCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTasksByList, Task } from '../database/repositories';
import { useAppTheme } from './ThemeProvider';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = width * 0.85; 
export const CARD_MARGIN = 8;
export const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

interface ListPreviewCardProps {
  list: { id: string; name: string; primary_color?: string | null; priority?: string; due_date?: string | null; icon?: string | null };
  onPress: () => void;
  onLongPress?: () => void;
}

export default function ListPreviewCard({ list, onPress, onLongPress }: ListPreviewCardProps) {
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
          <View backgroundColor={colors.secondary} style={styles.iconContainer} >
            <Ionicons name={defaultIcon} size={28} color={colors.onPrimary} />
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
    backgroundColor: 'colors.secondary',
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
  card: {
    // 1. ZARZĄDZANIE WYSOKOŚCIĄ
    minHeight: 100, // Zmniejsz wartość (np. z 120 lub 140 na 100), by karty były niższe
    // maxHeight: 150, // Opcjonalnie: zablokuj maksymalną wysokość, by tekst jej nie rozpychał za bardzo
    
    // 2. ZARZĄDZANIE MARGINESAMI I ODSTĘPAMI (Wielkość "wewnątrz" karty)
    paddingVertical: 16,   // Pionowy odstęp w środku
    paddingHorizontal: 20, // Poziomy odstęp w środku
    marginBottom: 12,      // Odstęp między kolejnymi kartami
    
    // 3. WYGLĄD
    borderRadius: 16,      // Mniejsze lub większe zaokrąglenie rogów
    justifyContent: 'space-between',
    
    // Cienie (dla zachowania głębi)
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  
  // Jeśli podgląd zadań w karcie zajmuje za dużo miejsca, zmniejsz czcionkę:
  previewText: {
    fontSize: 13, // Mniejsza czcionka dla zadań w podglądzie
    lineHeight: 18,
    marginTop: 4,
  },
  
  title: {
    fontSize: 18, // Zmiana rozmiaru tytułu listy
    fontWeight: '700',
  }
});