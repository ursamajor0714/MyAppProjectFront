import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { HOSPITALS, Hospital, Doctor } from '../constants/hospitalData';


const { height: SCREEN_H } = Dimensions.get('window');

type ClinicStep = 'hospital' | 'doctor' | 'waiting';

export default function TelemedicineScreen() {
  const insets = useSafeAreaInsets();
  const { hospitalId, reportId, fromResult } = useLocalSearchParams<{ hospitalId?: string; reportId?: string; fromResult?: string }>();
  const [step, setStep] = useState<ClinicStep>('hospital'); // 기본값 hospital로 시작하여 일반 진입 시 병원 목록이 먼저 뜨게 함

  
  // 카메라 권한 훅
  const [permission, requestPermission] = useCameraPermissions();
  
  // 상태 변수
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [waitingNumber, setWaitingNumber] = useState(3);
  const [waitingTime, setWaitingTime] = useState(8);

  // 비대면 가능한 병원 필터링 (가까운 병원 3~4개 구성)
  const telemedicineHospitals = HOSPITALS.filter(h => h.id <= 4);

  // 의료법 준수: 특정 추천병원 자동지정(알선) 금지에 따라, 모든 진입 경로에서 환자가 병원을 직접 선택할 수 있도록 병원 선택 단계('hospital')가 무조건 첫 화면으로 뜹니다.
  useEffect(() => {
    setSelectedHospital(null);
    setStep('hospital');
  }, [hospitalId, reportId, fromResult]);

  // 카메라 권한 요청
  useEffect(() => {
    (async () => {
      if (permission && !permission.granted && permission.canAskAgain) {
        await requestPermission();
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission]);

  // 대기 시간 줄어드는 타이머 시뮬레이션
  useEffect(() => {
    let timer: any;
    if (step === 'waiting') {
      timer = setInterval(() => {
        setWaitingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            Alert.alert('진료 시작', '의사 선생님이 진료실에 입장하셨습니다. 화면을 확인해 주세요!', [
              { text: '확인', onPress: () => {} }
            ]);
            return 0;
          }
          return prev - 1;
        });
        setWaitingNumber((prev) => (prev > 1 ? prev - 1 : 1));
      }, 5000); // 5초마다 대기순번 감소 시뮬레이션
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleHospitalSelect = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setStep('doctor');
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setWaitingNumber(Math.floor(Math.random() * 4) + 2); // 2~5명 무작위 대기순번
    setWaitingTime(Math.floor(Math.random() * 5) + 6); // 6~10분 무작위 대기시간
    setStep('waiting');
  };

  const handleCancelWaiting = () => {
    Alert.alert(
      '진료 취소',
      '비대면 진료 신청을 취소하시겠습니까?',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예',
          style: 'destructive',
          onPress: () => {
            setStep('doctor');
            setSelectedDoctor(null);
          },
        },
      ]
    );
  };

  const handleGoBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      {/* ── 상단 절반: 비디오 카메라 화면 ── */}
      <View style={styles.cameraSection}>
        {permission?.granted ? (
          <>
            <CameraView style={styles.camera} facing="front" />
            <View style={[styles.cameraOverlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.cameraUserLabel}>환자 화면 (전면 카메라)</Text>
            </View>
          </>
        ) : (
          <View style={[styles.camera, styles.cameraPlaceholder]}>
            <Ionicons name="videocam-off" size={48} color="#94A3B8" />
            <Text style={styles.cameraPlaceholderText}>
              카메라 화면을 준비 중이거나 권한이 없습니다.
            </Text>
            {!permission?.granted && permission?.canAskAgain && (
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={requestPermission}
              >
                <Text style={styles.permissionBtnText}>카메라 권한 승인하기</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* 헤더 백버튼 오버레이 */}
        <TouchableOpacity
          onPress={handleGoBackSafe}
          style={[styles.headerBackBtn, { top: insets.top > 0 ? insets.top : 16 }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* ── 하단 절반: 정보 및 컨트롤 패널 ── */}
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

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {telemedicineHospitals.map((hospital) => (
                <TouchableOpacity
                  key={hospital.id}
                  style={styles.hospitalCard}
                  onPress={() => handleHospitalSelect(hospital)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.hospitalBadge}>
                      <Text style={styles.hospitalBadgeText}>{hospital.dept}</Text>
                    </View>
                    <Text style={styles.distanceText}>{hospital.distance}</Text>
                  </View>
                  <Text style={styles.hospitalName}>{hospital.name}</Text>
                  <Text style={styles.hospitalIntro} numberOfLines={1}>
                    {hospital.intro}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{hospital.rating}</Text>
                    </View>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: hospital.open ? '#10B981' : '#EF4444' }]} />
                      <Text style={styles.statusText}>{hospital.open ? '진료중' : '진료종료'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {step === 'doctor' && selectedHospital && (
          <View style={styles.panelContainer}>
            <View style={styles.panelHeaderWithBack}>
              <TouchableOpacity 
                onPress={() => setStep('hospital')} 
                style={styles.panelBackBtn}
              >
                <Ionicons name="arrow-back" size={20} color="#64748B" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.panelTitle} numberOfLines={1}>{selectedHospital.name}</Text>
                <Text style={styles.panelSub}>진료받으실 전담 의사를 선택해 주세요.</Text>
              </View>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedHospital.doctors.map((doctor, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.doctorCard}
                  onPress={() => handleDoctorSelect(doctor)}
                  activeOpacity={0.8}
                >
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorAvatarEmoji}>👨‍⚕️</Text>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.name} 전문의</Text>
                    <Text style={styles.doctorRole}>{doctor.role}</Text>
                    <Text style={styles.doctorIntro} numberOfLines={1}>{doctor.intro}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {step === 'waiting' && selectedHospital && selectedDoctor && (
          <View style={styles.waitingContainer}>
            {/* 똥글똥글 도는 이모티콘 및 로딩 */}
            <View style={styles.waitingStatusArea}>
              <View style={styles.loadingSpinnerContainer}>
                <ActivityIndicator size="large" color="#6366F1" style={styles.nativeSpinner} />
                <View style={styles.spinnerEmojiContainer}>
                  <Text style={styles.spinningEmoji}>🩺</Text>
                </View>
              </View>
              
              <Text style={styles.waitingTitle}>진료 대기 중</Text>
              <Text style={styles.waitingSub}>
                {selectedHospital.name} 의 {selectedDoctor.name} 의사 선생님의 진료를 대기 중입니다.
              </Text>
            </View>

            {/* 대기 정보 보드 */}
            <View style={styles.waitingBoard}>
              <View style={styles.boardItem}>
                <Text style={styles.boardLabel}>내 대기 번호</Text>
                <Text style={styles.boardValue}>{waitingNumber}명</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.boardItem}>
                <Text style={styles.boardLabel}>예상 대기 시간</Text>
                <Text style={styles.boardValue}>{waitingTime}분</Text>
              </View>
            </View>

            <View style={styles.infoAlert}>
              <Ionicons name="information-circle-outline" size={18} color="#4F46E5" />
              <Text style={styles.infoAlertText}>
                차례가 되면 카메라 화면에 화상 진료 화면이 연결됩니다. 화면을 종료하지 마시고 대기해 주세요.
              </Text>
            </View>

            {/* 대기 취소 버튼 */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancelWaiting}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>진료 취소하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // 다크 테마 기반의 고급스러운 색상
  },
  cameraSection: {
    height: SCREEN_H * 0.46,
    position: 'relative',
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  cameraUserLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cameraPlaceholderText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  permissionBtn: {
    marginTop: 16,
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  headerBackBtn: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  controlSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  panelContainer: {
    flex: 1,
    paddingTop: 24,
  },
  panelHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  panelHeaderWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  panelSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  hospitalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hospitalBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hospitalBadgeText: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '800',
  },
  distanceText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  hospitalIntro: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAvatarEmoji: {
    fontSize: 22,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  doctorRole: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 4,
  },
  doctorIntro: {
    fontSize: 11,
    color: '#64748B',
  },
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  waitingStatusArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingSpinnerContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  nativeSpinner: {
    transform: [{ scale: 1.8 }],
  },
  spinnerEmojiContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  spinningEmoji: {
    fontSize: 20,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  waitingSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  waitingBoard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 16,
    width: '100%',
    marginBottom: 20,
  },
  boardItem: {
    flex: 1,
    alignItems: 'center',
  },
  boardLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  boardValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#4F46E5',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  infoAlert: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  infoAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#4F46E5',
    lineHeight: 16,
    fontWeight: '500',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
});
