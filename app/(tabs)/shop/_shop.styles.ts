import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 12;
const CARD_W = (SCREEN_W - 16 * 2 - GRID_GAP) / 2;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  cartIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartHeaderBtn: { marginRight: 12, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartIconText: { fontSize: 20 },
  cartBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#E53935', borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center'
  },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: '#333', padding: 0 },

  mainTabWrap: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, backgroundColor: '#F0F0F0', borderRadius: 28, padding: 4 },
  mainTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 24 },
  mainTabActive: { backgroundColor: '#FFFFFF' },
  mainTabText: { fontSize: 12, color: '#666', fontWeight: '600' },
  mainTabTextActive: { color: '#2E7D32', fontWeight: '800' },

  categoryScroll: { marginTop: 16, flexGrow: 0 },
  categoryScrollContent: { paddingHorizontal: 16, gap: 14 },
  categoryItem: { alignItems: 'center', width: 58 },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconCircleActive: {
    backgroundColor: '#4CAF82',
  },
  categoryIcon: { fontSize: 18 },
  categoryLabel: { fontSize: 11, color: '#777', textAlign: 'center' },
  categoryLabelActive: { color: '#2E7D32', fontWeight: '700' },

  tagScroll: { marginTop: 12, flexGrow: 0 },
  tagScrollContent: { paddingHorizontal: 16, gap: 8 },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tagChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF82',
  },
  tagChipText: { fontSize: 12, color: '#777' },
  tagChipTextActive: { color: '#2E7D32', fontWeight: '700' },

  listScroll: { flex: 1, marginTop: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },

  recommendSection: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 16, marginBottom: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#EFEFEF' },
  recommendTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  recommendScroll: { gap: 10 },
  recommendCard: { width: 120, backgroundColor: '#FAFAFA', borderRadius: 18, padding: 8, borderWidth: 1, borderColor: '#EFEFEF' },
  recommendImg: { width: '100%', height: 75, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  recommendImgText: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.25)' },
  recommendName: { fontSize: 11, fontWeight: '700', color: '#333', marginBottom: 2 },
  recommendPrice: { fontSize: 12, fontWeight: '800', color: '#1A1A1A' },

  resultCount: { fontSize: 12, color: '#999', marginBottom: 10 },

  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: GRID_GAP,
  },
  productCard: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: CARD_W * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.25)',
  },
  cardInfo: { padding: 10 },
  productType: { fontSize: 11, color: '#4CAF82', fontWeight: '700', marginBottom: 3 },
  productName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 6, lineHeight: 17 },
  productPrice: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  productRating: { fontSize: 11, color: '#888' },
  productReview: { fontSize: 11, color: '#888' },

  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#AAA' },
});
