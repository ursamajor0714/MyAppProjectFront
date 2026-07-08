import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSymptomStore } from '../../../store/symptomData';
import { useCartStore } from '../../../store/useCartStore';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { SYMPTOM_CATEGORIES, TYPE_TAGS, PRODUCTS } from '../../../constants/shopData';
import { styles } from './_shop.styles';
import * as SecureStore from 'expo-secure-store';

const SERVER = 'http://192.168.0.100:3000';

const getToken = async () => {
  try {
    let token = await SecureStore.getItemAsync('userToken');
    if (!token && typeof localStorage !== 'undefined') token = localStorage.getItem('userToken');
    return token;
  } catch { return null; }
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  fatigue: '피로회복', immunity: '면역강화', digestion: '소화건강',
  joint: '관절건강', sleep: '수면개선', eye: '눈건강',
  skin: '피부', circulation: '혈액순환', memory: '기억력', women: '여성건강', men: '남성건강'
};


export default function ShopScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<'all' | 'supplement' | 'medical'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [illnessRec, setIllnessRec] = useState<{
    recommendedCategories: string[];
    recommendedTypes: string[];
    illnesses: string[];
    reason: string;
  } | null>(null);
  const [recLoading, setRecLoading] = useState(true);

  const { fromDiagnosis, part, hasWound } = useLocalSearchParams<{ fromDiagnosis?: string; part?: string; hasWound?: string }>();
  const navigation = useNavigation();

  // ── 서버에서 기저질환 기반 추천 데이터 fetch ──
  const fetchIllnessRecommend = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) { setRecLoading(false); return; }
      const res = await fetch(`${SERVER}/api/shop/recommend`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { setRecLoading(false); return; }
      const data = await res.json();
      setIllnessRec(data);
    } catch (e) {
      console.warn('기저질환 추천 fetch 실패:', e);
    } finally {
      setRecLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIllnessRecommend();
  }, [fetchIllnessRecommend]);

  useEffect(() => {
    if (fromDiagnosis === 'true') {
      if (hasWound === 'true') {
        setSelectedMainCategory('medical');
        setSelectedCategory(null);
        setSelectedTag('의약외품');
      } else if (part === 'head') {
        setSelectedMainCategory('supplement');
        setSelectedCategory('sleep');
        setSelectedTag(null);
      } else if (part === 'abdomen') {
        setSelectedMainCategory('supplement');
        setSelectedCategory('digestion');
        setSelectedTag(null);
      } else if (part === 'chest') {
        setSelectedMainCategory('supplement');
        setSelectedCategory('circulation');
        setSelectedTag(null);
      } else if (part === 'neck') {
        setSelectedMainCategory('supplement');
        setSelectedCategory('joint');
        setSelectedTag(null);
      }
    }
  }, [fromDiagnosis, part, hasWound]);

  const { history } = useSymptomStore();
  const { cart } = useCartStore();
  const setModalOpen = useNotificationStore((state) => state.setModalOpen);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const latestDiagnosis = history && history.length > 0 ? history[0] : null;
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 16 }}>
          {/* 알림 아이콘 */}
          <TouchableOpacity
            onPress={() => setModalOpen(true)}
            style={{
              position: 'relative',
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  backgroundColor: '#E53935',
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 장바구니 아이콘 */}
          <TouchableOpacity
            style={styles.cartIconBtn}
            onPress={() => router.push('/shop/cart')}
            activeOpacity={0.8}
          >
            <Text style={styles.cartIconText}>🛒</Text>
            {totalCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, totalCartCount, unreadCount]);

  // ── 기저질환 기반 서버 추천 상품 목록 (API 응답 활용) ──
  const illnessRecommendedProducts = (() => {
    if (!illnessRec || illnessRec.illnesses.length === 0) return [];
    const { recommendedCategories, recommendedTypes } = illnessRec;
    return PRODUCTS
      .filter(p =>
        p.mainCategory === 'supplement' &&
        (recommendedCategories.includes(p.category) || recommendedTypes.includes(p.type))
      )
      .sort((a, b) => {
        // 카테고리 우선순위 가중치 정렬
        const aScore = (recommendedCategories.indexOf(a.category) !== -1 ? 3 : 0)
          + (recommendedTypes.indexOf(a.type) !== -1 ? 1 : 0);
        const bScore = (recommendedCategories.indexOf(b.category) !== -1 ? 3 : 0)
          + (recommendedTypes.indexOf(b.type) !== -1 ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, 8);
  })();

  // ── 최근 자가진단 연동 추천 필터 (Zustand 오프라인) ──
  const recommendedProducts = (() => {
    if (!latestDiagnosis) return [];
    const symptoms = latestDiagnosis.symptoms || [];
    const hasWounds = symptoms.some((s) => s.includes('상처') || s.includes('진물') || s.includes('고름') || s.includes('찰과상'));
    
    if (hasWounds) {
      return PRODUCTS.filter((p) => p.mainCategory === 'medical' && (p.name.includes('밴드') || p.name.includes('거즈') || p.name.includes('소독제')));
    }
    if (latestDiagnosis.part === 'head') {
      return PRODUCTS.filter((p) => p.category === 'sleep' || p.category === 'fatigue' || p.type === '비타민').slice(0, 4);
    }
    if (latestDiagnosis.part === 'abdomen') {
      return PRODUCTS.filter((p) => p.category === 'digestion' || p.type === '유산균').slice(0, 4);
    }
    if (latestDiagnosis.part === 'chest') {
      return PRODUCTS.filter((p) => p.category === 'circulation' || p.name.includes('혈압')).slice(0, 4);
    }
    return PRODUCTS.filter((p) => p.category === 'immunity').slice(0, 4);
  })();

  const filtered = PRODUCTS.filter((p) => {
    const matchesSearch =
      searchText === '' ||
      p.name.includes(searchText) ||
      p.type.includes(searchText);
    const matchesMainCategory = selectedMainCategory === 'all' || p.mainCategory === selectedMainCategory;
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesTag = !selectedTag || p.type === selectedTag;
    return matchesSearch && matchesMainCategory && matchesCategory && matchesTag;
  });

  const handleProductPress = (id: number) => {
    router.push(`/shop/product-detail?id=${id}`);
  };

  return (
    <View style={styles.container}>
      {/* ── 검색창 ── */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="제품명 또는 성분 검색"
          placeholderTextColor="#AAAAAA"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* ── 대분류 세그먼트 탭 ── */}
      <View style={styles.mainTabWrap}>
        {[
          { key: 'all', label: '전체' },
          { key: 'supplement', label: '건강기능식품' },
          { key: 'medical', label: '의약외품·의료기기' },
        ].map((tab) => {
          const isActive = selectedMainCategory === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.mainTab, isActive && styles.mainTabActive]}
              onPress={() => {
                setSelectedMainCategory(tab.key as any);
                setSelectedCategory(null);
                setSelectedTag(null);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.mainTabText, isActive && styles.mainTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 증상별 카테고리 ── */}
      {selectedMainCategory !== 'medical' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
          style={styles.categoryScroll}
        >
          <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => setSelectedCategory(null)}
          >
            <View
              style={[
                styles.categoryIconCircle,
                !selectedCategory && styles.categoryIconCircleActive,
              ]}
            >
              <Text style={styles.categoryIcon}>전체</Text>
            </View>
            <Text
              style={[
                styles.categoryLabel,
                !selectedCategory && styles.categoryLabelActive,
              ]}
            >
              전체
            </Text>
          </TouchableOpacity>

          {SYMPTOM_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() =>
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
              }
            >
              <View
                style={[
                  styles.categoryIconCircle,
                  selectedCategory === cat.id && styles.categoryIconCircleActive,
                ]}
              >
                <Text style={styles.categoryIcon}>
                  {cat.icon === 'Bone' ? '🦴' : cat.icon}
                </Text>
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === cat.id && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── 종류 태그 (보조 필터) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagScrollContent}
        style={styles.tagScroll}
      >
        {TYPE_TAGS.filter(tag => {
          if (selectedMainCategory === 'supplement') return tag !== '의약외품' && tag !== '의료기기';
          if (selectedMainCategory === 'medical') return tag === '의약외품' || tag === '의료기기';
          return true;
        }).map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
            onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
          >
            <Text
              style={[
                styles.tagChipText,
                selectedTag === tag && styles.tagChipTextActive,
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── 상품 리스트 및 추천 영역 ── */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 기저질환 맞춤 추천 섹션 (서버 API 연동) ── */}
        {!recLoading && illnessRec && illnessRec.illnesses.length > 0 && illnessRecommendedProducts.length > 0 && (
          <View style={[styles.recommendSection, { borderLeftColor: '#1976D2', borderLeftWidth: 3, paddingLeft: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>🏥</Text>
              <Text style={[styles.recommendTitle, { color: '#1565C0', flex: 1 }]}>
                기저질환 맞춤 추천
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>
              {illnessRec.reason}
            </Text>
            {/* 추천 카테고리 칩 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              {illnessRec.recommendedCategories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    setSelectedMainCategory('supplement');
                    setSelectedCategory(cat);
                  }}
                  style={{
                    backgroundColor: selectedCategory === cat ? '#1976D2' : '#E3F2FD',
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: selectedCategory === cat ? '#fff' : '#1976D2', fontWeight: '700', fontSize: 12 }}>
                    {CATEGORY_LABEL_MAP[cat] || cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* 추천 상품 가로 스크롤 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendScroll}>
              {illnessRecommendedProducts.map(p => (
                <TouchableOpacity
                  key={`ill-rec-${p.id}`}
                  style={styles.recommendCard}
                  onPress={() => handleProductPress(p.id)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.recommendImg, { backgroundColor: p.color }]}>
                    <Text style={styles.recommendImgText}>{p.type}</Text>
                  </View>
                  <Text style={styles.recommendName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.recommendPrice}>{p.price.toLocaleString()}원</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {recLoading && (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator size="small" color="#1976D2" />
            <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>기저질환 분석 중...</Text>
          </View>
        )}

        {/* 최근 자가진단 맞춤 추천 섹션 (DB 없이 오프라인 Zustand 기반 연동) */}
        {latestDiagnosis && recommendedProducts.length > 0 && (

          <View style={styles.recommendSection}>
            <Text style={styles.recommendTitle}>
              💡 최근 {latestDiagnosis.partLabel} 자가진단 맞춤 추천 상품
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendScroll}
            >
              {recommendedProducts.map((p) => (
                <TouchableOpacity
                  key={`rec-${p.id}`}
                  style={styles.recommendCard}
                  onPress={() => handleProductPress(p.id)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.recommendImg, { backgroundColor: p.color }]}>
                    <Text style={styles.recommendImgText}>{p.type}</Text>
                  </View>
                  <Text style={styles.recommendName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.recommendPrice}>
                    {p.price.toLocaleString()}원
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.resultCount}>총 {filtered.length}개 상품</Text>

        <View style={styles.cardGrid}>
          {filtered.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              activeOpacity={0.85}
              onPress={() => handleProductPress(product.id)}
            >
              <View style={[styles.cardImage, { backgroundColor: product.color }]}>
                <Text style={styles.cardImageText}>{product.type}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.productType}>{product.type}</Text>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productPrice}>
                  {product.price.toLocaleString()}원
                </Text>
                <View style={styles.cardBottomRow}>
                  <Text style={styles.productRating}>⭐ {product.rating}</Text>
                  <Text style={styles.productReview}>
                    리뷰 {product.reviewCount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>해당하는 상품이 없습니다</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}


