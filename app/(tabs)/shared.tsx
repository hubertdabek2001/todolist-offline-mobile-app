// app/(tabs)/shared.tsx
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, Dimensions, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InvitationPreviewCard, { Invitation } from '../../src/components/InvitationPreviewCard';
import ListPreviewCard, { SNAP_INTERVAL } from '../../src/components/ListPreviewCard';
import ListSettingsModal from '../../src/components/ListSettingsModal';
import { useAppTheme } from '../../src/components/ThemeProvider';
import { getSharedLists } from '../../src/database/repositories';
import { performPull } from '../../src/services/syncService';
import { acceptInvitationAPI, declineInvitationAPI, fetchPendingInvitationsAPI } from '../../src/utils/api';
import { importListFromQR } from '../../src/utils/qrPayloadManager';

const { width } = Dimensions.get('window');
// Definicja interfejsu (tak jak w index.tsx)
interface TodoList {
  id: string;
  name: string;
  is_archived: number;
  primary_color: string;
}

export default function SharedListsScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [scannedChunks, setScannedChunks] = useState<Map<number, string>>(new Map());
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [expectedTotal, setExpectedTotal] = useState<number>(1);
  const [senderInfo, setSenderInfo] = useState<{email: string, name: string} | null>(null);
  const insets = useSafeAreaInsets();
  // Stan na udostępnione listy
  const [sharedLists, setSharedLists] = useState<TodoList[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  
  const [selectedListForSettings, setSelectedListForSettings] = useState<TodoList | null>(null);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const router = useRouter();
  const { colors } = useAppTheme();

  const loadShared = async () => {
    const data = await getSharedLists();
    setSharedLists(data as TodoList[]);
    
    // Fetch invitations
    const pendingInvitations = await fetchPendingInvitationsAPI();
    setInvitations(pendingInvitations);
  };

  // Pobieranie list udostępnionych (uruchamia się, gdy wejdziemy w tę zakładkę)
  useFocusEffect(
    useCallback(() => {
      loadShared();
    }, [])
  );

  const handleAcceptInvitation = async (shareId: string) => {
    const success = await acceptInvitationAPI(shareId);
    if (success) {
      await performPull();
      await loadShared();
    }
  };

  const handleDeclineInvitation = async (shareId: string) => {
    const success = await declineInvitationAPI(shareId);
    if (success) {
      await loadShared();
    }
  };

  const carouselData = [...invitations.map(inv => ({ ...inv, type: 'invitation' })), ...sharedLists.map(list => ({ ...list, type: 'list' }))];

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>Potrzebujemy dostępu do aparatu, aby skanować listy.</Text>
        <Button onPress={requestPermission} title="Przyznaj dostęp" color={colors.primary} />
      </View>
    );
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
  // Jeśli to nie jest nasz chunk, ignoruj
  if (!data.startsWith('CHUNK|')) return;

  const parts = data.split('|');
  const sessionId = parts[1];
  const email = parts[2];
  const name = parts[3];
  const index = parseInt(parts[4], 10);
  const total = parseInt(parts[5], 10);
  
  // Łączymy resztę z powrotem w razie, gdyby JSON zawierał znak '|'
  const payloadData = parts.slice(6).join('|');

  // Funkcja resetująca stan przy nowym kodzie QR
  if (currentSession !== sessionId) {
    setCurrentSession(sessionId);
    setExpectedTotal(total);
    setSenderInfo({ email, name });
    const newMap = new Map();
    newMap.set(index, payloadData);
    setScannedChunks(newMap);
    return;
  }

  // Zbieranie klatek w obecnej sesji
  if (!scannedChunks.has(index)) {
    const newMap = new Map(scannedChunks);
    newMap.set(index, payloadData);
    setScannedChunks(newMap);

    // CZY MAMY JUŻ WSZYSTKIE KLATKI?
    if (newMap.size === total) {
      setScanned(true); // Blokuje aparat
      
      // Sklejamy JSON z powrotem, upewniając się, że kolejność jest właściwa
      const completeJson = Array.from(newMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(entry => entry[1])
        .join('');

      try {
        const result = await importListFromQR(completeJson);
        if (result.success && result.listId) {
          setIsScanning(false); 
          showToast(`Pobrano od: ${name}`, "success"); // Używa zdekodowanej nazwy z kodu QR!
          
          router.push({
            pathname: `/list/${result.listId}` as any,
            params: { name: result.listName || 'Udostępniona lista' }
          });
        } else {
          showToast("Uszkodzone dane. Spróbuj ponownie.", "error");
          setTimeout(() => setScanned(false), 2000);
        }
      } catch (e) {
        showToast("Błąd łączenia pliku", "error");
        setTimeout(() => setScanned(false), 2000);
      }
      
      // Czyszczenie sesji po imporcie
      setCurrentSession(null);
      setScannedChunks(newMap);
    }
  }
};

  const renderToast = () => {
    if (!toast) return null;
    return (
      <View style={[styles.toastContainer, toast.type === 'error' ? { backgroundColor: colors.error } : { backgroundColor: colors.success }]}>
        <Text style={[styles.toastText, { color: toast.type === 'error' ? colors.onError : colors.onPrimary }]}>{toast.message}</Text>
      </View>
    );
  };

  // Renderowanie kafelka pojedynczej, udostępnionej listy
return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {renderToast()}
      <View style={styles.titleContainer}>
                <Text style={[styles.mainTitle, { color: colors.text }]}>Wspólne Listy</Text>
                <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Zarządzaj swoimi zadaniami efektywnie.</Text>
      </View>
      
      
      {/* KARUZELA WSPÓLNYCH LIST */}
      <View style={styles.carouselContainer}>
        {carouselData.length === 0 ? (
          <Text style={[styles.emptyGlobalText, { color: colors.textSecondary }]}>Nie masz jeszcze wspólnych list. Zeskanuj kod QR od znajomego!</Text>
        ) : (
          <FlatList
            horizontal
            data={carouselData as any[]}
            keyExtractor={(item) => item.type === 'invitation' ? `inv-${item.id}` : `list-${item.id}`}
            showsHorizontalScrollIndicator={false}
            
            // Dokładnie te same bezpieczne ustawienia
            snapToOffsets={carouselData.map((_, i) => i * SNAP_INTERVAL)}
            disableIntervalMomentum={true} 
            
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: (width - SNAP_INTERVAL) / 2 }}
            
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
      
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setIsScanning(true)}>
        <Ionicons name="qr-code-outline" size={24} color={colors.onPrimary} />
        <Text style={[styles.fabText, { color: colors.onPrimary }]}>Zeskanuj listę</Text>
      </TouchableOpacity>

      <Modal visible={isScanning} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setIsScanning(false)}>
            <Ionicons name="close-circle" size={40} color="white" />
          </TouchableOpacity>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
          <View style={styles.overlayWrapper}>
            <View style={styles.scanFrame} />
            
            {/* Nowy dynamiczny tekst skanowania */}
            {currentSession ? (
              <>
                <Text style={styles.overlayText}>
                  Odbieranie od: {senderInfo?.name}
                </Text>
                <Text style={[styles.overlayText, { color: '#10b981', fontSize: 24 }]}>
                  Pobrano {scannedChunks.size} / {expectedTotal}
                </Text>
              </>
            ) : (
              <Text style={styles.overlayText}>Nakieruj aparat na animowany kod QR</Text>
            )}

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => { setIsScanning(false); setScanned(false); setCurrentSession(null); setScannedChunks(new Map()); }}
            >
              <Ionicons name="close-circle" size={48} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ListSettingsModal 
        visible={isSettingsVisible} 
        onClose={() => setIsSettingsVisible(false)} 
        list={selectedListForSettings as any} 
        onSave={() => {
          getSharedLists().then(data => setSharedLists(data as TodoList[]));
        }} 
      />
    </View>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1 },
  carouselContainer: {
    marginBottom: 80,
    flex: 1, 
    paddingVertical: 10, 
     // Robimy miejsce na nasz pływający przycisk FAB!
  },
  emptyGlobalText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 60,
    paddingHorizontal: 20
  },
  // Dodane style dla kafelków z listy
  listContentContainer: {
    padding: 16,
    paddingBottom: 20, // Zostawiamy miejsce na przycisk FAB
  },
  listCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  listName: {
    fontSize: 18,
    fontWeight: '500',
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

  toastContainer: { position: 'absolute', top: 60, left: 20, right: 20, padding: 16, borderRadius: 12, zIndex: 100, elevation: 10, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  toastText: { fontSize: 16, fontWeight: '600' },
  text: { textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  emptyText: { textAlign: 'center', fontSize: 16, marginTop: 40 },
  fab: { position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, alignItems: 'center', elevation: 5, shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  fabText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  modalContainer: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  overlayWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanFrame: { width: 250, height: 250, borderWidth: 3, backgroundColor: 'transparent', borderRadius: 16 },
  overlayText: { color: 'white', fontSize: 18, marginTop: 20, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
});