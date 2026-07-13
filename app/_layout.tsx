import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { LogBox, Platform } from 'react-native';

if (Platform.OS === 'web') {
  LogBox.ignoreAllLogs(true);
  try {
    // LogBox의 핵심 진입 메소드를 완전 모의(Mock)화하여 웹 2차 크래시 오버레이 방지
    LogBox.install = () => {};
    LogBox.uninstall = () => {};
  } catch (e) {}
}

export default function RootLayout() {
  const loadFromStorage = useAuthStore(state => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <>
      <StatusBar style="dark" backgroundColor="rgba(0,0,0,0.04)" />
      <Stack screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="telemedicine" options={{ headerShown: false }} />
        <Stack.Screen name="medication-settings" options={{ headerShown: false }} />
        <Stack.Screen name="calendar-reservations" options={{ headerShown: false }} />
        <Stack.Screen name="health-scheduler" options={{ headerShown: false }} />
        <Stack.Screen name="find-info" options={{ headerShown: false }} />
        <Stack.Screen name="resume-clinic" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
