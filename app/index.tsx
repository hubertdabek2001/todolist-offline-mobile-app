// app/index.tsx
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from './LoginScreen';
import SetupProfileScreen from './SetupProfileScreen';
import VerifyScreen from './VerifyScreen';
import WelcomeScreen from './WelcomeScreen';

export default function EntryScreen() {
  const router = useRouter();
  
  const [step, setStep] = useState<'LOADING' | 'WELCOME' | 'LOGIN' | 'VERIFY' | 'SETUP'>('LOADING');
  const [email, setEmail] = useState('');
  const [jwtToken, setJwtToken] = useState('');

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    // 🛠️ NARZĘDZIE DEWELOPERSKIE: 
    // Odkomentuj poniższą linijkę, zapisz plik, a aplikacja usunie Twój token i pokaże WelcomeScreen.
    // Jak już go zobaczysz, zakomentuj ją z powrotem, aby logowanie znów działało!
    
    // await SecureStore.deleteItemAsync('userToken'); 

    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      // Użytkownik jest zalogowany - wrzucamy go od razu do nawigacji (tabs)
      router.replace('/(tabs)');
    } else {
      setStep('WELCOME');
    }
  };

  const handleLoginSuccess = async (token: string, requiresSetup: boolean) => {
    if (requiresSetup) {
      setJwtToken(token);
      setStep('SETUP');
    } else {
      await SecureStore.setItemAsync('userToken', token);
      router.replace('/(tabs)');
    }
  };

  const handleSetupComplete = async () => {
    await SecureStore.setItemAsync('userToken', jwtToken);
    router.replace('/(tabs)');
  };

  if (step === 'LOADING') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#006196" />
      </View>
    );
  }

  if (step === 'WELCOME') {
    return (
      <WelcomeScreen 
        onNavigate={() => setStep('LOGIN')} 
        onSkipAuth={() => router.replace('/(tabs)')} 
      />
    );
  }

  if (step === 'LOGIN') {
    return (
      <LoginScreen 
        onBack={() => setStep('WELCOME')} 
        onSubmitEmail={(e) => { setEmail(e); setStep('VERIFY'); }} 
      />
    );
  }

  if (step === 'VERIFY') {
    return (
      <VerifyScreen 
        email={email} 
        onBack={() => setStep('LOGIN')} 
        onSuccess={handleLoginSuccess} 
      />
    );
  }

  if (step === 'SETUP') {
    return <SetupProfileScreen token={jwtToken} onSuccess={handleSetupComplete} />;
  }

  return null;
}