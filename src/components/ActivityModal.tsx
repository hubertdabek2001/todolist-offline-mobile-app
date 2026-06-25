import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import BottomSheetModal from './BottomSheetModal';
import { useAppTheme } from './ThemeProvider';

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  activityLogs: any[];
}

export default function ActivityModal({ visible, onClose, activityLogs }: ActivityModalProps) {
  const { colors } = useAppTheme();

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title="Aktywność">
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        bounces={false} 
      >
        {activityLogs.length === 0 ? (
          <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 40 }}>Brak aktywności na tej liście.</Text>
        ) : (
          activityLogs.map((log, index) => {
            let actionText = '';
            let iconName: any = 'ellipse-outline';
            let iconColor: string = colors.primary;

            if (log.actionType === 'CREATE') { actionText = 'dodał(a)'; iconName = 'add-circle'; iconColor = colors.success as string; }
            else if (log.actionType === 'UPDATE') { actionText = 'zmodyfikował(a)'; iconName = 'pencil'; iconColor = colors.warning as string; }
            else if (log.actionType === 'DELETE') { actionText = 'usunął(a)'; iconName = 'trash'; iconColor = colors.error as string; }
            else if (log.actionType === 'COMPLETE') { actionText = 'ukończył(a)'; iconName = 'checkmark-circle'; iconColor = colors.primary as string; }

            let entityText = '';
            if (log.entityType === 'LIST') entityText = 'listę';
            else if (log.entityType === 'TASK') entityText = 'zadanie';
            else if (log.entityType === 'SUBTASK') entityText = 'podzadanie';

            const dateObj = new Date(log.timestamp);
            const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = dateObj.toLocaleDateString();

            return (
              <View key={log.id} style={{ flexDirection: 'row', marginBottom: 20 }}>
                <View style={{ alignItems: 'center', marginRight: 16 }}>
                  <Ionicons name={iconName} size={24} color={iconColor} />
                  {index !== activityLogs.length - 1 && (
                    <View style={{ width: 2, flex: 1, backgroundColor: colors.surfaceVariant, marginTop: 4 }} />
                  )}
                </View>

                <View style={{ flex: 1, paddingBottom: 8 }}>
                  <Text style={{ color: colors.text, fontSize: 15 }}>
                    <Text style={{ fontWeight: 'bold' }}>{log.authorName}</Text> {actionText} {entityText}:
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontStyle: 'italic', marginVertical: 4 }}>
                    &quot;{log.entityName}&quot;
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {dateString} o {timeString}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </BottomSheetModal>
  );
}
