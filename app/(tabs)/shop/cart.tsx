import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../../store/useCartStore';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCartStore();

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.clearHeaderBtn}
          onPress={() => {
            if (cart.length === 0) return;
            Alert.alert('장바구니 비우기', '전체 상품을 삭제하시겠습니까?', [
              { text: '취소', style: 'cancel' },
              { text: '삭제', onPress: clearCart, style: 'destructive' }
            ]);
          }}
          disabled={cart.length === 0}
        >
          <Text style={[styles.clearBtnText, cart.length === 0 && styles.clearBtnDisabled]}>
            비우기
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, cart.length]);

  const handleCheckout = () => {
    Alert.alert(
      '주문 데모',
      '결제 기능은 준비 중입니다. 장바구니를 비울까요?',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예 (비우기)',
          onPress: () => {
            clearCart();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>

      {cart.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>장바구니가 비어 있습니다.</Text>
          <Text style={styles.emptySubText}>건강 상점에서 필요한 영양제나 의약외품을 담아보세요.</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.shopBtnText}>쇼핑하러 가기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {cart.map((item) => (
              <View key={item.id} style={styles.cartCard}>
                <View style={[styles.itemImg, { backgroundColor: item.color }]}>
                  <Text style={styles.itemImgText}>{item.type}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemType}>{item.type}</Text>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {(item.price * item.quantity).toLocaleString()}원
                  </Text>

                  <View style={styles.controlRow}>
                    <View style={styles.quantityWrap}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      >
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <Text style={styles.removeBtnText}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* ── 결제 바 ── */}
          <View style={[styles.footerBar, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>총 결제 금액</Text>
              <Text style={styles.priceTotal}>{totalPrice.toLocaleString()}원</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutBtnText}>구매 진행하기</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 20, color: '#333' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  clearBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  clearHeaderBtn: { marginRight: 12, paddingVertical: 4, paddingHorizontal: 8 },
  clearBtnText: { fontSize: 13, color: '#FF5252', fontWeight: '700' },
  clearBtnDisabled: { color: '#CCC' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'center',
  },
  itemImg: { width: 70, height: 70, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  itemImgText: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.2)' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemType: { fontSize: 10, color: '#4CAF82', fontWeight: '700', marginBottom: 2 },
  itemName: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },

  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 14,
  },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 14, color: '#555', fontWeight: '700' },
  qtyValue: { width: 24, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  removeBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  removeBtnText: { fontSize: 12, color: '#999', fontWeight: '600' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubText: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  shopBtn: { backgroundColor: '#4CAF82', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 },
  shopBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  footerBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  priceLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
  priceTotal: { fontSize: 20, fontWeight: '900', color: '#E53935' },
  checkoutBtn: { backgroundColor: '#4CAF82', paddingVertical: 14, alignItems: 'center', borderRadius: 26 },
  checkoutBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
