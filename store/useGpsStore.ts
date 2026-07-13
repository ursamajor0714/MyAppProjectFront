import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export interface GpsSettings {
  id?: number;
  consentGranted: boolean;
  targetType: 'senior' | 'child';
  targetAge: number;
  safetyRadius: number; // in meters
  stayTimeLimit: string; // e.g. "2시간"
  selectedIllnesses: string[];
  targetPhoneNumber: string;
  connectionStatus: 'none' | 'pending' | 'linked';
}

interface GpsState {
  settings: GpsSettings;
  currentCoords: { latitude: number; longitude: number } | null;
  isTracking: boolean;
  setConsent: (granted: boolean) => Promise<void>;
  updateSettings: (updates: Partial<GpsSettings>) => Promise<void>;
  setCurrentCoords: (coords: { latitude: number; longitude: number } | null) => Promise<void>;
  toggleTracking: (val: boolean) => void;
  resetGpsStore: () => void;
  fetchSettingsFromServer: () => Promise<void>;
  deleteSettingsFromServer: () => Promise<void>;
}

const getAuthStore = () => {
  return require('./useAuthStore').useAuthStore;
};

const DEFAULT_SETTINGS: GpsSettings = {
  consentGranted: false,
  targetType: 'senior',
  targetAge: 75,
  safetyRadius: 300,
  stayTimeLimit: '2시간',
  selectedIllnesses: ['치매'],
  targetPhoneNumber: '',
  connectionStatus: 'none',
};

export const useGpsStore = create<GpsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      currentCoords: null,
      isTracking: false,
      
      setConsent: async (granted) => {
        set((state) => ({
          settings: { ...state.settings, consentGranted: granted },
        }));
        
        // 로그인된 상태라면 동기화 시도
        const isLoggedIn = getAuthStore().getState().isLoggedIn;
        if (isLoggedIn) {
          const currentSettings = get().settings;
          try {
            if (currentSettings.id) {
              await api.put(`/api/gps/${currentSettings.id}`, { consentGranted: granted });
            }
          } catch (e) {
            console.warn('Failed to sync consent status to server:', e);
          }
        }
      },
      
      updateSettings: async (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));

        const isLoggedIn = getAuthStore().getState().isLoggedIn;
        if (!isLoggedIn) return;

        const currentSettings = get().settings;
        try {
          if (currentSettings.id) {
            const updated = await api.put(`/api/gps/${currentSettings.id}`, {
              safetyRadius: currentSettings.safetyRadius,
              stayTimeLimit: currentSettings.stayTimeLimit,
              selectedIllnesses: currentSettings.selectedIllnesses,
              connectionStatus: currentSettings.connectionStatus,
              consentGranted: currentSettings.consentGranted,
              targetPhoneNumber: currentSettings.targetPhoneNumber,
            });
            set((state) => ({
              settings: { ...state.settings, ...updated },
            }));
          } else {
            const created = await api.post('/api/gps', {
              targetType: currentSettings.targetType,
              targetAge: currentSettings.targetAge,
              safetyRadius: currentSettings.safetyRadius,
              stayTimeLimit: currentSettings.stayTimeLimit,
              selectedIllnesses: currentSettings.selectedIllnesses,
              targetPhoneNumber: currentSettings.targetPhoneNumber,
              connectionStatus: currentSettings.connectionStatus,
            });
            set((state) => ({
              settings: { ...state.settings, id: created.id },
            }));
          }
        } catch (e) {
          console.warn('Failed to sync GPS settings to server:', e);
        }
      },
      
      setCurrentCoords: async (coords) => {
        set({ currentCoords: coords });

        const currentSettings = get().settings;
        const isLoggedIn = getAuthStore().getState().isLoggedIn;
        if (isLoggedIn && currentSettings.id && coords) {
          try {
            await api.put(`/api/gps/${currentSettings.id}`, {
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
          } catch (e) {
            console.warn('Failed to sync current coords to server:', e);
          }
        }
      },
      
      toggleTracking: (val) => set({ isTracking: val }),
      
      resetGpsStore: () => set({ settings: DEFAULT_SETTINGS, currentCoords: null, isTracking: false }),
      
      fetchSettingsFromServer: async () => {
        const isLoggedIn = getAuthStore().getState().isLoggedIn;
        if (!isLoggedIn) return;
        try {
          const data = await api.get('/api/gps');
          if (Array.isArray(data) && data.length > 0) {
            const srv = data[0];
            set({
              settings: {
                id: srv.id,
                consentGranted: srv.consentGranted ?? true,
                targetType: srv.targetType,
                targetAge: srv.targetAge,
                safetyRadius: srv.safetyRadius,
                stayTimeLimit: srv.stayTimeLimit,
                selectedIllnesses: srv.selectedIllnesses,
                targetPhoneNumber: srv.targetPhoneNumber,
                connectionStatus: srv.connectionStatus,
              }
            });
            if (srv.latitude && srv.longitude) {
              set({ currentCoords: { latitude: srv.latitude, longitude: srv.longitude } });
            }
          }
        } catch (e) {
          console.warn('Failed to fetch GPS settings from server:', e);
        }
      },
      
      deleteSettingsFromServer: async () => {
        const currentSettings = get().settings;
        const isLoggedIn = getAuthStore().getState().isLoggedIn;
        if (isLoggedIn && currentSettings.id) {
          try {
            await api.delete(`/api/gps/${currentSettings.id}`);
          } catch (e) {
            console.warn('Failed to delete GPS settings from server:', e);
          }
        }
        set({ settings: DEFAULT_SETTINGS, currentCoords: null, isTracking: false });
      },
    }),
    {
      name: 'gps-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
