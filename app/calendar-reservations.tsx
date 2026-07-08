import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  scheduleHospitalVisitNotification,
  cancelNotification
} from '../utils/notificationHelper';

interface HospitalReservation {
  id: string;
  hospitalName: string;
  deptName: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
  memo?: string;
  notificationIds?: string[];
}

const RESERVATION_STORAGE_KEY = 'hospital_reservations';

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
export default function CalendarReservationsScreen() {
  const insets = useSafeAreaInsets();
  
  // 현재 달력 기준 날짜
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState('');
  
  // 예약 목록 및 입력 상태
  const [reservations, setReservations] = useState<HospitalReservation[]>([]);
  const [hospitalName, setHospitalName] = useState('');
  const [deptName, setDeptName] = useState('');
  const [timeStr, setTimeStr] = useState('14:30');
  const [memo, setMemo] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // 다이얼 휠 시간 선택기 팝업 상태
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [pickerHourStr, setPickerHourStr] = useState('14');
  const [pickerMinStr, setPickerMinStr] = useState('30');

  useEffect(() => {
    const today = new Date();
    setSelectedDateStr(formatDate(today));
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const raw = await AsyncStorage.getItem(RESERVATION_STORAGE_KEY);
      if (raw) {
        setReservations(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('예약 목록 로드 오류:', e);
    }
  };

  const saveReservations = async (list: HospitalReservation[]) => {
    try {
      await AsyncStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(list));
      setReservations(list);
    } catch (e) {
      console.warn('예약 목록 저장 오류:', e);
    }
  };

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // ── 커스텀 월간 캘린더 행렬 계산 ──
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const daysArray: (Date | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      daysArray.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      daysArray.push(new Date(year, month, d));
    }

    return daysArray;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleConfirmTime = () => {
    const formatted = `${pickerHourStr}:${pickerMinStr}`;
    setTimeStr(formatted);
    setIsTimePickerOpen(false);
  };

  // 신규 예약 및 OS 로컬 2중 알람 스케줄 등록
  const handleAddReservation = async () => {
    if (!hospitalName.trim()) {
      Alert.alert('알림', '병원 이름을 입력해 주세요.');
      return;
    }
    if (!deptName.trim()) {
      Alert.alert('알림', '진료과 이름을 입력해 주세요.');
      return;
    }

    try {
      const [year, month, day] = selectedDateStr.split('-').map(Number);
      const [hour, minute] = timeStr.split(':').map(Number);
      const visitDateTime = new Date(year, month - 1, day, hour, minute);

      // 1. 기기 OS 2중 로컬 푸시 알람 예약
      const notifIds = await scheduleHospitalVisitNotification(hospitalName, deptName, visitDateTime);

      // 2. 로컬 스토리지에 예약 저장
      const newReservation: HospitalReservation = {
        id: Math.random().toString(),
        hospitalName,
        deptName,
        dateStr: selectedDateStr,
        timeStr,
        memo: memo || undefined,
        notificationIds: notifIds
      };

      const updated = [...reservations, newReservation];
      await saveReservations(updated);

      Alert.alert('예약 완료', '진료 일정이 등록되었습니다. 전날 저녁 및 당일 2시간 전에 로컬 푸시 알림이 발송됩니다.');
      
      setHospitalName('');
      setDeptName('');
      setTimeStr('14:30');
      setMemo('');
      setShowAddForm(false);
    } catch (e) {
      Alert.alert('오류', '예약 일정을 등록하지 못했습니다.');
    }
  };

  // 예약 삭제 및 OS 알람 제거
  const handleDeleteReservation = (id: string) => {
    const item = reservations.find(r => r.id === id);
    if (!item) return;

    Alert.alert(
      '예약 삭제',
      `"${item.hospitalName}" 진료 예약을 삭제하시겠습니까? 관련 알림 예약도 함께 취소됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              if (item.notificationIds) {
                for (const notifId of item.notificationIds) {
                  await cancelNotification(notifId);
                }
              }

              const filtered = reservations.filter(r => r.id !== id);
              await saveReservations(filtered);
              Alert.alert('삭제 완료', '진료 예약 일정이 정상 삭제되었습니다.');
            } catch (e) {
              Alert.alert('오류', '예약을 삭제하는 중 문제가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const calendarDays = getCalendarDays();
  const selectedDateReservations = reservations.filter(r => r.dateStr === selectedDateStr);

  return (
    <View style={styles.container}>
      {/* ── 헤더 ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📅 진료/처방 예약 캘린더</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. 달력 헤더 및 본체 ── */}
        <View style={styles.calendarCard}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={20} color="#4CAF82" />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </Text>
            <TouchableOpacity onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={20} color="#4CAF82" />
            </TouchableOpacity>
          </View>

          {/* 요일 라벨 */}
          <View style={styles.weeksRow}>
            {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
              <Text key={w} style={[styles.weekLabel, idx === 0 && { color: '#E53935' }, idx === 6 && { color: '#1E88E5' }]}>
                {w}
              </Text>
            ))}
          </View>

          {/* 날짜 그리드 */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.dayBox} />;
              }

              const dateStr = formatDate(day);
              const isSelected = dateStr === selectedDateStr;
              const isToday = formatDate(new Date()) === dateStr;
              const hasEvents = reservations.some(r => r.dateStr === dateStr);

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.dayBox, isSelected && styles.dayBoxSelected]}
                  onPress={() => {
                    setSelectedDateStr(dateStr);
                    setShowAddForm(false);
                  }}
                >
                  <Text style={[
                    styles.dayText,
                    isToday && styles.dayTextToday,
                    isSelected && styles.dayTextSelected,
                    day.getDay() === 0 && !isSelected && { color: '#E53935' },
                    day.getDay() === 6 && !isSelected && { color: '#1E88E5' }
                  ]}>
                    {day.getDate()}
                  </Text>
                  
                  {/* 이벤트 표시 도트 */}
                  {hasEvents && <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 2. 선택된 날짜의 예약 리스트 & 입력 폼 ── */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsDateText}>📍 {selectedDateStr} 진료 예약</Text>
            {!showAddForm && (
              <TouchableOpacity style={styles.formToggleBtn} onPress={() => setShowAddForm(true)}>
                <Text style={styles.formToggleBtnText}>+ 예약 추가</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 예약 등록 폼 */}
          {showAddForm ? (
            <View style={styles.addForm}>
              <Text style={styles.label}>예약 병원</Text>
              <TextInput
                style={styles.input}
                placeholder="예) 서울성모이비인후과"
                placeholderTextColor="#AAAAAA"
                value={hospitalName}
                onChangeText={setHospitalName}
              />

              <Text style={styles.label}>진료과</Text>
              <TextInput
                style={styles.input}
                placeholder="예) 이비인후과, 내과"
                placeholderTextColor="#AAAAAA"
                value={deptName}
                onChangeText={setDeptName}
              />

              <Text style={styles.label}>예약 시간 (터치하여 다이얼 스크롤)</Text>
              <TouchableOpacity
                style={styles.timeInputBox}
                onPress={() => {
                  const [h, m] = timeStr.split(':');
                  setPickerHourStr(h);
                  setPickerMinStr(m);
                  setIsTimePickerOpen(true);
                }}
              >
                <Text style={styles.timeValText}>{timeStr}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>방문 메모 (선택)</Text>
              <TextInput
                style={styles.input}
                placeholder="예) 비대면 수납 완료, 3번 창구 방문"
                placeholderTextColor="#AAAAAA"
                value={memo}
                onChangeText={setMemo}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity style={[styles.formBtn, styles.formBtnCancel]} onPress={() => setShowAddForm(false)}>
                  <Text style={styles.formBtnCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.formBtn, styles.formBtnAdd]} onPress={handleAddReservation}>
                  <Text style={styles.formBtnAddText}>등록 완료</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // 예약 목록 출력
            <View style={styles.listContainer}>
              {selectedDateReservations.length === 0 ? (
                <Text style={styles.emptyText}>이 날짜에 예정된 병원 진료 일정이 없습니다.</Text>
              ) : (
                selectedDateReservations.map((res) => (
                  <View key={res.id} style={styles.reservationCard}>
                    <View style={styles.resHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resName}>{res.hospitalName}</Text>
                        <Text style={styles.resDept}>{res.deptName} | ⏰ {res.timeStr}</Text>
                      </View>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteReservation(res.id)}>
                        <Ionicons name="close-circle-outline" size={20} color="#E53935" />
                      </TouchableOpacity>
                    </View>
                    {res.memo ? (
                      <View style={styles.resMemoBox}>
                        <Text style={styles.resMemoText}>📝 {res.memo}</Text>
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── ⏱️ 드래그 스크롤 다이얼 시간 선택기 모달 ── */}
      <Modal visible={isTimePickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContainer}>
            <Text style={styles.pickerTitle}>진료 예약 시간 선택</Text>
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
  calendarCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 20,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
  },
  weeksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekLabel: {
    width: '13%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  dayBox: {
    width: '13%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    position: 'relative',
  },
  dayBoxSelected: {
    backgroundColor: '#4CAF82',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  dayTextToday: {
    color: '#4CAF82',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF82',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF82',
  },
  eventDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 12,
    marginBottom: 16,
  },
  detailsDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },
  formToggleBtn: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  formToggleBtnText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '800',
  },
  addForm: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1A1A1A',
  },
  timeInputBox: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4CAF82',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  formBtnCancel: {
    backgroundColor: '#F5F5F5',
  },
  formBtnCancelText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
  },
  formBtnAdd: {
    backgroundColor: '#4CAF82',
  },
  formBtnAddText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContainer: {
    gap: 12,
  },
  emptyText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  reservationCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 14,
  },
  resHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  resDept: {
    fontSize: 11,
    color: '#4CAF82',
    fontWeight: '700',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  resMemoBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  resMemoText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 15,
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
