import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'medication' | 'booking' | 'gps' | 'sos' | 'general';
  read: boolean;
  relatedId?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'read' | 'time'>) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    {
      id: '1',
      title: '💊 복약 알림',
      body: '오늘 아침 고혈압약 복용하실 시간입니다. 물과 함께 드세요.',
      time: '10분 전',
      type: 'medication',
      read: false,
    },
    {
      id: '2',
      title: '📅 예약 확정 알림',
      body: '서울성모이비인후과 오늘 오후 2:30 예약이 확정되었습니다. 진료 정보는 등록된 번호로 전송되었습니다.',
      time: '1시간 전',
      type: 'booking',
      read: false,
    },
    {
      id: '3',
      title: '🚨 SOS 긴급 감지',
      body: '[비상] 아버님(보호 대상자)의 단말기에서 사이렌 비상 호출이 발생했습니다. 즉시 연락해 보세요.',
      time: '2시간 전',
      type: 'sos',
      read: true,
    },
    {
      id: '4',
      title: '📍 안전구역 이탈',
      body: '아버님이 설정된 안심 안전구역(반경 500m)을 벗어나 이동 중입니다.',
      time: '3시간 전',
      type: 'gps',
      read: true,
    },
    {
      id: '5',
      title: '🎁 스토어 할인 혜택',
      body: '관절 건강 기저질환자를 위한 맞춤형 MSM 제품 20% 특별 할인 쿠폰이 발급되었습니다.',
      time: '어제',
      type: 'general',
      read: true,
    },
  ],
  isModalOpen: false,
  setModalOpen: (open) => set({ isModalOpen: open }),
  addNotification: (item) => {
    const newNotif: NotificationItem = {
      ...item,
      id: Math.random().toString(),
      time: '방금 전',
      read: false,
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }));
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
    }));
  },
  clearAll: () => {
    set({ notifications: [] });
  },
  deleteNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));
