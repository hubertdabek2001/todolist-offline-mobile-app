// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import InvitationPreviewCard, { Invitation } from '../../src/components/InvitationPreviewCard';
import { fetchPendingInvitationsAPI, acceptInvitationAPI, declineInvitationAPI } from '../../src/utils/api';

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ListPreviewCard, { SNAP_INTERVAL } from '../../src/components/ListPreviewCard';
import ListSettingsModal from '../../src/components/ListSettingsModal';
import { useAppTheme } from '../../src/components/ThemeProvider';
import { createList, evaluateAutoPriority, getMyLists } from '../../src/database/repositories';
import { performSync } from '../../src/services/syncService';

interface TodoList {
  id: string;
  name: string;
  is_archived: number;
  primary_color: string;
  priority: string;
  due_date: string | null;
  auto_priority: number;
  edit_mode?: number;
  icon?: string | null;
}

export default function MyListsScreen() {

  const [lists, setLists] = useState<TodoList[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const [newListName, setNewListName] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [selectedListForSettings, setSelectedListForSettings] = useState<TodoList | null>(null);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const router = useRouter();
  const { colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const loadLists = async () => {
    try {
      const data = await getMyLists() as TodoList[];
      for (const list of data) {
        if (list.auto_priority === 1) {
          await evaluateAutoPriority(list.id);
        }
      }
      // Re-fetch after evaluating auto priorities
      const updatedData = await getMyLists();
      setLists(updatedData as TodoList[]);

      // Fetch invitations
      const pendingInvitations = await fetchPendingInvitationsAPI();
      setInvitations(pendingInvitations);

    } catch (error) {
      console.error("Błąd pobierania list:", error);
    }
  };

  useFocusEffect(
    useCallback(() => { loadLists(); }, [])
  );


  const handleAcceptInvitation = async (shareId: string) => {
    const success = await acceptInvitationAPI(shareId);
    if (success) {
      performSync();
      await loadLists();
    }
  };

  const handleDeclineInvitation = async (shareId: string) => {
    const success = await declineInvitationAPI(shareId);
    if (success) {
      await loadLists();
    }
  };

  const carouselData = [...invitations.map(inv => ({ ...inv, type: 'invitation' })), ...lists.map(list => ({ ...list, type: 'list' }))];

  const handleAddList = async () => {
    if (newListName.trim() === '') return;
    await createList(newListName.trim());
    setNewListName('');
    await loadLists(); 
    performSync();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      
      {/* 1. Kontener z flex: 1 zajmujący całą górną przestrzeń */}
      <View style={{ flex: 1 }}>

        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Moje Listy</Text>
          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Zarządzaj swoimi zadaniami efektywnie.</Text>
        </View>

        {/* KARUZELA LIST */}
        <View style={styles.carouselContainer}>
          {carouselData.length === 0 ? (
            <Text style={[styles.emptyGlobalText, { color: colors.textSecondary }]}>Brak list. Utwórz pierwszą listę poniżej!</Text>
          ) : (
            <FlatList
              horizontal
              data={carouselData as any[]}
              keyExtractor={(item) => item.type === 'invitation' ? `inv-${item.id}` : `list-${item.id}`}
              showsHorizontalScrollIndicator={false}
              
              snapToAlignment="start"
              snapToInterval={SNAP_INTERVAL}
              disableIntervalMomentum={true} 
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={() => <View style={{ width: 0 }} />}
              
              renderItem={({ item }) => {
                if (item.type === 'invitation') {
                  return (
                    <InvitationPreviewCard
                      invitation={item as Invitation}
                      onAccept={() => handleAcceptInvitation(item.id)}
                      onDecline={() => handleDeclineInvitation(item.id)}
                    />
                  );
                } else {
                  return (
                    <ListPreviewCard
                      list={item}
                      onPress={() => router.push({
                        pathname: `/list/${item.id}`,
                        params: { name: item.name }
                      } as any)}
                      onLongPress={() => {
                        setSelectedListForSettings(item);
                        setIsSettingsVisible(true);
                      }}
                    />
                  );
                }
              }}
            />
          )}
        </View>

        
      </View>

      {/* 2. Naturalnie pozycjonowany dolny kontener */}
      <View style={[styles.floatingInputWrapper, { bottom: Math.max(20, insets.bottom + 10) }]}>
        {!isInputVisible ? (
          // Domyślnie widoczny tylko FAB
          <TouchableOpacity 
            style={[styles.fabButton, { backgroundColor: colors.primary }]} 
            onPress={() => setIsInputVisible(true)}
          >
            <Ionicons name="add" size={28} color={colors.onPrimary} />
          </TouchableOpacity>
        ) : (
          // Input widoczny po kliknięciu
          <View style={[styles.floatingInputContainer, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.floatingInput, { color: colors.text }]}
              placeholder="Dodaj nową listę..."
              placeholderTextColor={colors.textSecondary}
              value={newListName}
              onChangeText={setNewListName}
              autoFocus={true} // Automatycznie wysuwa klawiaturę
              onSubmitEditing={() => {
                handleAddList();
                setIsInputVisible(false);
              }}
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
              <Ionicons name="checkmark" size={24} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ListSettingsModal 
        visible={isSettingsVisible} 
        onClose={() => setIsSettingsVisible(false)} 
        list={selectedListForSettings as any} 
        onSave={() => { loadLists(); }} 
      />
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
    marginBottom: 80,
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
    marginBottom: 20, // Zmiana z 100 na 20, element poniżej nie jest już pozycjonowany absolutnie
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // Usunięto position: 'absolute'
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
    alignSelf: 'flex-end', // Wyrównanie przycisku do prawej krawędzi
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});