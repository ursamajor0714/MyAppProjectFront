import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  // 건강정보
  age: string;
  gender: 'male' | 'female' | null;
  height: string;
  weight: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: UserInfo | null;
  isLoading: boolean;

  login: (user: UserInfo, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<UserInfo>) => void;
  loadFromStorage: () => Promise<void>;
}

const USER_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  user: null,
  isLoading: true,

  login: async (user, token) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ isLoggedIn: true, user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    
    // 비로그인 세션 원천 격리 (Zero Cache) - 동적 require로 순환 참조 해결
    const { useNotificationStore } = require('./useNotificationStore');
    const { useGpsStore } = require('./useGpsStore');
    const { useCartStore } = require('./useCartStore');
    const { useSymptomStore } = require('./symptomData');

    useNotificationStore.getState().clearAll();
    useGpsStore.getState().resetGpsStore();
    useCartStore.getState().clearCart();
    await useSymptomStore.getState().clearHistory();
    set({ isLoggedIn: false, user: null });
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    set({ user: updated });
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
  },

  loadFromStorage: async () => {
    try {
      const raw = await SecureStore.getItemAsync(USER_KEY);
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (raw && token) {
        set({ isLoggedIn: true, user: JSON.parse(raw) });
      } else {
        // 비로그인 상태 진입 시 이전 캐시 원천 격리 (Zero Cache) - 동적 require
        const { useNotificationStore } = require('./useNotificationStore');
        const { useGpsStore } = require('./useGpsStore');
        const { useCartStore } = require('./useCartStore');
        const { useSymptomStore } = require('./symptomData');

        useNotificationStore.getState().clearAll();
        useGpsStore.getState().resetGpsStore();
        useCartStore.getState().clearCart();
        await useSymptomStore.getState().clearHistory();
      }
    } catch (_) {
    } finally {
      set({ isLoading: false });
    }
  },
}));
