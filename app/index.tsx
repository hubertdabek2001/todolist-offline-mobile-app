// app/index.tsx
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { applyPulledData } from '../src/database/repositories';
import { fetchSyncPull } from '../src/utils/api';

import LoginScreen from './LoginScreen';
import SetupProfileScreen from './SetupProfileScreen';
import VerifyScreen from './VerifyScreen';
import WelcomeScreen from './WelcomeScreen';

export default function EntryScreen() {
  const router = useRouter();
  
  const [step, setStep] = useState<'LOADING' | 'WELCOME' | 'LOGIN' | 'VERIFY' | 'SETUP'>('LOADING');
  const [email, setEmail] = useState('');
  
  // Trzymamy oba tokeny w pamięci na czas rejestracji
  const [jwtToken, setJwtToken] = useState('');
  const [refreshTokenState, setRefreshTokenState] = useState('');

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      router.replace('/(tabs)');
    } else {
      setStep('WELCOME');
    }
  };

  const handleLoginSuccess = async (accessToken: string, refreshToken: string, requiresSetup: boolean) => {
    if (requiresSetup) {
      setJwtToken(accessToken);
      setRefreshTokenState(refreshToken);
      setStep('SETUP');
    } else {
      // 1. Zapisz nowe tokeny
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      
      // 2. Zablokuj ekran na ładowanie
      setStep('LOADING'); 
      
      // 3. Pobierz chmurę i zrzuć ją do SQLite
      const cloudData = await fetchSyncPull();
      if (cloudData) {
        await applyPulledData(cloudData);
      }
      
      // 4. Dopiero teraz przepuść do aplikacji!
      router.replace('/(tabs)');
    }
  };

  const handleSetupComplete = async () => {
    await SecureStore.setItemAsync('accessToken', jwtToken);
    await SecureStore.setItemAsync('refreshToken', refreshTokenState);
    
    setStep('LOADING');
    const cloudData = await fetchSyncPull();
    if (cloudData) {
      await applyPulledData(cloudData);
    }
    
    router.replace('/(tabs)');
  };

  if (step === 'LOADING') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#006196" /></View>;
  if (step === 'WELCOME') return <WelcomeScreen onNavigate={() => setStep('LOGIN')} onSkipAuth={() => router.replace('/(tabs)')} />;
  if (step === 'LOGIN') return <LoginScreen onBack={() => setStep('WELCOME')} onSubmitEmail={(e) => { setEmail(e); setStep('VERIFY'); }} />;
  if (step === 'VERIFY') return <VerifyScreen email={email} onBack={() => setStep('LOGIN')} onSuccess={handleLoginSuccess} />;
  if (step === 'SETUP') return <SetupProfileScreen token={jwtToken} onSuccess={handleSetupComplete} />;

  return null;
}