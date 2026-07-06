import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore'; // Auth 토큰 참조용

// Haversine 거리 계산 공식
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // 지구 반경 (m)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위 거리 반환
}

export interface GpsSettingData {
  id: number;
  targetPhoneNumber: string;
  targetType: 'senior' | 'child';
  targetAge: number;
  safetyRadius: number;
  stayTimeLimit: string;
  selectedIllnesses: string[];
  connectionStatus: 'pending' | 'linked';
  consentGranted: boolean;
  latitude: number | null;
  longitude: number | null;
}

export function useGpsTracker(gpsSettingId?: number) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isBreached, setIsBreached] = useState(false);
  const [sosStatus, setSosStatus] = useState<'idle' | 'triggered' | 'resolved'>('idle');
  const [loading, setLoading] = useState(false);
  const [setting, setSetting] = useState<GpsSettingData | null>(null);

  // Mock 위치 시뮬레이션용 좌표 발생기 (시뮬레이터 테스트 용이성 극대화)
  const simulateMovement = (centerLat: number, centerLon: number, radiusMeters: number, forceBreach = false) => {
    // forceBreach 이면 반경 초과 위치 설정, 아니면 내부 무작위 움직임
    const offset = forceBreach ? (radiusMeters + 50) / 111000 : (radiusMeters - 50) * Math.random() / 111000;
    const nextLat = centerLat + offset;
    const nextLon = centerLon + offset;
    setCoords({ latitude: nextLat, longitude: nextLon });

    const dist = getDistance(nextLat, nextLon, centerLat, centerLon);
    setIsBreached(dist > radiusMeters);
  };

  // 1. 보호 대상 설정 불러오기
  const fetchGpsSetting = async (id: number) => {
    setLoading(true);
    try {
      // 실제 API 통신 (어드민 또는 보호자 인증 필요)
      const response = await axios.get(`/api/gps/${id}`);
      setSetting(response.data);
      if (response.data.latitude && response.data.longitude) {
        setCoords({ latitude: response.data.latitude, longitude: response.data.longitude });
      }
    } catch (err) {
      console.warn('GPS 설정을 가져오는 데 실패하여 디버깅용 모의 데이터로 로드합니다.');
      // 임시 목업 바인딩
      const mockSetting: GpsSettingData = {
        id: id,
        targetPhoneNumber: '010-9988-7766',
        targetType: 'senior',
        targetAge: 78,
        safetyRadius: 100,
        stayTimeLimit: '2시간',
        selectedIllnesses: ['치매', '고혈압'],
        connectionStatus: 'linked',
        consentGranted: true,
        latitude: 37.5665,
        longitude: 126.9780
      };
      setSetting(mockSetting);
      setCoords({ latitude: 37.5665, longitude: 126.9780 });
    } finally {
      setLoading(false);
    }
  };

  // 2. 실시간 위치 로그 기록 전송
  const logLocation = async (lat: number, lon: number) => {
    if (!gpsSettingId) return;
    try {
      await axios.post(`/api/gps/${gpsSettingId}/logs`, {
        latitude: lat,
        longitude: lon,
        batteryLevel: 85,
        speed: 1.2
      });
    } catch (e) {
      console.log('위치 로그 백엔드 전송 실패 (오프라인 모드 작동)');
    }
  };

  // 3. SOS 비상 호출 발생
  const triggerSos = async (lat?: number, lon?: number) => {
    if (!gpsSettingId) return;
    setSosStatus('triggered');
    try {
      const currentLat = lat || coords?.latitude || 37.5665;
      const currentLon = lon || coords?.longitude || 126.9780;
      await axios.post(`/api/gps/${gpsSettingId}/sos`, {
        latitude: currentLat,
        longitude: currentLon
      });
    } catch (e) {
      console.warn('SOS 백엔드 알람 전송 실패');
    }
  };

  // 4. SOS 비상 해제
  const resolveSos = async (sosAlertId: number) => {
    if (!gpsSettingId) return;
    setSosStatus('resolved');
    try {
      await axios.post(`/api/gps/${gpsSettingId}/sos/resolve`, {
        sosAlertId: sosAlertId
      });
    } catch (e) {
      console.warn('SOS 상황 해제 백엔드 전송 실패');
    }
  };

  useEffect(() => {
    if (gpsSettingId) {
      fetchGpsSetting(gpsSettingId);
    }
  }, [gpsSettingId]);

  return {
    coords,
    isBreached,
    sosStatus,
    loading,
    setting,
    simulateMovement,
    logLocation,
    triggerSos,
    resolveSos,
    fetchGpsSetting
  };
}
