// app/LoginScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_API_URL

interface LoginScreenProps {
  onBack: () => void;
  onSubmitEmail: (email: string) => void;
}

export default function LoginScreen({ onBack, onSubmitEmail }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Wpisz swój adres e-mail');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Wprowadź poprawny adres e-mail');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      // 1. LOG: Co dokładnie próbujemy wywołać?
      console.log(`[LOGIN] Wysyłam żądanie na: ${API_URL}/auth/request-otp`);
      console.log(`[LOGIN] Payload:`, { email: email.trim() });

      const response = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      // 2. LOG: Jaki był status odpowiedzi?
      console.log(`[LOGIN] Status odpowiedzi: ${response.status}`);

      if (response.ok) {
        onSubmitEmail(email.trim()); 
      } else {
        // 3. LOG: Treść błędu z backendu
        const errorText = await response.text();
        console.error(`[LOGIN] Błąd z serwera:`, errorText);
        setError('Wystąpił błąd podczas wysyłania kodu. Spróbuj ponownie.');
      }
    } catch (e: any) {
      // 4. LOG: Błąd sieci (np. brak neta, zły adres IP, firewall)
      console.error(`[LOGIN] BŁĄD SIECI (Catch):`, e.message, e);
      setError(`Błąd sieci: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Ionicons name="arrow-back" color="#191c1e" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.cornerDecoration} />

            <View style={styles.cardHeader}>
              <View style={styles.brandContainer}>
                <Ionicons name="checkmark-circle" color="#ffffff" size={28} />
              </View>
              <Text style={styles.title}>Witaj w Fluent Task</Text>
              <Text style={styles.subtitle}>Wpisz swój adres e-mail, aby kontynuować logowanie lub rejestrację.</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Adres E-mail</Text>
              <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
                <View style={styles.iconContainer}>
                  <Ionicons name="mail" color="#3f4850" size={20} />
                </View>
                <TextInput 
                  value={email}
                  onChangeText={(text) => { setEmail(text); if (error) setError(''); }}
                  placeholder="Twój e-mail"
                  placeholderTextColor="#bfc7d2"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit} style={styles.submitButton} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Kontynuuj</Text>
                    <Ionicons name="arrow-forward" color="#ffffff" size={18} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Kontynuując, akceptujesz nasz <Text style={styles.linkText}>Regulamin</Text> i <Text style={styles.linkText}>Politykę Prywatności</Text>.
              </Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ... Twoje style bez zmian (wklej tutaj obiekt styles z oryginalnego pliku)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fb' },
  keyboardAvoid: { flex: 1 },
  headerBar: { height: 60, justifyContent: 'center', paddingHorizontal: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 24, elevation: 2, borderWidth: 1, borderColor: 'rgba(224, 227, 229, 0.4)', overflow: 'hidden', position: 'relative', maxWidth: 420, width: '100%', alignSelf: 'center' },
  cornerDecoration: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: '#cde5ff', opacity: 0.3 },
  cardHeader: { zIndex: 10, marginBottom: 24 },
  brandContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#007abc', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#007abc', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 1 },
  title: { fontSize: 24, fontWeight: '700', color: '#191c1e', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#3f4850', lineHeight: 20, opacity: 0.9 },
  formContainer: { zIndex: 10, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#3f4850', marginLeft: 8, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 28, height: 56, paddingHorizontal: 16, borderWidth: 1, borderColor: 'transparent' },
  inputWrapperError: { borderColor: '#ef4444' },
  iconContainer: { marginRight: 12, opacity: 0.8 },
  input: { flex: 1, height: '100%', fontSize: 15, color: '#191c1e', fontWeight: '500' },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '500', marginLeft: 8, marginTop: 4 },
  submitButton: { backgroundColor: '#006196', borderRadius: 28, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowColor: '#006196', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 2, gap: 8 },
  submitButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  footer: { zIndex: 10, alignItems: 'center', marginTop: 12 },
  footerText: { fontSize: 11, color: '#707882', textAlign: 'center', lineHeight: 16 },
  linkText: { color: '#006196', fontWeight: '500' }
});