// app/(tabs)/shared.tsx
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, Dimensions, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ListPreviewCard, { SNAP_INTERVAL } from '../../src/components/ListPreviewCard';
import { useAppTheme } from '../../src/components/ThemeProvider';
import { getSharedLists } from '../../src/database/repositories';
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
  
  // Stan na udostępnione listy
  const [sharedLists, setSharedLists] = useState<TodoList[]>([]);
  
  const router = useRouter();
  const { colors } = useAppTheme();

  // Pobieranie list udostępnionych (uruchamia się, gdy wejdziemy w tę zakładkę)
  useFocusEffect(
    useCallback(() => {
      const loadShared = async () => {
        const data = await getSharedLists();
        setSharedLists(data as TodoList[]);
      };
      loadShared();
    }, [])
  );

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
    setScanned(true);
    try {
      const result = await importListFromQR(data);
      if (result.success && result.listId) {
        setIsScanning(false); 
        showToast("Zeskanowano pomyślnie", "success");
        
        // Przenosimy do wnętrza zeskanowanej listy (która jest teraz w "Wspólne")
        router.push({
          pathname: `/list/${result.listId}`,
          params: { name: result.listName || 'Udostępniona lista' }
        } as any);

      } else {
        showToast("Spróbuj ponownie", "error");
        setTimeout(() => setScanned(false), 2000);
      }
    } catch (e) {
      console.error(e);
      showToast("Spróbuj ponownie", "error");
      setTimeout(() => setScanned(false), 2000);
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderToast()}
      
      {/* KARUZELA WSPÓLNYCH LIST */}
      <View style={styles.carouselContainer}>
        {sharedLists.length === 0 ? (
          <Text style={[styles.emptyGlobalText, { color: colors.textSecondary }]}>Nie masz jeszcze wspólnych list. Zeskanuj kod QR od znajomego!</Text>
        ) : (
          <FlatList
            horizontal
            data={sharedLists}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            
            // Dokładnie te same bezpieczne ustawienia
            snapToOffsets={sharedLists.map((_, i) => i * SNAP_INTERVAL)}
            disableIntervalMomentum={true} 
            
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: (width - SNAP_INTERVAL) / 2 }}
            
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
            <View style={[styles.scanFrame, { borderColor: colors.success }]} />
            <Text style={styles.overlayText}>Zeskanuj kod QR z listą</Text>
          </View>
        </View>
      </Modal>
    </View>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1 },
  carouselContainer: {
    flex: 1, 
    paddingTop: 20,
    paddingBottom: 90, // Robimy miejsce na nasz pływający przycisk FAB!
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
    paddingBottom: 100, // Zostawiamy miejsce na przycisk FAB
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