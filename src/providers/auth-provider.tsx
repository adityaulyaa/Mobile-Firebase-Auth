import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut, type User } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { storage, TOKEN_KEY, USER_EMAIL_KEY, USER_NAME_KEY } from '@/services/storage';

type LoginPayload = {
  token: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  userToken: string | null;
  userName: string;
  userEmail: string;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const clearUserStorage = async () => {
  await Promise.all([
    storage.remove(TOKEN_KEY),
    storage.remove(USER_NAME_KEY),
    storage.remove(USER_EMAIL_KEY),
  ]);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const firebaseAuth = getAuth();
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const applyUser = async (user: User | null) => {
      if (cancelled) return;

      if (!user) {
        try {
          await clearUserStorage();
        } catch (error) {
          console.warn('[AUTH] Failed to clear local user storage:', error);
        }
        if (cancelled) return;

        setUserToken(null);
        setUserName('');
        setUserEmail('');
        setIsLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        if (cancelled) return;

        setUserToken(token);
        setUserName(user.displayName ?? '');
        setUserEmail(user.email ?? '');

        try {
          await storage.set(TOKEN_KEY, token);
          await storage.set(USER_NAME_KEY, user.displayName ?? '');
          await storage.set(USER_EMAIL_KEY, user.email ?? '');
        } catch (error) {
          console.warn('[AUTH] Failed to persist user session:', error);
        }
      } catch (error) {
        if (cancelled) return;

        const code = (error as { code?: string }).code;
        const cachedToken = await storage.getString(TOKEN_KEY).catch(() => undefined);

        if (code === 'auth/network-request-failed' && cachedToken) {
          setUserToken(cachedToken);
          setUserName(user.displayName ?? '');
          setUserEmail(user.email ?? '');
        } else {
          try {
            await clearUserStorage();
          } catch (storageError) {
            console.warn('[AUTH] Failed to clear local user storage:', storageError);
          }
          await signOut(firebaseAuth).catch(() => undefined);
          if (cancelled) return;

          setUserToken(null);
          setUserName('');
          setUserEmail('');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const init = async () => {
      try {
        await firebaseAuth.authStateReady();
      } catch (error) {
        console.warn('[AUTH] Failed to wait for auth state:', error);
      }

      if (cancelled) return;

      unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        void applyUser(user);
      });

      void applyUser(firebaseAuth.currentUser);
    };

    void init();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [firebaseAuth]);

  const login = useCallback(async ({ token, name, email }: LoginPayload) => {
    try {
      await storage.set(TOKEN_KEY, token);
      await storage.set(USER_NAME_KEY, name);
      await storage.set(USER_EMAIL_KEY, email);
    } catch (error) {
      console.warn('[AUTH] Failed to persist user session:', error);
    }

    setUserToken(token);
    setUserName(name);
    setUserEmail(email);
  }, []);

  const logout = useCallback(async () => {
    setUserToken(null);
    setUserName('');
    setUserEmail('');

    try {
      await clearUserStorage();
    } catch (error) {
      console.warn('[AUTH] Failed to clear local user storage:', error);
    }

    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.warn('[AUTH] Google sign-out failed:', error);
    }

    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.warn('[AUTH] Firebase sign-out failed:', error);
    }
  }, [firebaseAuth]);

  const value = useMemo(
    () => ({ userToken, userName, userEmail, isLoading, login, logout }),
    [userToken, userName, userEmail, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
