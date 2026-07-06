import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRODUCTS } from '../../../constants/shopData';
import { useCartStore } from '../../../store/useCartStore';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const { addToCart, cart } = useCartStore();
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const product = PRODUCTS.find((p) => p.id === Number(id));

  if (!product) {
    return (
      <View style={styles.notFoundWrap}>
        <Text style={styles.notFoundText}>상품을 찾을 수 없습니다</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.notFoundBtn}>
          <Text style={styles.notFoundBtnText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalPrice = product.price * quantity;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      color: product.color,
      type: product.type
    }, quantity);

    Alert.alert(
      '장바구니 담기 완료',
      '장바구니에 상품을 추가했습니다. 장바구니로 이동하시겠습니까?',
      [
        { text: '쇼핑 계속하기', style: 'cancel' },
        { text: '장바구니 이동', onPress: () => router.push('/shop/cart') }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ── 이미지 ── */}
        <View style={[styles.productImage, { backgroundColor: product.color }]}>
          <Text style={styles.productImageText}>{product.type}</Text>
        </View>

        {/* ── 기본 정보 ── */}
        <View style={styles.infoSection}>
          <Text style={styles.productType}>{product.type}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>⭐ {product.rating}</Text>
            <Text style={styles.reviewText}>
              리뷰 {product.reviewCount.toLocaleString()}개
            </Text>
          </View>

          <Text style={styles.price}>{product.price.toLocaleString()}원</Text>
        </View>

        <View style={styles.divider} />

        {/* ── 상품 설명 ── */}
        <View style={styles.descSection}>
          <Text style={styles.sectionTitle}>상품 설명</Text>
          <Text style={styles.descText}>{product.desc}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── 상세 정보 및 성분 스펙 ── */}
        <View style={styles.descSection}>
          <Text style={styles.sectionTitle}>성분 및 규격</Text>
          <Text style={styles.descText}>{product.nutrition}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── 섭취/사용 가이드 ── */}
        <View style={styles.descSection}>
          <Text style={styles.sectionTitle}>섭취/사용 안내</Text>
          <View style={styles.guideRow}>
            <Text style={styles.guideLabel}>방법</Text>
            <Text style={styles.guideValue}>{product.dosage}</Text>
          </View>
          <View style={styles.guideRow}>
            <Text style={styles.guideLabel}>주의사항</Text>
            <Text style={styles.guideValue}>{product.warning}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── 하단 구매/장바구니 바 ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.quantityWrap}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => q + 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.buyBtn} 
          activeOpacity={0.85}
          onPress={handleAddToCart}
        >
          <Text style={styles.buyBtnText}>
            장바구니 담기 ({totalPrice.toLocaleString()}원)
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 플로팅 장바구니 버튼 ── */}
      <TouchableOpacity
        style={[styles.floatingCartBtn, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/shop/cart')}
        activeOpacity={0.85}
      >
        <Text style={styles.floatingCartIcon}>🛒</Text>
        {totalCartCount > 0 && (
          <View style={styles.floatingCartBadge}>
            <Text style={styles.floatingCartBadgeText}>{totalCartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 20, color: '#333' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  productImage: {
    width: SCREEN_W,
    height: SCREEN_W * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageText: { fontSize: 20, fontWeight: '900', color: 'rgba(0,0,0,0.15)' },

  infoSection: { padding: 18 },
  productType: { fontSize: 12, color: '#4CAF82', fontWeight: '700', marginBottom: 6 },
  productName: { fontSize: 19, fontWeight: '800', color: '#1A1A1A', marginBottom: 10, lineHeight: 26 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  ratingText: { fontSize: 13, color: '#666' },
  reviewText: { fontSize: 13, color: '#999' },
  price: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },

  divider: { height: 8, backgroundColor: '#FAFAFA' },

  descSection: { padding: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  descText: { fontSize: 14, color: '#555', lineHeight: 22 },

  guideRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  guideLabel: { width: 80, fontSize: 13, color: '#999', fontWeight: '700' },
  guideValue: { flex: 1, fontSize: 13, color: '#333', lineHeight: 18 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  quantityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
  },
  qtyBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, color: '#555', fontWeight: '700' },
  qtyValue: { width: 28, textAlign: 'center', fontSize: 14, fontWeight: '700', color: '#1A1A1A' },

  buyBtn: {
    flex: 1,
    backgroundColor: '#4CAF82',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buyBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  notFoundWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFoundText: { fontSize: 14, color: '#999' },
  notFoundBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  notFoundBtnText: { fontSize: 13, color: '#555' },

  floatingCartBtn: {
    position: 'absolute',
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4CAF82',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  floatingCartIcon: { fontSize: 24 },
  floatingCartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E53935',
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
});
