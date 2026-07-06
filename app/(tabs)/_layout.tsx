import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text } from 'react-native';
import { useNotificationStore } from '../../store/useNotificationStore';
import NotificationModal from '../../components/NotificationModal';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  activeIcon: IoniconsName;
}

const TABS: TabConfig[] = [
  {
    name: 'index',
    title: '홈',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    name: 'clinic',
    title: '진료',
    icon: 'medical-outline',
    activeIcon: 'medical',
  },
  {
    name: 'gps',
    title: 'GPS',
    icon: 'location-outline',
    activeIcon: 'location',
  },
  {
    name: 'shop',
    title: '쇼핑몰',
    icon: 'cart-outline',
    activeIcon: 'cart',
  },
  {
    name: 'profile',
    title: '내 정보',
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

export default function TabLayout() {
  const setModalOpen = useNotificationStore((state) => state.setModalOpen);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#4CAF82',
          tabBarInactiveTintColor: '#9E9E9E',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#1A1A1A',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setModalOpen(true)}
              style={{
                marginRight: 16,
                position: 'relative',
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    backgroundColor: '#E53935',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ),
        }}
      >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerShown: tab.name !== 'shop',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
      {/* 탭바에는 아이콘으로 안 보이지만, 탭 네비게이션 안에 있어서 탭바는 유지됨 */}
      <Tabs.Screen
        name="clinic-hospitals"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="symptom-result"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
      <NotificationModal />
    </>
  );
}
