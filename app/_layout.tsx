import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
        <Stack.Screen name="telemedicine-empty" options={{ headerShown: false }} />
        <Stack.Screen name="find-info" options={{ headerShown: false }} />
        <Stack.Screen name="resume-clinic" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
