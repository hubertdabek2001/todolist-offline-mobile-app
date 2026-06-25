import React, { useEffect, useState } from 'react';
import { Animated, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from './ThemeProvider';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BottomSheetModal({ visible, onClose, title, children }: BottomSheetModalProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const [panY] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible, panY]);

  const [panResponder] = useState(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 1.5) {
          onClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        
        <Animated.View 
          style={[
            styles.modalSheet, 
            { 
              backgroundColor: colors.surface, 
              paddingBottom: Math.max(24, insets.bottom), 
              transform: [{ translateY: panY }] 
            }
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.modalHeaderDragArea}>
            <View style={[styles.dragIndicator, { backgroundColor: colors.outlineVariant }]} />
            <Text style={[styles.modalTitleText, { color: colors.text }]}>{title}</Text>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    height: '80%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeaderDragArea: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 16,
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
