import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

// 앱이 켜져 있는 동안(포그라운드)에도 상단 알림이 뜨도록 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 1. 푸시 및 로컬 알림 권한 획득
 */
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (!('Notification' in window)) {
      console.warn('이 브라우저는 알림 기능을 지원하지 않습니다.');
      return false;
    }
    const permission = await window.Notification.requestPermission();
    return permission === 'granted';
  }

  // 모바일 네이티브 권한 요청
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.warn('푸시 알림 권한 획득 실패');
    return false;
  }

  // Android 헤드업 알림을 위한 알림 채널 정의
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

/**
 * 2. 즉시 알림 트리거 (SOS, GPS 이탈 등 시뮬레이션용)
 */
export async function triggerInstantNotification(title: string, body: string): Promise<string | null> {
  try {
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) return null;

    if (Platform.OS === 'web') {
      new window.Notification(title, { body });
      return 'web-instant-id';
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // 즉시 발송
    });
    return id;
  } catch (error) {
    console.warn('즉시 알림 발송 중 오류:', error);
    return null;
  }
}

/**
 * 3. 주간 요일별/시간별 복약 알림 스케줄링 예약
 * @param weekdays 요일 배열: 1 (일요일) ~ 7 (토요일)
 * @param timeStr "09:00" 형식의 24시간제 시간 문자열
 */
export async function scheduleWeeklyMedicationNotification(
  medicineName: string,
  timeStr: string,
  weekdays: number[]
): Promise<string[]> {
  try {
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) return [];

    const [hourStr, minStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (Platform.OS === 'web') {
      console.log(`[Web 스케줄 예약] ${medicineName} - 매주 요일(${weekdays.join(',')})의 ${timeStr} 알람이 모의 등록되었습니다.`);
      return weekdays.map(day => `web-schedule-id-${day}-${timeStr}`);
    }

    const scheduledIds: string[] = [];

    // 요일별로 각각 WeeklyTrigger 등록
    for (const day of weekdays) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 복약 시간입니다',
          body: `복용 약물: ${medicineName}\n잊지 말고 지시된 용량을 섭취하세요.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.WEEKLY,
          weekday: day, // 1=일, 2=월 ... 7=토
          hour,
          minute,
        },
      });
      scheduledIds.push(id);
    }

    return scheduledIds;
  } catch (error) {
    console.warn('복약 스케줄러 등록 오류:', error);
    return [];
  }
}

/**
 * 4. 지정한 특정 예약 날짜/시간 알림 예약 (병원 방문 예약용)
 * @param dateDate Date 객체 (방문 시간)
 */
export async function scheduleHospitalVisitNotification(
  hospitalName: string,
  deptName: string,
  dateDate: Date
): Promise<string[]> {
  try {
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) return [];

    if (Platform.OS === 'web') {
      console.log(`[Web 예약] ${hospitalName}(${deptName}) 방문 예약 알람 등록 완료 (${dateDate.toLocaleString()})`);
      return ['web-visit-id-1', 'web-visit-id-2'];
    }

    const scheduledIds: string[] = [];
    const nowMs = Date.now();

    // 1안: 방문 하루 전 저녁 8시 (20:00) 알림
    const dayBefore = new Date(dateDate.getTime() - 24 * 60 * 60 * 1000);
    dayBefore.setHours(20, 0, 0, 0);
    if (dayBefore.getTime() > nowMs) {
      const id1 = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 내일 병원 예약 안내',
          body: `내일은 ${hospitalName} (${deptName}) 진료 예약이 있습니다. 준비 사항을 확인해 주세요.`,
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: dayBefore,
        },
      });
      scheduledIds.push(id1);
    }

    // 2안: 방문 당일 2시간 전 리마인드 알림
    const twoHoursBefore = new Date(dateDate.getTime() - 2 * 60 * 60 * 1000);
    if (twoHoursBefore.getTime() > nowMs) {
      const id2 = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏥 오늘 병원 방문 안내',
          body: `2시간 후 ${hospitalName} (${deptName}) 진료가 예약되어 있습니다. 늦지 않게 이동하세요.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: twoHoursBefore,
        },
      });
      scheduledIds.push(id2);
    }

    return scheduledIds;
  } catch (error) {
    console.warn('병원 방문 알림 등록 오류:', error);
    return [];
  }
}

/**
 * 5. 매일 반복 스케줄 알림 예약
 */
export async function scheduleDailyScheduleNotification(
  title: string,
  body: string,
  timeStr: string
): Promise<string | null> {
  try {
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) return null;

    const [hourStr, minStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (Platform.OS === 'web') {
      console.log(`[Web 일일 스케줄] ${title} - 매일 ${timeStr} 알람 등록`);
      return `web-daily-${timeStr}-${Date.now()}`;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  } catch (error) {
    console.warn('일일 스케줄 알림 등록 오류:', error);
    return null;
  }
}

/**
 * 6. 주간 반복 스케줄 알림 예약 (여러 요일 지원)
 * @param weekdays 요일 배열: 1 (일) ~ 7 (토)
 */
export async function scheduleWeeklyScheduleNotification(
  title: string,
  body: string,
  timeStr: string,
  weekdays: number[]
): Promise<string[]> {
  try {
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) return [];

    const [hourStr, minStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (Platform.OS === 'web') {
      console.log(`[Web 주간 스케줄] ${title} - 요일(${weekdays}) ${timeStr} 등록`);
      return weekdays.map((d) => `web-weekly-${d}-${timeStr}-${Date.now()}`);
    }

    const ids: string[] = [];
    for (const weekday of weekdays) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        },
      });
      ids.push(id);
    }
    return ids;
  } catch (error) {
    console.warn('주간 스케줄 알림 등록 오류:', error);
    return [];
  }
}

/**
 * 7. 특정 예약 취소
 */
export async function cancelNotification(id: string) {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (e) {
    console.warn('알림 예약 취소 실패:', e);
  }
}

/**
 * 8. 모든 알림 예약 전체 삭제
 */
export async function cancelAllNotifications() {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('전체 알림 예약 삭제 실패:', e);
  }
}

/**
 * 9. 1회성 스케줄 알림 예약 (오늘 또는 내일)
 */
export async function scheduleOneTimeScheduleNotification(
  title: string,
  body: string,
  timeStr: string
): Promise<string | null> {
  try {
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) return null;

    const [hourStr, minStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);

    // 이미 지난 시간이면 내일로 설정
    if (triggerDate.getTime() <= Date.now()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    if (Platform.OS === 'web') {
      console.log(`[Web 1회성 스케줄] ${title} - ${triggerDate.toLocaleString()} 알람 등록`);
      return `web-onetime-${timeStr}-${Date.now()}`;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
    return id;
  } catch (error) {
    console.warn('1회성 스케줄 알림 등록 오류:', error);
    return null;
  }
}
