import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from './ThemeProvider';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface CustomAlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const CustomAlertContext = createContext<CustomAlertContextType | undefined>(undefined);

export const useCustomAlert = () => {
  const context = useContext(CustomAlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within a CustomAlertProvider');
  }
  return context;
};

export const CustomAlertProvider = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [alertData, setAlertData] = useState<AlertOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));
  const { colors } = useAppTheme();

  const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
    setAlertData({ title, message, buttons });
    setIsVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  };

  const hideAlert = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsVisible(false);
      setAlertData(null);
    });
  };

  const handleButtonPress = (button: AlertButton) => {
    hideAlert();
    if (button.onPress) {
      // Small delay to allow modal to close before executing action
      setTimeout(() => button.onPress!(), 150);
    }
  };

  return (
    <CustomAlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal transparent visible={isVisible} animationType="none" onRequestClose={hideAlert}>
        <TouchableWithoutFeedback onPress={hideAlert}>
          <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View
                style={[
                  styles.alertContainer,
                  { backgroundColor: colors.surface },
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <Text style={[styles.title, { color: colors.text }]}>{alertData?.title}</Text>
                {alertData?.message ? (
                  <Text style={[styles.message, { color: colors.textSecondary }]}>{alertData.message}</Text>
                ) : null}

                <View style={styles.buttonContainer}>
                  {(alertData?.buttons && alertData.buttons.length > 0) ? (
                    alertData.buttons.map((button, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.button,
                          alertData.buttons!.length > 2 && styles.buttonStacked,
                          button.style === 'cancel' && { backgroundColor: colors.background },
                          button.style === 'destructive' && { backgroundColor: '#FFEBEE' },
                          (!button.style || button.style === 'default') && { backgroundColor: colors.primaryContainer }
                        ]}
                        onPress={() => handleButtonPress(button)}
                      >
                        <Text
                          style={[
                            styles.buttonText,
                            button.style === 'cancel' && { color: colors.textSecondary },
                            button.style === 'destructive' && { color: '#D32F2F' },
                            (!button.style || button.style === 'default') && { color: colors.primary }
                          ]}
                        >
                          {button.text}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: colors.primaryContainer }]}
                      onPress={() => {
                        hideAlert();
                      }}
                    >
                      <Text style={[styles.buttonText, { color: colors.primary }]}>OK</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </CustomAlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonStacked: {
    width: '100%',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
