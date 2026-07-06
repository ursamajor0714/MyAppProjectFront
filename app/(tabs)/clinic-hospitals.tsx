import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useSymptomStore } from '../../store/symptomData';
import { api } from '../../services/api';
import { HOSPITALS, DEPARTMENTS, Hospital } from '../../constants/hospitalData';
import { styles } from '../../styles/clinic-hospitals.styles';

const PAGE_SIZE = 6;

export default function HospitalListScreen() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  
  const { fromDiagnosis, reportId } = useLocalSearchParams<{ fromDiagnosis: string; reportId: string }>();
  const [linkedReport, setLinkedReport] = useState<any>(null);

  // 예약 관련 상태
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  const setModalOpen = useNotificationStore((state) => state.setModalOpen);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (fromDiagnosis === 'true' && reportId) {
      const record = useSymptomStore.getState().history.find((r) => r.id === reportId);
      if (record) {
        setLinkedReport(record);
        
        // Mapping all symptoms & inferred causes to medical departments exactly matching DEPARTMENTS labels
        let recommendedDept = '내과';
        const inferred = record.inferredCause || '';
        
        // 1. 외과 (Surgery)
        if (
          inferred.includes('충수염') || 
          inferred.includes('맹장염') || 
          inferred.includes('탈장') || 
          inferred.includes('종양') || 
          inferred.includes('종기') || 
          inferred.includes('낭종') || 
          inferred.includes('지방종') ||
          inferred.includes('유방') ||
          inferred.includes('고름') ||
          inferred.includes('상처') ||
          inferred.includes('외상') ||
          inferred.includes('찰과상')
        ) {
          recommendedDept = '외과';
        }
        // 2. 정형외과 (Ortho)
        else if (
          inferred.includes('근골격계') || 
          inferred.includes('뼈') || 
          inferred.includes('관절') || 
          inferred.includes('늑골') || 
          inferred.includes('건초염') || 
          inferred.includes('근육') ||
          inferred.includes('골격') ||
          inferred.includes('디스크') ||
          inferred.includes('기립')
        ) {
          recommendedDept = '정형외과';
        }
        // 3. 피부과 (Derma)
        else if (
          inferred.includes('피부') || 
          inferred.includes('아토피') || 
          inferred.includes('습진') || 
          inferred.includes('알레르기') || 
          inferred.includes('진물')
        ) {
          recommendedDept = '피부과';
        }
        // 4. 이비인후과 (ENT)
        else if (
          inferred.includes('인두염') || 
          inferred.includes('후두염') || 
          inferred.includes('목') || 
          inferred.includes('코') || 
          inferred.includes('귀') ||
          inferred.includes('이비인후')
        ) {
          recommendedDept = '이비인후과';
        }
        // 5. 정신건강의학과 (Psych)
        else if (
          inferred.includes('정신') || 
          inferred.includes('우울') || 
          inferred.includes('불안') ||
          inferred.includes('뇌신경') ||
          inferred.includes('뇌졸중')
        ) {
          recommendedDept = '정신건강의학과';
        }
        // 6. 안과 (Eye)
        else if (
          inferred.includes('안구') || 
          inferred.includes('눈') || 
          inferred.includes('안과')
        ) {
          recommendedDept = '안과';
        }
        
        setSearchText(recommendedDept);
        
        Alert.alert(
          '🩺 자가진단 결과 연동',
          `자가진단 결과지(${record.partLabel} - ${record.inferredCause})에 최적화된 [${recommendedDept}] 병원을 필터링했습니다.`
        );
      }
    }
  }, [fromDiagnosis, reportId]);

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayName = dayNames[d.getDay()];
      dates.push({
        formatted: `${yyyy}-${mm}-${dd}`,
        label: `${d.getMonth() + 1}/${d.getDate()} (${dayName})`,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return dates;
  };

  const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00', '17:30'
  ];

  const handleConfirmBooking = async () => {
    if (!selectedDoctor) {
      Alert.alert('예약 실패', '진료를 받으실 의사를 선택해주세요.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('예약 실패', '진료를 받으실 날짜를 선택해주세요.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('예약 실패', '진료를 받으실 시간을 선택해주세요.');
      return;
    }

    const userPhone = useAuthStore.getState().user?.phone || '010-1234-5678';
    const symptomDetailsStr = linkedReport 
      ? `[자가진단 연동] 부위: ${linkedReport.partLabel} / 의심원인: ${linkedReport.inferredCause} / 증상: ${linkedReport.symptoms.join(', ')} / 강도: ${linkedReport.intensity} / 예약일시: ${selectedDate} ${selectedTime}`
      : `[일반 예약] 예약일시: ${selectedDate} ${selectedTime}`;

    try {
      // 백엔드 비대면 진료 세션 자동 생성 API 호출
      await api.post('/api/telemedicine/sessions', {
        doctorName: selectedDoctor,
        department: selectedHospital?.dept.split(',')[0].trim() || '내과',
        hospitalName: selectedHospital?.name || '서울의원',
        symptomDetails: symptomDetailsStr
      });

      Alert.alert(
        '예약 완료',
        `예약 및 접수가 완료되었습니다.\n진료 정보는 입력하신 ${userPhone}으로 발송되며, 비대면 진료 준비 시 대기열 알림이 제공됩니다.`,
        [
          {
            text: '확인',
            onPress: () => {
              useNotificationStore.getState().addNotification({
                title: '📅 예약 완료 알림',
                body: `${selectedHospital?.name} (${selectedDoctor} 의사) ${selectedDate} ${selectedTime} 예약이 완료되었습니다.`,
                type: 'booking',
              });
              setIsBookingOpen(false);
              setSelectedHospital(null);
              setSelectedDoctor(null);
              setSelectedDate(null);
              setSelectedTime(null);
              setLinkedReport(null);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Telemedicine booking failed:', error);
      const errMsg = error.response?.data?.error || '비대면 진료 예약 중 오류가 발생했습니다. 이미 진행 중인 진료가 있는지 확인하세요.';
      Alert.alert('예약 실패', errMsg);
    }
  };

  const filtered = HOSPITALS.filter((h) =>
    h.name.includes(searchText) || h.dept.includes(searchText)
  );
  const visibleHospitals = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    if (hasMore) {
      setVisibleCount((prev) => prev + PAGE_SIZE);
    }
  };

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 60;
    if (isCloseToBottom) {
      handleLoadMore();
    }
  };

  return (
    <View style={styles.container}>
      {/* ── 커스텀 헤더 ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.replace('/clinic')}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>진료 가능 병원</Text>
        <TouchableOpacity
          onPress={() => setModalOpen(true)}
          style={{ position: 'relative', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
          {unreadCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: '#E53935',
                borderRadius: 7,
                minWidth: 14,
                height: 14,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: '800' }}>
                {unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── 검색창 ── */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="병원명 또는 진료과 검색"
          placeholderTextColor="#AAAAAA"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* ── 진료과 아이콘 자유 스크롤 ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.deptScrollContent}
        style={styles.deptScroll}
      >
        {DEPARTMENTS.map((dept) => (
          <TouchableOpacity
            key={dept.id}
            style={styles.deptItem}
            onPress={() => setSearchText(dept.label)}
          >
            <View style={styles.deptIconCircle}>
              <Text style={styles.deptIcon}>{dept.icon}</Text>
            </View>
            <Text style={styles.deptLabel}>{dept.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── 병원 카드 그리드 (2열) ── */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.cardGrid}>
          {visibleHospitals.map((hospital) => (
            <TouchableOpacity
              key={hospital.id}
              style={styles.hospitalCard}
              activeOpacity={0.85}
              onPress={() => setSelectedHospital(hospital)}
            >
              {/* 이미지 영역 (더미: 색상 블록 + 이미지 텍스트) */}
              <View style={[styles.cardImage, { backgroundColor: hospital.color }]}>
                <Text style={styles.cardImageText}>이미지</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: hospital.open ? '#FFFFFF' : '#FFFFFF' },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: hospital.open ? '#4CAF50' : '#E53935' },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {hospital.open ? '진료중' : '진료마감'}
                  </Text>
                </View>
              </View>

              {/* 정보 영역 */}
              <View style={styles.cardInfo}>
                <Text style={styles.hospitalName} numberOfLines={1}>
                  {hospital.name}
                </Text>
                <Text style={styles.hospitalDept}>{hospital.dept}</Text>
                <View style={styles.cardBottomRow}>
                  <Text style={styles.hospitalDistance}>📍 {hospital.distance}</Text>
                  <Text style={styles.hospitalRating}>⭐ {hospital.rating}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {hasMore && (
          <TouchableOpacity style={styles.moreBtn} onPress={handleLoadMore}>
            <Text style={styles.moreBtnText}>더 보기 ▾</Text>
          </TouchableOpacity>
        )}

        {!hasMore && (
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>건강체크 헬스케어</Text>
            <Text style={styles.footerText}>
              사업자등록번호 000-00-00000{'\n'}
              대표 홍길동 · 서울특별시 강남구 테헤란로 000{'\n'}
              고객센터 1588-0000 (평일 09:00 ~ 18:00)
            </Text>
            <Text style={styles.footerCopyright}>
              © 2026 HealthCheck Inc. All rights reserved.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── 병원 상세 모달 (안티그래비티 테마 소프트 카드) ── */}
      {selectedHospital && (
        <Modal
          visible={selectedHospital !== null && !isBookingOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedHospital(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* 모달 헤더 */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>병원 상세 정보</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedHospital(null)}
                >
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                {/* 병원 이미지 플레이스홀더 */}
                <View style={[styles.modalImageArea, { backgroundColor: selectedHospital.color }]}>
                  <Text style={styles.modalImageText}>🏥 {selectedHospital.name}</Text>
                  <Text style={styles.modalImageSub}>진료기관 인증 정보</Text>
                </View>

                {/* 기본 정보 */}
                <View style={styles.modalSection}>
                  <View style={styles.modalTitleRow}>
                    <Text style={styles.modalHospitalName}>{selectedHospital.name}</Text>
                    <View style={[styles.modalStatusBadge, { backgroundColor: selectedHospital.open ? '#E8F5E9' : '#FFEBEE' }]}>
                      <Text style={[styles.modalStatusText, { color: selectedHospital.open ? '#2E7D32' : '#C62828' }]}>
                        {selectedHospital.open ? '진료중' : '진료마감'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalDeptText}>진료과목: {selectedHospital.dept}</Text>
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalMetaText}>📍 거리: {selectedHospital.distance}</Text>
                    <Text style={styles.modalMetaText}>⭐ 평점: {selectedHospital.rating} / 5.0</Text>
                  </View>
                  <Text style={styles.modalAddressText}>
                    주소: {selectedHospital.address}
                  </Text>
                  <Text style={styles.modalPhoneText}>
                    전화번호: {selectedHospital.phone}
                  </Text>
                </View>

                {/* 병원 소개 */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>병원 소개</Text>
                  <Text style={styles.modalBodyText}>
                    {selectedHospital.intro}
                  </Text>
                </View>

                {/* 운영 및 시설 정보 */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>운영 및 시설 정보</Text>
                  <Text style={styles.modalBodyText}>⏳ 점심시간: {selectedHospital.lunchTime}</Text>
                  <Text style={styles.modalBodyText}>🚫 휴진일: {selectedHospital.closedDays.join(', ')}</Text>
                  <Text style={styles.modalBodyText}>
                    {selectedHospital.parking ? '🅿️ 주차 가능' : '🅿️ 주차 불가'}
                  </Text>
                  <Text style={styles.modalBodyText}>
                    {selectedHospital.elevator ? '🛗 엘리베이터 있음' : '🛗 엘리베이터 없음'}
                  </Text>
                </View>

                {/* 의료진 및 약력 소개 */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>의료진 소개 ({selectedHospital.doctors.length}명)</Text>
                  {selectedHospital.doctors.map((doctor, dIdx) => (
                    <View key={dIdx} style={styles.doctorItemCard}>
                      <Text style={styles.modalDoctorName}>
                        🩺 {doctor.name} {doctor.role}
                      </Text>
                      <Text style={[styles.modalBodyText, { marginBottom: 6 }]}>
                        {doctor.intro}
                      </Text>
                      <View style={styles.doctorBioList}>
                        {doctor.bio.map((bioLine, bIdx) => (
                          <Text key={bIdx} style={styles.modalBioText}>• {bioLine}</Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* 하단 액션 버튼 */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalReserveBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    // 기본 첫 번째 의사 선택 및 일정 조율창 가동
                    setSelectedDoctor(selectedHospital.doctors[0].name);
                    setIsBookingOpen(true);
                  }}
                >
                  <Text style={styles.modalReserveBtnText}>진료 예약하기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalTelemedicineBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    const hId = selectedHospital?.id;
                    setSelectedHospital(null);
                    if (hId) {
                      router.push({
                        pathname: '/telemedicine',
                        params: { hospitalId: hId.toString() }
                      });
                    } else {
                      router.push('/telemedicine');
                    }
                  }}
                >
                  <Text style={styles.modalTelemedicineBtnText}>비대면 진료받기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── 진료 예약 상세 일정 조율 모달 (캘린더 & 시간) ── */}
      {selectedHospital && isBookingOpen && (
        <Modal
          visible={isBookingOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsBookingOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: '90%' }]}>
              {/* 예약 헤더 */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>🗓️ 진료 예약 설정 ({selectedHospital.name})</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setIsBookingOpen(false)}
                >
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                {/* 1. 의사 선택 */}
                <View style={styles.bookingSection}>
                  <Text style={styles.bookingSectionTitle}>1. 진료 의사 선택</Text>
                  <View style={styles.doctorSelectRow}>
                    {selectedHospital.doctors.map((doc) => (
                      <TouchableOpacity
                        key={doc.name}
                        style={[
                          styles.doctorSelectBtn,
                          selectedDoctor === doc.name && styles.doctorSelectBtnActive
                        ]}
                        onPress={() => setSelectedDoctor(doc.name)}
                      >
                        <Text style={[
                          styles.doctorSelectBtnText,
                          selectedDoctor === doc.name && styles.doctorSelectBtnTextActive
                        ]}>
                          {doc.name} ({doc.role.split('/')[0]})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 2. 날짜 선택 (오늘부터 1개월 뒤까지) */}
                <View style={styles.bookingSection}>
                  <Text style={styles.bookingSectionTitle}>2. 진료 예약 날짜 선택 (1개월 내)</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.calendarScroll}
                  >
                    {getAvailableDates().map((dateItem) => (
                      <TouchableOpacity
                        key={dateItem.formatted}
                        style={[
                          styles.dateCard,
                          selectedDate === dateItem.formatted && styles.dateCardActive,
                          dateItem.isWeekend && styles.dateCardWeekend
                        ]}
                        onPress={() => setSelectedDate(dateItem.formatted)}
                      >
                        <Text style={[
                          styles.dateLabel,
                          selectedDate === dateItem.formatted && styles.dateLabelActive,
                          dateItem.isWeekend && { color: '#E53935' }
                        ]}>
                          {dateItem.label.split(' ')[0]}
                        </Text>
                        <Text style={[
                          styles.dayLabel,
                          selectedDate === dateItem.formatted && styles.dateLabelActive,
                          dateItem.isWeekend && { color: '#E53935' }
                        ]}>
                          {dateItem.label.split(' ')[1]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* 3. 시간 선택 (30분 단위) */}
                <View style={styles.bookingSection}>
                  <Text style={styles.bookingSectionTitle}>3. 진료 시간 선택 (30분 단위)</Text>
                  <View style={styles.timeGrid}>
                    {TIME_SLOTS.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeSlot,
                          selectedTime === time && styles.timeSlotActive
                        ]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <Text style={[
                          styles.timeText,
                          selectedTime === time && styles.timeTextActive
                        ]}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 자가진단 연동 정보 표시 */}
                {linkedReport && (
                  <View style={{
                    backgroundColor: 'rgba(76, 175, 130, 0.08)',
                    borderWidth: 1.5,
                    borderColor: 'rgba(76, 175, 130, 0.25)',
                    borderRadius: 16,
                    padding: 16,
                    marginHorizontal: 16,
                    marginTop: 12,
                    marginBottom: 20,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#4CAF82', marginBottom: 6 }}>
                      🩺 자가진단 분석 결과 연동됨
                    </Text>
                    <Text style={{ fontSize: 12, color: '#333333', lineHeight: 18, fontWeight: '500' }}>
                      • 진단 부위: {linkedReport.partLabel} ({linkedReport.isInternal ? '내부' : '외부'})
                      {'\n'}
                      • 추정 원인: {linkedReport.inferredCause}
                      {'\n'}
                      • 선택 증상: {linkedReport.symptoms.join(', ')} (강도: {linkedReport.intensity}/10)
                    </Text>
                    <Text style={{ fontSize: 10, color: '#888888', marginTop: 8, fontWeight: '500' }}>
                      * 예약 접수 시 해당 자가진단 기록이 담당 의사에게 자동으로 전송됩니다.
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* 하단 최종 완료 버튼 */}
              <View style={styles.bookingActionRow}>
                <TouchableOpacity
                  style={styles.bookingConfirmBtn}
                  activeOpacity={0.85}
                  onPress={handleConfirmBooking}
                >
                  <Text style={styles.bookingConfirmBtnText}>예약 완료하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}


