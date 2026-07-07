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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
  const insets = useSafeAreaInsets();
  const { hospitalId, reportId, fromResult } = useLocalSearchParams<{ hospitalId?: string; reportId?: string; fromResult?: string }>();
  const [step, setStep] = useState<ClinicStep>('hospital');

  // 상태 변수
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [waitingNumber, setWaitingNumber] = useState(3);
  const [waitingTime, setWaitingTime] = useState(8);

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
  }, [localStream, remoteStream]);

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

  // 로컬 미디어 (카메라 & 마이크) 스트림 시작
  const startLocalStream = async () => {
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
      console.error('로컬 카메라/마이크 캡처 실패:', error);
      Alert.alert('권한 오류', '화상 진료를 위한 카메라/마이크 캡처 권한을 획득하지 못했습니다. 설정에서 확인해 주세요.');
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

    // [iOS/모바일 브라우저 대응] 사용자 클릭 이벤트 내부에서 미리 카메라/마이크 권한을 획득하여 홀딩합니다.
    // 비동기 소켓 콜백 안에서 getUserMedia를 호출하면 브라우저 보안 정책(Safari 등)에 의해 차단될 수 있습니다.
    const preStream = await startLocalStream();
    if (!preStream) {
      return; // 권한 획득 실패 시 접수를 진행하지 않음
    }

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
        transports: ['websocket']
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('시그널링 소켓 연결 완료. 룸 조인 시도.');
        socket.emit('join-clinic', { sessionId: session.id });
      });

      // 의사 접속 완료 -> WebRTC 셋업
      socket.on('clinic-ready', async () => {
        console.log('의사 입장 감지 ➡️ WebRTC 연결 개시');
        const stream = localStreamRef.current || await startLocalStream();
        if (stream) {
          const pc = await setupPeerConnection(stream);
          await createAndSendOffer(pc);
        }
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

      // ICE Candidate 중계 수신
      socket.on('ice-candidate', async ({ candidate }: any) => {
        const pc = peerConnectionRef.current;
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Candidate 추가 실패:', e);
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
            setStep('doctor');
            setSelectedDoctor(null);
          },
        },
      ]
    );
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
            {Platform.OS === 'web' ? (
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
                {Platform.OS === 'web' ? (
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

              <TouchableOpacity style={[styles.controlBtn, styles.hangUpBtn]} onPress={handleCancelWaiting}>
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
});
