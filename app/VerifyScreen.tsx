// app/VerifyScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../src/utils/api';

interface VerifyScreenProps {
  email: string;
  onBack: () => void;
  onSuccess: (accessToken: string, refreshToken: string, requiresSetup: boolean) => void;
}

const AnimatedView = Animated.View as any;

export default function VerifyScreen({ email, onBack, onSuccess }: VerifyScreenProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(59);
  const [isSuccessState, setIsSuccessState] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const activeIndex = otp.findIndex((val) => val === '');
  const currentFocusIndex = activeIndex === -1 ? 5 : activeIndex;
  const isOtpComplete = otp.every((val) => val !== '');

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleKeyPress = (num: string) => {
    const nextOtp = [...otp];
    const emptyIndex = nextOtp.findIndex((v) => v === '');
    if (emptyIndex !== -1) {
      nextOtp[emptyIndex] = num;
      setOtp(nextOtp);
    }
  };

  const handleDelete = () => {
    const nextOtp = [...otp];
    let lastFilledIndex = -1;
    for (let i = 5; i >= 0; i--) {
      if (nextOtp[i] !== '') { lastFilledIndex = i; break; }
    }
    if (lastFilledIndex !== -1) {
      nextOtp[lastFilledIndex] = '';
      setOtp(nextOtp);
    }
  };

  const handleResend = () => { /* Logika ponownego wysłania */ };

  const handleSubmit = async () => {
    if (!isOtpComplete) return;

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp.join('') }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccessState(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

        setTimeout(() => {
          onSuccess(data.accessToken, data.refreshToken, data.requiresProfileSetup);
        }, 1200);
      } else {
        Alert.alert("Błąd", data.error || "Nieprawidłowy kod OTP");
        setOtp(Array(6).fill('')); // Resetujemy pola po błędzie
      }
    } catch (e) {
      Alert.alert("Błąd połączenia", "Nie można połączyć się z serwerem.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isSuccessState && (
        <AnimatedView style={[styles.successOverlay, { opacity: fadeAnim }]}>
          <View style={styles.successCentered}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark" color="#ffffff" size={48} />
            </View>
            <Text style={styles.successTitle}>Weryfikacja udana</Text>
            <Text style={styles.successSubtitle}>Logowanie do Fluent Task...</Text>
          </View>
        </AnimatedView>
      )}

      <View style={styles.cardWrapper}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Ionicons name="arrow-back" color="#191c1e" size={24} />
          </TouchableOpacity>
          <View style={styles.testBadge}>
            <Text style={styles.testBadgeText}>Sprawdź konsolę Spring Boot!</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.headerTextSection}>
            <Text style={styles.title}>Weryfikacja</Text>
            <Text style={styles.subtitle}>
              Wpisz 6-cyfrowy kod wysłany na adres <Text style={styles.boldEmail}>{email}</Text>
            </Text>
          </View>

          <View style={styles.otpGrid}>
            {otp.map((digit, index) => {
              const isActive = index === currentFocusIndex && !isOtpComplete;
              const isFilled = digit !== '';
              return (
                <View key={index} style={[styles.otpBox, isActive && styles.otpBoxActive, isFilled && styles.otpBoxFilled]}>
                  <Text style={[styles.otpText, isFilled && styles.otpTextFilled]}>{digit || (isActive ? '|' : '')}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.submitContainer}>
            <TouchableOpacity onPress={handleSubmit} disabled={!isOtpComplete} activeOpacity={0.8} style={[styles.submitBtn, isOtpComplete ? styles.submitBtnActive : styles.submitBtnDisabled]}>
              <Text style={styles.submitBtnText}>Zatwierdź</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keypad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
              <TouchableOpacity key={key} onPress={() => handleKeyPress(key)} activeOpacity={0.6} style={styles.keyButton}>
                <Text style={styles.keyButtonText}>{key}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.keyButtonEmpty} />
            <TouchableOpacity onPress={() => handleKeyPress('0')} activeOpacity={0.6} style={styles.keyButton}>
              <Text style={styles.keyButtonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} activeOpacity={0.6} style={styles.keyButton}>
              <Ionicons name="backspace" color="#191c1e" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ... Styl bez zmian (z oryginalnego pliku VerifyScreen)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fb' },
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 97, 150, 0.96)', zIndex: 999, alignItems: 'center', justifyContent: 'center' },
  successCentered: { alignItems: 'center', justifyContent: 'center' },
  successIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { color: '#ffffff', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  successSubtitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 },
  cardWrapper: { flex: 1, backgroundColor: '#ffffff', maxWidth: 420, width: '100%', alignSelf: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 32, elevation: 4, borderWidth: 1, borderColor: 'rgba(220, 224, 227, 0.4)', borderRadius: 24, overflow: 'hidden' },
  headerBar: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  testBadge: { backgroundColor: 'rgba(0, 97, 150, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 97, 150, 0.15)', marginLeft: 'auto' },
  testBadgeText: { fontSize: 11, color: '#006196', fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  headerTextSection: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#191c1e', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#3f4850', textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  boldEmail: { fontWeight: '600', color: '#191c1e' },
  otpGrid: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  otpBox: { width: 48, height: 56, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  otpBoxActive: { borderColor: '#006196', backgroundColor: '#ffffff', transform: [{ scale: 1.05 }] },
  otpBoxFilled: { borderColor: 'rgba(0, 97, 150, 0.3)', backgroundColor: '#ffffff' },
  otpText: { fontSize: 20, fontWeight: '700', color: '#bfc7d2' },
  otpTextFilled: { color: '#191c1e' },
  timerSection: { alignItems: 'center', marginTop: 12 },
  resendText: { fontSize: 14, fontWeight: '600', color: '#006196', paddingHorizontal: 12, paddingVertical: 6 },
  resendTextDisabled: { color: 'rgba(112, 120, 130, 0.7)' },
  timerCountdown: { fontSize: 11, color: '#707882', fontWeight: '500', marginTop: 4 },
  footer: { borderTopWidth: 1, borderColor: '#eceef0' },
  submitContainer: { paddingHorizontal: 24, paddingVertical: 16 },
  submitBtn: { width: '100%', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  submitBtnActive: { backgroundColor: '#006196' },
  submitBtnDisabled: { backgroundColor: 'rgba(0, 97, 150, 0.45)' },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#f2f4f6', height: 240, padding: 4 },
  keyButton: { width: '33.33%', height: '25%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderWidth: 0.5, borderColor: '#eceef0', borderRadius: 8 },
  keyButtonEmpty: { width: '33.33%', height: '25%', backgroundColor: '#ffffff', borderWidth: 0.5, borderColor: '#eceef0', borderRadius: 8 },
  keyButtonText: { fontSize: 22, fontWeight: '600', color: '#191c1e' }
});