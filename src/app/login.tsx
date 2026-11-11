import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';

import { ThemedText } from '@/components/themed-text';
import { FormInput } from '@/components/login/FormInput';
import { GradientButton } from '@/components/login/GradientButton';
import { useAuth } from '@/providers/auth-provider';
import { LoginColors } from '@/constants/loginColors';
import { Spacing } from '@/constants/theme';

const Envelope = (props: { size: number; color: string; weight?: string }) => <Ionicons name="mail-outline" size={props.size} color={props.color} />;
const Lock = (props: { size: number; color: string; weight?: string }) => <Ionicons name="lock-closed-outline" size={props.size} color={props.color} />;
const Eye = (props: { size: number; color: string; weight?: string }) => <Ionicons name="eye-outline" size={props.size} color={props.color} />;
const EyeSlash = (props: { size: number; color: string; weight?: string }) => <Ionicons name="eye-off-outline" size={props.size} color={props.color} />;

export default function LoginScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const firebaseAuth = getAuth();
  const { login } = useAuth();
  const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const logoSize = Math.min(230, Math.max(180, windowHeight * 0.28));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (GOOGLE_WEB_CLIENT_ID) {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
        scopes: ['profile', 'email'],
      });
    } else {
      console.warn('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID not set in .env');
    }
  }, [GOOGLE_WEB_CLIENT_ID]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      if (!GOOGLE_WEB_CLIENT_ID) {
        Alert.alert('Error', 'Google Web Client ID not configured');
        return;
      }

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const user = response.data;
        const idToken = user.idToken;

        if (!idToken) {
          throw new Error('No ID token from Google Sign-In');
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(firebaseAuth, credential);

        const token = await result.user.getIdToken();

        await login({
          token,
          name: result.user.displayName ?? '',
          email: result.user.email ?? '',
        });
      } else if (response.type === 'cancelled') {
        console.log('Google Sign-In cancelled');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google Sign-In failed';
      setError(errorMessage);
      Alert.alert('Sign In Error', errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);

      const token = await result.user.getIdToken();

      await login({
        token,
        name: result.user.displayName ?? '',
        email: result.user.email ?? '',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      Alert.alert('Sign In Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0F1419', '#151B29', '#0F1419']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      <LinearGradient
        colors={['rgba(255, 107, 53, 0.18)', 'rgba(255, 215, 0, 0.05)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 0.8 }}
        style={styles.backgroundGlow}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.headerSection}>
            <Image
              source={require('@/assets/images/Logo.png')}
              style={[styles.logo, { width: logoSize, height: logoSize }]}
              resizeMode="contain"
            />
            <ThemedText style={styles.title}>Firebase Login</ThemedText>
            <ThemedText style={styles.subtitle}>Masuk untuk mengakses data mahasiswa secara real-time</ThemedText>
          </View>

          <BlurView intensity={20} style={styles.formContainer}>
            <View style={styles.formContent}>
              {error ? (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                </View>
              ) : null}

              <FormInput
                icon={<Envelope size={24} color={LoginColors.primaryLight} weight="regular" />}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loading && !googleLoading}
              />

              <FormInput
                icon={<Lock size={24} color={LoginColors.primaryLight} weight="regular" />}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                showToggle
                toggleIcon={<Eye size={24} color={LoginColors.primaryLight} weight="regular" />}
                hideIcon={<EyeSlash size={24} color={LoginColors.primaryLight} weight="regular" />}
                autoComplete="password"
                textContentType="password"
                containerStyle={{ marginTop: Spacing.three }}
                editable={!loading && !googleLoading}
              />

              <Pressable
                style={styles.forgotPasswordLink}
                disabled
                accessibilityRole="button"
                accessibilityLabel="Forgot password (disabled)">
                <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
              </Pressable>

              <GradientButton
                title="Sign In"
                onPress={handleSignIn}
                loading={loading}
                disabled={googleLoading}
                style={styles.signInButton}
              />
            </View>
          </BlurView>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or continue with</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.googleButtonPressed,
              (loading || googleLoading) && styles.googleButtonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google">
            <View style={styles.googleLogoPlaceholder}>
              <ThemedText style={styles.googleLogoText}>G</ThemedText>
            </View>
            <ThemedText style={styles.googleButtonText}>
              {googleLoading ? 'Signing in...' : 'Sign in with Google'}
            </ThemedText>
          </Pressable>

          <View style={styles.signUpContainer}>
            <ThemedText style={styles.signUpText}>Don&apos;t have an account? </ThemedText>
            <Pressable disabled accessibilityRole="button" accessibilityLabel="Sign up (disabled)">
              <ThemedText style={styles.signUpLink}>Sign Up</ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LoginColors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundGlow: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 360,
    height: 420,
    borderRadius: 220,
    opacity: 0.8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logo: {
    width: 230,
    height: 230,
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '800',
    color: LoginColors.accent,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 300,
    marginTop: 7,
    color: LoginColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 31, 46, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.24)',
  },
  formContent: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    padding: Spacing.two,
    marginBottom: Spacing.one,
  },
  errorText: {
    color: LoginColors.error,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  forgotPasswordText: {
    color: LoginColors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.85,
  },
  signInButton: {
    marginTop: Spacing.one,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.three,
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 140, 66, 0.2)',
  },
  dividerText: {
    color: LoginColors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
  },
  googleButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.42)',
    backgroundColor: 'rgba(26, 31, 46, 0.62)',
    gap: Spacing.two,
  },
  googleButtonPressed: {
    opacity: 0.8,
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: LoginColors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoText: {
    fontSize: 14,
    fontWeight: '700',
    color: LoginColors.primary,
  },
  googleButtonText: {
    color: LoginColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  signUpText: {
    color: LoginColors.textSecondary,
    fontSize: 14,
  },
  signUpLink: {
    color: LoginColors.primaryLight,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
  },
});
