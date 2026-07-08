import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../../store/useCartStore';
import { api } from '../../../services/api';
import { triggerInstantNotification } from '../../../utils/notificationHelper';
import { Ionicons } from '@expo/vector-icons';

interface CreditCardItem {
  id: number;
  company: string;
  number: string;
  expiry: string;
  color: string;
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCartStore();

  // 결제 카드 연동 상태
  const [cards, setCards] = useState<CreditCardItem[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  
  // 모달 및 결제 로딩 제어
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 화면 진입 시 카드 목록 조회
  useEffect(() => {
    loadUserCards();
  }, []);

  const loadUserCards = async () => {
    try {
      const data = await api.get('/api/cards');
      setCards(data);
      if (data.length > 0) {
        setSelectedCardId(data[0].id); // 기본 첫번째 카드 선택
      }
    } catch (e) {
      console.warn('결제용 카드 조회 오류:', e);
    }
  };

  // 구매 버튼 클릭 시 분기 처리
  const handlePressCheckout = () => {
    if (cards.length === 0) {
      // 카드가 없으면 마이페이지 유도
      Alert.alert(
        '결제 수단 필요',
        '간편결제 지갑에 등록된 카드가 없습니다. 마이페이지에서 카드를 연동해 주세요.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '카드 등록하러 가기',
            onPress: () => {
              router.push('/(tabs)/profile');
            }
          }
        ]
      );
      return;
    }
    // 카드가 있으면 카드 선택 모달 열기
    setIsPayModalOpen(true);
  };

  // 실제 결제 요청 및 E2E 통보 처리
  const handleConfirmCheckout = async () => {
    if (!selectedCardId) return;
    setIsSubmitting(true);

    try {
      const selectedCard = cards.find(c => c.id === selectedCardId);

      // 백엔드 결제 API 전송 (PortOne 승인 연동)
      const res = await api.post('/api/orders', {
        items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })),
        cardId: selectedCardId,
        amount: totalPrice,
      });

      // OS 즉시 상단 푸시 알람 전송
      await triggerInstantNotification(
        '🛒 결제 및 주문 성공',
        `간편결제(${selectedCard?.company})로 ${totalPrice.toLocaleString()}원 결제가 승인되었습니다. (주문번호: ${res.orderId})`
      );

      Alert.alert(
        '결제 완료',
        `성공적으로 결제 및 주문 접수가 완료되었습니다.\n(결제 수단: ${selectedCard?.company})`,
        [
          {
            text: '확인',
            onPress: () => {
              setIsPayModalOpen(false);
              clearCart(); // 장바구니 비우기
              router.replace('/(tabs)/shop'); // 상점으로 복귀
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('결제 오류', e.message || '결제를 완료하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
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
              onPress={handlePressCheckout}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutBtnText}>구매 진행하기</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── 💳 간편 결제 카드 선택 모달 ── */}
      <Modal visible={isPayModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.payModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💳 간편 결제 카드 선택</Text>
              <TouchableOpacity onPress={() => setIsPayModalOpen(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>결제에 사용할 간편결제 카드를 선택해 주세요.</Text>

            <ScrollView style={styles.cardScroll} showsVerticalScrollIndicator={false}>
              {cards.map((c) => {
                const isSelected = selectedCardId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.cardRadioItem,
                      isSelected && styles.cardRadioItemActive,
                      { borderLeftColor: c.color }
                    ]}
                    onPress={() => setSelectedCardId(c.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardRadioLeft}>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.cardCompanyText}>{c.company}</Text>
                        <Text style={styles.cardNoText}>{c.number}</Text>
                      </View>
                    </View>
                    <View style={[styles.cardMiniChip, { backgroundColor: c.color }]} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.checkoutTotalRow}>
              <Text style={styles.checkoutTotalLabel}>최종 결제 금액</Text>
              <Text style={styles.checkoutTotalPrice}>{totalPrice.toLocaleString()}원</Text>
            </View>

            <TouchableOpacity
              style={[styles.checkoutConfirmBtn, isSubmitting && { backgroundColor: '#A5D6A7' }]}
              onPress={handleConfirmCheckout}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.checkoutConfirmBtnText}>등록된 카드로 결제 승인</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
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

  // 결제 팝업 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  payModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  modalDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  cardScroll: {
    maxHeight: 250,
    marginBottom: 20,
  },
  cardRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderLeftWidth: 5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  cardRadioItemActive: {
    borderColor: '#4CAF82',
    backgroundColor: '#E8F5E9',
  },
  cardRadioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#4CAF82',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF82',
  },
  cardCompanyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  cardNoText: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  cardMiniChip: {
    width: 24,
    height: 16,
    borderRadius: 3,
  },
  checkoutTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
    marginBottom: 16,
  },
  checkoutTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
  },
  checkoutTotalPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E53935',
  },
  checkoutConfirmBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutConfirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
