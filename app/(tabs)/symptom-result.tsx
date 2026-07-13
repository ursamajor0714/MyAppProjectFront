import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSymptomStore, RED_FLAGS, DiagnosisRecord } from '../../store/symptomData';
import { useNotificationStore } from '../../store/useNotificationStore';

const RISK_LABELS = {
  low: { label: '경미 (자가관리)', color: '#2E7D32', bg: '#E8F5E9', desc: '휴식과 균형 잡힌 식습관으로 호전 가능한 가벼운 증상입니다.' },
  medium: { label: '주의 (경과 관찰)', color: '#E65100', bg: '#FFF3E0', desc: '증상이 지속되거나 악화될 경우 병의원 내원이 필요한 상태입니다.' },
  high: { label: '경고 (병원 방문 권장)', color: '#C62828', bg: '#FFEBEE', desc: '24시간 이내에 진료를 받아보시기를 권장합니다.' },
  emergency: { label: '응급 (즉시 내원 또는 119)', color: '#D32F2F', bg: '#FFEBEE', desc: '생명이 위험할 수 있는 급성 증상입니다. 즉시 가까운 응급센터를 찾거나 119 구급대를 호출하십시오.' }
};

export default function SymptomResultScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history } = useSymptomStore();
  
  const setModalOpen = useNotificationStore((state) => state.setModalOpen);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const record = history.find((r: DiagnosisRecord) => r.id === id);

  if (!record) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>진단 기록을 찾을 수 없습니다.</Text>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isEmergency = record.riskLevel === 'emergency';
  const isHigh = record.riskLevel === 'high';
  const hasRedFlag = record.symptoms.some((s: string) => RED_FLAGS.includes(s));
  const risk = RISK_LABELS[record.riskLevel as keyof typeof RISK_LABELS];

  // Self-care advice matching
  const getSelfCareAdvice = (cause: string) => {
    if (cause.includes('뇌신경계')) return '뇌경색/뇌출혈 골든타임은 3시간입니다. 한쪽 마비, 발음 어눌함이 생겼다면 즉시 이동하세요.';
    if (cause.includes('심혈관계')) return '가슴 통증과 함께 턱, 어깨 등으로 통증이 퍼진다면 심장마비 위험이 큽니다. 움직임을 멈추고 119를 부르세요.';
    if (cause.includes('근골격계')) return '무리한 관절 및 근육 사용을 멈추고 환부를 심장보다 높이 올린 채 냉찜질(RICE 요법)을 하세요.';
    if (cause.includes('소화기')) return '미지근한 물을 자주 마시고 장을 편안하게 비워주세요. 복부 우하단(맹장) 통증이 심해지면 병원을 급히 찾으십시오.';
    if (cause.includes('편두통')) return '시각/청각적 자극을 최소화하고 어두운 방에서 조용히 안정을 취하는 것이 두통 경감에 효과적입니다.';
    if (cause.includes('역류성')) return '식사 후 2-3시간 내에 눕지 마시고 자극적인 음식, 카페인, 야식을 제한하십시오.';
    if (cause.includes('피부')) return '해당 부위를 긁지 말고 미지근한 물로 세척하십시오. 증상이 번지면 항히스타민제 처방이 필요합니다.';
    return '충분한 수면과 균형 있는 영양 섭취를 권장합니다. 증상 기록을 지속 관리하십시오.';
  };

  return (
    <View style={styles.container}>
      {/* ── 헤더 ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.headerBackBtn}>
          <Text style={styles.headerBackBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>자가진단 분석결과</Text>
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ── 요약 카드 ── */}
        <View style={styles.summaryCard}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>진단 부위</Text>
              <Text style={styles.partVal}>{record.partLabel} ({record.isInternal ? '내부 문제' : '외부 문제'})</Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: risk.bg }]}>
              <Text style={[styles.riskText, { color: risk.color }]}>{risk.label}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>체크한 증상</Text>
          <View style={styles.tagWrap}>
            {record.symptoms.map((s: string, idx: number) => (
              <View key={idx} style={[styles.tag, RED_FLAGS.includes(s) && styles.redTag]}>
                <Text style={[styles.tagText, RED_FLAGS.includes(s) && styles.redTagText]}>
                  {RED_FLAGS.includes(s) ? '🚨 ' : ''}{s}
                </Text>
              </View>
            ))}
          </View>

          {!hasRedFlag && (
            <View style={{ marginTop: 14 }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>통증 강도</Text>
                  <Text style={styles.valText}>{record.intensity} / 10</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>지속 시간</Text>
                  <Text style={styles.valText}>{record.duration}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── 면책 고지 고정 표시 ── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            💡 본 서비스는 입력하신 증상 기반 참고용 정보로, 정확한 진단을 위한 전문 의료 자문이 아님을 고지합니다.
          </Text>
        </View>

        {/* ── 진단 추정 질환군 ── */}
        <Text style={styles.sectionTitle}>추정 의심 원인</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.causeIcon}>🔬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.causeTitle}>{record.inferredCause}</Text>
              <Text style={styles.causeDesc}>{record.inferredCauseDesc || risk.desc}</Text>
            </View>
          </View>
        </View>

        {/* ── 대응 조치 가이드 ── */}
        <Text style={styles.sectionTitle}>대응 가이드 및 자가 관리</Text>
        <View style={styles.card}>
          <Text style={styles.guideContent}>
            {record.selfCareAdvice || getSelfCareAdvice(record.inferredCause)}
          </Text>
        </View>

        {/* ── 비상 연락 / 행동 제안 ── */}
        {(isEmergency || isHigh) ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ 고위험 경고 알림</Text>
            <Text style={styles.warningText}>
              선택된 증상은 지체 시 신경계 손상이나 급성 쇼크 등 합병증으로 이어질 위험이 높습니다. 병의원 방문을 최우선으로 결정하십시오.
            </Text>
          </View>
        ) : null}



        {/* ── 행동 이동 버튼 (비대면 연결 및 모든 증상 연동 지원) ── */}
        <View style={{ gap: 8, marginTop: 12, width: '100%' }}>
          <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => router.replace({
                pathname: '/clinic-hospitals',
                params: {
                  fromDiagnosis: 'true',
                  reportId: record.id
                }
              })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionEmoji}>🏥</Text>
              <Text style={styles.actionBtnText}>주변 병원 찾기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnTertiary}
              onPress={() => router.replace({
                pathname: '/telemedicine',
                params: {
                  fromResult: 'true',
                  reportId: record.id
                }
              })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionEmoji}>📞</Text>
              <Text style={styles.actionBtnTextTertiary}>비대면 진료받기</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionBtnSecondary, { flex: 0, width: '100%' }]}
            onPress={() => {
              const symptoms = record.symptoms || [];
              const hasWounds = symptoms.some((s) => s.includes('상처') || s.includes('진물') || s.includes('고름') || s.includes('찰과상'));
              router.replace({
                pathname: '/shop',
                params: {
                  fromDiagnosis: 'true',
                  part: record.part,
                  hasWound: hasWounds ? 'true' : 'false'
                }
              });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.actionEmoji}>💊</Text>
            <Text style={styles.actionBtnTextSecondary}>관련 건강보조제 쇼핑몰 보기</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
  headerBackBtnText: { fontSize: 20, color: '#333' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 30, borderWidth: 1, borderColor: '#EFEFEF',
    padding: 18, marginBottom: 16
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { fontSize: 11, color: '#999', marginBottom: 4, fontWeight: '600' },
  partVal: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  valText: { fontSize: 14, fontWeight: '700', color: '#333' },
  riskBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 24 },
  riskText: { fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 14 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 11, color: '#2E7D32', fontWeight: '700' },
  redTag: { backgroundColor: '#FFEBEE' },
  redTagText: { color: '#C62828' },

  noticeBox: { backgroundColor: '#FFF8E1', borderRadius: 24, padding: 14, marginBottom: 20 },
  noticeText: { fontSize: 11, color: '#8D6E00', lineHeight: 17, fontWeight: '600' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 10, marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 28, borderWidth: 1, borderColor: '#EFEFEF',
    padding: 16, marginBottom: 16
  },
  causeIcon: { fontSize: 24 },
  causeTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  causeDesc: { fontSize: 12, color: '#666', lineHeight: 18, fontWeight: '500' },
  guideContent: { fontSize: 13, color: '#333', lineHeight: 21, fontWeight: '500' },

  warningBox: {
    backgroundColor: '#FFEBEE', borderRadius: 26, padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: '#FFCDD2'
  },
  warningTitle: { fontSize: 13, fontWeight: '800', color: '#C62828', marginBottom: 6 },
  warningText: { fontSize: 12, color: '#D32F2F', lineHeight: 18, fontWeight: '500' },

  actionWrap: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtnPrimary: {
    flex: 1, backgroundColor: '#4CAF82', borderRadius: 28,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 4, flexDirection: 'row'
  },
  actionEmoji: { fontSize: 16 },
  actionBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  actionBtnSecondary: {
    flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#4CAF82',
    borderRadius: 28, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 4, flexDirection: 'row'
  },
  actionBtnTextSecondary: { fontSize: 11, fontWeight: '800', color: '#4CAF82', textAlign: 'center' },
  actionBtnTertiary: {
    flex: 1, backgroundColor: '#E8F5E9', borderWidth: 1.5, borderColor: '#4CAF82',
    borderRadius: 28, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 4, flexDirection: 'row'
  },
  actionBtnTextTertiary: { fontSize: 11, fontWeight: '800', color: '#2E7D32', textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  errorText: { fontSize: 14, color: '#999', fontWeight: '700' },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#F0F0F0', borderRadius: 22 },
  backBtnText: { fontSize: 13, color: '#555', fontWeight: '700' }
});
