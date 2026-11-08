import React from 'react';
import { StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { storage, TOKEN_KEY } from '@/services/storage';

const firebaseAuth = getAuth();

export default function HomeScreen() {
  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      storage.remove(TOKEN_KEY);
      storage.remove('userEmail');
      storage.remove('userName');
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Welcome to Home
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            You have successfully logged in with Firebase!
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.infoBox}>
            <ThemedText type="default">
              User Email: {storage.getString('userEmail') || 'N/A'}
            </ThemedText>
            <ThemedText type="default" style={styles.infoText}>
              User Name: {storage.getString('userName') || 'N/A'}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: Spacing.four,
  },
  infoBox: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    width: '100%',
  },
  infoText: {
    marginTop: Spacing.one,
  },
  logoutButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
