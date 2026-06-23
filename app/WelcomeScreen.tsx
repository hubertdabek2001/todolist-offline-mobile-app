import {
  Dimensions,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Screen } from '../src/constants/types';
import { CheckCircle2 } from './Icons';

interface WelcomeScreenProps {
  onNavigate: (screen: Screen) => void;
  onSkipAuth: () => void;
}

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ onNavigate, onSkipAuth }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      {/* Background Graphic */}
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgnam4YS3W0QO3ZN-u5aYk0w71qzU737DyG6SvqWnyavK3g3FQRsw4BR6ZEZaHjr0of6kP_fhCjDcno_dVhJ1eDAZG2x8RwkS-IbFc2ZtqkKQVEAskPYlj5Gj6ZyvohFx_1rINEgeF7Ur00tmybLr93rcffwbqFXoWjrrx9pn2_KJ6BA-YbGX3EWci6nvFZEok3p3pba70lV-ANCa1JFujo3daYbgaw6LSeNUGHYGvxm-_8XXIhRR2VmSm5Mm8QQE6xPglBs2sMg' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={styles.backgroundImage}
      />
      
      {/* Semi-transparent overlay layer */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentCard}>
          {/* Top Spacer for visual balance */}
          <View style={styles.spacer} />

          {/* Central Identity Area */}
          <View style={styles.identityContainer}>
            {/* App Logo */}
            <View style={styles.logoCircle}>
              <CheckCircle2 color="#006196" size={42} strokeWidth={1.5} />
            </View>

            {/* App Name */}
            <Text style={styles.title}>Fluent Task</Text>
            
            {/* Description */}
            <Text style={styles.description}>
              Witaj. Uporządkuj swój dzień z przejrzystością i spokojem.
            </Text>
          </View>

          {/* Bottom Spacer */}
          <View style={styles.spacer} />

          {/* Actions Container */}
          <View style={styles.actionsContainer}>
            {/* Primary Action Button (Login) */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => onNavigate(Screen.LOGIN)}
              style={[styles.button, styles.primaryButton]}
            >
              <Text style={styles.primaryButtonText}>Zaloguj się</Text>
            </TouchableOpacity>

            {/* Secondary Action Button (Sign up) */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => onNavigate(Screen.LOGIN)}
              style={[styles.button, styles.secondaryButton]}
            >
              <Text style={styles.secondaryButtonText}>Załóż konto</Text>
            </TouchableOpacity>

            {/* Tertiary Action Link */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={onSkipAuth}
              style={styles.tertiaryButton}
            >
              <Text style={styles.tertiaryButtonText}>Korzystaj bez logowania</Text>
              <View style={styles.tertiaryUnderline} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  backgroundImage: {
    opacity: 0.25,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  safeArea: {
    flex: 1,
  },
  contentCard: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 450,
    alignSelf: 'center',
    width: '100%',
  },
  spacer: {
    flex: 1,
  },
  identityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#ffffff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#006196',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#191c1e',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3f4850',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    opacity: 0.9,
    fontFamily: 'Inter',
  },
  actionsContainer: {
    width: '100%',
    paddingBottom: 20,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#006196',
    shadowColor: '#006196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: '#bfc7d2',
  },
  secondaryButtonText: {
    color: '#006196',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  tertiaryButton: {
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  tertiaryButtonText: {
    color: '#006196',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  tertiaryUnderline: {
    width: 140,
    height: 1.5,
    backgroundColor: 'rgba(0, 97, 150, 0.2)',
    marginTop: 4,
  }
});
