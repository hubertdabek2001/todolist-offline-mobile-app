import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheetModal from './BottomSheetModal';
import { useAppTheme } from './ThemeProvider';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectQRCode: () => void;
  onSelectLink: () => void;
  onSelectCode: () => void;
}

export default function ShareModal({ 
  visible, 
  onClose, 
  onSelectQRCode, 
  onSelectLink, 
  onSelectCode 
}: ShareModalProps) {
  const { colors } = useAppTheme();

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title="Udostępnij">
      <View style={styles.container}>
        <TouchableOpacity 
          style={[styles.optionRow, { borderBottomColor: colors.outlineVariant }]} 
          onPress={onSelectQRCode}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="qr-code-outline" size={24} color={colors.onPrimaryContainer} />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>Kod QR</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionRow, { borderBottomColor: colors.outlineVariant }]} 
          onPress={onSelectLink}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="link-outline" size={24} color={colors.onPrimaryContainer} />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>Link</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionRow, { borderBottomColor: colors.outlineVariant, borderBottomWidth: 0 }]} 
          onPress={onSelectCode}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="keypad-outline" size={24} color={colors.onPrimaryContainer} />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>Kod</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
