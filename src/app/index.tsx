import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { getAuth } from '@react-native-firebase/auth';

import { storage, TOKEN_KEY } from '@/services/storage';
import { LoginColors } from '@/constants/loginColors';

export default function Index() {
  const firebaseAuth = getAuth();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const currentUser = firebaseAuth.currentUser;
        const cachedToken = storage.getString(TOKEN_KEY);

        if (currentUser || cachedToken) {
          router.replace('/home');
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth redirect error:', error);
        router.replace('/login');
      }
    };

    checkAuthAndRedirect();
  }, [firebaseAuth]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={LoginColors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LoginColors.background,
  },
});
