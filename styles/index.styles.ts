import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  greetingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  greetingWrap: { alignItems: 'center', gap: 16 },
  greeting: { fontSize: 30, fontWeight: '900', color: '#1A1A1A' },
  welcomeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  welcome: { fontSize: 20, color: '#4CAF82', fontWeight: '800' },

  bodySection: { flex: 1 },
  bodyArea: { width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F6F5' },
  bodyScaleWrapper: {
    width: SCREEN_W,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 28, borderWidth: 1, borderColor: '#EAEAEA',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  hintIcon: { fontSize: 14 },
  hintLabel: { fontSize: 11, color: '#666', fontWeight: '700' },

  closeBtn: {
    position: 'absolute', right: 18, zIndex: 20,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 28,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 11, color: '#E53935', fontWeight: '800' },
  closeButtonText: { fontSize: 13, color: '#E53935', fontWeight: '800' },

  symptomSection: {
    flex: 1, borderTopWidth: 1, borderTopColor: '#EEEEEE', backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 4
  },
  wizardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5'
  },
  backButton: { padding: 4 },
  backButtonText: { fontSize: 13, color: '#666', fontWeight: '700' },
  stepTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },

  symptomScroll: { flex: 1 },
  symptomScrollContent: { padding: 18, paddingBottom: 32 },

  emptyHint: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyHintEmoji: { fontSize: 44, marginBottom: 14 },
  emptyHintText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, fontWeight: '500' },

  stepContainer: { flex: 1 },
  sectionLabel: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  sectionSubLabel: { fontSize: 12, color: '#888', marginBottom: 16 },

  cardSelectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEB',
    borderRadius: 28, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1
  },
  cardSelectEmoji: { fontSize: 32 },
  cardSelectTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  cardSelectDesc: { fontSize: 11, color: '#888', lineHeight: 15 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  gridCard: {
    width: (SCREEN_W - 36 - 10) / 2,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEB',
    borderRadius: 28, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1
  },
  gridCardEmoji: { fontSize: 28 },
  gridCardLabel: { fontSize: 12, fontWeight: '800', color: '#333', textAlign: 'center' },

  noSymptomsText: { fontSize: 13, color: '#888', textAlign: 'center', paddingVertical: 20 },
  symptomRowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEB',
    borderRadius: 24, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8
  },
  symptomRowCardChecked: { borderColor: '#4CAF82', backgroundColor: '#F1F9F4' },
  symptomRowCardRedFlag: { borderColor: '#FFEBEE', backgroundColor: '#FFF9F9' },
  checkbox: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CCCCCC',
    alignItems: 'center', justifyContent: 'center'
  },
  checkboxChecked: { backgroundColor: '#4CAF82', borderColor: '#4CAF82' },
  checkmark: { fontSize: 11, color: '#FFFFFF', fontWeight: '900' },
  symptomText: { fontSize: 13, color: '#333', fontWeight: '500' },
  symptomTextChecked: { color: '#2E7D32', fontWeight: '700' },
  redFlagBadge: { fontSize: 10, color: '#D32F2F', fontWeight: '700', marginTop: 3 },
  redFlagAlertBox: { backgroundColor: '#FFEBEE', borderRadius: 22, padding: 12, marginVertical: 12 },
  redFlagAlertText: { fontSize: 11, color: '#C62828', fontWeight: '600', lineHeight: 16 },

  intensitySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'space-between', marginTop: 10 },
  intBtn: {
    width: (SCREEN_W - 36 - 28) / 5, height: 42, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#EAEAEA'
  },
  intLow: { backgroundColor: '#E8F5E9' },
  intMed: { backgroundColor: '#FFF3E0' },
  intHigh: { backgroundColor: '#FFEBEE' },
  intBtnSelected: { borderColor: '#1A1A1A', borderWidth: 2.5 },
  intBtnText: { fontSize: 13, fontWeight: '700', color: '#555' },
  intBtnTextSelected: { color: '#000', fontWeight: '900' },

  durationSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  durationChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 28,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EAEAEA'
  },
  durationChipSelected: { backgroundColor: '#E8F5E9', borderColor: '#4CAF82' },
  durationChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
  durationChipTextSelected: { color: '#2E7D32', fontWeight: '800' },

  actionBtn: {
    marginTop: 20, backgroundColor: '#4CAF82', borderRadius: 28,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center'
  },
  actionBtnDisabled: { backgroundColor: '#D9D9D9' },
  actionBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' }
});
