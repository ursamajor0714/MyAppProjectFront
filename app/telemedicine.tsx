import { useState, useEffect, useRef } from 'react';
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
  Modal,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from '../utils/secureStoreHelper';
import io from 'socket.io-client';
import { HOSPITALS, Hospital, Doctor } from '../constants/hospitalData';
import { api } from '../services/api';
import { API_URL } from '../constants/Api';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  RTCView
} from '../utils/webrtcShim';

const { height: SCREEN_H } = Dimensions.get('window');

type ClinicStep = 'hospital' | 'doctor' | 'waiting';

export default function TelemedicineScreen() {
  if (Platform.OS === ('web' as any)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 }}>🏥 비대면 화상 진료실</Text>
        <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
          비대면 화상 진료 기능은 모바일 앱(Expo Go / Native App) 환경에서만 작동합니다.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#4CAF82', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>이전 화면으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const insets = useSafeAreaInsets();
  const { hospitalId, reportId, fromResult } = useLocalSearchParams<{ hospitalId?: string; reportId?: string; fromResult?: string }>();
  const [step, setStep] = useState<ClinicStep>('hospital');

  // 상태 변수
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [waitingNumber, setWaitingNumber] = useState(3);
  const [waitingTime, setWaitingTime] = useState(8);

  const { user } = useAuthStore();

  // 처방전 약국 발송 관련 상태
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [prescriptionMethod, setPrescriptionMethod] = useState<'fax' | 'email'>('fax');
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyFaxNo, setPharmacyFaxNo] = useState('');
  const [pharmacyEmailAddr, setPharmacyEmailAddr] = useState('');
  const [isPrescriptionSending, setIsPrescriptionSending] = useState(false);

  const handleSendPrescription = async () => {
    if (!pharmacyName.trim()) {
      Alert.alert('입력 요망', '처방전을 전달받을 약국 이름을 정확히 기입해 주세요.');
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

    try {
      if (prescriptionMethod === 'fax') {
        await api.post('/api/documents/send-fax', {
          faxNumber: pharmacyFaxNo.trim(),
        });
        Alert.alert('처방전 송출 성공', `[${pharmacyName}] 약국으로 가상 처방전 팩스(FAX) 전송이 완료되었습니다.`);
      } else {
        await api.post('/api/documents/send-email', {
          email: pharmacyEmailAddr.trim(),
          subject: `[건강체크 케어서비스] 비대면 처방 조제 요청 (${user?.name || '환자'})`,
          content: `안녕하세요, 건강체크 서비스입니다.
비대면 진료가 완료되어 환자(${user?.name || '환자'})님이 요청하신 처방 서류를 송부합니다.

[진료 상세 및 약국 제출용]
- 환자 이름: ${user?.name || '환자'}
- 담당 전문의: ${selectedDoctor?.name || '전문의'}
- 진료 병원: ${selectedHospital?.name || '지정병원'}
- 수신 약국: ${pharmacyName}

환자가 귀 약국에 방문 예정이오니, 처방 조제 가능 여부를 사전에 검토 및 회신 부탁드립니다.
감사합니다.`,
        });
        Alert.alert('처방전 송출 성공', `[${pharmacyName}] 약국으로 가상 처방전 이메일(Email) 전송이 완료되었습니다.`);
      }

      // 모달 닫기 및 초기화 후 메인 이동
      setIsPrescriptionModalOpen(false);
      cleanupMediaAndSocket();
      setStep('hospital');
      setSelectedDoctor(null);
      setSelectedHospital(null);
    } catch (e: any) {
      Alert.alert('송신 실패', e.message || '처방전 발송 도중 오류가 발생했습니다.');
    } finally {
      setIsPrescriptionSending(false);
    }
  };

  // WebRTC 및 실시간 소켓 상태
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const socketRef = useRef<any>(null);
  const peerConnectionRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const sessionIdRef = useRef<number | null>(null);
  const localVideoRef = useRef<any>(null);
  const remoteVideoRef = useRef<any>(null);

  // 비대면 가능한 병원 필터링 (가까운 병원 3~4개 구성)
  const telemedicineHospitals = HOSPITALS.filter(h => h.id <= 4);

  // 의료법 준수: 특정 추천병원 자동지정(알선) 금지에 따라, 환자가 병원을 직접 선택할 수 있도록 첫 화면으로 고정
  useEffect(() => {
    setSelectedHospital(null);
    setStep('hospital');
    return () => {
      cleanupMediaAndSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId, reportId, fromResult]);

  // Web 브라우저 환경에서 스트림을 비디오 돔 요소에 바인딩
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [localStream, remoteStream, isCallActive]);

  // 대기 중일 때 대기열 가상 타이머 (소켓 연결 실패 시의 폴백 보조용)
  useEffect(() => {
    let timer: any;
    if (step === 'waiting' && !isCallActive) {
      timer = setInterval(() => {
        setWaitingTime((prev) => (prev > 1 ? prev - 1 : 1));
        setWaitingNumber((prev) => (prev > 1 ? prev - 1 : 1));
      }, 10000);
    }
    return () => clearInterval(timer);
  }, [step, isCallActive]);

  // 로컬 미디어 (카메라 & 마이크) 스트림 시작 - 실패해도 진료 접수는 계속 진행
  const startLocalStream = async (): Promise<any | null> => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: 480,
          height: 360
        }
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      // 카메라/마이크 없어도 텍스트 기반 진료(시그널링)는 계속 진행
      console.warn('⚠️ 로컬 카메라/마이크 캡처 실패 (미디어 없이 계속 진행):', error);
      return null;
    }
  };

  // WebRTC 피어 연결 생성 및 이벤트 바인딩
  const setupPeerConnection = async (stream: any) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    // 로컬 스트림 트랙 추가
    if (stream) {
      if (Platform.OS === 'web') {
        stream.getTracks().forEach((track: any) => {
          pc.addTrack(track, stream);
        });
      } else {
        pc.addStream(stream);
      }
    }

    // ICE Candidate 시그널링 전송
    pc.onicecandidate = (event: any) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          sessionId: sessionIdRef.current
        });
      }
    };

    // 리모트 스트림 수신 이벤트 바인딩
    if (Platform.OS === 'web') {
      pc.ontrack = (event: any) => {
        const rStream = event.streams[0];
        setRemoteStream(rStream);
      };
    } else {
      pc.onaddstream = (event: any) => {
        setRemoteStream(event.stream);
      };
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  // WebRTC 통화 생성 (Offer 생성 및 전송)
  const createAndSendOffer = async (pc: any) => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socketRef.current.emit('webrtc-offer', {
        offer,
        sessionId: sessionIdRef.current
      });
      console.log('WebRTC Offer 전송 성공');
    } catch (e) {
      console.error('Offer 생성 실패:', e);
    }
  };

  // 비대면 진료 접수 및 실시간 소켓/WebRTC 수립 시작
  const startClinicSession = async (doctor: Doctor) => {
    if (!selectedHospital) return;

    // [iOS/모바일 브라우저 대응] 사용자 클릭 이벤트 내부에서 미리 카메라/마이크 권한을 획득합니다.
    // 실패해도 오디오/비디오 없이 시그널링 진료 진행 (카메라/마이크 없는 환경 지원)
    const preStream = await startLocalStream();
    // 스트림 실패해도 진료 접수는 계속 진행 (preStream이 null일 수 있음)

    try {
      // 1. 백엔드 DB 세션 접수 생성
      const session = await api.post('/api/telemedicine/sessions', {
        doctorName: doctor.name,
        department: selectedHospital.dept,
        hospitalName: selectedHospital.name,
        symptomDetails: '비대면 종합 원격 화상 진료 접수'
      });

      setSessionId(session.id);
      sessionIdRef.current = session.id;
      setWaitingNumber(session.waitQueueNumber || 1);
      setWaitingTime((session.waitQueueNumber || 1) * 3);
      setStep('waiting');

      // 2. 소켓 연결
      const token = await SecureStore.getItemAsync('auth_token');
      const socket = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1500,
        timeout: 10000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('시그널링 소켓 연결 완료. 룸 조인 시도.');
        socket.emit('join-clinic', { sessionId: session.id });
      });

      // 의사 접속 완료 -> WebRTC 셋업 (스트림 없어도 PeerConnection 생성)
      socket.on('clinic-ready', async () => {
        console.log('의사 입장 감지 ➡️ WebRTC 연결 개시');
        const stream = localStreamRef.current || await startLocalStream();
        // 스트림이 없어도(null) PeerConnection은 생성하여 시그널링 진행
        const pc = await setupPeerConnection(stream);
        await createAndSendOffer(pc);
      });

      // 의사로부터의 Offer 처리
      socket.on('webrtc-offer', async ({ offer }: any) => {
        console.log('의사로부터 Offer 수신');
        let pc = peerConnectionRef.current;
        if (!pc) {
          const stream = localStreamRef.current || await startLocalStream();
          pc = await setupPeerConnection(stream);
        }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc-answer', { answer, sessionId: sessionIdRef.current });
          setIsCallActive(true);
        } catch (e) {
          console.error('Offer 처리 중 오류:', e);
        }
      });

      // 의사로부터의 Answer 처리
      socket.on('webrtc-answer', async ({ answer }: any) => {
        console.log('의사로부터 Answer 수신');
        const pc = peerConnectionRef.current;
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            setIsCallActive(true);
          } catch (e) {
            console.error('Answer 처리 중 오류:', e);
          }
        }
      });

      // ICE Candidate 중계 수신 (null 체크 강화)
      socket.on('ice-candidate', async ({ candidate }: any) => {
        const pc = peerConnectionRef.current;
        if (pc && candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Candidate 추가 실패 (무시):', e);
          }
        }
      });

      // 의사가 진료 완료/종료 시
      socket.on('clinic-closed', () => {
        cleanupMediaAndSocket();
        Alert.alert('진료 완료', '비대면 진료가 성료되었습니다. 마이페이지에서 의료 영수증 수납을 완료해 주세요.', [
          { text: '확인', onPress: () => router.replace('/(tabs)/profile') }
        ]);
      });

      socket.on('connect_error', (err) => {
        console.warn('소켓 연결 거부:', err);
      });

    } catch (e: any) {
      console.error('진료 신청 에러:', e);
      Alert.alert('접수 실패', e.message || '서버 오류로 진료 접수가 불가능합니다.');
    }
  };

  // 통화 중 진료 종료 (isCallActive 상태에서 끊기 버튼)
  const handleEndCall = () => {
    Alert.alert(
      '진료 종료',
      '비대면 진료를 종료하시겠습니까?',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '종료',
          style: 'destructive',
          onPress: async () => {
            if (sessionId) {
              try {
                await api.put(`/api/telemedicine/sessions/${sessionId}`, { status: 'completed' });
                // 💳 등록 카드를 통한 자동 후청구 결제 실행
                await api.post(`/api/telemedicine/sessions/${sessionId}/pay`);
                
                Alert.alert(
                  '진료 및 수납 완료',
                  '진료비 후청구 수납이 완료되었습니다. 처방전을 근처 약국으로 송부하시겠습니까?',
                  [
                    {
                      text: '나중에 하기',
                      onPress: () => {
                        cleanupMediaAndSocket();
                        setStep('hospital');
                        setSelectedDoctor(null);
                        setSelectedHospital(null);
                      }
                    },
                    {
                      text: '약국 발송 진행',
                      onPress: () => {
                        setIsPrescriptionModalOpen(true);
                      }
                    }
                  ]
                );
              } catch (e) {
                console.warn('서버 세션 완료 및 결제 실패:', e);
                cleanupMediaAndSocket();
                setStep('hospital');
                setSelectedDoctor(null);
                setSelectedHospital(null);
              }
            } else {
              cleanupMediaAndSocket();
              setStep('hospital');
              setSelectedDoctor(null);
              setSelectedHospital(null);
            }
          },
        },
      ]
    );
  };

  // 대기 중인 진료 취소 및 자원 해제
  const handleCancelWaiting = () => {
    Alert.alert(
      '진료 취소',
      '비대면 진료 신청을 취소하시겠습니까?',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예',
          style: 'destructive',
          onPress: async () => {
            if (sessionId) {
              try {
                // 환자의 진료 자발적 취소
                await api.put(`/api/telemedicine/sessions/${sessionId}`, { status: 'cancelled' });
              } catch (e) {
                console.warn('서버 세션 취소 실패:', e);
              }
            }
            cleanupMediaAndSocket();
            setStep('hospital');
            setSelectedDoctor(null);
            setSelectedHospital(null);
          },
        },
      ]
    );
  };

  const handleMockAccept = () => {
    console.log('🤖 Virtual WebRTC: 모의 수락 강제 트리거됨');
    setIsCallActive(true);
  };

  // 자원 초기화 청소기
  const cleanupMediaAndSocket = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: any) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    setRemoteStream(null);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.emit('leave-clinic', { sessionId: sessionIdRef.current });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setSessionId(null);
    sessionIdRef.current = null;
    setIsCallActive(false);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleHospitalSelect = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setStep('doctor');
  };

  const handleGoBackSafe = () => {
    cleanupMediaAndSocket();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      {/* ── 상단 영역: WebRTC 비디오 스트림 화면 ── */}
      <View style={styles.cameraSection}>
        {isCallActive ? (
          // ── 통화 연결 중 ──
          <View style={styles.callWrapper}>
            {/* 상대방 (의사) 렌더링 - 전체 화면 */}
            {Platform.OS === ('web' as any) ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={styles.webRemoteVideo}
              />
            ) : (
              <RTCView stream={remoteStream} style={styles.nativeRemoteVideo} />
            )}

            {/* 내 화면 (로컬) 렌더링 - 우측 상단 플로팅 미니어처 */}
            {!isVideoOff && (
              <View style={styles.floatingLocalView}>
                {Platform.OS === ('web' as any) ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={styles.webLocalVideo}
                  />
                ) : (
                  <RTCView stream={localStream} style={styles.nativeLocalVideo} />
                )}
              </View>
            )}

            {/* 통화 중인 의사 정보 배너 오버레이 */}
            <View style={styles.callHeaderOverlay}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>진료중 (LIVE)</Text>
              </View>
              <Text style={styles.doctorLabel}>{selectedDoctor?.name} 전문의</Text>
            </View>

            {/* 하단 통화 제어 패널 */}
            <View style={styles.callControlPanel}>
              <TouchableOpacity style={[styles.controlBtn, isMuted && styles.controlBtnActive]} onPress={toggleMute}>
                <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? '#FFF' : '#333'} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]} onPress={toggleVideo}>
                <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={22} color={isVideoOff ? '#FFF' : '#333'} />
              </TouchableOpacity>

              {/* 끊기 버튼 - isCallActive 상태에서는 handleEndCall 전용 함수 호출 */}
              <TouchableOpacity style={[styles.controlBtn, styles.hangUpBtn]} onPress={handleEndCall}>
                <Ionicons name="call" size={22} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // ── 통화 대기 또는 준비 전 ──
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="videocam" size={48} color="#64748B" />
            <Text style={styles.cameraPlaceholderText}>
              진료실 입장 시 카메라 화상 통화가 활성화됩니다.
            </Text>
          </View>
        )}

        {/* 헤더 백버튼 */}
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

      {/* ── 하단 영역: 제어/리스트 컨트롤 패널 ── */}
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
                    onPress={() => startClinicSession(doctor)}
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
              <View style={styles.waitingStatusArea}>
                <View style={styles.loadingSpinnerContainer}>
                  <ActivityIndicator size="large" color="#6366F1" style={styles.nativeSpinner} />
                  <View style={styles.spinnerEmojiContainer}>
                    <Text style={styles.spinningEmoji}>🩺</Text>
                  </View>
                </View>
                
                <Text style={styles.waitingTitle}>진료실 입장 대기 중</Text>
                <Text style={styles.waitingSub}>
                  {selectedHospital.name} 의 {selectedDoctor.name} 의사 선생님이 수락 시 즉시 화상 진료가 시작됩니다.
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
                  차례가 오면 카메라와 통화 화면이 자동 연결됩니다. 화면을 켜둔 상태로 잠시만 기다려 주세요.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.mockAcceptBtn}
                onPress={handleMockAccept}
                activeOpacity={0.8}
              >
                <Text style={styles.mockAcceptBtnText}>📞 의사 강제 통화 수락 (테스트용)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancelWaiting}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>진료 신청 취소하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── 💊 처방전 약국 전송 모달 ── */}
      <Modal visible={isPrescriptionModalOpen} transparent animationType="slide">
        <View style={styles.telePrescOverlay}>
          <View style={styles.telePrescContent}>
            <View style={styles.telePrescHeader}>
              <Text style={styles.telePrescTitle}>💊 약국 처방전 자동 발송</Text>
              <TouchableOpacity onPress={() => {
                setIsPrescriptionModalOpen(false);
                cleanupMediaAndSocket();
                setStep('hospital');
                setSelectedDoctor(null);
                setSelectedHospital(null);
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.telePrescDesc}>
                발행된 원격 처방전을 수신할 근처 단골 약국 정보를 기입해 주세요. 해당 약국으로 처방 서류가 자동 송출됩니다.
              </Text>

              <Text style={styles.teleLabel}>1. 발송 방식 선택</Text>
              <View style={styles.teleMethodGrid}>
                <TouchableOpacity
                  style={[styles.teleMethodBtn, prescriptionMethod === 'fax' && styles.teleMethodBtnActive]}
                  onPress={() => setPrescriptionMethod('fax')}
                >
                  <Text style={[styles.teleMethodBtnText, prescriptionMethod === 'fax' && styles.teleMethodBtnTextActive]}>
                    📠 팩스(FAX) 송출
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.teleMethodBtn, prescriptionMethod === 'email' && styles.teleMethodBtnActive]}
                  onPress={() => setPrescriptionMethod('email')}
                >
                  <Text style={[styles.teleMethodBtnText, prescriptionMethod === 'email' && styles.teleMethodBtnTextActive]}>
                    📧 이메일(Email) 송출
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.teleLabel}>2. 약국 이름</Text>
              <TextInput
                style={styles.teleInput}
                placeholder="예: 푸른사랑약국"
                value={pharmacyName}
                onChangeText={setPharmacyName}
              />

              {prescriptionMethod === 'fax' ? (
                <>
                  <Text style={styles.teleLabel}>3. 약국 팩스 번호</Text>
                  <TextInput
                    style={styles.teleInput}
                    placeholder="예: 02-1234-5678"
                    keyboardType="numeric"
                    value={pharmacyFaxNo}
                    onChangeText={setPharmacyFaxNo}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.teleLabel}>3. 약국 수신 이메일</Text>
                  <TextInput
                    style={styles.teleInput}
                    placeholder="예: pharmacy@naver.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={pharmacyEmailAddr}
                    onChangeText={setPharmacyEmailAddr}
                  />
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.teleSubmitBtn, isPrescriptionSending && { backgroundColor: '#A5D6A7' }]}
              onPress={handleSendPrescription}
              disabled={isPrescriptionSending}
            >
              {isPrescriptionSending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.teleSubmitBtnText}>약국으로 처방 서류 송부</Text>
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
    backgroundColor: '#0F172A',
  },
  cameraSection: {
    height: SCREEN_H * 0.46,
    position: 'relative',
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  cameraPlaceholder: {
    flex: 1,
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
  callWrapper: {
    flex: 1,
    position: 'relative',
  },
  webRemoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: '#000',
  },
  nativeRemoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  floatingLocalView: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 90,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#000',
    zIndex: 15,
  },
  webLocalVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  nativeLocalVideo: {
    width: '100%',
    height: '100%',
  },
  callHeaderOverlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 14,
    gap: 6,
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
  doctorLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  callControlPanel: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  controlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  controlBtnActive: {
    backgroundColor: '#EF4444',
  },
  hangUpBtn: {
    backgroundColor: '#EF4444',
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

  // ── 처방전 모달 스타일 ──
  telePrescOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  telePrescContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  telePrescHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  telePrescTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  telePrescDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20,
  },
  teleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
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
    borderColor: '#4F46E5',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  teleMethodBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  teleMethodBtnTextActive: {
    color: '#4F46E5',
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
  mockAcceptBtn: {
    backgroundColor: '#00796B',
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  mockAcceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
