import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  scheduleDailyScheduleNotification,
  scheduleWeeklyScheduleNotification,
  scheduleOneTimeScheduleNotification,
  cancelNotification,
} from '../utils/notificationHelper';

const WEEKDAY_NUMS: Record<string, number> = {
  '일': 1, '월': 2, '화': 3, '수': 4, '목': 5, '금': 6, '토': 7
};

const getCategoryIcon = (category: ScheduleCategory): string => {
  const icons: Record<ScheduleCategory, string> = {
    medication: '💊',
    exercise: '🏃',
    checkup: '🩺',
    hospital: '🏥',
    diet: '🥗',
    custom: '📌',
  };
  return icons[category] || '⏰';
};

const getCategoryLabel = (category: ScheduleCategory): string => {
  const labels: Record<ScheduleCategory, string> = {
    medication: '복약',
    exercise: '운동',
    checkup: '건강검진',
    hospital: '병원',
    diet: '식단',
    custom: '기타',
  };
  return labels[category] || '일정';
};

// 알림 실제 예약 처리 헬퍼 함수
async function registerScheduleNotifications(item: Omit<ScheduleItem, 'notificationIds'>): Promise<string[]> {
  if (!item.active) return [];
  
  const title = `${getCategoryIcon(item.category)} ${item.title}`;
  const body = item.description || `${getCategoryLabel(item.category)} 일정을 지킬 시간입니다.`;
  
  try {
    if (item.repeat === 'daily') {
      const id = await scheduleDailyScheduleNotification(title, body, item.time);
      return id ? [id] : [];
    } else if (item.repeat === 'weekly') {
      const dayNums = item.repeatDays.map(d => WEEKDAY_NUMS[d] || 1);
      const ids = await scheduleWeeklyScheduleNotification(title, body, item.time, dayNums);
      return ids;
    } else if (item.repeat === 'none') {
      const id = await scheduleOneTimeScheduleNotification(title, body, item.time);
      return id ? [id] : [];
    }
  } catch (e) {
    console.warn('[registerScheduleNotifications] 등록 오류:', e);
  }
  return [];
}


// ─────────────────────────────────────────
//  타입 정의
// ─────────────────────────────────────────

export type ScheduleCategory = 'medication' | 'exercise' | 'checkup' | 'hospital' | 'diet' | 'custom';
export type ScheduleRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  category: ScheduleCategory;
  /** "HH:MM" 24h 형식 */
  time: string;
  /** 'daily'/'none' 일 때는 무시, 'weekly' 일 때: ['월','화',...], 'monthly': ['1','15'] */
  repeatDays: string[];
  repeat: ScheduleRepeat;
  active: boolean;
  /** expo-notifications 예약 ID 목록 */
  notificationIds: string[];
  createdAt: string;
}

export interface WeeklyReportSummary {
  weekLabel: string;  // 예: "2026년 7월 1주차"
  startDate: string;  // ISO 날짜
  healthScore: number;
  totalChecks: number;
  emergencyCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  topParts: { part: string; count: number }[];
  sentToGuardian: boolean;
  sentAt?: string;
}

// ─────────────────────────────────────────
//  스토어 인터페이스
// ─────────────────────────────────────────

interface HealthReportState {
  // 스케줄 관리
  schedules: ScheduleItem[];
  addSchedule: (item: Omit<ScheduleItem, 'id' | 'createdAt' | 'notificationIds'>) => Promise<ScheduleItem>;
  updateSchedule: (id: string, patch: Partial<ScheduleItem>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  toggleScheduleActive: (id: string) => Promise<void>;
  setScheduleNotificationIds: (id: string, ids: string[]) => void;

  // 주간 리포트 아카이브
  weeklyReports: WeeklyReportSummary[];
  saveWeeklyReport: (report: WeeklyReportSummary) => void;
  markReportSent: (weekLabel: string) => void;

  // 영속성 로드
  loadFromStorage: () => Promise<void>;
  persistToStorage: () => Promise<void>;
}

const STORAGE_KEY = 'health_report_store_v1';

// ─────────────────────────────────────────
//  초기 샘플 데이터
// ─────────────────────────────────────────

const SAMPLE_SCHEDULES: ScheduleItem[] = [
  {
    id: 'sched-001',
    title: '혈압약 복용',
    description: '아침 식후 30분 고혈압약 1정',
    category: 'medication',
    time: '09:00',
    repeat: 'daily',
    repeatDays: [],
    active: true,
    notificationIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sched-002',
    title: '아침 스트레칭',
    description: '15분 가벼운 전신 스트레칭',
    category: 'exercise',
    time: '07:30',
    repeat: 'daily',
    repeatDays: [],
    active: true,
    notificationIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sched-003',
    title: '주간 자가진단 체크',
    description: '매주 월요일 전신 건강 자가 체크',
    category: 'checkup',
    time: '09:00',
    repeat: 'weekly',
    repeatDays: ['월'],
    active: true,
    notificationIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sched-004',
    title: '영양제 복용',
    description: '점심 식후 비타민D + 오메가3',
    category: 'medication',
    time: '13:00',
    repeat: 'daily',
    repeatDays: [],
    active: false,
    notificationIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sched-005',
    title: '저녁 산책',
    description: '30분 빠른 걷기',
    category: 'exercise',
    time: '19:30',
    repeat: 'weekly',
    repeatDays: ['월', '수', '금'],
    active: true,
    notificationIds: [],
    createdAt: new Date().toISOString(),
  },
];

// ─────────────────────────────────────────
//  스토어 생성
// ─────────────────────────────────────────

export const useHealthReportStore = create<HealthReportState>((set, get) => ({
  schedules: SAMPLE_SCHEDULES,
  weeklyReports: [],

  // ── 스케줄 추가
  addSchedule: async (item) => {
    const newItem: ScheduleItem = {
      ...item,
      id: `sched-${Date.now()}`,
      notificationIds: [],
      createdAt: new Date().toISOString(),
    };

    // 활성화 상태인 경우에만 로컬 알림 등록
    if (newItem.active) {
      const ids = await registerScheduleNotifications(newItem);
      newItem.notificationIds = ids;
    }

    set((state) => ({ schedules: [newItem, ...state.schedules] }));
    await get().persistToStorage();
    return newItem;
  },

  // ── 스케줄 업데이트
  updateSchedule: async (id, patch) => {
    const schedules = get().schedules;
    const target = schedules.find((s) => s.id === id);
    if (!target) return;

    // 1. 기존 알림들 취소
    if (target.notificationIds && target.notificationIds.length > 0) {
      for (const nid of target.notificationIds) {
        await cancelNotification(nid);
      }
    }

    // 2. 패치 데이터를 합쳐 임시 객체 생성
    const updatedMock = { ...target, ...patch, notificationIds: [] as string[] };

    // 3. 만약 업데이트 후에도 active 상태라면 알림 재생성
    if (updatedMock.active) {
      const ids = await registerScheduleNotifications(updatedMock);
      updatedMock.notificationIds = ids;
    }

    set((state) => ({
      schedules: state.schedules.map((s) => (s.id === id ? updatedMock : s)),
    }));
    await get().persistToStorage();
  },

  // ── 스케줄 삭제
  deleteSchedule: async (id) => {
    const schedules = get().schedules;
    const target = schedules.find((s) => s.id === id);
    
    // 기존에 예약된 알림 취소
    if (target && target.notificationIds && target.notificationIds.length > 0) {
      for (const nid of target.notificationIds) {
        await cancelNotification(nid);
      }
    }

    set((state) => ({ schedules: state.schedules.filter((s) => s.id !== id) }));
    await get().persistToStorage();
  },

  // ── 활성 토글
  toggleScheduleActive: async (id) => {
    const schedules = get().schedules;
    const target = schedules.find((s) => s.id === id);
    if (!target) return;

    const nextActive = !target.active;
    let nextNotificationIds: string[] = [];

    if (nextActive) {
      // 비활성 -> 활성: 알림 예약
      const updatedMock = { ...target, active: true };
      nextNotificationIds = await registerScheduleNotifications(updatedMock);
    } else {
      // 활성 -> 비활성: 알림 취소
      if (target.notificationIds && target.notificationIds.length > 0) {
        for (const nid of target.notificationIds) {
          await cancelNotification(nid);
        }
      }
    }

    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === id ? { ...s, active: nextActive, notificationIds: nextNotificationIds } : s
      ),
    }));
    await get().persistToStorage();
  },

  // ── 알림 ID 세팅
  setScheduleNotificationIds: (id, ids) => {
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === id ? { ...s, notificationIds: ids } : s
      ),
    }));
  },

  // ── 주간 리포트 저장
  saveWeeklyReport: (report) => {
    set((state) => {
      const filtered = state.weeklyReports.filter((r) => r.weekLabel !== report.weekLabel);
      return { weeklyReports: [report, ...filtered] };
    });
    get().persistToStorage();
  },

  // ── 리포트 전송 완료 마킹
  markReportSent: (weekLabel) => {
    set((state) => ({
      weeklyReports: state.weeklyReports.map((r) =>
        r.weekLabel === weekLabel
          ? { ...r, sentToGuardian: true, sentAt: new Date().toISOString() }
          : r
      ),
    }));
    get().persistToStorage();
  },

  // ── AsyncStorage 로드
  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set((state) => ({
          schedules: parsed.schedules ?? state.schedules,
          weeklyReports: parsed.weeklyReports ?? state.weeklyReports,
        }));
      }
    } catch (e) {
      console.warn('[HealthReportStore] 로드 실패:', e);
    }
  },

  // ── AsyncStorage 저장
  persistToStorage: async () => {
    try {
      const { schedules, weeklyReports } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ schedules, weeklyReports }));
    } catch (e) {
      console.warn('[HealthReportStore] 저장 실패:', e);
    }
  },
}));
