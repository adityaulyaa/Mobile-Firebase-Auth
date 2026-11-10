import { getFirestore, onSnapshot, collection, query, orderBy } from '@react-native-firebase/firestore';

export interface Mahasiswa {
  id: string;
  nim: string;
  nama: string;
  jurusan: string;
}

export const getMahasiswaCollection = () => {
  return collection(getFirestore(), 'mahasiswa');
};

export const subscribeToMahasiswa = (
  onUpdate: (data: Mahasiswa[]) => void,
  onError: (error: Error) => void
) => {
  const db = getFirestore();
  const q = query(collection(db, 'mahasiswa'), orderBy('nim', 'asc'));

  return onSnapshot(q, {
    next: (snapshot) => {
      const list: Mahasiswa[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Mahasiswa, 'id'>),
      }));
      onUpdate(list);
    },
    error: (err) => {
      onError(err as Error);
    },
  });
};