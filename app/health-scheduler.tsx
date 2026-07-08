import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function HealthSchedulerPlanScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⏰ 건강 스케줄러 (기획 단계)</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerCard}>
          <Text style={styles.bannerEmoji}>💡</Text>
          <Text style={styles.bannerTitle}>생활 알림 스케줄러 기획 명세</Text>
          <Text style={styles.bannerDesc}>
            본 화면은 스케줄러 UI 완성에 앞서 기획 명세 및 로컬 푸시 연계 로드맵을 확인하는 페이지입니다.
          </Text>
        </View>

        {/* 기획 1 */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>1. 기능 개요</Text>
          <Text style={styles.cardText}>
            • 어르신 및 아동의 복약 외 생활 습관을 관리하기 위한 카테고리화 알림 제공.{"\n"}
            • 각 스케줄에 따른 스마트폰 OS 레벨 푸시(expo-notifications) 실시간 자동 스케줄링.
          </Text>
        </View>

        {/* 기획 2 */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>2. 지원 예정 카테고리</Text>
          <Text style={styles.cardText}>
            • 🏃 운동: 아침 스트레칭, 관절 강화 걷기 등{"\n"}
            • 🥗 식단: 고혈압 식이요법 저녁, 당뇨 제한 당 섭취 알림{"\n"}
            • 🩺 건강검진: 6개월 주기 안저검사 알림{"\n"}
            • 📌 커스텀: 개인화 생활 약속 및 기타 습관 설정
          </Text>
        </View>

        {/* 기획 3 */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>3. UI 및 인터랙션 설계 로드맵</Text>
          <Text style={styles.cardText}>
            • 복약 알림과 같이 휠 다이얼 시간 선택 모달 제공.{"\n"}
            • 요일별 반복 활성화 칩 및 스와이프 활성/비활성 제어.{"\n"}
            • 스케줄 완료(체크) 기록을 바탕으로 주간 건강 리포트 통계와 연동.
          </Text>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={() => router.back()}>
          <Text style={styles.confirmBtnText}>이전 화면으로 돌아가기</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  bannerCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  bannerEmoji: { fontSize: 32, marginBottom: 8 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#2E7D32', marginBottom: 4 },
  bannerDesc: { fontSize: 12, color: '#4CAF50', textAlign: 'center', lineHeight: 18 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  cardText: { fontSize: 12, color: '#666666', lineHeight: 20 },
  confirmBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
