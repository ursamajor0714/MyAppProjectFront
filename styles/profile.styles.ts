import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', padding: 32 },
  loadingText: { fontSize: 14, color: '#AAA' },
  guestIcon: { fontSize: 52, marginBottom: 16 },
  guestTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  guestSub: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  loginBtn: {
    backgroundColor: '#4CAF82', borderRadius: 28,
    paddingVertical: 15, paddingHorizontal: 48, alignItems: 'center',
  },
  loginBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  logoutText: { fontSize: 13, color: '#E53935', fontWeight: '600' },

  profileSection: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F5',
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#4CAF82', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 34, fontWeight: '700', color: '#FFFFFF' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBtnText: { fontSize: 13 },
  userName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  userEmail: { fontSize: 13, color: '#9E9E9E' },

  card: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
    borderRadius: 28, borderWidth: 1, borderColor: '#EFEFEF',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#4CAF82', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 13,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  infoLabel: { fontSize: 14, color: '#999' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },

  editBtn: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#4CAF82',
    borderRadius: 28, paddingVertical: 15, alignItems: 'center',
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#4CAF82' },
  logoutBtn: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E53935',
    borderRadius: 28, paddingVertical: 15, alignItems: 'center',
  },
  logoutBtnText: { fontSize: 14, fontWeight: '700', color: '#E53935' },

  /* ── 메뉴 목록 스타일 ── */
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9E9E9E',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },

  /* ── 모달 기본 오버레이 및 구조 ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    height: SCREEN_H * 0.85,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  /* ── 자가진단 기록 스타일 ── */
  diagCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  diagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagPart: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222222',
  },
  diagDate: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  diagSymptomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  diagSymptomBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diagSymptomText: {
    fontSize: 11,
    color: '#666666',
  },
  diagBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 10,
  },
  diagRiskText: {
    fontSize: 12,
    fontWeight: '700',
  },
  diagDetailLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF82',
  },

  /* ── 주문 내역 스타일 ── */
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 8,
  },
  orderNo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4CAF82',
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  orderPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  orderDate: {
    fontSize: 11,
    color: '#AAA',
    marginTop: 8,
  },

  /* ── 카드 관리 스타일 ── */
  creditCard: {
    height: 180,
    borderRadius: 22,
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardChip: {
    width: 40,
    height: 28,
    backgroundColor: '#EBE0C0',
    borderRadius: 6,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
    marginVertical: 12,
  },
  cardHolderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHolder: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  cardExpiry: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardDeleteBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardDeleteText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  addCardForm: {
    backgroundColor: '#FAFAFA',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#333',
    marginBottom: 10,
  },
  addCardSubmitBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  addCardSubmitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── GPS/SOS 설정 스타일 ── */
  gpsSection: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  gpsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#4CAF82',
    fontWeight: '800',
  },
  radiusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  radiusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  radiusBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF82',
  },
  radiusBtnText: {
    fontSize: 12,
    color: '#666',
  },
  radiusBtnTextActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  gpsSaveBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  gpsSaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── 보험 서류 자동 청구 스타일 ── */
  claimStepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  claimList: {
    marginBottom: 16,
  },
  claimRadioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    borderRadius: 18,
    marginBottom: 8,
    gap: 12,
  },
  claimRadioBtnActive: {
    borderColor: '#4CAF82',
    backgroundColor: '#F1F9F4',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#4CAF82',
    backgroundColor: '#4CAF82',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  claimItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
  },
  claimItemMeta: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  claimSubmitBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  claimSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  claimLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  claimSuccessIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  claimLoadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  claimLoadingSubText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  claimSuccessBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  claimSuccessBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── 대상자 추가 및 관리 스타일 ── */
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 8,
  },
  targetCardActive: {
    borderColor: '#4CAF82',
    backgroundColor: '#F1F9F4',
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#222222',
  },
  targetAgeText: {
    fontSize: 11,
    color: '#666',
  },
  targetRoleBadge: {
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  targetRoleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#555',
  },
  targetDeleteBtn: {
    padding: 4,
  },
});
