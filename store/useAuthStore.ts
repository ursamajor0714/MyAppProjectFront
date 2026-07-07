import { create } from 'zustand';
import * as SecureStore from '../utils/secureStoreHelper';

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
      }
    } catch (_) {
    } finally {
      set({ isLoading: false });
    }
  },
}));
