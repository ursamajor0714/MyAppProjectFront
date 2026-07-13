import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, Camera } from 'expo-camera';
import { HOSPITALS, Hospital, Doctor } from '../constants/hospitalData';
import { api } from '../services/api';

const { height: SCREEN_H } = Dimensions.get('window');

type ClinicStep = 'hospital' | 'doctor' | 'waiting';

export default function TelemedicineScreen() {
  const insets = useSafeAreaInsets();
  const { hospitalId, reportId, fromResult } = useLocalSearchParams<{ hospitalId?: string; reportId?: string; fromResult?: string }>();
  const [step, setStep] = useState<ClinicStep>('hospital');

  // 상태 관리
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [waitingNumber, setWaitingNumber] = useState(3);
  const [waitingTime, setWaitingTime] = useState(8);

  const { user } = useAuthStore();

  // 화상통화 및 디바이스 제어 상태
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // 모달 제어 상태
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [prescriptionMethod, setPrescriptionMethod] = useState<'fax' | 'email'>('fax');
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyFaxNo, setPharmacyFaxNo] = useState('');
  const [pharmacyEmailAddr, setPharmacyEmailAddr] = useState('');
  const [isPrescriptionSending, setIsPrescriptionSending] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // 1. 카메라 권한 자동 팝업
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // 2. 전달받은 hospitalId 세팅 우회
  useEffect(() => {
    if (hospitalId) {
      const hosp = HOSPITALS.find((h) => h.id === Number(hospitalId));
      if (hosp) {
        setSelectedHospital(hosp);
        setStep('doctor');
      }
    }
  }, [hospitalId]);

  // 병원 선택 핸들러
  const handleSelectHospital = (hosp: Hospital) => {
    setSelectedHospital(hosp);
    setStep('doctor');
  };

  // 의사 선택 핸들러
  const handleSelectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setWaitingNumber(Math.floor(Math.random() * 3) + 1);
    setWaitingTime((Math.floor(Math.random() * 3) + 1) * 3);
    setStep('waiting');
  };

  // 대기 취소
  const handleCancelWaiting = () => {
    setStep('hospital');
    setSelectedHospital(null);
    setSelectedDoctor(null);
  };

  // 강제 의사 수락 시뮬레이션 기동
  const handleStartMockCall = () => {
    if (hasPermission === false) {
      Alert.alert('권한 필요', '카메라 권한이 거부된 상태입니다. 설정에서 허용해 주세요.');
    }
    setIsCallActive(true);
  };

  // 음소거 & 비디오 토글
  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);

  // 화상통화 강제 끊기 -> 처방전 모달 유도
  const handleEndCall = () => {
    setIsPrescriptionModalOpen(true);
  };

  // 처방전 발송 완료 핸들러
  const handleSendPrescription = async () => {
    if (!pharmacyName.trim()) {
      Alert.alert('입력 요망', '처방전을 전달받을 약국 이름을 기입해 주세요.');
      return;
    }
    if (prescriptionMethod === 'fax' && !pharmacyFaxNo.trim()) {
      Alert.alert('입력 요망', '약국의 팩스 번호를 기입해 주세요.');
      return;
    }
    if (prescriptionMethod === 'email' && !pharmacyEmailAddr.trim()) {
      Alert.alert('입력 요망', '약국의 이메일 주소를 기입해 주세요.');
      return;
    }

    setIsPrescriptionSending(true);

    // 백엔드 문서 전송 API 모의 호출 우회 (에러 시 무시)
    try {
      if (prescriptionMethod === 'fax') {
        await api.post('/api/documents/send-fax', { faxNumber: pharmacyFaxNo.trim() });
      } else {
        await api.post('/api/documents/send-email', {
          email: pharmacyEmailAddr.trim(),
          subject: '처방전 조제 요청',
          content: `${user?.name || '환자'}님의 처방전 요청입니다.`
        });
      }
    } catch (e) {
      console.warn('Mock document sending failed (proceeding):', e);
    }

    setIsPrescriptionSending(false);
    setIsPrescriptionModalOpen(false);
    
    // 수납 수수료 결제창 띄우기
    setIsPaymentModalOpen(true);
  };

  // 진료비 최종 승인 수납 핸들러
  const handleProcessPayment = async () => {
    setIsPaymentProcessing(true);
    
    // 백엔드 가상 결제 승인내역 저장 API 호출 우회 (에러 우회)
    try {
      await api.post('/api/telemedicine/sessions', {
        doctorName: selectedDoctor?.name || '전문의',
        department: selectedHospital?.dept || '내과',
        hospitalName: selectedHospital?.name || '지정병원',
        status: 'completed',
        symptomDetails: reportId ? `reportId: ${reportId}` : '일반 화상 비대면 진료',
        waitQueueNumber: 1,
        prescriptionSentTo: prescriptionMethod === 'fax' ? `fax: ${pharmacyFaxNo}` : `email: ${pharmacyEmailAddr}`,
        billAmount: 8500,
        paid: true
      });
    } catch (e) {
      console.warn('Mock session creation failed (proceeding):', e);
    }

    setTimeout(() => {
      setIsPaymentProcessing(false);
      setIsPaymentModalOpen(false);
      setIsCallActive(false);
      setStep('hospital');
      setSelectedHospital(null);
      setSelectedDoctor(null);
      
      Alert.alert('결제 및 수납 완료', '비대면 진료 수납이 정상 완료되었습니다. 마이페이지 결제 내역으로 이동합니다.', [
        { text: '확인', onPress: () => router.replace('/(tabs)/profile') }
      ]);
    }, 1500);
  };

  const handleGoBackSafe = () => {
    if (step === 'doctor') {
      setStep('hospital');
      setSelectedHospital(null);
    } else if (step === 'waiting') {
      setStep('doctor');
      setSelectedDoctor(null);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* ── 상단 50% 영역: 화상 카메라 송출 뷰 ── */}
      <View style={styles.videoSection}>
        {isCallActive ? (
          <View style={styles.cameraFrame}>
            {!isVideoOff && hasPermission ? (
              // expo-camera의 CameraView로 환자 본인의 전면 카메라 렌즈 송출
              <CameraView style={StyleSheet.absoluteFillObject} facing="front" />
            ) : (
              <View style={styles.cameraOffScreen}>
                <Ionicons name="videocam-off" size={48} color="#94A3B8" />
                <Text style={styles.cameraOffText}>비디오 화면이 비활성화 상태입니다.</Text>
              </View>
            )}

            {/* 원격 의사 모의 오버레이 프레임 */}
            <View style={styles.remoteDoctorAvatarWrap}>
              <View style={styles.remoteDoctorAvatar}>
                <Text style={{ fontSize: 24 }}>👨‍⚕️</Text>
              </View>
              <Text style={styles.remoteDoctorName}>{selectedDoctor?.name} 의사 (LIVE)</Text>
            </View>

            {/* 통화 헤더 */}
            <View style={styles.callHeaderOverlay}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>비대면 진료중</Text>
              </View>
            </View>

            {/* 하단 통화 제어 패널 */}
            <View style={styles.callControlPanel}>
              <TouchableOpacity style={[styles.controlBtn, isMuted && styles.controlBtnActive]} onPress={toggleMute}>
                <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? '#FFF' : '#333'} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]} onPress={toggleVideo}>
                <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={22} color={isVideoOff ? '#FFF' : '#333'} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.controlBtn, styles.hangUpBtn]} onPress={handleEndCall}>
                <Ionicons name="call" size={22} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="videocam" size={44} color="#64748B" />
            <Text style={styles.cameraPlaceholderText}>
              진료실 입장 시 카메라 화상 통화가 활성화됩니다.
            </Text>
          </View>
        )}

        {!isCallActive && (
          <TouchableOpacity
            onPress={handleGoBackSafe}
            style={[styles.headerBackBtn, { top: insets.top > 0 ? insets.top : 16 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── 하단 50% 영역: 진료 단계별 리스트 ── */}
      {!isCallActive && (
        <View style={styles.controlSection}>
          {step === 'hospital' && (
            <View style={styles.panelContainer}>
              <View style={styles.panelHeaderWithBack}>
                <TouchableOpacity onPress={handleGoBackSafe} style={styles.panelBackBtn}>
                  <Ionicons name="arrow-back" size={20} color="#64748B" />
                </TouchableOpacity>
                <View>
                  <Text style={styles.panelTitle}>비대면 진료 가능한 병원</Text>
                  <Text style={styles.panelSub}>진료받으실 가까운 병원을 선택해 주세요.</Text>
                </View>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 10 }}>
                {HOSPITALS.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    style={styles.hospitalCard}
                    onPress={() => handleSelectHospital(h)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.hospInfo}>
                      <Text style={styles.hospName}>🏥 {h.name}</Text>
                      <Text style={styles.hospDetail}>진료과: {h.dept}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {step === 'doctor' && selectedHospital && (
            <View style={styles.panelContainer}>
              <View style={styles.panelHeaderWithBack}>
                <TouchableOpacity onPress={handleGoBackSafe} style={styles.panelBackBtn}>
                  <Ionicons name="arrow-back" size={20} color="#64748B" />
                </TouchableOpacity>
                <View>
                  <Text style={styles.panelTitle}>{selectedHospital.name} 의사 선택</Text>
                  <Text style={styles.panelSub}>비대면 진료를 진행할 전문의를 선택해 주세요.</Text>
                </View>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 10 }}>
                {selectedHospital.doctors.map((doc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.doctorCard}
                    onPress={() => handleSelectDoctor(doc)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.doctorAvatar}>
                      <Text style={{ fontSize: 20 }}>🩺</Text>
                    </View>
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorNameText}>{doc.name} {doc.role}</Text>
                      <Text style={styles.doctorDetailText}>평점: ⭐ {selectedHospital.rating} | 환자 대기: {waitingNumber}명</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {step === 'waiting' && selectedHospital && selectedDoctor && (
            <View style={styles.waitingContainer}>
              <View style={styles.waitingStatusArea}>
                <View style={styles.loadingSpinnerContainer}>
                  <ActivityIndicator size="large" color="#4CAF82" />
                </View>
                <Text style={styles.waitingTitle}>진료 대기실 입장 완료</Text>
                <Text style={styles.waitingSub}>
                  {selectedHospital.name} 의 {selectedDoctor.name} 의사 선생님이 수락 시 즉시 화상 진료실로 입장합니다.
                </Text>
              </View>

              <View style={styles.waitingBoard}>
                <View style={styles.boardItem}>
                  <Text style={styles.boardLabel}>내 대기 순번</Text>
                  <Text style={styles.boardValue}>{waitingNumber}번째</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.boardItem}>
                  <Text style={styles.boardLabel}>예상 대기 시간</Text>
                  <Text style={styles.boardValue}>{waitingTime}분</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.mockAcceptBtn}
                onPress={handleStartMockCall}
                activeOpacity={0.8}
              >
                <Text style={styles.mockAcceptBtnText}>📞 의사 수락 및 진료실 입장</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancelWaiting}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>진료 예약 신청 취소</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── 💊 처방전 모달 ── */}
      <Modal visible={isPrescriptionModalOpen} transparent animationType="slide">
        <View style={styles.telePrescOverlay}>
          <View style={styles.telePrescContent}>
            <View style={styles.telePrescHeader}>
              <Text style={styles.telePrescTitle}>💊 약국 가상 처방전 발송</Text>
              <TouchableOpacity onPress={() => setIsPrescriptionModalOpen(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.teleLabel}>수신 약국 이름</Text>
              <TextInput
                style={styles.teleInput}
                placeholder="예: 서울희망약국"
                value={pharmacyName}
                onChangeText={setPharmacyName}
              />

              <Text style={styles.teleLabel}>발송 수단 선택</Text>
              <View style={styles.teleMethodGrid}>
                <TouchableOpacity
                  style={[styles.teleMethodBtn, prescriptionMethod === 'fax' && styles.teleMethodBtnActive]}
                  onPress={() => setPrescriptionMethod('fax')}
                >
                  <Text style={[styles.teleMethodBtnText, prescriptionMethod === 'fax' && styles.teleMethodBtnTextActive]}>📠 팩스(FAX) 송출</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.teleMethodBtn, prescriptionMethod === 'email' && styles.teleMethodBtnActive]}
                  onPress={() => setPrescriptionMethod('email')}
                >
                  <Text style={[styles.teleMethodBtnText, prescriptionMethod === 'email' && styles.teleMethodBtnTextActive]}>📧 이메일(Email) 송출</Text>
                </TouchableOpacity>
              </View>

              {prescriptionMethod === 'fax' ? (
                <>
                  <Text style={styles.teleLabel}>약국 팩스 번호</Text>
                  <TextInput
                    style={styles.teleInput}
                    placeholder="예: 02-1234-5678"
                    keyboardType="phone-pad"
                    value={pharmacyFaxNo}
                    onChangeText={setPharmacyFaxNo}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.teleLabel}>약국 이메일 주소</Text>
                  <TextInput
                    style={styles.teleInput}
                    placeholder="example@pharmacy.com"
                    keyboardType="email-address"
                    value={pharmacyEmailAddr}
                    onChangeText={setPharmacyEmailAddr}
                  />
                </>
              )}

              <TouchableOpacity
                style={styles.teleSubmitBtn}
                onPress={handleSendPrescription}
                activeOpacity={0.8}
              >
                {isPrescriptionSending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.teleSubmitBtnText}>처방 서류 즉시 발송하기</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 💳 진료비 후청구 결제 승인 모달 ── */}
      <Modal visible={isPaymentModalOpen} transparent animationType="fade">
        <View style={styles.telePrescOverlay}>
          <View style={styles.telePrescContent}>
            <View style={styles.telePrescHeader}>
              <Text style={styles.telePrescTitle}>💳 진료비 자동 수납 결제</Text>
            </View>

            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <Ionicons name="card-outline" size={48} color="#4CAF82" />
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 10 }}>진료/약제비 합산 금액</Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#4CAF82', marginTop: 6 }}>8,500원</Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 12, textAlign: 'center' }}>
                마이페이지에 사전 등록된 간편 결제 카드로{'\n'}즉시 승인 수납을 처리합니다.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.teleSubmitBtn, { backgroundColor: '#4CAF82', marginTop: 10 }]}
              onPress={handleProcessPayment}
              activeOpacity={0.8}
            >
              {isPaymentProcessing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.teleSubmitBtnText}>💳 승인 결제 완료 및 진료 종료</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  videoSection: {
    height: '50%',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraFrame: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraOffScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  cameraOffText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 10,
  },
  remoteDoctorAvatarWrap: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 20,
  },
  remoteDoctorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A5568',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  remoteDoctorName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  callHeaderOverlay: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 20,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  liveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  callControlPanel: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    zIndex: 20,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  controlBtnActive: {
    backgroundColor: '#EF4444',
  },
  hangUpBtn: {
    backgroundColor: '#EF4444',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  cameraPlaceholderText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  headerBackBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  controlSection: {
    height: '50%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
    elevation: 5,
  },
  panelContainer: {
    flex: 1,
  },
  panelHeaderWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  panelBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  panelSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  hospitalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  hospInfo: {
    flex: 1,
  },
  hospName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  hospDetail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  doctorDetailText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingStatusArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingSpinnerContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  waitingSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 6,
    lineHeight: 16,
  },
  waitingBoard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  boardItem: {
    alignItems: 'center',
  },
  boardLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  boardValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4CAF82',
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  mockAcceptBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  mockAcceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  telePrescOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  telePrescContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  telePrescHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  telePrescTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  teleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 14,
    marginBottom: 6,
  },
  teleMethodGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  teleMethodBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  teleMethodBtnActive: {
    borderColor: '#4CAF82',
    backgroundColor: 'rgba(76, 175, 130, 0.06)',
  },
  teleMethodBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  teleMethodBtnTextActive: {
    color: '#4CAF82',
  },
  teleInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1E293B',
  },
  teleSubmitBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  teleSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
