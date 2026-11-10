import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV, type MMKV } from 'react-native-mmkv';

let mmkv: MMKV | null = null;

try {
  mmkv = createMMKV();
} catch (error) {
  console.warn('[STORAGE] MMKV unavailable, falling back to AsyncStorage:', error);
  mmkv = null;
}

const getString = async (key: string): Promise<string | undefined> => {
  if (mmkv) {
    try {
      return mmkv.getString(key);
    } catch (error) {
      console.warn('[STORAGE] MMKV read failed, falling back to AsyncStorage:', error);
    }
  }

  const value = await AsyncStorage.getItem(key);
  return value ?? undefined;
};

const set = async (key: string, value: string): Promise<void> => {
  if (mmkv) {
    try {
      mmkv.set(key, value);
      return;
    } catch (error) {
      console.warn('[STORAGE] MMKV write failed, falling back to AsyncStorage:', error);
    }
  }

  await AsyncStorage.setItem(key, value);
};

const remove = async (key: string): Promise<void> => {
  if (mmkv) {
    try {
      mmkv.remove(key);
      return;
    } catch (error) {
      console.warn('[STORAGE] MMKV remove failed, falling back to AsyncStorage:', error);
    }
  }

  await AsyncStorage.removeItem(key);
};

export const storage = {
  getString,
  set,
  remove,
  delete: remove,
};

export const TOKEN_KEY = 'user_google_token';
export const USER_NAME_KEY = 'userName';
export const USER_EMAIL_KEY = 'userEmail';
