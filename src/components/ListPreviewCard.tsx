// src/components/ListPreviewCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTasksByList, Task } from '../database/repositories';
import { useAppTheme } from './ThemeProvider';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = width * 0.82; 
export const CARD_MARGIN = 10;
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
    
  const gradientColors = [
    cardColor,
    theme === 'dark' ? '#121212' : '#ffffff'
  ];

  return (
    // Zmieniono: Cała karta jest teraz klikalna
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      style={[
        styles.cardContainer, 
        { 
          shadowColor: theme === 'dark' ? '#000' : '#000' 
        }
      ]}
    >
      <LinearGradient
        colors={gradientColors as [string, string]}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Nagłówek bez zmiany struktury, ale usunięto starą funkcję Touchable */}
        <View style={[styles.header, { borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>{list.name}</Text>
          <Ionicons name="expand-outline" size={24} color={colors.textSecondary} />
        </View>

        <ScrollView 
          style={styles.scrollArea} 
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          {tasks.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Brak zadań. Kliknij, aby dodać.</Text>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <Ionicons 
                  name={task.is_completed ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={task.is_completed ? colors.success : colors.textSecondary} 
                />
                <Text 
                  style={[
                    styles.taskTitle, 
                    { color: colors.text }, 
                    task.is_completed ? [styles.completedTask, { color: colors.textSecondary }] : undefined
                  ]}
                >
                  {task.title}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    borderRadius: 20,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    flex: 1, 
    justifyContent: 'space-between',
    overflow: 'hidden'
  },
  gradientContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  emptyText: {
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
    flex: 1,
  },
  completedTask: {
    textDecorationLine: 'line-through',
  }
});