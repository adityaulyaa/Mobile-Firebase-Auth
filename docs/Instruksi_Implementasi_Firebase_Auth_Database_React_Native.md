# INSTRUKSI PENGEMBANGAN: IMPLEMENTASI FIREBASE AUTH & DATABASE REACT NATIVE

## 1. Ringkasan Tugas & Tujuan

Tujuan tugas ini adalah mengintegrasikan layanan **Firebase** pada
aplikasi React Native dengan alur autentikasi Google Sign-In, menyimpan
token sesi pengguna di penyimpanan lokal (*session caching*), melakukan
*bypass* halaman login saat token aktif, serta mengintegrasikan *cloud
database* untuk menampilkan daftar data mahasiswa di layar utama (Home)
secara *real-time*.

------------------------------------------------------------------------

## 2. Ketentuan & Spesifikasi Fitur

1.  **Autentikasi (Google Sign-In):** Menggunakan Firebase
    Authentication berbasis *Google Auth Provider*.

2.  **Local Storage Caching:** Menyimpan data sesi/token pengguna hasil
    login Google ke penyimpanan lokal (MMKV atau AsyncStorage).

3.  **Auto-Login / Bypass Login:**

-   Saat aplikasi dibuka (`App Open`), sistem memeriksa ketersediaan
    token di *storage* lokal.

-   Jika token ditemukan dan masih valid $\rightarrow$ Langsung buka
    layar **Home**.

-   Jika token tidak ditemukan / terhapus $\rightarrow$ Tampilkan layar
    **Login**.

4.  **Database Cloud (Firestore / Realtime DB):** Menyimpan
    dokumen/tabel data mahasiswa (dengan field: `nim`, `nama`,
    `jurusan`).

5.  **Layar Home (Daftar Mahasiswa):** Membaca koleksi data mahasiswa
    dari Firebase Database dan menyajikannya dalam bentuk daftar
    (*list*) secara *real-time*.

------------------------------------------------------------------------

## 3. Kebutuhan Library / Dependensi

Pastikan seluruh *package* pendukung Firebase, Auth Google, dan Local
Storage berikut terinstall di proyek Expo:

``` bash
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
npx expo install @react-native-google-signin/google-signin
npx expo install react-native-mmkv @react-native-async-storage/async-storage
```

------------------------------------------------------------------------

## 4. Alur Kerja Aplikasi (User Flow & State)

                           ┌─────────────────────────┐
                           │     APLIKASI DIBUKA     │
                           └────────────┬────────────┘
                                        │
                        ┌───────────────┴───────────────┐
                        │ Cek Token di Storage Lokal    │
                        │   (MMKV / AsyncStorage)       │
                        └───────────────┬───────────────┘
                                        │
                           ADA TOKEN?  / \  TIDAK ADA TOKEN
                                      /   \
                             ┌───────┘     └───────┐
                             ▼                     ▼
                  ┌──────────────────┐    ┌──────────────────┐
                  │ Bypass Ke HOME   │    │ Halaman LOGIN    │
                  │ (Instan)         │    └────────┬─────────┘
                  └────────┬─────────┘             │
                           │                       ▼
                           │            ┌────────────────────┐
                           │            │ Sign In via Google │
                           │            └────────┬───────────┘
                           │                       │
                           │                       ▼
                           │            ┌────────────────────┐
                           │            │ Firebase Auth OK   │
                           │            └────────┬───────────┘
                           │                       │
                           │                       ▼
                           │            ┌────────────────────┐
                           │            │ Save Token/Sesi ke │
                           │            │ Storage Lokal      │
                           │            └────────┬───────────┘
                           │                       │
                           └───────────┬───────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │     HALAMAN HOME      │
                           │  Stream List Realtime │
                           │    Data Mahasiswa     │
                           └───────────────────────┘

------------------------------------------------------------------------

## 5. Cetak Biru Implementasi Kode (Code Blueprint)

### A. Konfigurasi Firebase & Local Storage (`storage.ts`)

Inisialisasi instance penyimpanan lokal (MMKV/AsyncStorage) dan
penentuan kunci token:

``` typescript
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();
export const TOKEN_KEY = 'user_google_token';
```

------------------------------------------------------------------------

### B. Session Check & Bypass Login (`App.tsx` / `_layout.tsx`)

Pemeriksaan sesi otomatis saat aplikasi dibuka (*Auto-Login / Session
Caching*):

``` typescript
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { storage, TOKEN_KEY } from './storage';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    // Read Token dari Local Storage (MMKV synchronous read)
    const token = storage.getString(TOKEN_KEY);
    if (token) {
      console.log('[AUTO-LOGIN] Token ditemukan, bypass login screen:', token);
      setUserToken(token);
    } else {
      console.log('[AUTO-LOGIN] Token tidak ada, tampilkan Login screen');
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Bypass Login jika token aktif ditemukan
  return userToken ? (
    <HomeScreen onLogout={() => setUserToken(null)} />
  ) : (
    <LoginScreen onLoginSuccess={(token) => setUserToken(token)} />
  );
}
```

------------------------------------------------------------------------

### C. Halaman Login: Google Sign-In & Simpan Sesi (`LoginScreen.tsx`)

Pengisian kredensial Google Sign-In, autentikasi Firebase, dan
penyimpanan token ke storage lokal:

``` typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { storage, TOKEN_KEY } from '../storage';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginProps) {
  const handleGoogleSignIn = async () => {
    try {
      // 1. Ambil ID Token dari Google Sign-In
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken } = await GoogleSignin.signIn();

      // 2. Buat kredensial Firebase Auth
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);

      // 3. Dapatkan Token Sesi Firebase
      const token = await userCredential.user.getIdToken();

      // 4. Simpan ke Local Storage (Session Caching)
      storage.set(TOKEN_KEY, token);
      console.log('[LOGIN SUCCESS] Token tersimpan di MMKV:', token);

      // 5. Callback untuk pembaruan state / navigasi
      onLoginSuccess(token);
    } catch (error) {
      console.error('[LOGIN ERROR]', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portal Mahasiswa</Text>
      <Text style={styles.subtitle}>Silakan masuk menggunakan akun Google Anda</Text>

      <TouchableOpacity style={styles.btnGoogle} onPress={handleGoogleSignIn}>
        <Text style={styles.btnText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
  btnGoogle: { backgroundColor: '#4285F4', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
```

------------------------------------------------------------------------

### D. Halaman Home: Stream List Data Mahasiswa Real-time (`HomeScreen.tsx`)

Membaca koleksi data `mahasiswa` dari Cloud Firestore menggunakan
*listener* `onSnapshot`:

``` typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { storage, TOKEN_KEY } from '../storage';

interface Mahasiswa {
  id: string;
  nim: string;
  nama: string;
  jurusan: string;
}

interface HomeProps {
  onLogout: () => void;
}

export default function HomeScreen({ onLogout }: HomeProps) {
  const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);

  useEffect(() => {
    // Realtime Listener Firestore (Slide 19)
    const unsubscribe = firestore()
      .collection('mahasiswa')
      .orderBy('nim', 'asc')
      .onSnapshot(
        (snapshot) => {
          const list: Mahasiswa[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Mahasiswa, 'id'>),
          }));
          setMahasiswaList(list);
          console.log('[FIRESTORE REALTIME] Data mahasiswa diperbarui:', list.length, 'data');
        },
        (error) => console.error('[FIRESTORE ERROR]', error)
      );

    // Cleanup listener saat unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth().signOut();
    storage.delete(TOKEN_KEY); // Hapus token dari local storage
    console.log('[LOGOUT] Token terhapus dari local storage');
    onLogout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daftar Mahasiswa</Text>
        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={mahasiswaList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nama}>{item.nama}</Text>
            <Text style={styles.detail}>NIM: {item.nim}</Text>
            <Text style={styles.detail}>Jurusan: {item.jurusan}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada data mahasiswa...</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold' },
  btnLogout: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  nama: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  detail: { fontSize: 14, color: '#64748b', marginTop: 2 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
});
```

------------------------------------------------------------------------

### E. Input Data Mahasiswa Awal (Data Seeding)

Pengisian data awal mahasiswa dilakukan secara manual melalui **Firebase
Console**:

1.  Masuk ke **Firebase Console** $\rightarrow$ pilih proyek aktif
    $\rightarrow$ **Firestore Database**.
2.  Buat koleksi (*collection*) baru bernama `mahasiswa`.
3.  Tambahkan beberapa dokumen contoh dengan struktur *field*:

-   `nim`: `"24060124120006"` (*string*)
-   `nama`: `"Aditya Sultonul Ulya"` (*string*)
-   `jurusan`: `"Informatika"` (*string*)

------------------------------------------------------------------------

## 6. Deliverables & Checklist Pengumpulan Tugas

-   [ ] Firebase Auth (Google Sign-In Provider) & Firestore Database
    dikonfigurasi aktif di Firebase Console.

-   [ ] Fitur *Sign in with Google* berhasil mengeksekusi login dan
    menerima ID Token.

-   [ ] Sesi login/token berhasil tersimpan otomatis di penyimpanan
    lokal (MMKV / AsyncStorage).

-   [ ] Fitur *Bypass Login*: Aplikasi langsung menuju layar Home tanpa
    menampilkan Login Screen jika token aktif masih tersimpan di lokal.

-   [ ] Koleksi data mahasiswa berhasil di-stream dan ditampilkan pada
    komponen `FlatList` di layar Home secara *real-time*.

-   [ ] Fitur *Logout* berhasil menghapus token dari storage lokal dan
    mengembalikan posisi aplikasi ke Login Screen.
