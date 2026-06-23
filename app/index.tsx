// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ListPreviewCard, { SNAP_INTERVAL } from './../src/components/ListPreviewCard';
import { useAppTheme } from './../src/components/ThemeProvider';
import { createList, getMyLists } from './../src/database/repositories';

interface TodoList {
  id: string;
  name: string;
  is_archived: number;
  primary_color: string;
}

export default function MyListsScreen() {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [newListName, setNewListName] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const router = useRouter();
  const { colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const loadLists = async () => {
    try {
      const data = await getMyLists();
      setLists(data as TodoList[]);
    } catch (error) {
      console.error("Błąd pobierania list:", error);
    }
  };

  useFocusEffect(
    useCallback(() => { loadLists(); }, [])
  );

  const handleAddList = async () => {
    if (newListName.trim() === '') return;
    await createList(newListName.trim());
    setNewListName('');
    await loadLists(); 
  };

  return (
    <KeyboardAvoidingView 
      // Na Androidzie Expo często lepiej radzi sobie bez narzuconego behavior lub z 'height', jeśli adjustResize jest włączone
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      {/* Kluczowa zmiana 1: 
        Wszystko to, co znajduje się nad Twoim pływającym przyciskiem, 
        owijamy w kontener z flex: 1, aby naturalnie wypychało przycisk na sam dół.
      */}
      <View style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={[styles.headerContainer, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="checkmark-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Zadania</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Moje Listy</Text>
          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Zarządzaj swoimi zadaniami efektywnie.</Text>
        </View>

        {/* KARUZELA LIST */}
        <View style={styles.carouselContainer}>
          {lists.length === 0 ? (
            <Text style={[styles.emptyGlobalText, { color: colors.textSecondary }]}>Brak list. Utwórz pierwszą listę poniżej!</Text>
          ) : (
            <FlatList
              horizontal
              data={lists}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              
              snapToAlignment="start"
              snapToInterval={SNAP_INTERVAL}
              disableIntervalMomentum={true} 
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={() => <View style={{ width: 0 }} />}
              
              renderItem={({ item }) => (
                <ListPreviewCard 
                  list={item} 
                  onPress={() => router.push({
                    pathname: `/list/${item.id}`,
                    params: { name: item.name }
                  } as any)}
                />
              )}
            />
          )}
        </View>

        {/* PILNE ZADANIA (MOCK) */}
        <View style={styles.urgentCardContainer}>
          <TouchableOpacity 
            style={[
              styles.urgentCard, 
              { backgroundColor: colors.surface, shadowColor: theme === 'dark' ? '#000' : '#000' }
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.urgentIconContainer}>
              <Ionicons name="alert" size={20} color="#e53935" />
            </View>
            <View style={styles.urgentTextContainer}>
              <Text style={[styles.urgentTitle, { color: colors.text }]}>Pilne Zadania</Text>
              <Text style={[styles.urgentSubtitle, { color: colors.textSecondary }]}>3 na dzisiaj</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Kluczowa zmiana 2: 
        Pasek znajduje się w naturalnym flow dokumentu. 
        Uwzględniamy insets.bottom, aby np. pasek nawigacji iPhone'a (Home Indicator) nie zasłaniał inputu.
      */}
      <View style={[styles.floatingInputWrapper, { paddingBottom: Math.max(24, insets.bottom + 10) }]}>
        {!isInputVisible ? (
          <TouchableOpacity 
            style={[styles.fabButton, { backgroundColor: colors.primary }]} 
            onPress={() => setIsInputVisible(true)}
          >
            <Ionicons name="add" size={28} color={colors.onPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.floatingInputContainer, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.floatingInput, { color: colors.text }]}
              placeholder="Dodaj nową listę..."
              placeholderTextColor={colors.textSecondary}
              value={newListName}
              onChangeText={setNewListName}
              onSubmitEditing={() => {
                handleAddList();
                setIsInputVisible(false);
              }}
              autoFocus={true} // Input naturalnie wywoła klawiaturę, a KeyboardAvoidingView wypchnie całość
            />
            <TouchableOpacity 
              style={[styles.floatingCloseButton, { backgroundColor: colors.surfaceVariant }]} 
              onPress={() => setIsInputVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.floatingAddButton, { backgroundColor: colors.primary }]} 
              onPress={() => {
                handleAddList();
                setIsInputVisible(false);
              }}
            >
              <Ionicons name="add" size={24} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    backgroundColor: '#ffffff',
  },
  headerIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 15,
  },
  carouselContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  emptyGlobalText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  urgentCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 20, // Zmiana z 100 na 20, ponieważ fabButton nie jest już absolutny i nie przysłania zawartości
  },
  urgentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  urgentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  urgentTextContainer: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  urgentSubtitle: {
    fontSize: 14,
  },
  floatingInputWrapper: {
    // Usunięto position: 'absolute', bottom, left, right
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  floatingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 30,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  floatingInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  floatingAddButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  floatingCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end', // Przyciąga FAB do prawej strony naturalnie w flexboxie
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});