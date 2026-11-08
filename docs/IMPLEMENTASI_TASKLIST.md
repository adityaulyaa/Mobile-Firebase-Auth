# IMPLEMENTASI TASKLIST

## Fase 1: Persiapan Dependensi & Konfigurasi Proyek
- **1.1 Instalasi Library & Native Modules**
  - `npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore`
  - `npx expo install @react-native-google-signin/google-signin`
  - `npx expo install react-native-mmkv @react-native-async-storage/async-storage`
- **1.2 Konfigurasi Native Firebase**
  - Tempatkan `google-services.json` di root proyek.
  - Tambahkan konfigurasi plugin di `app.json`:
    ```json
    {
      "expo": {
        "android": {
          "googleServicesFile": "./google-services.json"
        }
      }
    }
    ```
- **1.3 Modul Abstraksi Storage (`src/services/storage.ts`)**
  - Buat wrapper untuk `MMKV` (dan fallback ke `AsyncStorage`).
  - Export `storage` dan constant `TOKEN_KEY`.

## Fase 2: Implementasi Layar & Fitur Login (LoginScreen)
- **2.1 Inisialisasi Google Sign-In**
  - `GoogleSignin.configure({ webClientId: '<WEB_CLIENT_ID>' })`.
- **2.2 Buat `LoginScreen.tsx`**
  - UI: judul, deskripsi, tombol Sign‑in with Google, indikator loading.
- **2.3 Alur Autentikasi Firebase**
  1. Dapatkan `idToken` dari Google Sign‑In.
  2. Buat kredensial: `auth.GoogleAuthProvider.credential(idToken)`.
  3. `auth().signInWithCredential(credential)`.
  4. `const token = await userCredential.user.getIdToken();`
- **2.4 Caching Token Sesi**
  - `storage.set(TOKEN_KEY, token);`
  - Panggil `onLoginSuccess(token)` untuk memperbaharui state aplikasi.

## Fase 3: Implementasi Layar & Fitur Home (HomeScreen)
- **3.1 Definisikan Model Mahasiswa**
  ```ts
  interface Mahasiswa { id: string; nim: string; nama: string; jurusan: string; }
  ```
- **3.2 Integrasi Firestore Real‑time**
  - Listener:
    ```ts
    const unsubscribe = firestore()
      .collection('mahasiswa')
      .orderBy('nim', 'asc')
      .onSnapshot(snapshot => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Mahasiswa,'id'>) }));
        setMahasiswaList(list);
      });
    ```
  - Cleanup dengan `return () => unsubscribe();`.
- **3.3 UI Daftar Mahasiswa**
  - `FlatList` dengan `renderItem` menampilkan kartu (NIM, Nama, Jurusan).
  - `ListEmptyComponent` & loading indicator.
- **3.4 Logout**
  - `await auth().signOut();`
  - `storage.delete(TOKEN_KEY);`
  - Panggil `onLogout()` untuk kembali ke login.

## Fase 4: Manajemen Navigasi & Auto‑Login (Bypass Login)
- **4.1 Cek Sesi di Root Layout (`src/app/_layout.tsx`)**
  - Pada `useEffect` baca `storage.getString(TOKEN_KEY)`.
  - Jika ada, set state `userToken` dan render `HomeScreen`.
  - Jika tidak, render `LoginScreen`.
- **4.2 Splash / Loading**
  - Tampilkan `ActivityIndicator` hingga status token diketahui.

## Fase 5: Validasi, QA & Testing
- **5.1 Typecheck & Lint**
  - `npx tsc --noEmit`
  - `npm run lint`
- **5.2 Checklist Akhir**
  - [ ] Google Sign‑In berhasil, token tersimpan.
  - [ ] Restart aplikasi → auto‑login langsung ke Home.
  - [ ] Data Firestore realtime ter‑update di UI.
  - [ ] Logout menghapus token & kembali ke Login.
  - [ ] Semua TypeScript lint‑free.
