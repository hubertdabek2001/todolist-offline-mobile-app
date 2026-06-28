import { Ionicons } from '@expo/vector-icons';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from './ThemeProvider';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = width * 0.85;
export const CARD_MARGIN = 8;

export interface Invitation {
  id: string; // shareId
  listId: string;
  listName: string;
  inviterEmail: string;
  permission: string;
}

interface InvitationPreviewCardProps {
  invitation: Invitation;
  onAccept: () => void;
  onDecline: () => void;
}

export default function InvitationPreviewCard({ invitation, onAccept, onDecline }: InvitationPreviewCardProps) {
  const { colors, theme } = useAppTheme();

  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.surface, shadowColor: theme === 'dark' ? '#000' : '#000' }]}>
      <View style={styles.innerContainer}>
        <View style={styles.headerSection}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]} >
            <Ionicons name="mail-unread-outline" size={28} color={colors.onPrimaryContainer} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={2}>
              Zaproszenie do listy
            </Text>
            <Text style={[styles.taskCount, { color: colors.textSecondary }]}>
              {invitation.inviterEmail} udostępnił(a) Ci listę &quot;{invitation.listName}&quot;.
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={onDecline}
          >
            <Text style={[styles.buttonText, { color: colors.error }]}>Odrzuć</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={onAccept}
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Akceptuj</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    flex: 1,
    minHeight: 180,
    marginBottom: 12,
  },
  innerContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  headerSection: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  taskCount: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
  },
  acceptButton: {
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
