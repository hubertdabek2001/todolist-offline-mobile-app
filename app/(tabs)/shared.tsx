// app/(tabs)/shared.tsx
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, Dimensions, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ListPreviewCard, { SNAP_INTERVAL } from '../../src/components/ListPreviewCard';
import { getSharedLists } from '../../src/database/repositories';
import { importListFromQR } from '../../src/utils/qrPayloadManager';

const { width } = Dimensions.get('window');
// Definicja interfejsu (tak jak w index.tsx)
interface TodoList {
  id: string;
  name: string;
  is_archived: number;
}

export default function SharedListsScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Stan na udostępnione listy
  const [sharedLists, setSharedLists] = useState<TodoList[]>([]);
  
  const router = useRouter();

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
      <View style={styles.container}>
        <Text style={styles.text}>Potrzebujemy dostępu do aparatu, aby skanować listy.</Text>
        <Button onPress={requestPermission} title="Przyznaj dostęp" />
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
        });

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
      <View style={[styles.toastContainer, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
        <Text style={styles.toastText}>{toast.message}</Text>
      </View>
    );
  };

  // Renderowanie kafelka pojedynczej, udostępnionej listy
return (
    <View style={styles.container}>
      {renderToast()}
      
      {/* KARUZELA WSPÓLNYCH LIST */}
      <View style={styles.carouselContainer}>
        {sharedLists.length === 0 ? (
          <Text style={styles.emptyGlobalText}>Nie masz jeszcze wspólnych list. Zeskanuj kod QR od znajomego!</Text>
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
                })}
              />
            )}
          />
        )}
      </View>
      
      <TouchableOpacity style={styles.fab} onPress={() => setIsScanning(true)}>
        <Ionicons name="qr-code-outline" size={24} color="white" />
        <Text style={styles.fabText}>Zeskanuj listę</Text>
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
            <Text style={styles.overlayText}>Zeskanuj kod QR z listą</Text>
          </View>
        </View>
      </Modal>
    </View>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  carouselContainer: {
    flex: 1, 
    paddingTop: 20,
    paddingBottom: 90, // Robimy miejsce na nasz pływający przycisk FAB!
  },
  emptyGlobalText: {
    textAlign: 'center',
    color: '#64748b',
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
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  listName: {
    fontSize: 18,
    fontWeight: '500',
  },

  toastContainer: { position: 'absolute', top: 60, left: 20, right: 20, padding: 16, borderRadius: 12, zIndex: 100, elevation: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  toastSuccess: { backgroundColor: '#10b981' },
  toastError: { backgroundColor: '#f59e0b' },
  toastText: { color: 'white', fontSize: 16, fontWeight: '600' },
  text: { textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 16, marginTop: 40 },
  fab: { position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', backgroundColor: '#2f95dc', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  fabText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  modalContainer: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  overlayWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanFrame: { width: 250, height: 250, borderWidth: 3, borderColor: '#10b981', backgroundColor: 'transparent', borderRadius: 16 },
  overlayText: { color: 'white', fontSize: 18, marginTop: 20, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
});