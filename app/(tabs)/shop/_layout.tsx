import { Stack } from 'expo-router';

export default function ShopLayout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerTintColor: '#1A1A1A',
      headerTitleStyle: { fontWeight: '800', fontSize: 18 },
      headerShadowVisible: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      animation: 'slide_from_right',
    }}>
      <Stack.Screen name="index" options={{ title: '건강 상점' }} />
      <Stack.Screen name="product-detail" options={{ title: '상품 상세' }} />
      <Stack.Screen name="cart" options={{ title: '장바구니' }} />
    </Stack>
  );
}
