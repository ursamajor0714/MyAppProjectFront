import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export interface TelemedicineSession {
  id: number;
  status: 'waiting' | 'ongoing' | 'completed' | 'cancelled';
  hospitalName: string;
  doctorName: string;
  department: string;
  symptomDetails: string | null;
  waitQueueNumber: number | null;
  billAmount: number | null;
  paid: boolean;
  prescriptionUrl: string | null;
  prescriptionSentTo: string | null;
  createdAt: string;
}

export interface HospitalInfo {
  id: number;
  name: string;
  address: string;
  phone: string;
  departments: string[];
  rating: number;
  status: 'active' | 'inactive';
}

export function useTelemedicine() {
  const [activeSession, setActiveSession] = useState<TelemedicineSession | null>(null);
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. 주변 협력 병원 리스트 조회
  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/hospitals'); // 공용 병원조회 엔드포인트 호환
      setHospitals(response.data);
    } catch (err) {
      console.warn('API 병원 조회 실패, 더미 병원 목록을 바인딩합니다.');
      const mockHospitals: HospitalInfo[] = [
        {
          id: 1,
          name: '행복한내과의원',
          address: '서울시 중구 세종대로 110',
          phone: '02-123-4567',
          departments: ['내과', '순환기내과', '가정의학과'],
          rating: 4.8,
          status: 'active'
        },
        {
          id: 2,
          name: '든든한소아과',
          address: '서울시 종로구 대학로 101',
          phone: '02-765-4321',
          departments: ['소아청소년과', '소아과'],
          rating: 4.9,
          status: 'active'
        }
      ];
      setHospitals(mockHospitals);
    } finally {
      setLoading(false);
    }
  };

  // 2. 비대면 진료 접수/예약 신청
  const requestSession = async (payload: {
    hospitalName: string;
    doctorName: string;
    department: string;
    symptomDetails: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/telemedicine/sessions', payload);
      setActiveSession(response.data);
      startQueuePolling(response.data.id);
      return response.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.error || '비대면 진료 신청 중 오류 발생.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // 3. 진료 대기 정보 폴링 (실시간 대기열 업데이트 모방)
  const startQueuePolling = (sessionId: number) => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);
    
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await axios.get(`/api/telemedicine/sessions/${sessionId}`);
        setActiveSession(response.data);
        
        // 진료 수락 또는 완료/취소 시 폴링 중단
        if (response.data.status !== 'waiting') {
          stopQueuePolling();
        }
      } catch (err) {
        console.log('대기열 폴링 에러');
      }
    }, 4000);
  };

  const stopQueuePolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  // 4. 진료 취소
  const cancelSession = async (sessionId: number) => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/telemedicine/sessions/${sessionId}`, {
        status: 'cancelled'
      });
      setActiveSession(null);
      stopQueuePolling();
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || '진료 취소 실패.');
    } finally {
      setLoading(false);
    }
  };

  // 5. 진료비 후청구 결제 (수납)
  const paySession = async (sessionId: number) => {
    setLoading(true);
    try {
      const response = await axios.post(`/api/telemedicine/sessions/${sessionId}/pay`);
      if (activeSession && activeSession.id === sessionId) {
        setActiveSession(prev => prev ? { ...prev, paid: true } : null);
      }
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || '진료비 수납 결제 실패.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopQueuePolling();
    };
  }, []);

  return {
    activeSession,
    hospitals,
    loading,
    error,
    fetchHospitals,
    requestSession,
    cancelSession,
    paySession,
    stopQueuePolling
  };
}
