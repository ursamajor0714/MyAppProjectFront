import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  // 온보딩 영역
  onboardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  onboardEmoji: { fontSize: 68, marginBottom: 20 },
  onboardTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginBottom: 12 },
  onboardSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  lawAlertBox: { backgroundColor: '#FFF9F9', borderColor: '#FFEBEE', borderWidth: 1.5, borderRadius: 24, padding: 18, marginBottom: 32 },
  lawAlertTitle: { fontSize: 13, fontWeight: '800', color: '#D32F2F', marginBottom: 8 },
  lawAlertText: { fontSize: 12, color: '#C62828', lineHeight: 18, fontWeight: '500' },
  onboardBtn: { backgroundColor: '#4CAF82', borderRadius: 28, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  onboardBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  errorText: { fontSize: 12, color: '#E53935', marginTop: 12, fontWeight: '600' },

  // 헤더
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },

  // 메인 스크롤 콘텐츠
  scrollContent: { padding: 16, paddingBottom: 80, gap: 16 },

  // 공통 카드 레이아웃 (Antigravity 둥글고 뾰족함 없는 스타일)
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSectionTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 14 },
  cardSubTitle: { fontSize: 11, color: '#888', marginBottom: 14, lineHeight: 16 },

  // 가상 지도
  mapContainer: { width: '100%', height: 250, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  mapFallback: { flex: 1, backgroundColor: '#E8F0EC', alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  mapFallbackText: { fontSize: 13, color: '#666', fontWeight: '600' },
  mapOverlayInfo: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 28, paddingVertical: 8, paddingHorizontal: 16,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  mapInfoText: { fontSize: 11, color: '#333', fontWeight: '700' },

  // 시뮬레이터 제어
  simBtnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  simBtn: { flex: 1, backgroundColor: '#F5F5F5', paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  simBtnActive: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#4CAF82' },
  simBtnActiveRed: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#EF5350' },
  simBtnText: { fontSize: 12, color: '#888', fontWeight: '700' },
  simBtnTextActive: { color: '#000', fontWeight: '800' },

  // 경보 배너
  outOfBoundsBanner: {
    backgroundColor: '#FFEBEE', borderColor: '#FFCDD2', borderWidth: 1.5,
    borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12
  },
  bannerEmoji: { fontSize: 24 },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: '#C62828', marginBottom: 2 },
  bannerDesc: { fontSize: 11, color: '#D32F2F', lineHeight: 16, fontWeight: '500' },

  // 폼 입력
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 8 },
  textInput: {
    backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#EAEAEA',
    borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16, fontSize: 13, color: '#333', marginBottom: 16
  },
  toggleGroup: { marginTop: 4 },
  tabToggle: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 24, padding: 4 },
  tabToggleItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20 },
  tabToggleItemActive: { backgroundColor: '#FFFFFF' },
  tabToggleText: { fontSize: 12, color: '#777', fontWeight: '600' },
  tabToggleTextActive: { color: '#4CAF82', fontWeight: '800' },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ageValText: { fontSize: 14, fontWeight: '800', color: '#4CAF82' },
  ageSelectorRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  ageChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EAEAEA' },
  ageChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF82' },
  ageChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
  ageChipTextActive: { color: '#2E7D32', fontWeight: '800' },
  ageRuleDesc: { fontSize: 11, color: '#FF8A80', fontWeight: '700', marginTop: 10, lineHeight: 16 },

  // 기저질환 그리드
  illnessGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  illnessItem: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEB'
  },
  illnessItemActive: { backgroundColor: '#F1F9F4', borderColor: '#4CAF82' },
  illnessText: { fontSize: 12, color: '#777', fontWeight: '600' },
  illnessTextActive: { color: '#2E7D32', fontWeight: '800' },

  // 반경 칩
  radiusRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  radiusChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 18, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EAEAEA' },
  radiusChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF82' },
  radiusChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
  radiusChipTextActive: { color: '#2E7D32', fontWeight: '800' },

  // 체류 시간
  stayScroll: { gap: 8 },
  stayChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EAEAEA' },
  stayChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF82' },
  stayChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
  stayChipTextActive: { color: '#2E7D32', fontWeight: '800' },

  // SOS 카드
  sosCard: { backgroundColor: '#FFF9F9', borderColor: '#FFCDD2' },
  sosCardTitle: { fontSize: 15, fontWeight: '900', color: '#D32F2F', marginBottom: 6 },
  sosCardDesc: { fontSize: 11, color: '#E53935', lineHeight: 16, marginBottom: 16, fontWeight: '500' },
  sosBtn: { backgroundColor: '#D32F2F', borderRadius: 26, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  sosBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  // 법규 플로팅 버튼
  lawFloatingBtn: {
    position: 'absolute', bottom: 16, right: 16,
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#EAEAEA', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4
  },
  lawFloatingIcon: { fontSize: 18, fontWeight: '900', color: '#9E9E9E' },

  // 모달 오버레이
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },

  // 법규 모달 컨테이너
  lawModalContainer: { backgroundColor: '#FFFFFF', borderRadius: 32, width: '100%', maxHeight: '80%', padding: 24 },
  lawModalTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A', marginBottom: 16, textAlign: 'center' },
  lawModalScroll: { maxHeight: SCREEN_W * 0.9 },
  lawModalSectionTitle: { fontSize: 13, fontWeight: '800', color: '#333', marginTop: 12, marginBottom: 6 },
  lawModalBody: { fontSize: 11, color: '#666', lineHeight: 18, fontWeight: '500' },
  lawModalCloseBtn: { backgroundColor: '#4CAF82', borderRadius: 22, paddingVertical: 12, alignItems: 'center', marginTop: 18 },
  lawModalCloseBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  // SOS 카운트다운/알람 모달 컨테이너
  sosModalContainer: { backgroundColor: '#FFFFFF', borderRadius: 36, padding: 28, width: '85%', alignItems: 'center' },
  sosModalContainerAlarm: { backgroundColor: '#FFEBEB' },
  sosCountdownText: { fontSize: 68, fontWeight: '900', color: '#D32F2F', marginBottom: 12 },
  sosCountdownTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginBottom: 8 },
  sosCountdownDesc: { fontSize: 12, color: '#666', textAlign: 'center', lineHeight: 18, marginBottom: 12, fontWeight: '500' },
  sosCountdownWarning: { fontSize: 10, color: '#E53935', textAlign: 'center', lineHeight: 14, marginBottom: 20, fontWeight: '600' },
  sosAlarmIcon: { fontSize: 52, marginBottom: 12 },
  sosAlarmTitle: { fontSize: 18, fontWeight: '900', color: '#D32F2F', marginBottom: 8 },
  sosAlarmDesc: { fontSize: 12, color: '#C62828', textAlign: 'center', lineHeight: 18, marginBottom: 24, fontWeight: '600' },
  sosCancelBtn: { backgroundColor: '#1A1A1A', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 32, alignItems: 'center' },
  sosCancelBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  // 연동 설정 관련 스타일
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  statusRowLabel: { fontSize: 12, fontWeight: '700', color: '#666' },
  statusChip: { backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusChipLinked: { backgroundColor: '#E8F5E9' },
  statusChipPending: { backgroundColor: '#FFF3E0' },
  statusChipText: { fontSize: 11, fontWeight: '800', color: '#888' },
  statusChipTextLinked: { color: '#2E7D32' },
  statusChipTextPending: { color: '#E65100' },

  phoneInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 16 },
  linkReqBtn: { backgroundColor: '#4CAF82', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  linkReqBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  disconnectBtn: { backgroundColor: '#FFEBEB', borderWidth: 1.5, borderColor: '#EF5350', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  disconnectBtnText: { fontSize: 13, fontWeight: '800', color: '#D32F2F' },
  simulateAcceptBtn: { backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#2196F3', borderRadius: 20, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  simulateAcceptBtnText: { fontSize: 12, fontWeight: '800', color: '#1E88E5' },
});
