import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useSymptomStore } from '../store/symptomData';
import { useAuthStore } from '../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export default function ResumeClinicScreen() {
  const insets = useSafeAreaInsets();
  const { history, loadHistory } = useSymptomStore();
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const latestRecord = history[0];

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFaceToFace = () => {
    if (!latestRecord) return;
    router.push({
      pathname: '/clinic-hospitals',
      params: {
        fromDiagnosis: 'true',
        reportId: latestRecord.id,
      }
    } as any);
  };

  const handleTelemedicine = () => {
    if (!latestRecord) return;
    router.push({
      pathname: '/telemedicine-empty',
      params: {
        fromDiagnosis: 'true',
        reportId: latestRecord.id,
      }
    } as any);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'emergency': return '#E53935';
      case 'high': return '#FB8C00';
      case 'medium': return '#FDD835';
      default: return '#4CAF50';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'emergency': return '🚨 응급 (즉시 내원)';
      case 'high': return '⚠️ 경고 (의사 진료 필요)';
      case 'medium': return '💡 주의 (경과 관찰)';
      default: return '🟢 경미 (자가 관리)';
    }
  };

  return (
    <View style={styles.container}>
      {/* ── 헤더 ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기존 진료 이어받기</Text>
        <View style={{ width: 32 }} />
      </View>

      {!latestRecord ? (
        <View style={styles.emptyContent}>
          <Ionicons name="pulse" size={80} color="#8B5CF6" style={{ marginBottom: 8 }} />
          <Text style={styles.emptyTitle}>새로운 비대면/대면 진료 접수</Text>
          <Text style={styles.emptySub}>
            대기 중인 최근 자가진단 내역이 없습니다. 바로 진료 가능한 주변 병원을 조회하시겠습니까?
          </Text>
          <TouchableOpacity 
            style={styles.emptyBtn} 
            activeOpacity={0.85}
            onPress={() => router.replace('/clinic-hospitals')}
          >
            <Text style={styles.emptyBtnText}>새로운 진료 받기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 이전 자가진단 요약 카드 */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>🩺 최근 자가진단 분석 결과</Text>
              <Text style={styles.cardHeaderDate}>{new Date(latestRecord.timestamp).toLocaleDateString()}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>진단 부위</Text>
              <Text style={styles.infoValue}>{latestRecord.partLabel} ({latestRecord.isInternal ? '내부' : '외부'})</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>추정 원인</Text>
              <Text style={[styles.infoValue, { fontWeight: '800', color: '#8B5CF6' }]}>{latestRecord.inferredCause}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>선택한 증상</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{latestRecord.symptoms.join(', ')}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>위험 레벨</Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(latestRecord.riskLevel) }]}>
                <Text style={styles.riskBadgeText}>{getRiskLabel(latestRecord.riskLevel)}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>진료 방식 선택</Text>
          <Text style={styles.sectionSub}>최근 분석된 원인 결과지를 토대로 즉각 병원 진료를 신청합니다.</Text>

          {/* 대면 진료 버튼 */}
          <TouchableOpacity style={[styles.choiceBtn, { borderColor: '#BA68C8' }]} activeOpacity={0.9} onPress={handleFaceToFace}>
            <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="business" size={28} color="#BA68C8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.choiceTitle}>🏥 대면 진료 예약하기</Text>
              <Text style={styles.choiceDesc}>근처 협력 병원을 예약하여 대기 없이 직접 방문 후 내원 진료를 진행합니다.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AAA" />
          </TouchableOpacity>

          {/* 비대면 진료 버튼 */}
          <TouchableOpacity style={[styles.choiceBtn, { borderColor: '#4DB6AC' }]} activeOpacity={0.9} onPress={handleTelemedicine}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2F1' }]}>
              <Ionicons name="videocam" size={28} color="#4DB6AC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.choiceTitle}>📹 비대면 화상 진료받기</Text>
              <Text style={styles.choiceDesc}>실시간 원격 전면 카메라 화상 연결을 거쳐 의사 대면 및 처방전을 즉시 수령합니다.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AAA" />
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  headerBackBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#333', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  emptyBtn: { backgroundColor: '#8B5CF6', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 24 },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },

  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  cardHeaderDate: { fontSize: 12, color: '#999' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
  infoValue: { fontSize: 13, color: '#222', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 20 },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  riskBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginTop: 8 },
  sectionSub: { fontSize: 12, color: '#777', marginBottom: 8 },

  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  choiceTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  choiceDesc: { fontSize: 11, color: '#666', lineHeight: 15 }
});
