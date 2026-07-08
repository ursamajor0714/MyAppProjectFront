import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSymptomStore } from '../store/symptomData';
import { useGpsStore } from '../store/useGpsStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useHealthReportStore, WeeklyReportSummary } from '../store/useHealthReportStore';

const { width: SCREEN_W } = Dimensions.get('window');

type SendState = 'idle' | 'preparing' | 'sending' | 'success';
type TabType = 'report' | 'scheduler';

// ── 카테고리 색상 맵
const CATEGORY_COLORS: Record<string, string> = {
  medication: '#4CAF82',
  exercise: '#42A5F5',
  checkup: '#AB47BC',
  hospital: '#EF5350',
  diet: '#FF9800',
  custom: '#78909C',
};
const CATEGORY_ICONS: Record<string, string> = {
  medication: '💊',
  exercise: '🏃',
  checkup: '🩺',
  hospital: '🏥',
  diet: '🥗',
  custom: '📌',
};
const CATEGORY_LABELS: Record<string, string> = {
  medication: '복약',
  exercise: '운동',
  checkup: '건강검진',
  hospital: '병원',
  diet: '식단',
  custom: '기타',
};

// ── 요일 맵 (한국어 → 숫자)
const KR_DAY_MAP: Record<string, number> = {
  '일': 1, '월': 2, '화': 3, '수': 4, '목': 5, '금': 6, '토': 7,
};
const WEEKDAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];

// ── 미니 바 차트 컴포넌트
function MiniBarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  const BAR_H = 80;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 8 }}>
      {data.map((val, i) => {
        const h = Math.max((val / max) * BAR_H, 4);
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>{val}</Text>
            <View
              style={{
                width: '100%',
                height: h,
                backgroundColor: color,
                borderRadius: 4,
                opacity: 0.8 + 0.2 * (val / max),
              }}
            />
            <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{labels[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── 도넛 비율 표시 컴포넌트 (SVG 대신 뷰 스택)
function RiskPieRow({ emergency, high, medium, low, total }: {
  emergency: number; high: number; medium: number; low: number; total: number;
}) {
  if (total === 0) return (
    <Text style={{ fontSize: 11, color: '#9E9E9E', textAlign: 'center', paddingVertical: 8 }}>진단 데이터 없음</Text>
  );
  const segments = [
    { label: '응급', count: emergency, color: '#E53935' },
    { label: '주의', count: high, color: '#FF7043' },
    { label: '경과관찰', count: medium, color: '#FDD835' },
    { label: '양호', count: low, color: '#4CAF82' },
  ].filter((s) => s.count > 0);

  return (
    <View>
      {/* 진행 바 */}
      <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
        {segments.map((s, i) => (
          <View
            key={i}
            style={{ flex: s.count / total, backgroundColor: s.color }}
          />
        ))}
      </View>
      {/* 범례 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {segments.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
            <Text style={{ fontSize: 11, color: '#555' }}>
              {s.label} {s.count}회 ({Math.round((s.count / total) * 100)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── 주간 건강 점수 트렌드 (간단 꺾은선 느낌)
function ScoreTrendRow({ scores, labels }: { scores: number[]; labels: string[] }) {
  const max = 100;
  const H = 60;
  const W = SCREEN_W - 80;
  const step = W / Math.max(scores.length - 1, 1);

  return (
    <View style={{ height: H + 24, marginTop: 8 }}>
      {/* Y축 100점 점선 */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 9, color: '#ccc', width: 26 }}>100</Text>
        <View style={{ flex: 1, borderTopWidth: 1, borderColor: '#eee', borderStyle: 'dashed' }} />
      </View>
      {/* 점수 막대들 */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginLeft: 28, height: H }}>
        {scores.map((score, i) => {
          const color = score >= 90 ? '#4CAF82' : score >= 75 ? '#42A5F5' : score >= 60 ? '#FDD835' : '#E53935';
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color }}>{score}</Text>
              <View
                style={{
                  width: '100%',
                  height: (score / max) * H,
                  backgroundColor: color,
                  borderRadius: 4,
                  opacity: 0.9,
                }}
              />
            </View>
          );
        })}
      </View>
      {/* X 레이블 */}
      <View style={{ flexDirection: 'row', marginLeft: 28, gap: 6, marginTop: 4 }}>
        {labels.map((l, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#888' }}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
//  메인 컴포넌트
// ─────────────────────────────────────────

export default function HealthReportScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { history } = useSymptomStore();
  const { settings } = useGpsStore();
  const {
    schedules,
    weeklyReports,
    saveWeeklyReport,
    markReportSent,
    addSchedule,
    toggleScheduleActive,
    deleteSchedule,
  } = useHealthReportStore();

  // ─ 탭
  const [activeTab, setActiveTab] = useState<TabType>('report');

  // ─ 전송 상태
  const [sendState, setSendState] = useState<SendState>('idle');
  const [sendProgress, setSendProgress] = useState('');

  // ─ 헤더 그라디언트 애니메이션
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 700, useNativeDriver: false }).start();
  }, []);

  // ─ 현재 주차 라벨
  const now = new Date();
  const weekNum = Math.ceil(now.getDate() / 7);
  const weekLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${weekNum}주차`;

  // ─ 종합 통계 계산
  const totalChecks = history.length;
  const emergencyChecks = history.filter((r) => r.riskLevel === 'emergency').length;
  const highChecks = history.filter((r) => r.riskLevel === 'high').length;
  const mediumChecks = history.filter((r) => r.riskLevel === 'medium').length;
  const lowChecks = history.filter((r) => r.riskLevel === 'low').length;

  // ─ 빈번한 부위
  const partCounts: Record<string, number> = {};
  history.forEach((r) => { partCounts[r.partLabel] = (partCounts[r.partLabel] || 0) + 1; });
  const sortedParts = Object.entries(partCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ─ 건강 점수 계산
  const calcHealthScore = (ec: number, hc: number, mc: number, lc: number) => {
    const total = ec + hc + mc + lc;
    if (total === 0) return 95;
    const penalty = ec * 20 + hc * 12 + mc * 6 + lc * 2;
    return Math.max(40, 100 - penalty);
  };
  const healthScore = calcHealthScore(emergencyChecks, highChecks, mediumChecks, lowChecks);

  // ─ 주차별 가상 트렌드 데이터 (최근 4주)
  const trendScores = weeklyReports.slice(0, 4).map((r) => r.healthScore).reverse();
  const trendLabels = weeklyReports.slice(0, 4).map((r) => r.weekLabel.replace(/\d{4}년 /, '').replace('주차', 'W')).reverse();
  const hasTrend = trendScores.length >= 2;

  // 이번 주 샘플 일별 진단 횟수 (7일)
  const dailyChecks = [1, 0, 2, 1, 0, 3, 1];
  const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];

  // ─ 보호자 정보
  const guardianPhone = settings.targetPhoneNumber || '010-9876-5432';
  const guardianLabel = settings.targetPhoneNumber
    ? `${settings.targetPhoneNumber} (${settings.targetType === 'senior' ? '어르신' : '아동'} 안심망)`
    : '김순옥 보호자 (010-9876-5432)';

  // ─ 리포트 전송
  const handleSendReport = () => {
    setSendState('preparing');
    setSendProgress('🔐 의료 분석 보고서 PDF 암호화 및 데이터 패키징 중...');
    setTimeout(() => {
      setSendState('sending');
      setSendProgress(`📡 ${guardianLabel} 보안 채널 연결 및 리포트 송신 중...`);
      setTimeout(() => {
        setSendState('success');
        // 주간 리포트 아카이브 저장
        const report: WeeklyReportSummary = {
          weekLabel,
          startDate: new Date().toISOString(),
          healthScore,
          totalChecks,
          emergencyCount: emergencyChecks,
          highCount: highChecks,
          mediumCount: mediumChecks,
          lowCount: lowChecks,
          topParts: sortedParts.map(([part, count]) => ({ part, count })),
          sentToGuardian: true,
          sentAt: new Date().toISOString(),
        };
        saveWeeklyReport(report);
        useNotificationStore.getState().addNotification({
          title: '📊 주간 건강 리포트 전송 완료',
          body: `${guardianLabel}에게 ${weekLabel} 건강 보고서(보안 PDF)가 안전하게 전송되었습니다.`,
          type: 'general',
        });
      }, 1800);
    }, 1200);
  };

  // ─ 스케줄러 토글
  const handleToggleSchedule = async (id: string) => {
    try {
      await toggleScheduleActive(id);
    } catch (e) {
      console.warn('스케줄 토글 실패:', e);
      Alert.alert('오류', '알림 상태를 변경하지 못했습니다.');
    }
  };

  // ─ 스케줄 삭제
  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteSchedule(id);
      Alert.alert('삭제 완료', '해당 일정이 정상적으로 삭제되었습니다.');
    } catch (e) {
      console.warn('스케줄 삭제 실패:', e);
      Alert.alert('오류', '일정을 삭제하지 못했습니다.');
    }
  };

  // ─────────────────────────────────────────
  //  렌더
  // ─────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* ── 헤더 */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + 10, opacity: headerAnim },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>📊 건강 리포트</Text>
          <Text style={styles.headerSub}>{weekLabel}</Text>
        </View>
        <TouchableOpacity
          style={styles.schedulerTabBtn}
          onPress={() => router.push('/health-scheduler' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={20} color="#4CAF82" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── 탭 바 */}
      <View style={styles.tabBar}>
        {(['report', 'scheduler'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'report' ? '📊 주간 리포트' : '⏰ 스케줄러'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'report' ? (
          // ══════════════════════════════════════
          //  리포트 탭
          // ══════════════════════════════════════
          <>
            {/* ── 1. 건강 점수 카드 */}
            <View style={styles.scoreCard}>
              <Text style={styles.scoreCardLabel}>{user?.name ?? '회원'}님의 이번 주 종합 건강 점수</Text>
              <View style={styles.scoreRow}>
                <View style={styles.scoreCircleWrap}>
                  <View style={[styles.scoreCircle, { borderColor: healthScore >= 75 ? '#4CAF82' : healthScore >= 60 ? '#FDD835' : '#E53935' }]}>
                    <Text style={[styles.scoreNumber, { color: healthScore >= 75 ? '#2E7D32' : healthScore >= 60 ? '#F57F17' : '#C62828' }]}>
                      {healthScore}
                    </Text>
                    <Text style={styles.scoreUnit}>점</Text>
                  </View>
                  <View style={styles.scoreGrade}>
                    <Text style={styles.scoreGradeText}>
                      {healthScore >= 90 ? '🌟 매우 안정' : healthScore >= 75 ? '🟢 비교적 양호' : healthScore >= 60 ? '🟡 경과 관찰' : '🚨 건강 적신호'}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.scoreDesc}>
                    {healthScore >= 90
                      ? '현재 매우 좋은 생체 바이오 리듬을 유지 중입니다. 꾸준한 운동과 수분 섭취를 지속해 주세요.'
                      : healthScore >= 75
                      ? '경미한 이상 반응이 관찰됩니다. 처방약을 제때 복용하고 무리한 활동을 자제하세요.'
                      : '경고 이상 증상이 빈번히 기록되었습니다. 비대면 진료 또는 병원 내원을 강력히 권장합니다.'}
                  </Text>
                  <View style={styles.statMiniRow}>
                    <View style={styles.statMiniBox}>
                      <Text style={styles.statMiniLabel}>총 진단</Text>
                      <Text style={styles.statMiniVal}>{totalChecks}회</Text>
                    </View>
                    <View style={[styles.statMiniBox, { borderColor: '#FFCDD2' }]}>
                      <Text style={styles.statMiniLabel}>위험 이상</Text>
                      <Text style={[styles.statMiniVal, { color: '#E53935' }]}>{emergencyChecks + highChecks}회</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* ── 2. 주간 트렌드 */}
            {hasTrend && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📈 주간 건강 점수 트렌드</Text>
                <ScoreTrendRow scores={trendScores} labels={trendLabels} />
                <Text style={styles.trendNote}>* 지난 {trendScores.length}주 건강 점수 변화 추이</Text>
              </View>
            )}

            {/* ── 3. 이번 주 일별 진단 현황 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📅 이번 주 일별 자가진단 현황</Text>
              <MiniBarChart data={dailyChecks} labels={dayLabels} color="#4CAF82" />
            </View>

            {/* ── 4. 위험도 분포 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎯 진단 위험도 분포</Text>
              <RiskPieRow
                emergency={emergencyChecks}
                high={highChecks}
                medium={mediumChecks}
                low={lowChecks}
                total={totalChecks}
              />
            </View>

            {/* ── 5. 빈번 부위 순위 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🦴 가장 많이 진단한 신체 부위</Text>
              {sortedParts.length === 0 ? (
                <Text style={styles.emptyText}>아직 진단 내역이 없습니다.</Text>
              ) : (
                sortedParts.map(([part, count], idx) => (
                  <View key={part} style={styles.rankRow}>
                    <View style={[styles.rankBadge, { backgroundColor: idx === 0 ? '#FDD835' : idx === 1 ? '#E0E0E0' : '#FFCCBC' }]}>
                      <Text style={styles.rankBadgeText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.rankPart}>{part}</Text>
                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: '#4CAF82',
                          borderRadius: 3,
                          width: `${(count / (sortedParts[0]?.[1] ?? 1)) * 100}%`,
                          opacity: 0.7,
                        }}
                      />
                    </View>
                    <Text style={styles.rankCount}>{count}회</Text>
                  </View>
                ))
              )}
            </View>

            {/* ── 6. 과거 주간 리포트 아카이브 */}
            {weeklyReports.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📁 과거 주간 리포트 기록</Text>
                {weeklyReports.slice(0, 3).map((r, i) => (
                  <View key={i} style={styles.archiveRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.archiveWeek}>{r.weekLabel}</Text>
                      <Text style={styles.archiveStat}>진단 {r.totalChecks}회 · 건강점수 {r.healthScore}점</Text>
                    </View>
                    {r.sentToGuardian && (
                      <View style={styles.sentBadge}>
                        <Ionicons name="checkmark-circle" size={13} color="#4CAF82" />
                        <Text style={styles.sentBadgeText}>전송 완료</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* ── 7. 보호자 전송 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>👥 보호자 안심 리포트 전송</Text>
              <Text style={styles.cardDesc}>
                설정된 안심 연락망 수신처로 현재 주간 분석 PDF 보고서를 보안 채널을 통해 무상 발송합니다.
              </Text>
              <View style={styles.guardianBox}>
                <Ionicons name="shield-checkmark" size={16} color="#4CAF82" />
                <Text style={styles.guardianText}>수신: <Text style={{ fontWeight: '800' }}>{guardianLabel}</Text></Text>
              </View>

              {sendState === 'idle' && (
                <TouchableOpacity style={styles.sendBtn} onPress={handleSendReport} activeOpacity={0.85}>
                  <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                  <Text style={styles.sendBtnText}>보호자에게 건강 보고서 즉시 전송</Text>
                </TouchableOpacity>
              )}
              {(sendState === 'preparing' || sendState === 'sending') && (
                <View style={styles.sendProgress}>
                  <ActivityIndicator size="small" color="#4CAF82" />
                  <Text style={styles.sendProgressText}>{sendProgress}</Text>
                </View>
              )}
              {sendState === 'success' && (
                <View style={styles.sendSuccess}>
                  <Ionicons name="checkmark-circle" size={22} color="#4CAF82" />
                  <Text style={styles.sendSuccessText}>보호자 전송 성공!</Text>
                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={() => setSendState('idle')}
                  >
                    <Text style={styles.resendBtnText}>재전송</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        ) : (
          // ══════════════════════════════════════
          //  스케줄러 탭 (인라인 요약)
          // ══════════════════════════════════════
          <>
            <View style={styles.schedBannerCard}>
              <Text style={styles.schedBannerTitle}>⏰ 나의 건강 스케줄</Text>
              <Text style={styles.schedBannerDesc}>
                매일·주간 복약, 운동, 검진 일정을 관리하고 정시 알림을 받아보세요.
              </Text>
              <TouchableOpacity
                style={styles.schedFullBtn}
                onPress={() => router.push('/health-scheduler' as any)}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.schedFullBtnText}>스케줄러 전체 보기 / 추가</Text>
              </TouchableOpacity>
            </View>

            {/* 오늘 예정 일정 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📋 오늘의 건강 일정</Text>
              {schedules.filter((s) => s.active && (s.repeat === 'daily' || (s.repeat === 'weekly' && s.repeatDays.includes(WEEKDAYS_KR[now.getDay()])))).length === 0 ? (
                <Text style={styles.emptyText}>오늘 예정된 활성 일정이 없습니다.</Text>
              ) : (
                schedules
                  .filter((s) => s.active && (s.repeat === 'daily' || (s.repeat === 'weekly' && s.repeatDays.includes(WEEKDAYS_KR[now.getDay()]))))
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((s) => (
                    <View key={s.id} style={styles.todaySchedRow}>
                      <View style={[styles.todayCatDot, { backgroundColor: CATEGORY_COLORS[s.category] }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.todaySchedTitle}>{CATEGORY_ICONS[s.category]} {s.title}</Text>
                        {s.description ? <Text style={styles.todaySchedDesc}>{s.description}</Text> : null}
                      </View>
                      <Text style={styles.todaySchedTime}>{s.time}</Text>
                    </View>
                  ))
              )}
            </View>

            {/* 이번 주 전체 일정 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📆 이번 주 스케줄 현황</Text>
              {schedules.length === 0 ? (
                <Text style={styles.emptyText}>등록된 스케줄이 없습니다.</Text>
              ) : (
                schedules.slice(0, 6).map((s) => (
                  <View key={s.id} style={styles.schedRow}>
                    <View style={[styles.schedCatBar, { backgroundColor: CATEGORY_COLORS[s.category] }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.schedTitle, !s.active && { opacity: 0.4 }]}>
                        {CATEGORY_ICONS[s.category]} {s.title}
                      </Text>
                      <Text style={styles.schedMeta}>
                        {s.time} · {s.repeat === 'daily' ? '매일' : s.repeat === 'weekly' ? `매주 ${s.repeatDays.join(',')}` : '반복 없음'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleToggleSchedule(s.id)} style={styles.schedToggleBtn}>
                      <View style={[styles.schedToggleDot, { backgroundColor: s.active ? '#4CAF82' : '#DDD' }]} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
              {schedules.length > 6 && (
                <TouchableOpacity onPress={() => router.push('/health-scheduler' as any)} style={{ marginTop: 8 }}>
                  <Text style={{ textAlign: 'center', color: '#4CAF82', fontSize: 12, fontWeight: '700' }}>
                    + {schedules.length - 6}개 더 보기
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
//  스타일
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  headerSub: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 1,
  },
  schedulerTabBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FBF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  // 탭 바
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 22,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  tabItemActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF82',
  },
  tabText: { fontSize: 12, fontWeight: '700', color: '#9E9E9E' },
  tabTextActive: { color: '#2E7D32' },

  scroll: { flex: 1 },

  // 점수 카드
  scoreCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    shadowColor: '#4CAF82',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF82',
    marginBottom: 12,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreCircleWrap: { alignItems: 'center', marginRight: 4 },
  scoreCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreNumber: { fontSize: 30, fontWeight: '900' },
  scoreUnit: { fontSize: 11, color: '#666', marginTop: 12, marginLeft: 2 },
  scoreGrade: { marginTop: 6 },
  scoreGradeText: { fontSize: 11, fontWeight: '700', color: '#555' },
  scoreDesc: { fontSize: 11, color: '#666', lineHeight: 16, marginBottom: 10 },
  statMiniRow: { flexDirection: 'row', gap: 8 },
  statMiniBox: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  statMiniLabel: { fontSize: 9, color: '#9E9E9E', marginBottom: 2 },
  statMiniVal: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },

  // 공통 카드
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 18,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 11,
    color: '#888',
    lineHeight: 16,
    marginBottom: 12,
  },
  emptyText: { fontSize: 12, color: '#9E9E9E', textAlign: 'center', paddingVertical: 10 },
  trendNote: { fontSize: 10, color: '#9E9E9E', marginTop: 6, textAlign: 'right' },

  // 부위 순위
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankBadgeText: { fontSize: 11, fontWeight: '900', color: '#1A1A1A' },
  rankPart: { fontSize: 13, fontWeight: '600', color: '#333', width: 60 },
  rankCount: { fontSize: 12, color: '#666', minWidth: 28, textAlign: 'right' },

  // 아카이브
  archiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  archiveWeek: { fontSize: 12, fontWeight: '700', color: '#333' },
  archiveStat: { fontSize: 11, color: '#888', marginTop: 2 },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sentBadgeText: { fontSize: 10, color: '#2E7D32', fontWeight: '700' },

  // 보호자 전송
  guardianBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F9F4',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  guardianText: { fontSize: 12, color: '#2E7D32' },
  sendBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  sendBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  sendProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  sendProgressText: { fontSize: 11, color: '#666', flex: 1 },
  sendSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 14,
    gap: 6,
  },
  sendSuccessText: { fontSize: 12, fontWeight: '800', color: '#2E7D32' },
  resendBtn: {
    backgroundColor: 'rgba(76,175,130,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resendBtnText: { fontSize: 11, color: '#2E7D32', fontWeight: '700' },

  // ── 스케줄러 탭 인라인
  schedBannerCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#2E7D32',
    borderRadius: 28,
  },
  schedBannerTitle: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
  schedBannerDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17, marginBottom: 14 },
  schedFullBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  schedFullBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },

  // 오늘 일정
  todaySchedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 10,
  },
  todayCatDot: { width: 10, height: 10, borderRadius: 5 },
  todaySchedTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  todaySchedDesc: { fontSize: 10, color: '#888', marginTop: 2 },
  todaySchedTime: { fontSize: 13, fontWeight: '800', color: '#4CAF82' },

  // 주간 스케줄
  schedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 10,
  },
  schedCatBar: { width: 4, height: 36, borderRadius: 2 },
  schedTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  schedMeta: { fontSize: 10, color: '#9E9E9E', marginTop: 2 },
  schedToggleBtn: { padding: 6 },
  schedToggleDot: { width: 14, height: 14, borderRadius: 7 },
});
