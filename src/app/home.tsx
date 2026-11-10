import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, SafeAreaView, FlatList, View, ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { subscribeToMahasiswa, Mahasiswa } from '@/services/firestore';
import { LoginColors } from '@/constants/loginColors';

export default function HomeScreen() {
  const { userName, logout } = useAuth();
  const [students, setStudents] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMahasiswa(
      (data) => {
        setStudents(data);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError('Failed to fetch student data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const renderStudentItem = ({ item }: { item: Mahasiswa }) => (
    <ThemedView type="backgroundElement" style={styles.studentCard}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.nimText}>{item.nim}</ThemedText>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{item.jurusan}</ThemedText>
        </View>
      </View>
      <ThemedText type="smallBold" style={styles.namaText}>
        {item.nama}
      </ThemedText>
    </ThemedView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.title}>
              Portal Mahasiswa
            </ThemedText>
            <ThemedText type="default" style={styles.welcomeText}>
              Halo, {userName || 'User'}
            </ThemedText>
          </View>
          <Pressable style={styles.logoutIconButton} onPress={handleLogout}>
            <ThemedText style={styles.logoutIconText}>Keluar</ThemedText>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={LoginColors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={renderStudentItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>Tidak ada data mahasiswa</ThemedText>
              </View>
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LoginColors.background,
  },
  container: {
    flex: 1,
    paddingTop: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 24,
    color: LoginColors.accent,
  },
  welcomeText: {
    fontSize: 14,
    opacity: 0.8,
  },
  logoutIconButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  logoutIconText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  studentCard: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.2)',
    backgroundColor: 'rgba(26, 31, 46, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  nimText: {
    fontSize: 12,
    color: LoginColors.primaryLight,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: 'rgba(255, 140, 66, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: LoginColors.accent,
    fontWeight: '600',
  },
  namaText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
  },
});
