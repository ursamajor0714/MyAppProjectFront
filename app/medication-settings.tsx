import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import {
  scheduleWeeklyMedicationNotification,
  cancelNotification
} from '../utils/notificationHelper';

interface MedicationAlarm {
  id: number;
  medicineName: string;
  dosage?: string;
  times: string[];
  days: string[];
  active: boolean;
  notificationIds?: string[];
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKDAYS_MAP: Record<string, number> = { '일': 1, '월': 2, '화': 3, '수': 4, '목': 5, '금': 6, '토': 7 };

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// ── ⏱️ 터치 드래그 스냅 시간 다이얼 컴포넌트 ──
const WHEEL_ITEM_H = 42;

interface WheelProps {
  items: string[];
  selectedValue: string;
  onValueChange: (val: string) => void;
}

function ScrollWheel({ items, selectedValue, onValueChange }: WheelProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const paddedItems = ['', ...items, ''];
  const selectedIndex = items.indexOf(selectedValue);

  useEffect(() => {
    if (selectedIndex !== -1 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: selectedIndex * WHEEL_ITEM_H,
          animated: false,
        });
      }, 50);
    }
  }, [selectedValue, selectedIndex]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / WHEEL_ITEM_H);
    const safeIdx = Math.max(0, Math.min(items.length - 1, idx));
    onValueChange(items[safeIdx]);
  };

  return (
    <View style={wheelStyles.container}>
      <View style={wheelStyles.highlightBar} />
      <ScrollView
        ref={scrollViewRef}
        style={wheelStyles.scroll}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {paddedItems.map((item, idx) => {
          const isSelected = item === selectedValue;
          return (
            <View key={idx} style={wheelStyles.itemBox}>
              <Text style={[wheelStyles.itemText, isSelected && wheelStyles.itemTextSelected]}>
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  container: {
    width: 70,
    height: WHEEL_ITEM_H * 3,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightBar: {
    position: 'absolute',
    height: WHEEL_ITEM_H,
    width: '100%',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#4CAF82',
    backgroundColor: '#F1F9F4',
    zIndex: 1,
  },
  scroll: { width: '100%', zIndex: 2 },
  itemBox: { height: WHEEL_ITEM_H, justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 16, color: '#AAA', fontWeight: '500' },
  itemTextSelected: { fontSize: 21, color: '#2E7D32', fontWeight: '900' },
});

// ── 메인 화면 컴포넌트 ──
export default function MedicationSettingsScreen() {
  const insets = useSafeAreaInsets();
  
  // UI 상태
  const [alarms, setAlarms] = useState<MedicationAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 내 정보(프로필) 연동용 약물 목록
  const [userMedications, setUserMedications] = useState<string[]>([]);
  const [newMedInput, setNewMedInput] = useState('');
  
  // 새 약 추가 폼 상태
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [timesCount, setTimesCount] = useState<1 | 2 | 3>(1);
  const [time1, setTime1] = useState('09:00');
  const [time2, setTime2] = useState('13:00');
  const [time3, setTime3] = useState('19:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['월', '화', '수', '목', '금']);

  // 다이얼 휠 시간 선택기 팝업 상태
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [activeTimeTarget, setActiveTimeTarget] = useState<1 | 2 | 3>(1);
  const [pickerHourStr, setPickerHourStr] = useState('09');
  const [pickerMinStr, setPickerMinStr] = useState('00');

  useEffect(() => {
    loadAlarms();
    loadUserProfile();
  }, []);

  const loadAlarms = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/notifications/medications');
      setAlarms(data);
    } catch (e) {
      console.warn('복약 목록 로딩 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const user = await api.get('/api/auth/me');
      if (user && user.medications) {
        setUserMedications(user.medications);
      }
    } catch (e) {
      console.warn('유저 프로필 로드 에러:', e);
    }
  };

  // 내 약물 목록에 새 약물 직접 추가
  const handleAddUserMedication = async () => {
    if (!newMedInput.trim()) return;
    if (userMedications.includes(newMedInput.trim())) {
      Alert.alert('알림', '이미 등록된 약물입니다.');
      return;
    }
    const nextList = [...userMedications, newMedInput.trim()];
    try {
      await api.put('/api/auth/me', { medications: nextList });
      setUserMedications(nextList);
      setNewMedInput('');
      Alert.alert('성공', '내 약물 목록에 추가되었습니다.');
    } catch (e) {
      Alert.alert('오류', '약물을 추가하지 못했습니다.');
    }
  };

  // 내 약물 목록에서 약물 영구 삭제
  const handleDeleteUserMedication = async (medName: string) => {
    Alert.alert(
      '약물 삭제',
      `"${medName}" 약물을 목록에서 제거하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const nextList = userMedications.filter(m => m !== medName);
            try {
              await api.put('/api/auth/me', { medications: nextList });
              setUserMedications(nextList);
            } catch (e) {
              Alert.alert('오류', '약물 삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  const handleToggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // 다이얼 시간 선택기 모달 오픈
  const openTimePicker = (targetNum: 1 | 2 | 3) => {
    setActiveTimeTarget(targetNum);
    const targetVal = targetNum === 1 ? time1 : targetNum === 2 ? time2 : time3;
    const [h, m] = targetVal.split(':');
    setPickerHourStr(h);
    setPickerMinStr(m);
    setIsTimePickerOpen(true);
  };

  // 시간 다이얼 확인 선택
  const handleConfirmTime = () => {
    const formatted = `${pickerHourStr}:${pickerMinStr}`;
    if (activeTimeTarget === 1) setTime1(formatted);
    else if (activeTimeTarget === 2) setTime2(formatted);
    else setTime3(formatted);
    setIsTimePickerOpen(false);
  };

  // 신규 복약 알림 추가
  const handleAddAlarm = async () => {
    if (!medicineName.trim()) {
      Alert.alert('알림', '의약품 이름을 입력해 주세요.');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('알림', '복용 요일을 하루 이상 선택해 주세요.');
      return;
    }

    const times: string[] = [];
    if (timesCount >= 1) times.push(time1);
    if (timesCount >= 2) times.push(time2);
    if (timesCount >= 3) times.push(time3);

    try {
      // 1. OS 로컬 알람 예약
      const weekdayNums = selectedDays.map(day => WEEKDAYS_MAP[day]);
      const registeredIds: string[] = [];

      for (const time of times) {
        const ids = await scheduleWeeklyMedicationNotification(medicineName, time, weekdayNums);
        registeredIds.push(...ids);
      }

      // 2. 백엔드 서버 저장
      await api.post('/api/notifications/medications', {
        medicineName,
        dosage: dosage || undefined,
        times,
        days: selectedDays,
      });

      // 내 등록 목록에 아직 없는 약물이면 서버 프로필에 자동 추가
      if (!userMedications.includes(medicineName.trim())) {
        const nextList = [...userMedications, medicineName.trim()];
        await api.put('/api/auth/me', { medications: nextList });
        setUserMedications(nextList);
      }

      Alert.alert('성공', '복약 알림이 등록되었습니다.');
      
      setMedicineName('');
      setDosage('');
      setTimesCount(1);
      setTime1('09:00');
      setTime2('13:00');
      setTime3('19:00');
      setSelectedDays(['월', '화', '수', '목', '금']);

      loadAlarms();
    } catch (e: any) {
      Alert.alert('오류', e.message || '복약 정보 저장에 실패했습니다.');
    }
  };

  // 알림 활성 토글
  const handleToggleAlarmActive = async (alarm: MedicationAlarm) => {
    const nextActive = !alarm.active;
    
    setAlarms(prev =>
      prev.map(a => (a.id === alarm.id ? { ...a, active: nextActive } : a))
    );

    try {
      await api.put(`/api/notifications/medications/${alarm.id}`, {
        active: nextActive
      });

      if (!nextActive) {
        if (alarm.notificationIds) {
          for (const notifId of alarm.notificationIds) {
            await cancelNotification(notifId);
          }
        }
      } else {
        const weekdayNums = alarm.days.map(day => WEEKDAYS_MAP[day]);
        for (const time of alarm.times) {
          await scheduleWeeklyMedicationNotification(alarm.medicineName, time, weekdayNums);
        }
      }
    } catch (e) {
      console.warn('상태 변경 실패:', e);
      setAlarms(prev =>
        prev.map(a => (a.id === alarm.id ? { ...a, active: alarm.active } : a))
      );
    }
  };

  const handleDeleteAlarm = (alarm: MedicationAlarm) => {
    Alert.alert(
      '삭제 확인',
      `"${alarm.medicineName}" 알림 설정을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/notifications/medications/${alarm.id}`);
              
              if (alarm.notificationIds) {
                for (const id of alarm.notificationIds) {
                  await cancelNotification(id);
                }
              }

              Alert.alert('성공', '복약 알림이 삭제되었습니다.');
              loadAlarms();
            } catch (e) {
              Alert.alert('오류', '알림을 삭제하지 못했습니다.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ── 헤더 ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💊 복약 알림 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. 내 약물 목록 (가입 시 설정 & 추가/선택/삭제 가능) ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>🏥 내 복약 중인 약물 목록</Text>
          <Text style={styles.cardDesc}>칩을 누르면 하단 폼에 약명이 자동으로 입력됩니다. 우측의 (x)를 누르면 삭제됩니다.</Text>
          
          <View style={styles.userMedicationsContainer}>
            {userMedications.length === 0 ? (
              <Text style={styles.emptyMedText}>아직 등록된 약물이 없습니다. 아래 칸에 약명을 직접 추가하세요.</Text>
            ) : (
              userMedications.map(med => (
                <View key={med} style={styles.medChip}>
                  <TouchableOpacity style={styles.medChipPress} onPress={() => setMedicineName(med)}>
                    <Text style={styles.medChipText}>{med}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.medChipDelete} onPress={() => handleDeleteUserMedication(med)}>
                    <Ionicons name="close" size={14} color="#E53935" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* 직접 약물 등록 */}
          <View style={styles.addUserMedRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="직접 복약 약명 입력 추가"
              placeholderTextColor="#AAA"
              value={newMedInput}
              onChangeText={setNewMedInput}
            />
            <TouchableOpacity style={styles.addUserMedBtn} onPress={handleAddUserMedication}>
              <Text style={styles.addUserMedBtnText}>목록 추가</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. 신규 복약 알림 등록 패널 ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>새로운 복약 일정 알람 추가</Text>

          <Text style={styles.label}>의약품 이름</Text>
          <TextInput
            style={styles.input}
            placeholder="직접 입력하거나 위 내 약물 칩을 터치하세요"
            placeholderTextColor="#AAAAAA"
            value={medicineName}
            onChangeText={setMedicineName}
          />

          <Text style={styles.label}>복용 용량/메모 (선택)</Text>
          <TextInput
            style={styles.input}
            placeholder="예) 1정 복용, 식후 30분"
            placeholderTextColor="#AAAAAA"
            value={dosage}
            onChangeText={setDosage}
          />

          <Text style={styles.label}>하루 복용 횟수</Text>
          <View style={styles.countRow}>
            {([1, 2, 3] as const).map((cnt) => (
              <TouchableOpacity
                key={cnt}
                style={[styles.countBtn, timesCount === cnt && styles.countBtnActive]}
                onPress={() => setTimesCount(cnt)}
              >
                <Text style={[styles.countBtnText, timesCount === cnt && styles.countBtnTextActive]}>
                  하루 {cnt}회
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 시간대 다이얼 선택기 버튼 */}
          <Text style={styles.label}>알림 시간 설정 (터치하여 다이얼 스크롤)</Text>
          <View style={styles.timeInputsContainer}>
            {timesCount >= 1 && (
              <TouchableOpacity style={styles.timeInputBox} onPress={() => openTimePicker(1)}>
                <Text style={styles.timeLabel}>1회차</Text>
                <Text style={styles.timeValText}>{time1}</Text>
              </TouchableOpacity>
            )}
            {timesCount >= 2 && (
              <TouchableOpacity style={styles.timeInputBox} onPress={() => openTimePicker(2)}>
                <Text style={styles.timeLabel}>2회차</Text>
                <Text style={styles.timeValText}>{time2}</Text>
              </TouchableOpacity>
            )}
            {timesCount >= 3 && (
              <TouchableOpacity style={styles.timeInputBox} onPress={() => openTimePicker(3)}>
                <Text style={styles.timeLabel}>3회차</Text>
                <Text style={styles.timeValText}>{time3}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 요일 체크 박스 */}
          <Text style={styles.label}>복용 요일 선택</Text>
          <View style={styles.daysRow}>
            {WEEKDAYS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => handleToggleDay(day)}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddAlarm} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>복약 알림 스케줄 등록</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. 등록된 복약 알림 목록 패널 ── */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>현재 알림이 설정된 복약 목록</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#4CAF82" style={{ marginTop: 20 }} />
          ) : alarms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={32} color="#CCC" />
              <Text style={{ color: '#888', fontSize: 13, marginTop: 8 }}>설정된 알람 일정이 없습니다.</Text>
            </View>
          ) : (
            alarms.map((alarm) => (
              <View key={alarm.id} style={[styles.alarmCard, !alarm.active && styles.alarmCardInactive]}>
                <View style={styles.alarmHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alarmName}>{alarm.medicineName}</Text>
                    {alarm.dosage ? <Text style={styles.alarmDosage}>{alarm.dosage}</Text> : null}
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteAlarm(alarm)}>
                    <Ionicons name="trash-outline" size={18} color="#E53935" />
                  </TouchableOpacity>
                </View>

                <View style={styles.alarmFooter}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alarmDetail}>
                      🗓️ {alarm.days.join(', ')} | ⏰ {alarm.times.join(', ')}
                    </Text>
                  </View>
                  <Switch
                    value={alarm.active}
                    onValueChange={() => handleToggleAlarmActive(alarm)}
                    trackColor={{ false: '#DDD', true: '#A5D6A7' }}
                    thumbColor={alarm.active ? '#4CAF82' : '#F5F5F5'}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── ⏱️ 드래그 스크롤 다이얼 시간 선택기 모달 ── */}
      <Modal visible={isTimePickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContainer}>
            <Text style={styles.pickerTitle}>{activeTimeTarget}회차 복용 시간 선택</Text>
            <Text style={styles.pickerSubDesc}>위아래로 터치해서 쓸어 올려 시간을 맞춰보세요.</Text>
            
            <View style={styles.pickerWheelsRow}>
              {/* 시(Hour) 다이얼 */}
              <View style={styles.pickerWheelCol}>
                <ScrollWheel
                  items={HOURS}
                  selectedValue={pickerHourStr}
                  onValueChange={setPickerHourStr}
                />
                <Text style={styles.pickerUnit}>시</Text>
              </View>

              <Text style={styles.pickerSeparator}>:</Text>

              {/* 분(Minute) 다이얼 */}
              <View style={styles.pickerWheelCol}>
                <ScrollWheel
                  items={MINUTES}
                  selectedValue={pickerMinStr}
                  onValueChange={setPickerMinStr}
                />
                <Text style={styles.pickerUnit}>분</Text>
              </View>
            </View>

            <View style={styles.pickerActions}>
              <TouchableOpacity style={[styles.pickerBtn, styles.pickerCancelBtn]} onPress={() => setIsTimePickerOpen(false)}>
                <Text style={styles.pickerCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerBtn, styles.pickerConfirmBtn]} onPress={handleConfirmTime}>
                <Text style={styles.pickerConfirmText}>설정 완료</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  scroll: { flex: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 20,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4CAF82',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 11,
    color: '#888',
    lineHeight: 16,
    marginBottom: 14,
  },
  userMedicationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  emptyMedText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  medChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
  },
  medChipPress: {
    marginRight: 6,
  },
  medChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  medChipDelete: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(229,57,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addUserMedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addUserMedBtn: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF82',
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addUserMedBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E7D32',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  countRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  countBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  countBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF82',
  },
  countBtnText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  countBtnTextActive: {
    color: '#2E7D32',
    fontWeight: '800',
  },
  timeInputsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  timeInputBox: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 12,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
    fontWeight: '700',
  },
  timeValText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4CAF82',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: '#4CAF82',
    borderColor: '#4CAF82',
  },
  dayChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  addBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  listSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  alarmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 16,
    marginBottom: 12,
  },
  alarmCardInactive: {
    opacity: 0.6,
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 10,
    marginBottom: 10,
  },
  alarmName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },
  alarmDosage: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 4,
  },
  alarmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alarmDetail: {
    fontSize: 12,
    color: '#4CAF82',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalContainer: {
    width: 290,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  pickerSubDesc: {
    fontSize: 11,
    color: '#888',
    marginBottom: 20,
  },
  pickerWheelsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    marginBottom: 24,
    height: WHEEL_ITEM_H * 3 + 10,
  },
  pickerWheelCol: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  pickerSeparator: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4CAF82',
    marginHorizontal: 4,
  },
  pickerUnit: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4CAF82',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  pickerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  pickerCancelBtn: {
    backgroundColor: '#F5F5F5',
  },
  pickerCancelText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
  },
  pickerConfirmBtn: {
    backgroundColor: '#4CAF82',
  },
  pickerConfirmText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
