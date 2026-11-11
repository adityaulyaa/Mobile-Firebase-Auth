import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LoginColors } from '@/constants/loginColors';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { Mahasiswa, subscribeToMahasiswa } from '@/services/firestore';

const CARD_RADIUS = 16;

function StatCard({ icon, value, label, accent = LoginColors.primaryLight }: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <View style={styles.statCard} accessible accessibilityLabel={`${value}, ${label}`}>
      <View style={[styles.statIcon, { backgroundColor: `${accent}20` }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function StudentCard({ item }: { item: Mahasiswa }) {
  return (
    <View style={styles.studentCard} accessible accessibilityLabel={`${item.nama}, NIM ${item.nim}, jurusan ${item.jurusan}`}>
      <View style={styles.studentTopRow}>
        <View style={styles.nimWrapper}>
          <Ionicons name="id-card-outline" size={15} color={LoginColors.primaryLight} />
          <ThemedText style={styles.nimText}>{item.nim}</ThemedText>
        </View>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{item.jurusan}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.namaText}>{item.nama}</ThemedText>
      <ThemedText style={styles.studentCaption}>Mahasiswa terdaftar</ThemedText>
    </View>
  );
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <View style={styles.stateContainer} accessible accessibilityRole="text">
      <View style={styles.stateIcon}>
        <Ionicons name={query ? 'search-outline' : 'people-outline'} size={30} color={LoginColors.primaryLight} />
      </View>
      <ThemedText style={styles.stateTitle}>{query ? 'Data tidak ditemukan' : 'Belum ada data mahasiswa'}</ThemedText>
      <ThemedText style={styles.stateDescription}>
        {query ? 'Coba gunakan kata kunci lain untuk mencari mahasiswa.' : 'Data mahasiswa belum tersedia di database saat ini.'}
      </ThemedText>
      {query ? (
        <Pressable style={styles.secondaryButton} onPress={onClear} accessibilityRole="button" accessibilityLabel="Hapus pencarian">
          <ThemedText style={styles.secondaryButtonText}>Hapus pencarian</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.stateContainer} accessible accessibilityRole="alert">
      <View style={[styles.stateIcon, styles.errorIcon]}>
        <Ionicons name="cloud-offline-outline" size={30} color={LoginColors.error} />
      </View>
      <ThemedText style={styles.stateTitle}>Data belum dapat dimuat</ThemedText>
      <ThemedText style={styles.stateDescription}>Periksa koneksi internet lalu coba lagi.</ThemedText>
      <Pressable style={styles.retryButton} onPress={onRetry} accessibilityRole="button" accessibilityLabel="Coba muat ulang data mahasiswa">
        <Ionicons name="refresh-outline" size={18} color={LoginColors.text} />
        <ThemedText style={styles.retryButtonText}>Coba lagi</ThemedText>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { userName, logout } = useAuth();
  const [students, setStudents] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const insets = useSafeAreaInsets();

  const subscribe = useCallback(() => {
    unsubscribeRef.current?.();
    const unsubscribe = subscribeToMahasiswa(
      (data) => {
        setStudents(data);
        setLoading(false);
        setRefreshing(false);
      },
      () => {
        setLoading(false);
        setRefreshing(false);
        setError(true);
      }
    );
    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, []);

  useEffect(() => {
    subscribe();
    return () => unsubscribeRef.current?.();
  }, [subscribe]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return students;
    return students.filter((student) =>
      [student.nama, student.nim, student.jurusan].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [query, students]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setError(false);
    subscribe();
  }, [subscribe]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
  };

  const firstName = userName?.trim().split(' ')[0] || 'Mahasiswa';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <StudentCard item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.five }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={LoginColors.primaryLight} colors={[LoginColors.primaryLight]} />}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <View style={styles.greetingBlock}>
                  <ThemedText style={styles.greeting}>Selamat datang kembali,</ThemedText>
                  <ThemedText style={styles.userName}>{firstName}</ThemedText>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed, loggingOut && styles.disabled]}
                  onPress={handleLogout}
                  disabled={loggingOut}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Keluar dari akun"
                  accessibilityState={{ disabled: loggingOut }}>
                  {loggingOut ? <ActivityIndicator size="small" color={LoginColors.error} /> : <Ionicons name="log-out-outline" size={20} color={LoginColors.error} />}
                  <ThemedText style={styles.logoutText}>Keluar</ThemedText>
                </Pressable>
              </View>

              <BlurView intensity={22} tint="dark" style={styles.welcomeCard}>
                <View style={styles.welcomeGlow} />
                <View style={styles.welcomeContent}>
                  <View style={styles.liveRow}>
                    <View style={styles.liveDot} />
                    <ThemedText style={styles.liveText}>LIVE DATABASE</ThemedText>
                  </View>
                  <ThemedText style={styles.welcomeTitle}>Portal Mahasiswa</ThemedText>
                  <ThemedText style={styles.welcomeDescription}>Pantau data mahasiswa secara real-time dalam satu tempat.</ThemedText>
                </View>
                <View style={styles.welcomeIcon}>
                  <Ionicons name="school-outline" size={38} color={LoginColors.accent} />
                </View>
              </BlurView>

              <View style={styles.statsRow}>
                <StatCard icon="people-outline" value={String(students.length)} label="Total Mahasiswa" />
                <StatCard icon="radio-outline" value="Live" label="Sinkronisasi" accent={LoginColors.success} />
              </View>

              <View style={styles.sectionHeader}>
                <View>
                  <ThemedText style={styles.sectionTitle}>Daftar Mahasiswa</ThemedText>
                  <ThemedText style={styles.sectionSubtitle}>{students.length} mahasiswa terdaftar</ThemedText>
                </View>
                <Ionicons name="list-outline" size={22} color={LoginColors.primaryLight} />
              </View>

              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={LoginColors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Cari nama, NIM, atau jurusan"
                  placeholderTextColor={LoginColors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Cari mahasiswa"
                  onSubmitEditing={Keyboard.dismiss}
                />
                {query ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Hapus pencarian">
                    <Ionicons name="close-circle" size={20} color={LoginColors.textSecondary} />
                  </Pressable>
                ) : null}
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={LoginColors.primaryLight} />
                  <ThemedText style={styles.loadingText}>Memuat data mahasiswa...</ThemedText>
                </View>
              ) : error ? <ErrorState onRetry={handleRefresh} /> : null}
            </>
          }
          ListEmptyComponent={!loading && !error ? <EmptyState query={query} onClear={() => setQuery('')} /> : undefined}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: LoginColors.background },
  container: { flex: 1, backgroundColor: LoginColors.background },
  listContent: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.five },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.four },
  greetingBlock: { flex: 1 },
  greeting: { color: LoginColors.textSecondary, fontSize: 13, marginBottom: 3 },
  userName: { color: LoginColors.accent, fontSize: 27, fontWeight: '800' },
  logoutButton: { minHeight: 44, paddingHorizontal: 13, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.35)', backgroundColor: 'rgba(255, 107, 107, 0.1)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoutText: { color: LoginColors.error, fontSize: 12, fontWeight: '700' },
  welcomeCard: { minHeight: 154, borderRadius: CARD_RADIUS, overflow: 'hidden', borderWidth: 1, borderColor: LoginColors.borderLight, backgroundColor: 'rgba(26, 31, 46, 0.82)', marginBottom: Spacing.three },
  welcomeContent: { padding: Spacing.four, paddingRight: 90 },
  welcomeGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, right: -50, top: -55, backgroundColor: 'rgba(255, 107, 53, 0.12)' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: LoginColors.success },
  liveText: { color: LoginColors.success, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  welcomeTitle: { color: LoginColors.text, fontSize: 23, fontWeight: '800', marginBottom: 7 },
  welcomeDescription: { color: LoginColors.textSecondary, fontSize: 13, lineHeight: 19 },
  welcomeIcon: { position: 'absolute', right: 22, top: 56, width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 215, 0, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.22)' },
  statsRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.five },
  statCard: { flex: 1, minHeight: 112, padding: Spacing.three, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255, 140, 66, 0.18)', backgroundColor: 'rgba(26, 31, 46, 0.72)' },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { color: LoginColors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: LoginColors.textSecondary, fontSize: 11, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.three },
  sectionTitle: { color: LoginColors.text, fontSize: 20, fontWeight: '800' },
  sectionSubtitle: { color: LoginColors.textSecondary, fontSize: 12, marginTop: 4 },
  searchContainer: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255, 140, 66, 0.25)', backgroundColor: 'rgba(26, 31, 46, 0.8)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10, marginBottom: Spacing.three },
  searchInput: { flex: 1, color: LoginColors.text, fontSize: 14, minHeight: 48 },
  studentCard: { padding: Spacing.three, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: 'rgba(255, 140, 66, 0.2)', backgroundColor: 'rgba(26, 31, 46, 0.72)', marginBottom: Spacing.three },
  studentTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  nimWrapper: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  nimText: { color: LoginColors.primaryLight, fontSize: 12, fontWeight: '800', flexShrink: 1 },
  badge: { maxWidth: '52%', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, backgroundColor: 'rgba(255, 140, 66, 0.15)' },
  badgeText: { color: LoginColors.accent, fontSize: 10, fontWeight: '700' },
  namaText: { color: LoginColors.text, fontSize: 17, fontWeight: '800' },
  studentCaption: { color: LoginColors.textSecondary, fontSize: 11, marginTop: 5 },
  loadingContainer: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: LoginColors.textSecondary, fontSize: 13 },
  stateContainer: { minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four },
  stateIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 140, 66, 0.12)', marginBottom: 16 },
  errorIcon: { backgroundColor: 'rgba(255, 107, 107, 0.12)' },
  stateTitle: { color: LoginColors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  stateDescription: { color: LoginColors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, maxWidth: 280 },
  secondaryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 16, borderRadius: 22, borderWidth: 1, borderColor: LoginColors.borderLight },
  secondaryButtonText: { color: LoginColors.primaryLight, fontSize: 13, fontWeight: '700' },
  retryButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, marginTop: 18, borderRadius: 23, backgroundColor: LoginColors.primary },
  retryButtonText: { color: LoginColors.text, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.55 },
});
