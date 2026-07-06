import { useState } from 'react';
import axios from 'axios';

export interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface ProductData {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sales: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [recommendations, setRecommendations] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. 장바구니 아이템 담기
  const addToCart = (product: ProductData, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + qty, product.stock) }
            : item
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  // 2. 장바구니 아이템 삭제
  const removeFromCart = (productId: number) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  // 3. 수량 조절
  const updateQuantity = (productId: number, quantity: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
          : item
      )
    );
  };

  const clearCart = () => setItems([]);

  // 4. 총합 금액 계산
  const getCartTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // 5. 기저질환 맞춤 상품 필터 추천 (치매/당뇨/고혈압 등 연계)
  const fetchRecommendations = async (userIllnesses: string[]) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/products');
      const allProducts: ProductData[] = res.data;
      
      // 기저질환 매칭 필터링
      const matched = allProducts.filter(p => {
        // 당뇨병 -> 루테인, 혈압계 등 카테고리 매핑 로직
        if (userIllnesses.includes('당뇨') && p.category === '측정기') return true;
        if (userIllnesses.includes('고혈압') && p.name.includes('혈압')) return true;
        if (userIllnesses.includes('치매') && p.name.includes('영양제')) return true;
        return p.stock > 0;
      });
      setRecommendations(matched.slice(0, 4));
    } catch (e) {
      console.warn('추천 상품 로드 실패 (더미 추천 바인딩)');
      // 기본 추천 리스트 바인딩
      setRecommendations([
        { id: 101, name: '기억력 개선 오메가3', category: '영양제', price: 29000, stock: 99, sales: 12 },
        { id: 102, name: '스마트 혈압계', category: '측정기', price: 49000, stock: 50, sales: 8 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 6. 모의 결제 (주문 승인 및 스토어 재고 차감 반영)
  const checkout = async () => {
    setLoading(true);
    try {
      // 결제 성공 시 각 아이템 재고 수동 차감 및 누적 판매량 API 반영 모의
      for (const item of items) {
        await axios.put(`/api/admin/products/${item.id}`, {
          stock: item.stock - item.quantity,
          sales: (item.stock > 0 ? item.quantity : 0) // 누적 판매 증가
        });
      }
      clearCart();
      return { success: true, message: '결제 및 주문이 완료되었습니다.' };
    } catch (e) {
      console.log('재고 실시간 전송 오류 (모의 결제만 승인 완료)');
      clearCart();
      return { success: true, message: '모의 주문 결제가 완료되었습니다.' };
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    recommendations,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    fetchRecommendations,
    checkout
  };
}
