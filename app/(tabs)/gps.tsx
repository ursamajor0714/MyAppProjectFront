import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { createAudioPlayer, AudioPlayer } from 'expo-audio'; // 모바일 오디오 재생 지원
import { useGpsStore } from '../../store/useGpsStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { styles } from '../../styles/gps.styles';

let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('react-native-webview load error:', e);
  }
}

const { width: SCREEN_W } = Dimensions.get('window');

// ── 더미 질환 리스트 ──
const ILLNESS_LIST = ['치매', '천식', '당뇨', '심장질환', '뇌질환'];
const STAY_TIME_OPTIONS = ['30분', '1시간', '2시간', '6시간', '12시간', '24시간', '48시간'];

// ── Leaflet OpenStreetMap HTML 템플릿 (API 키 불필요) ──
const getLeafletHtml = (
  centerLat: number,
  centerLng: number,
  targetLat: number,
  targetLng: number,
  radius: number
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
    .leaflet-control-attribution { display: none !important; }
    .custom-div-icon {
      background: #2196F3;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(33, 150, 243, 0.8);
    }
    .custom-home-icon {
      background: #4CAF82;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(76, 175, 130, 0.8);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var targetIcon = L.divIcon({
      className: 'custom-div-icon',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    var homeIcon = L.divIcon({
      className: 'custom-home-icon',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    var targetMarker = L.marker([${targetLat}, ${targetLng}], { icon: targetIcon }).addTo(map);
    var homeMarker = L.marker([${centerLat}, ${centerLng}], { icon: homeIcon }).addTo(map);
    
    homeMarker.bindPopup("<b>안전구역 중심 (집)</b>").openPopup();
    targetMarker.bindPopup("<b>보호 대상자</b>");

    var safetyCircle = L.circle([${centerLat}, ${centerLng}], {
      color: '#4CAF82',
      fillColor: '#4CAF82',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '5, 5',
      radius: ${radius}
    }).addTo(map);

    var group = L.featureGroup([targetMarker, safetyCircle]);
    map.fitBounds(group.getBounds().pad(0.15));

    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'update') {
          var tLatLng = [data.lat, data.lng];
          var cLatLng = [data.centerLat, data.centerLng];
          
          targetMarker.setLatLng(tLatLng);
          homeMarker.setLatLng(cLatLng);
          safetyCircle.setLatLng(cLatLng);
          safetyCircle.setRadius(data.radius);

          var newGroup = L.featureGroup([targetMarker, safetyCircle]);
          map.fitBounds(newGroup.getBounds().pad(0.15));
        }
      } catch (e) {
        console.error("Leaflet Message Error:", e);
      }
    });
  </script>
</body>
</html>
`;

export default function GpsScreen() {
  const insets = useSafeAreaInsets();
  const {
    settings,
    currentCoords,
    isTracking,
    setConsent,
    updateSettings,
    setCurrentCoords,
    toggleTracking,
    fetchSettingsFromServer,
    deleteSettingsFromServer,
  } = useGpsStore();

  // 내부 UI 상태
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showLawModal, setShowLawModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [isOutOfBoundsSimulated, setIsOutOfBoundsSimulated] = useState(false);

  // Web Audio 레퍼런스
  const audioCtxRef = useRef<any>(null);
  const oscRef = useRef<any>(null);
  const sirenIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const iframeRef = useRef<any>(null);
  const soundRef = useRef<AudioPlayer | null>(null); // 모바일 오디오 인스턴스 래퍼 추가

  // 보호 대상자 연동 로직
  const handleLinkRequest = () => {
    if (!settings.targetPhoneNumber.trim()) {
      Alert.alert('알림', '보호 대상자의 전화번호를 입력해주세요.');
      return;
    }

    updateSettings({ connectionStatus: 'pending' });

    if (settings.targetType === 'child') {
      if (settings.targetAge < 8) {
        Alert.alert(
          '보호자 확인 대기중',
          `만 8세 미만 아동은 별도 아동 동의가 필요 없으나, 제3자의 무단 등록 방지를 위해 아동 기기(앱)에서 최초 1회 [보호자 등록 확인] 버튼을 눌러 승인해야 연동이 완료됩니다. 아동 단말기로 승인 요청 문자가 발송되었습니다.`
        );
      } else if (settings.targetAge >= 8 && settings.targetAge < 14) {
        Alert.alert(
          '아동 확인 대기중',
          `만 8~14세 미만 아동 기기(앱)로 연동 승인 요청 문자가 발송되었습니다. 아동 기기에서 수락 시 연동이 최종 완료되며, 향후 위치 조회 시 아동에게 실시간 알림이 발송됩니다.`
        );
      } else {
        Alert.alert(
          '청소년 동의 대기중',
          `만 14세 이상 청소년은 법적 본인 동의가 필수적입니다. 입력하신 번호(${settings.targetPhoneNumber})로 동의 요청 문자가 발송되었습니다. 대상자 수락 시 연동이 승인됩니다.`
        );
      }
    } else {
      // Senior
      Alert.alert(
        '동의 대기중',
        `성인/어르신 기저질환자 위치 추적은 개인정보보호법에 의거 사전 동의가 필수적입니다. 입력하신 번호(${settings.targetPhoneNumber})로 동의 요청 문자가 발송되었습니다. 대상자가 동의 수락 시 즉시 연동됩니다.`
      );
    }
  };

  const handleSimulateAccept = () => {
    updateSettings({ connectionStatus: 'linked' });
    Alert.alert('테스트 승인', '보호 대상자가 위치 추적 동의 요청을 수락하여 연동이 완료되었습니다.');
  };

  const handleDisconnect = () => {
    deleteSettingsFromServer();
    Alert.alert('연동 해제', '보호 대상자와의 안심 위치 연동이 해제되었습니다.');
  };

  // GPS 권한 획득 및 현재 위치 가져오기
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionError('위치 권한이 거부되었습니다.');
        setConsent(false);
        return;
      }
      setConsent(true);
      setPermissionError(null);
      fetchCurrentLocation();
    } catch (e) {
      setPermissionError('권한 요청 중 오류 발생');
      setConsent(false);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      // 1. 빠른 응답을 위해 마지막으로 조회된 위치를 우선 적용
      const lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown) {
        setCurrentCoords({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        });
        toggleTracking(true);
      }

      // 2. 5초 타임아웃을 건 정확한 실시간 위치 요청
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      const location = await Promise.race([locationPromise, timeoutPromise]);
      if (location) {
        setCurrentCoords({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
      toggleTracking(true);
    } catch (e) {
      console.warn('GPS location fetch error/timeout:', e);
      if (!currentCoords) {
        setCurrentCoords({ latitude: 37.5665, longitude: 126.9780 });
      }
      toggleTracking(true);
    }
  };

  // SOS 사이렌 효과음 생성기 (웹 및 모바일 하이브리드 지원)
  const startSirenSound = async () => {
    if (Platform.OS === 'web') {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscRef.current = osc;

        let highFreq = false;
        sirenIntervalRef.current = setInterval(() => {
          const now = ctx.currentTime;
          osc.frequency.cancelScheduledValues(now);
          osc.frequency.setValueAtTime(osc.frequency.value, now);
          osc.frequency.exponentialRampToValueAtTime(highFreq ? 850 : 400, now + 0.45);
          highFreq = !highFreq;
        }, 500);

        setIsSirenPlaying(true);
      } catch (e) {
        console.warn('Siren audio error:', e);
      }
      return;
    }

    // 모바일 네이티브 (expo-audio) 재생 로직
    try {
      const player = createAudioPlayer({ uri: 'https://assets.mixkit.co/active_storage/sfx/950/950-84.wav' });
      player.loop = true;
      player.volume = 1.0;
      player.play();
      soundRef.current = player;
      setIsSirenPlaying(true);
    } catch (e) {
      console.warn('Mobile siren audio play error:', e);
    }
  };

  const stopSirenSound = async () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (oscRef.current) {
      try {
        oscRef.current.stop();
      } catch (e) {}
      oscRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }

    // 모바일 소리 정지 및 메모리 언로드
    if (soundRef.current) {
      try {
        soundRef.current.pause();
        soundRef.current.remove();
      } catch (e) {}
      soundRef.current = null;
    }
    setIsSirenPlaying(false);
  };

  // SOS 카운트다운 시작
  const triggerSos = () => {
    setShowSosModal(true);
    setSosCountdown(5);

    countdownIntervalRef.current = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          startSirenSound();
          useNotificationStore.getState().addNotification({
            title: '🚨 SOS 긴급 호출 감지',
            body: `[비상] 보호 대상자의 휴대폰에서 SOS 비상 싸이렌이 작동했습니다. 즉시 신변을 파악하십시오.`,
            type: 'sos',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // SOS 취소
  const cancelSos = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    stopSirenSound();
    setSosCountdown(null);
    setShowSosModal(false);
  };

  // 질환 선택 핸들러
  const handleToggleIllness = (illness: string) => {
    const selected = settings.selectedIllnesses.includes(illness)
      ? settings.selectedIllnesses.filter((i) => i !== illness)
      : [...settings.selectedIllnesses, illness];
    updateSettings({ selectedIllnesses: selected });
  };

  // 생명주기 관리
  useEffect(() => {
    fetchSettingsFromServer();
    if (settings.consentGranted) {
      fetchCurrentLocation();
    }
    return () => {
      stopSirenSound();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // 아동 연령 제한에 따른 안내 문구
  const getAgeNotice = () => {
    if (settings.targetAge < 8) {
      return '🟢 만 8세 미만: 부모 실시간 모니터링 및 이동 경로 보존이 유지됩니다.';
    }
    if (settings.targetAge >= 8 && settings.targetAge < 14) {
      return '🟡 만 8~14세 미만: 부모가 실시간 위치 확인 시 자녀 단말기에 실시간 알림이 발생합니다.';
    }
    return '🔴 만 14세 이상: 위치정보보호법에 의거, 대상자의 자발적 동의 없이는 조회가 차단됩니다.';
  };

  // 동의 미부여 시 온보딩 렌더링
  if (!settings.consentGranted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.onboardContent}>
          <Text style={styles.onboardEmoji}>📍</Text>
          <Text style={styles.onboardTitle}>GPS 안심 모니터링</Text>
          <Text style={styles.onboardSub}>
            기저질환 어르신과 아동의 조기 발견 및 실시간 긴급 이탈 알림 보호 기능입니다.
          </Text>

          <View style={styles.lawAlertBox}>
            <Text style={styles.lawAlertTitle}>⚠️ 위치정보 수집 및 법적 고지</Text>
            <Text style={styles.lawAlertText}>
              - 본 기능은 미성년자 및 심신상실인 등의 보호 목적 외에 무단 위치 추적 용도로 사용할 수 없습니다.
              {'\n'}- 만 14세 초과 보호 대상자의 경우 반드시 본인 사전 동의가 필요하며, 위반 시 위치정보법 제15조에 의거 처벌받을 수 있습니다.
            </Text>
          </View>

          <TouchableOpacity style={styles.onboardBtn} onPress={requestLocationPermission}>
            <Text style={styles.onboardBtnText}>약관 동의 및 권한 허용</Text>
          </TouchableOpacity>

          {permissionError && <Text style={styles.errorText}>{permissionError}</Text>}
        </View>
      </View>
    );
  }

  // 안전구역 실지형 지도용 좌표 계산
  const centerLat = currentCoords?.latitude ?? 37.5665;
  const centerLng = currentCoords?.longitude ?? 126.9780;
  
  // 이탈 시뮬레이션일 경우 반경의 1.4배만큼 위경도 이동 (위도 1도 = 약 111,320m)
  const offset = isOutOfBoundsSimulated ? (settings.safetyRadius * 1.4) / 111320 : 0;
  const targetLat = centerLat + offset;
  const targetLng = centerLng + offset / Math.cos(centerLat * Math.PI / 180);



  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── 1. 시뮬레이션 지도 카드 ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>보호 대상자 현재 위치 (가상 지도)</Text>
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <iframe
                ref={iframeRef}
                srcDoc={getLeafletHtml(centerLat, centerLng, targetLat, targetLng, settings.safetyRadius)}
                style={{ width: '100%', height: 250, border: 'none', borderRadius: 20 }}
              />
            ) : WebView ? (
              <WebView
                ref={iframeRef}
                originWhitelist={['*']}
                source={{ html: getLeafletHtml(centerLat, centerLng, targetLat, targetLng, settings.safetyRadius) }}
                style={{ width: '100%', height: 250, borderRadius: 20 }}
              />
            ) : (
              <View style={styles.mapFallback}>
                <Text style={styles.mapFallbackText}>지도를 로드할 수 없습니다.</Text>
              </View>
            )}

            {/* 지도 정보 안내 */}
            <View style={styles.mapOverlayInfo}>
              <Text style={styles.mapInfoText}>
                📍 설정 반경: {settings.safetyRadius}m | 상태:{' '}
                <Text style={{ color: isOutOfBoundsSimulated ? '#E53935' : '#2E7D32', fontWeight: '800' }}>
                  {isOutOfBoundsSimulated ? '안전영역 이탈!' : '안전영역 내 위치'}
                </Text>
              </Text>
            </View>
          </View>

          {/* 시뮬레이션 제어 버튼 */}
          <View style={styles.simBtnRow}>
            <TouchableOpacity
              style={[styles.simBtn, !isOutOfBoundsSimulated && styles.simBtnActive]}
              onPress={() => setIsOutOfBoundsSimulated(false)}
            >
              <Text style={[styles.simBtnText, !isOutOfBoundsSimulated && styles.simBtnTextActive]}>
                영역 내로 이동
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.simBtn, isOutOfBoundsSimulated && styles.simBtnActiveRed]}
              onPress={() => setIsOutOfBoundsSimulated(true)}
            >
              <Text style={[styles.simBtnText, isOutOfBoundsSimulated && styles.simBtnTextActive]}>
                영역 이탈 (알람 테스트)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🚨 이탈 경고 배너 */}
        {isOutOfBoundsSimulated && (
          <View style={styles.outOfBoundsBanner}>
            <Text style={styles.bannerEmoji}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>안전 구역 이탈 감지!</Text>
              <Text style={styles.bannerDesc}>
                보호 대상자가 지정 안전구역(반경 {settings.safetyRadius}m)을 벗어났습니다.
              </Text>
            </View>
          </View>
        )}

        {/* ── 2. 기본 인적 설정 ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>보호 대상 정보 설정</Text>

          {/* 연동 상태 표시 배너 */}
          <View style={styles.statusRow}>
            <Text style={styles.statusRowLabel}>연동 상태:</Text>
            <View style={[
              styles.statusChip,
              settings.connectionStatus === 'linked' && styles.statusChipLinked,
              settings.connectionStatus === 'pending' && styles.statusChipPending,
            ]}>
              <Text style={[
                styles.statusChipText,
                settings.connectionStatus === 'linked' && styles.statusChipTextLinked,
                settings.connectionStatus === 'pending' && styles.statusChipTextPending,
              ]}>
                {settings.connectionStatus === 'linked' ? '🟢 연동 완료' : 
                 settings.connectionStatus === 'pending' ? '🟡 동의 대기중' : '🔴 미연동'}
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>대상 전화번호 (위급 시 문자/전화 연동)</Text>
          <View style={styles.phoneInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
              placeholder="010-0000-0000"
              keyboardType="phone-pad"
              value={settings.targetPhoneNumber}
              onChangeText={(val) => updateSettings({ targetPhoneNumber: val })}
              editable={settings.connectionStatus === 'none'}
            />
            {settings.connectionStatus === 'none' ? (
              <TouchableOpacity style={styles.linkReqBtn} onPress={handleLinkRequest}>
                <Text style={styles.linkReqBtnText}>연동 요청</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
                <Text style={styles.disconnectBtnText}>연동 해제</Text>
              </TouchableOpacity>
            )}
          </View>

          {settings.connectionStatus === 'pending' && (
            <TouchableOpacity style={styles.simulateAcceptBtn} onPress={handleSimulateAccept}>
              <Text style={styles.simulateAcceptBtnText}>📲 대상자 스마트폰 동의 수락 시뮬레이션</Text>
            </TouchableOpacity>
          )}

          <View style={styles.toggleGroup}>
            <Text style={styles.inputLabel}>대상자 유형</Text>
            <View style={styles.tabToggle}>
              <TouchableOpacity
                style={[styles.tabToggleItem, settings.targetType === 'senior' && styles.tabToggleItemActive]}
                onPress={() => updateSettings({ targetType: 'senior', targetAge: 75 })}
              >
                <Text style={[styles.tabToggleText, settings.targetType === 'senior' && styles.tabToggleTextActive]}>
                  어르신 (실버)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabToggleItem, settings.targetType === 'child' && styles.tabToggleItemActive]}
                onPress={() => updateSettings({ targetType: 'child', targetAge: 6 })}
              >
                <Text style={[styles.tabToggleText, settings.targetType === 'child' && styles.tabToggleTextActive]}>
                  아동 (어린이)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 연령 조절 */}
          <View style={{ marginTop: 14 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.inputLabel}>대상자 연령</Text>
              <Text style={styles.ageValText}>만 {settings.targetAge}세</Text>
            </View>
            <View style={styles.ageSelectorRow}>
              {settings.targetType === 'child' ? (
                // 아동 연령 조절 분기
                [5, 7, 10, 15].map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[styles.ageChip, settings.targetAge === age && styles.ageChipActive]}
                    onPress={() => updateSettings({ targetAge: age })}
                  >
                    <Text style={[styles.ageChipText, settings.targetAge === age && styles.ageChipTextActive]}>
                      만 {age}세
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                // 노인 연령 조절 분기
                [65, 75, 80, 85].map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[styles.ageChip, settings.targetAge === age && styles.ageChipActive]}
                    onPress={() => updateSettings({ targetAge: age })}
                  >
                    <Text style={[styles.ageChipText, settings.targetAge === age && styles.ageChipTextActive]}>
                      만 {age}세
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
            <Text style={styles.ageRuleDesc}>{getAgeNotice()}</Text>
          </View>
        </View>

        {/* ── 3. 기저질환 연동 설정 ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>주요 관리 기저질환</Text>
          <Text style={styles.cardSubTitle}>
            해당 기저질환 상태에 따라 긴급상황 구조 매뉴얼이 자동 연계됩니다.
          </Text>

          <View style={styles.illnessGrid}>
            {ILLNESS_LIST.map((ill) => {
              const selected = settings.selectedIllnesses.includes(ill);
              return (
                <TouchableOpacity
                  key={ill}
                  style={[styles.illnessItem, selected && styles.illnessItemActive]}
                  onPress={() => handleToggleIllness(ill)}
                >
                  <Text style={[styles.illnessText, selected && styles.illnessTextActive]}>
                    {ill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 4. 반경 및 체류시간 경보 설정 ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>안전범위 및 감시 체류시간 설정</Text>

          {/* 안전 반경 설정 */}
          <Text style={styles.inputLabel}>안전반경 설정 (이탈 시 긴급 알림)</Text>
          <View style={styles.radiusRow}>
            {[100, 300, 500, 1000].map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[styles.radiusChip, settings.safetyRadius === radius && styles.radiusChipActive]}
                onPress={() => updateSettings({ safetyRadius: radius })}
              >
                <Text style={[styles.radiusChipText, settings.safetyRadius === radius && styles.radiusChipTextActive]}>
                  {radius}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 지정장소 체류 시간 알림 */}
          <Text style={[styles.inputLabel, { marginTop: 20 }]}>지정장소 최장 체류 알림 시간</Text>
          <Text style={styles.cardSubTitle}>
            보호 대상자가 낯선 구역에서 아래 시간 동안 움직임이 없는 경우 보호자에게 알림을 발송합니다.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stayScroll}>
            {STAY_TIME_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.stayChip, settings.stayTimeLimit === time && styles.stayChipActive]}
                onPress={() => updateSettings({ stayTimeLimit: time })}
              >
                <Text style={[styles.stayChipText, settings.stayTimeLimit === time && styles.stayChipTextActive]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── 5. 긴급 구조 SOS ── */}
        <View style={[styles.card, styles.sosCard]}>
          <Text style={styles.sosCardTitle}>긴급 구조 SOS 발동</Text>
          <Text style={styles.sosCardDesc}>
            사고, 낙상 또는 갑작스러운 발작/치매 배회 상황에서 신속한 경보와 119구조를 요청합니다.
          </Text>

          <TouchableOpacity style={styles.sosBtn} onPress={triggerSos}>
            <Text style={styles.sosBtnText}>🚨 SOS 긴급신호 전송</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── 우측 하단 고정 법적 규제 정보 (!) 버튼 ── */}
      <TouchableOpacity style={styles.lawFloatingBtn} onPress={() => setShowLawModal(true)}>
        <Text style={styles.lawFloatingIcon}>!</Text>
      </TouchableOpacity>

      {/* ── 팝업: 법적 제약 모달 ── */}
      <Modal visible={showLawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.lawModalContainer}>
            <Text style={styles.lawModalTitle}>안동안심 GPS 관련 자사규정 & 법적고지</Text>
            <ScrollView style={styles.lawModalScroll}>
              <Text style={styles.lawModalSectionTitle}>1. 위치정보의 보호 및 이용 등에 관한 법률 제15조</Text>
              <Text style={styles.lawModalBody}>
                누구든지 개인위치정보주체의 동의를 얻지 아니하고 당해 개인위치정보를 수집·이용 또는 제공하여서는 아니 됩니다. 이를 위반할 시 민형사상 법적 제재를 받게 됩니다.
              </Text>

              <Text style={styles.lawModalSectionTitle}>2. 만 14세 미만 아동 및 피성년후견인 수집 규정</Text>
              <Text style={styles.lawModalBody}>
                본 앱은 기저질환을 앓고 있는 노약자 및 아동 보호에 한하여 서비스를 수행합니다. 보호자 인증(가족관계증명서 제출 등) 절차를 거치지 않은 불법 위치 감시는 수집이 즉각 제한됩니다.
              </Text>

              <Text style={styles.lawModalSectionTitle}>3. 만 14세 초과 아동(청소년) 정책</Text>
              <Text style={styles.lawModalBody}>
                만 14세 이상의 자녀를 모니터링할 시, 자녀 단말기 상에 주기적인 GPS 동의 안내 및 조회 내역 푸시 알림이 고지되어 사생활 침해를 방지합니다.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.lawModalCloseBtn} onPress={() => setShowLawModal(false)}>
              <Text style={styles.lawModalCloseBtnText}>확인 및 닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── 팝업: SOS 카운트다운 및 사이렌 모달 ── */}
      <Modal visible={showSosModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.sosModalContainer, isSirenPlaying && styles.sosModalContainerAlarm]}>
            {isSirenPlaying ? (
              <>
                <Text style={styles.sosAlarmIcon}>🔊</Text>
                <Text style={styles.sosAlarmTitle}>SOS 긴급 파상음 작동중</Text>
                <Text style={styles.sosAlarmDesc}>
                  주변 행인의 인지 및 응급 구조를 위한 데시벨 사이렌이 재생 중입니다. 보호 대상자에게 긴급 푸시 및 지정 연락처로 조치 문자가 발송되었습니다.
                </Text>

                <TouchableOpacity style={styles.sosCancelBtn} onPress={cancelSos}>
                  <Text style={styles.sosCancelBtnText}>사이렌 끄기 / SOS 해제</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.sosCountdownText}>{sosCountdown}</Text>
                <Text style={styles.sosCountdownTitle}>SOS 신호 전송 대기중</Text>
                <Text style={styles.sosCountdownDesc}>
                  5초 후 SOS 신호가 강제 발동되며, 1시간 내 재발동 시 큰 데시벨의 시끄러운 경고음이 울립니다.
                </Text>
                <Text style={styles.sosCountdownWarning}>
                  * SOS 사용에 따른 오인 신고의 책임은 전적으로 사용자에게 있습니다.
                </Text>

                <TouchableOpacity style={styles.sosCancelBtn} onPress={cancelSos}>
                  <Text style={styles.sosCancelBtnText}>취소 하기</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}


