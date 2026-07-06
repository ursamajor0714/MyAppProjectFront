import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,

  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSymptomStore } from '../store/symptomData';
import { useGpsStore } from '../store/useGpsStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';

type SendState = 'idle' | 'preparing' | 'sending' | 'success';

export default function HealthReportScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { history } = useSymptomStore();
  const { settings } = useGpsStore();

  // 리포트 전송 모의 상태
  const [sendState, setSendState] = useState<SendState>('idle');
  const [sendProgress, setSendProgress] = useState('');

  // 주기적 알림 토글 상태
  const [remindMedication, setRemindMedication] = useState(true);
  const [remindSymptomCheck, setRemindSymptomCheck] = useState(false);
  const [remindExercise, setRemindExercise] = useState(true);

  // 종합 통계 계산
  const totalChecks = history.length;
  const emergencyChecks = history.filter(r => r.riskLevel === 'emergency').length;
  const highChecks = history.filter(r => r.riskLevel === 'high').length;
  const mediumChecks = history.filter(r => r.riskLevel === 'medium').length;
  const lowChecks = history.filter(r => r.riskLevel === 'low').length;

  // 가장 빈번한 불편 부위 순위 추출
  const partCounts: Record<string, number> = {};
  history.forEach(r => {
    partCounts[r.partLabel] = (partCounts[r.partLabel] || 0) + 1;
  });
  const sortedParts = Object.entries(partCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // 건강 점수 시뮬레이션 (진단 내역과 위험도 비례 계산)
  const calculateHealthScore = () => {
    if (totalChecks === 0) return 95; // 기록 없으면 기본 95점
    const penalty = (emergencyChecks * 20) + (highChecks * 12) + (mediumChecks * 6) + (lowChecks * 2);
    return Math.max(40, 100 - penalty);
  };
  const healthScore = calculateHealthScore();

  // 보호자 수신처 정보 (GPS 안심 설정 연동)
  const guardianName = settings.targetPhoneNumber ? (settings.targetType === 'senior' ? '보호자 (안심망)' : '부모 보호자') : '지정된 보호자';
  const guardianPhone = settings.targetPhoneNumber || '010-9876-5432';

  // 리포트 전송 수행
  const handleSendReport = () => {
    setSendState('preparing');
    setSendProgress('의료 분석 보고서 PDF 데이터 암호화 중...');

    setTimeout(() => {
      setSendState('sending');
      setSendProgress(`${guardianName} (${guardianPhone}) 보호자 보안 통신 채널 개설 및 리포트 송신 중...`);

      setTimeout(() => {
        setSendState('success');
        // 알림 센터 추가
        useNotificationStore.getState().addNotification({
          title: '📊 주간 건강 리포트 공유 완료',
          body: `${guardianName} (${guardianPhone})에게 주간 건강 리포트(보안 PDF)가 안전하게 전송되었습니다.`,
          type: 'general',
        });
      }, 1500);
    }, 1000);
  };

  // 복약 알림 변경 핸들러
  const handleMedicationChange = (val: boolean) => {
    setRemindMedication(val);
    if (val) {
      useNotificationStore.getState().addNotification({
        title: '💊 복약/생활 알림 활성화',
        body: '오전 9시 혈압약 복용 및 오후 8시 영양제 정기 알림 일정이 캘린더에 연동되었습니다.',
        type: 'medication',
      });
    }
  };

  // 자가진단 권장 알림 변경 핸들러
  const handleSymptomCheckChange = (val: boolean) => {
    setRemindSymptomCheck(val);
    if (val) {
      useNotificationStore.getState().addNotification({
        title: '🩺 주기적 자가진단 권장 스케줄러',
        body: '건강 관리를 위해 매주 월요일 아침 9시 전신 자가진단 독려 알림이 설정되었습니다.',
        type: 'general',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* ── 상단 헤더 ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 주간 건강 리포트</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. 종합 건강 점수 카드 ── */}
        <View style={styles.scoreCard}>
          <Text style={styles.cardSubTitle}>{user?.name}님의 이번 주 건강 요약</Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>{healthScore}</Text>
              <Text style={styles.scoreUnit}>점</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 20 }}>
              <Text style={styles.healthStatusText}>
                {healthScore >= 90 ? '🌟 매우 안정적' : healthScore >= 75 ? '🟢 비교적 양호' : healthScore >= 60 ? '🟡 경과 관찰 필요' : '🚨 건강 적신호'}
              </Text>
              <Text style={styles.healthStatusDesc}>
                {healthScore >= 90
                  ? '현재 매우 좋은 생체 바이오 리듬을 보이고 있습니다. 가벼운 유산소 운동과 수분 섭취를 계속 유지해 보세요.'
                  : healthScore >= 75
                  ? '자가진단 분석상 경미한 이상 반응이 관찰되었습니다. 처방약을 제때 복용하시고 무리한 신체활동을 지양해 주세요.'
                  : '응급 및 주의 등급의 증상 호소가 빈번히 기록되었습니다. 증상이 반복된다면 비대면 진료 또는 병원 내원을 강력히 권장합니다.'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. 진단 요약 및 통계 ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 진단 요약 및 신체 분포</Text>
          
          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>총 자가진단</Text>
              <Text style={styles.statValue}>{totalChecks}회</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>위험도 [경고이상]</Text>
              <Text style={[styles.statValue, { color: '#E53935' }]}>{emergencyChecks + highChecks}회</Text>
            </View>
          </View>

          {/* 불편 부위 순위 */}
          <Text style={styles.subSectionTitle}>가장 많이 진단한 신체 부위</Text>
          {sortedParts.length === 0 ? (
            <Text style={styles.emptyText}>아직 축적된 건강 데이터 분석서가 없습니다.</Text>
          ) : (
            sortedParts.map(([part, count], idx) => (
              <View key={part} style={styles.partRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.partRank}>{idx + 1}</Text>
                  <Text style={styles.partName}>{part}</Text>
                </View>
                <Text style={styles.partCount}>{count}회</Text>
              </View>
            ))
          )}
        </View>

        {/* ── 3. 보호자 자동 전송 카드 ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 보호자 원클릭 안심 리포트 전송</Text>
          <Text style={{ fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 12 }}>
            설정된 안심 연락망 수신처로 현재 주간 분석 PDF 보고서를 보안 채널을 통하여 무상 발송합니다.
          </Text>

          <View style={styles.guardianInfoBox}>
            <Ionicons name="shield-checkmark" size={18} color="#4CAF82" />
            <Text style={styles.guardianInfoText}>
              수신 보호자: <Text style={{ fontWeight: '800' }}>{settings.targetPhoneNumber ? `${settings.targetPhoneNumber} (${settings.targetType === 'senior' ? '어르신' : '아동'} 비상처)` : '김순옥 보호자 (010-9876-5432)'}</Text>
            </Text>
          </View>

          {sendState === 'idle' && (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendReport} activeOpacity={0.85}>
              <Text style={styles.sendBtnText}>보호자에게 건강 보고서 즉시 전송</Text>
            </TouchableOpacity>
          )}

          {(sendState === 'preparing' || sendState === 'sending') && (
            <View style={styles.sendProgressContainer}>
              <ActivityIndicator size="small" color="#4CAF82" />
              <Text style={styles.sendProgressText}>{sendProgress}</Text>
            </View>
          )}

          {sendState === 'success' && (
            <View style={styles.sendSuccessContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF82" />
              <Text style={styles.sendSuccessText}>보호자 전송 성공 완료!</Text>
              <TouchableOpacity style={styles.resetSendBtn} onPress={() => setSendState('idle')}>
                <Text style={styles.resetSendBtnText}>재전송</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── 4. 주기적 건강/자가진단 독려 설정 ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⏰ 생활 습관 및 정기 건강 검진 알림</Text>
          
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.switchLabel}>정기 복약 안내 및 복용 체크</Text>
              <Text style={styles.switchDesc}>오전 9시 혈압약 등 일정 알림</Text>
            </View>
            <Switch
              value={remindMedication}
              onValueChange={handleMedicationChange}
              trackColor={{ false: '#DDD', true: '#A5D6A7' }}
              thumbColor={remindMedication ? '#4CAF82' : '#F5F5F5'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.switchLabel}>주간 정기 자가진단 독려 알림</Text>
              <Text style={styles.switchDesc}>매주 월요일 전신 건강 자가체크</Text>
            </View>
            <Switch
              value={remindSymptomCheck}
              onValueChange={handleSymptomCheckChange}
              trackColor={{ false: '#DDD', true: '#A5D6A7' }}
              thumbColor={remindSymptomCheck ? '#4CAF82' : '#F5F5F5'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.switchLabel}>매일 수분 섭취 및 가벼운 스트레칭</Text>
              <Text style={styles.switchDesc}>2시간 주기 걷기 및 물 섭취 리마인더</Text>
            </View>
            <Switch
              value={remindExercise}
              onValueChange={setRemindExercise}
              trackColor={{ false: '#DDD', true: '#A5D6A7' }}
              thumbColor={remindExercise ? '#4CAF82' : '#F5F5F5'}
            />
          </View>
        </View>

      </ScrollView>
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
  scoreCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  cardSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#4CAF82',
    flexDirection: 'row',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2E7D32',
  },
  scoreUnit: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 10,
    marginLeft: 2,
  },
  healthStatusText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 4,
  },
  healthStatusDesc: {
    fontSize: 11,
    color: '#555555',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4CAF82',
    marginBottom: 8,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingVertical: 10,
  },
  partRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  partRank: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4CAF82',
    marginRight: 10,
  },
  partName: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '600',
  },
  partCount: {
    fontSize: 12,
    color: '#666666',
  },
  guardianInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F9F4',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  guardianInfoText: {
    fontSize: 12,
    color: '#2E7D32',
  },
  sendBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sendProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  sendProgressText: {
    fontSize: 12,
    color: '#666',
  },
  sendSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 14,
    gap: 6,
  },
  sendSuccessText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E7D32',
  },
  resetSendBtn: {
    backgroundColor: 'rgba(76,175,130,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
  },
  resetSendBtnText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
  },
  switchDesc: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 2,
  },
});
