import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useSymptomStore } from '../../store/symptomData';
import { useGpsStore } from '../../store/useGpsStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import {
  validateCardNumber,
  validateCardExpiry,
  validateName,
  validateAge,
  validatePhone,
} from '../../utils/validation';
import { styles } from '../../styles/profile.styles';

// ── 카드 및 대상자 타입 정의 ──
interface CreditCardItem {
  id: string;
  company: string;
  number: string;
  expiry: string;
  color: string;
}

interface GuardianTarget {
  id: string;
  name: string;
  type: 'senior' | 'child';
  age: number;
  phone: string;
  active: boolean;
}

type ClaimStep = 'form' | 'loading' | 'success';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn, isLoading, user, logout, updateUser, loadFromStorage } = useAuthStore();
  const { history } = useSymptomStore();
  const { settings, updateSettings, fetchSettingsFromServer } = useGpsStore();

  // 모달 제어 상태
  const [activeModal, setActiveModal] = useState<'none' | 'diagnosis' | 'gps' | 'insurance' | 'orders' | 'cards'>('none');

  // 1. 카드 관리 상태
  const [cards, setCards] = useState<CreditCardItem[]>([
    { id: '1', company: '신한 국민행복카드', number: '4518-****-****-9018', expiry: '12/29', color: '#1E3A8A' },
    { id: '2', company: '현대 메디케어카드', number: '5412-****-****-0122', expiry: '06/31', color: '#374151' },
  ]);
  const [newCardCompany, setNewCardCompany] = useState('');
  const [newCardNo, setNewCardNo] = useState('');
  const [newCardExp, setNewCardExp] = useState('');

  // 2. 주문 내역 데이터 (상품 디테일 연동용)
  const [orders] = useState([
    { id: 'OD-20260702-88', name: '데일리 멀티비타민 90정', price: '18,900', date: '2026-07-02', status: '배송중', productId: 1 },
    { id: 'OD-20260628-12', name: '루테인 지아잔틴 눈건강 60캡슐', price: '21,900', date: '2026-06-28', status: '배송완료', productId: 5 },
    { id: 'OD-20260615-03', name: '가정용 스마트 자동 혈압계', price: '55,000', date: '2026-06-15', status: '배송완료', productId: 55 },
  ]);

  // 3. 비대면 진료 내역 데이터 (보험 청구 전용)
  const [telemedicineRecords] = useState([
    { id: 'T-20260702-01', hospital: '서울이비인후과', doctor: '김민준 의사', date: '2026-07-02', diagnosis: '급성 상기도염 (감기)', cost: '8,400원' },
    { id: 'T-20260630-05', hospital: '가정의학과 건강의원', doctor: '이지혜 의사', date: '2026-06-30', diagnosis: '역류성 식도염 및 소화불량', cost: '12,500원' },
    { id: 'T-20260624-03', hospital: '바른정형외과', doctor: '최재혁 의사', date: '2026-06-24', diagnosis: '발목 관절 염좌 및 통증', cost: '21,000원' },
  ]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState('현대해상');
  const [claimMethod, setClaimMethod] = useState<'app' | 'fax'>('fax');
  const [claimFaxNo, setClaimFaxNo] = useState('02-730-1011');
  const [claimStep, setClaimStep] = useState<ClaimStep>('form');
  const [claimLoadingText, setClaimLoadingText] = useState('의료 데이터 분석 및 서류 추출 중...');

  // 4. 안심 GPS 보호 대상자 목록 및 추가
  const [targets, setTargets] = useState<GuardianTarget[]>([
    { id: '1', name: '이순재', type: 'senior', age: 78, phone: '010-9876-5432', active: true },
    { id: '2', name: '김지아', type: 'child', age: 7, phone: '010-1234-5678', active: false },
  ]);
  const [newTargetName, setNewTargetName] = useState('');
  const [newTargetAge, setNewTargetAge] = useState('');
  const [newTargetPhone, setNewTargetPhone] = useState('');
  const [newTargetType, setNewTargetType] = useState<'senior' | 'child'>('senior');

  // GPS 상세 설정 임시 상태
  const [gpsTargetType, setGpsTargetType] = useState<'senior' | 'child'>('senior');
  const [gpsTargetAge, setGpsTargetAge] = useState('');
  const [gpsSafetyRadius, setGpsSafetyRadius] = useState(300);
  const [gpsStayTime, setGpsStayTime] = useState('2시간');
  const [gpsPhone, setGpsPhone] = useState('');

  useEffect(() => {
    loadFromStorage();
    if (isLoggedIn) {
      fetchSettingsFromServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // GPS 모달 오픈 시 기존 상태 복사
  const handleOpenGpsModal = () => {
    // 활성화된 보호 대상 정보로 세팅
    const activeTarget = targets.find(t => t.active) || targets[0];
    setGpsTargetType(activeTarget.type);
    setGpsTargetAge(String(activeTarget.age));
    setGpsSafetyRadius(settings.safetyRadius || 300);
    setGpsStayTime(settings.stayTimeLimit || '2시간');
    setGpsPhone(activeTarget.phone);
    setActiveModal('gps');
  };

  // 보호 대상자 선택
  const handleSelectTarget = (id: string) => {
    const updated = targets.map(t => {
      if (t.id === id) {
        setGpsTargetType(t.type);
        setGpsTargetAge(String(t.age));
        setGpsPhone(t.phone);
        return { ...t, active: true };
      }
      return { ...t, active: false };
    });
    setTargets(updated);
  };

  // 보호 대상자 삭제
  const handleDeleteTarget = (id: string) => {
    if (targets.length <= 1) {
      Alert.alert('삭제 불가', '최소 1명 이상의 보호 대상자가 등록되어 있어야 합니다.');
      return;
    }
    const target = targets.find(t => t.id === id);
    Alert.alert('대상자 삭제', `정말 ${target?.name} 보호 대상자를 안심 설정에서 제거하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          const filtered = targets.filter(t => t.id !== id);
          if (target?.active) {
            filtered[0].active = true;
            setGpsTargetType(filtered[0].type);
            setGpsTargetAge(String(filtered[0].age));
            setGpsPhone(filtered[0].phone);
          }
          setTargets(filtered);

          useNotificationStore.getState().addNotification({
            title: '📍 보호 대상 제거',
            body: `${target?.name} 보호 대상자가 관리 목록에서 제거되었습니다.`,
            type: 'gps',
          });
        }
      }
    ]);
  };

  // 보호 대상자 추가
  const handleCreateTarget = () => {
    if (!validateName(newTargetName)) {
      Alert.alert('입력 오류', '보호 대상자의 성함은 한글/영문 2자 이상 15자 이내로 입력해 주세요.');
      return;
    }
    if (!validateAge(newTargetAge)) {
      Alert.alert('입력 오류', '나이는 1세부터 120세 사이의 숫자로 기입해 주세요.');
      return;
    }
    if (!validatePhone(newTargetPhone)) {
      Alert.alert('입력 오류', '연락처 형식은 010-XXXX-XXXX 대시 포함 형식으로 입력해 주세요.');
      return;
    }

    const ageVal = parseInt(newTargetAge, 10);

    const newTarget: GuardianTarget = {
      id: Math.random().toString(),
      name: newTargetName,
      type: newTargetType,
      age: ageVal,
      phone: newTargetPhone,
      active: false,
    };

    setTargets([...targets, newTarget]);
    setNewTargetName('');
    setNewTargetAge('');
    setNewTargetPhone('');

    useNotificationStore.getState().addNotification({
      title: '📍 보호 대상 추가 완료',
      body: `신규 보호 대상자 ${newTargetName} (${newTargetType === 'senior' ? '어르신' : '아동'})가 정상 등록되었습니다.`,
      type: 'gps',
    });

    Alert.alert('추가 완료', '신규 보호 대상자가 추가되었습니다. 목록에서 선택하여 세부 관리할 수 있습니다.');
  };

  // 프로필 이미지 선택
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      updateUser({ profileImage: result.assets[0].uri });
    }
  };

  // 카드 등록
  const handleAddCard = () => {
    if (!newCardCompany.trim()) {
      Alert.alert('입력 오류', '카드 회사명을 입력해 주세요 (예: 신한카드).');
      return;
    }
    if (!validateCardNumber(newCardNo)) {
      Alert.alert('입력 오류', '카드 번호는 16자리 숫자 형식(예: 1234-5678-1234-5678 또는 대시 없이 16자리)이어야 합니다.');
      return;
    }
    if (!validateCardExpiry(newCardExp)) {
      Alert.alert('입력 오류', '만료 기한은 MM/YY 양식(예: 12/29)으로 기입해 주세요.');
      return;
    }
    const newCard: CreditCardItem = {
      id: Math.random().toString(),
      company: newCardCompany,
      number: newCardNo.replace(/(\d{4})-\d{4}-\d{4}-(\d{4})/, '$1-****-****-$2'),
      expiry: newCardExp,
      color: ['#047857', '#6D28D9', '#B91C1C', '#C2410C'][Math.floor(Math.random() * 4)],
    };
    setCards([...cards, newCard]);
    setNewCardCompany('');
    setNewCardNo('');
    setNewCardExp('');

    useNotificationStore.getState().addNotification({
      title: '💳 카드 등록 완료',
      body: `새 결제 카드 (${newCardCompany})가 안전하게 등록되었습니다.`,
      type: 'general',
    });
    Alert.alert('등록 완료', '결제 카드가 성공적으로 연동되었습니다.');
  };

  // 카드 삭제
  const handleDeleteCard = (id: string, company: string) => {
    Alert.alert('카드 삭제', `정말 ${company} 카드를 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setCards(cards.filter(c => c.id !== id));
          useNotificationStore.getState().addNotification({
            title: '💳 카드 삭제 완료',
            body: `${company} 카드가 지갑에서 삭제되었습니다.`,
            type: 'general',
          });
        }
      }
    ]);
  };

  // GPS 설정 임시 상태 저장
  const handleSaveGpsSettings = async () => {
    if (!validateAge(gpsTargetAge)) {
      Alert.alert('오류', '보호 대상자의 유효한 연령(1~120세)을 기입해 주세요.');
      return;
    }
    if (!validatePhone(gpsPhone)) {
      Alert.alert('오류', '비상 연락처는 010-XXXX-XXXX 형식으로 기입해 주세요.');
      return;
    }

    const ageNum = parseInt(gpsTargetAge, 10);

    // 서버 및 로컬스토어 동기화
    await updateSettings({
      targetType: gpsTargetType,
      targetAge: ageNum,
      safetyRadius: gpsSafetyRadius,
      stayTimeLimit: gpsStayTime,
      targetPhoneNumber: gpsPhone,
    });

    // targets 리스트의 활성화된 대상자 정보도 동기화 수정
    setTargets(targets.map(t => {
      if (t.active) {
        return {
          ...t,
          type: gpsTargetType,
          age: ageNum,
          phone: gpsPhone
        };
      }
      return t;
    }));

    useNotificationStore.getState().addNotification({
      title: '📍 안심 GPS 설정 변경',
      body: `보호 대상자 나이 ${ageNum}세, 안전 반경 ${gpsSafetyRadius}m 보호 설정이 갱신되었습니다.`,
      type: 'gps',
    });

    Alert.alert('설정 저장', '안심 보호 설정이 성공적으로 갱신되었습니다.');
    setActiveModal('none');
  };

  // 보험 선택 시 디폴트 팩스 매핑
  const handleSelectInsurance = (ins: string) => {
    setSelectedInsurance(ins);
    const defaultFaxes: Record<string, string> = {
      현대해상: '02-730-1011',
      삼성생명: '02-2001-5050',
      DB손해보험: '02-2262-3114',
      KB손해보험: '02-6900-2211',
      메리츠화재: '02-3786-2114',
    };
    setClaimFaxNo(defaultFaxes[ins] || '02-1234-5678');
  };

  // 보험 청구 절차 진행
  const handleStartClaim = () => {
    if (!selectedRecordId) {
      Alert.alert('진료 미선택', '청구할 비대면 진료 내역을 한 개 선택해주세요.');
      return;
    }

    if (claimMethod === 'app') {
      Alert.alert(
        '서비스 준비 중',
        '보험사 전용 앱 간편 연동 서비스는 현재 제휴 계약 및 보안망 연동 개발이 진행 중입니다. 팩스 전송 서비스를 이용해 주세요.',
        [{ text: '확인' }]
      );
      return;
    }

    if (!claimFaxNo.trim()) {
      Alert.alert('입력 요망', '보험금 청구서를 발송할 팩스번호를 정확히 기입해 주세요.');
      return;
    }

    setClaimStep('loading');
    setClaimLoadingText('진료비 영수증 및 처방 세부 서류 추출 중...');

    // 1초 뒤 두번째 단계
    setTimeout(() => {
      setClaimLoadingText(`의료 팩스 문서 생성 완료 및 ${selectedInsurance}(${claimFaxNo}) 전송 중...`);

      // 1.5초 뒤 완료 단계
      setTimeout(() => {
        setClaimStep('success');
        const record = telemedicineRecords.find(r => r.id === selectedRecordId);
        useNotificationStore.getState().addNotification({
          title: '🏥 비대면 진료 보험 청구 완료',
          body: `${selectedInsurance}(팩스: ${claimFaxNo})에 실손의료비 청구가 처리 완료되었습니다. (진료과: ${record?.hospital}, 진료비: ${record?.cost})`,
          type: 'booking',
        });
      }, 1500);
    }, 1000);
  };

  // 주문 내역 터치 시 상품 연결
  const handleOrderPress = (productId: number) => {
    setActiveModal('none');
    router.push(`/shop/product-detail?id=${productId}`);
  };

  // 로그아웃
  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color="#4CAF82" />
        <Text style={[styles.loadingText, { marginTop: 12 }]}>나의 정보 불러오는 중...</Text>
      </View>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <View style={[styles.centerWrap, { paddingTop: insets.top }]}>
        <Text style={styles.guestIcon}>👤</Text>
        <Text style={styles.guestTitle}>로그인이 필요해요</Text>
        <Text style={styles.guestSub}>로그인하고 나의 전용 건강 리포트,{'\n'}GPS 안심 케어 및 보험 서류 청구를 이용해 보세요.</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push('/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBtnText}>로그인 / 회원가입</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const genderLabel = user.gender === 'male' ? '남성' : user.gender === 'female' ? '여성' : '-';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 프로필 정보 헤드 ── */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrap} activeOpacity={0.9}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {user.name?.charAt(0) ?? '?'}
                </Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color="#777" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* ── 메뉴 그룹 1: 개인 정보 ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>신체 정보 및 기본 정보</Text>
          <InfoRow label="이름" value={user.name} />
          <InfoRow label="이메일" value={user.email} />
          <InfoRow label="전화번호" value={user.phone} />
          <InfoRow label="나이" value={user.age ? `${user.age}세` : '-'} />
          <InfoRow label="성별" value={genderLabel} />
          <InfoRow label="키 / 몸무게" value={user.height && user.weight ? `${user.height}cm / ${user.weight}kg` : '-'} isLast />
        </View>

        {/* ── 메뉴 그룹 2: 마이 라이프 & 스마트 헬스케어 ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>스마트 안심케어 및 설정</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => setActiveModal('diagnosis')} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="medical" size={18} color="#4CAF82" />
              <Text style={styles.menuItemText}>자가진단 기록 보기</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleOpenGpsModal} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="location" size={18} color="#FF9800" />
              <Text style={styles.menuItemText}>안심 GPS & SOS 세부 설정</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setActiveModal('insurance')} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text" size={18} color="#2196F3" />
              <Text style={styles.menuItemText}>보험 서류 자동 청구</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/health-report')} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="bar-chart" size={18} color="#9C27B0" />
              <Text style={styles.menuItemText}>주간 건강 리포트 조회</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        {/* ── 메뉴 그룹 3: 쇼핑 및 정산 ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>쇼핑 및 결제 자산 관리</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => setActiveModal('orders')} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="cart" size={18} color="#9C27B0" />
              <Text style={styles.menuItemText}>상품 주문 내역 조회</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setActiveModal('cards')} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="card" size={18} color="#607D8B" />
              <Text style={styles.menuItemText}>간편 결제 카드 등록</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        {/* ── 설정 수정 및 로그아웃 ── */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/edit-profile')}
          activeOpacity={0.85}
        >
          <Text style={styles.editBtnText}>개인 프로필 수정</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutBtnText}>계정 로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ======================================================== */}
      {/* 1. 자가진단 기록 모달 */}
      {/* ======================================================== */}
      <Modal visible={activeModal === 'diagnosis'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>자가진단 기록</Text>
              <TouchableOpacity onPress={() => setActiveModal('none')} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#555" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {history.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 100 }}>
                  <Ionicons name="medical-outline" size={48} color="#DDD" />
                  <Text style={{ fontSize: 13, color: '#999', marginTop: 12 }}>아직 자가진단 기록이 없습니다.</Text>
                </View>
              ) : (
                history.map((record) => (
                  <View key={record.id} style={styles.diagCard}>
                    <View style={styles.diagHeader}>
                      <Text style={styles.diagPart}>📍 {record.partLabel} ({record.isInternal ? '내부 장기' : '외부 신체'})</Text>
                      <Text style={styles.diagDate}>{new Date(record.timestamp).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.diagSymptomRow}>
                      {record.symptoms.map((sym: string, sIdx: number) => (
                        <View key={sIdx} style={styles.diagSymptomBadge}>
                          <Text style={styles.diagSymptomText}>{sym}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.diagBottom}>
                      <Text style={[
                        styles.diagRiskText,
                        {
                          color: record.riskLevel === 'emergency' || record.riskLevel === 'high' ? '#D32F2F' :
                                 record.riskLevel === 'medium' ? '#FF9800' : '#4CAF82'
                        }
                      ]}>
                        위험도: {
                          record.riskLevel === 'low' ? '경미 (자가관리)' :
                          record.riskLevel === 'medium' ? '주의 (경과 관찰)' :
                          record.riskLevel === 'high' ? '경고 (병원 방문 권장)' : '응급 (즉시 내원)'
                        }
                      </Text>
                      <TouchableOpacity onPress={() => {
                        setActiveModal('none');
                        router.push(`/symptom-result?id=${record.id}`);
                      }}>
                        <Text style={styles.diagDetailLink}>결과 분석서 보기 ➔</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 2. 안심 GPS 및 SOS 설정 모달 (다중 보호대상 추가 연동) */}
      {/* ======================================================== */}
      <Modal visible={activeModal === 'gps'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>안심 GPS & SOS 상세설정</Text>
              <TouchableOpacity onPress={() => setActiveModal('none')} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#555" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              
              {/* 보호 대상자 목록 및 추가 */}
              <View style={styles.gpsSection}>
                <Text style={styles.gpsSectionTitle}>1. 보호 대상자 관리 및 선택</Text>
                {targets.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.targetCard, t.active && styles.targetCardActive]}
                    onPress={() => handleSelectTarget(t.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.targetInfo}>
                      <Ionicons
                        name={t.type === 'senior' ? 'person-circle' : 'body'}
                        size={24}
                        color={t.active ? '#4CAF82' : '#9E9E9E'}
                      />
                      <View>
                        <Text style={styles.targetNameText}>{t.name}</Text>
                        <Text style={styles.targetAgeText}>연령: {t.age}세 | 보호처: {t.phone}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={styles.targetRoleBadge}>
                        <Text style={styles.targetRoleText}>
                          {t.type === 'senior' ? '어르신' : '아동'}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.targetDeleteBtn} onPress={() => handleDeleteTarget(t.id)}>
                        <Ionicons name="trash-outline" size={16} color="#E53935" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* 보호 대상 추가 폼 */}
                <View style={{ borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 14, paddingTop: 14 }}>
                  <Text style={styles.formTitle}>➕ 보호 대상 추가 등록</Text>
                  
                  <TextInput
                    style={styles.inputField}
                    placeholder="보호 대상자 성명 (예: 김순옥)"
                    placeholderTextColor="#AAA"
                    value={newTargetName}
                    onChangeText={setNewTargetName}
                  />

                  <View style={[styles.segmentRow, { marginBottom: 10 }]}>
                    <TouchableOpacity
                      style={[styles.segmentBtn, newTargetType === 'senior' && styles.segmentBtnActive]}
                      onPress={() => setNewTargetType('senior')}
                    >
                      <Text style={[styles.segmentText, newTargetType === 'senior' && styles.segmentTextActive]}>어르신</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.segmentBtn, newTargetType === 'child' && styles.segmentBtnActive]}
                      onPress={() => setNewTargetType('child')}
                    >
                      <Text style={[styles.segmentText, newTargetType === 'child' && styles.segmentTextActive]}>아동</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.inputField, { flex: 1 }]}
                      placeholder="나이"
                      placeholderTextColor="#AAA"
                      keyboardType="numeric"
                      value={newTargetAge}
                      onChangeText={setNewTargetAge}
                    />
                    <TextInput
                      style={[styles.inputField, { flex: 2 }]}
                      placeholder="비상 수신 번호"
                      placeholderTextColor="#AAA"
                      keyboardType="phone-pad"
                      value={newTargetPhone}
                      onChangeText={setNewTargetPhone}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.addCardSubmitBtn, { backgroundColor: '#4CAF82' }]}
                    onPress={handleCreateTarget}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addCardSubmitBtnText}>보호 대상 등록하기</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.gpsSection}>
                <Text style={styles.gpsSectionTitle}>2. 선택된 대상 안심구역 반경 설정</Text>
                <Text style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>선택한 대상자가 설정 반경 이탈 시 비상 알림을 작동합니다.</Text>
                <View style={styles.radiusGrid}>
                  {[100, 300, 500, 1000, 2000].map((rad) => (
                    <TouchableOpacity
                      key={rad}
                      style={[styles.radiusBtn, gpsSafetyRadius === rad && styles.radiusBtnActive]}
                      onPress={() => setGpsSafetyRadius(rad)}
                    >
                      <Text style={[styles.radiusBtnText, gpsSafetyRadius === rad && styles.radiusBtnTextActive]}>
                        {rad >= 1000 ? `${rad / 1000}km` : `${rad}m`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.gpsSection}>
                <Text style={styles.gpsSectionTitle}>3. 체류 지연 경보 시간</Text>
                <Text style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>동일한 지점에 계속 머무르는 제한 경보 시간입니다.</Text>
                <View style={styles.radiusGrid}>
                  {['1시간', '2시간', '6시간', '12시간', '24시간'].map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[styles.radiusBtn, gpsStayTime === time && styles.radiusBtnActive]}
                      onPress={() => setGpsStayTime(time)}
                    >
                      <Text style={[styles.radiusBtnText, gpsStayTime === time && styles.radiusBtnTextActive]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.gpsSaveBtn} onPress={handleSaveGpsSettings} activeOpacity={0.85}>
                <Text style={styles.gpsSaveBtnText}>선택 대상 설정 갱신 및 완료</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 3. 보험서류 자동 청구 모달 (비대면 진료기록 연동 및 팩스 수신) */}
      {/* ======================================================== */}
      <Modal visible={activeModal === 'insurance'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏥 보험서류 원클릭 자동 청구</Text>
              <TouchableOpacity onPress={() => { setActiveModal('none'); setClaimStep('form'); }} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#555" />
              </TouchableOpacity>
            </View>

            {claimStep === 'form' && (
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                
                <Text style={styles.claimStepTitle}>1. 청구 청구대상 비대면 진료 내역 선택</Text>
                <View style={styles.claimList}>
                  {telemedicineRecords.map((record) => (
                    <TouchableOpacity
                      key={record.id}
                      style={[styles.claimRadioBtn, selectedRecordId === record.id && styles.claimRadioBtnActive]}
                      onPress={() => setSelectedRecordId(record.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radioCircle, selectedRecordId === record.id && styles.radioCircleActive]}>
                        {selectedRecordId === record.id && <View style={styles.radioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.claimItemName}>🏥 비대면 진료: {record.hospital} ({record.doctor})</Text>
                        <Text style={styles.claimItemMeta}>진단: {record.diagnosis} | 진료일: {record.date} | 자부담: {record.cost}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.claimStepTitle}>2. 서류 제출 방식 선택</Text>
                <View style={styles.radiusGrid}>
                  <TouchableOpacity
                    style={[styles.radiusBtn, claimMethod === 'app' && styles.radiusBtnActive]}
                    onPress={() => {
                      setClaimMethod('app');
                      Alert.alert(
                        '개발 중',
                        '보험사 앱 연동 서비스는 간편 제휴 준비 중입니다. 현재 빌드 버전에서는 [팩스 자동 전송]을 활용해 주세요.'
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.radiusBtnText, claimMethod === 'app' && styles.radiusBtnTextActive]}>
                      📲 어플 연동 [개발중]
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radiusBtn, claimMethod === 'fax' && styles.radiusBtnActive]}
                    onPress={() => setClaimMethod('fax')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.radiusBtnText, claimMethod === 'fax' && styles.radiusBtnTextActive]}>
                      📠 팩스 번호 직접 입력
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.claimStepTitle, { marginTop: 16 }]}>3. 청구 제출 보험사 선택</Text>
                <View style={styles.radiusGrid}>
                  {['현대해상', '삼성생명', 'DB손해보험', 'KB손해보험', '메리츠화재'].map((ins) => (
                    <TouchableOpacity
                      key={ins}
                      style={[styles.radiusBtn, selectedInsurance === ins && styles.radiusBtnActive]}
                      onPress={() => handleSelectInsurance(ins)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.radiusBtnText, selectedInsurance === ins && styles.radiusBtnTextActive]}>
                        {ins}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {claimMethod === 'fax' && (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.formTitle}>📠 전송 팩스 번호 입력</Text>
                    <TextInput
                      style={styles.inputField}
                      value={claimFaxNo}
                      onChangeText={setClaimFaxNo}
                      placeholder="팩스 번호 직접 입력"
                      keyboardType="numeric"
                    />
                  </View>
                )}

                <View style={{ backgroundColor: '#F9FAFA', borderRadius: 14, padding: 12, marginTop: 16, borderWidth: 1, borderColor: '#EEE' }}>
                  <Text style={{ fontSize: 11, color: '#666', lineHeight: 16 }}>
                    ℹ️ **안내 사항**{'\n'}
                    - 비대면 진료 처방 조제 영수증 및 청구 서류 작성이 자동으로 시뮬레이션 처리됩니다.
                    - 팩스 전송은 가상 모의 팩스 게이트웨이를 사용하여 전송이 모사됩니다.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.claimSubmitBtn, (!selectedRecordId || (claimMethod === 'fax' && !claimFaxNo)) && { backgroundColor: '#CCC' }]}
                  disabled={!selectedRecordId || (claimMethod === 'fax' && !claimFaxNo)}
                  onPress={handleStartClaim}
                  activeOpacity={0.85}
                >
                  <Text style={styles.claimSubmitBtnText}>의료서류 자동 청구 및 팩스발송</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {claimStep === 'loading' && (
              <View style={styles.claimLoadingContainer}>
                <ActivityIndicator size="large" color="#4CAF82" />
                <Text style={styles.claimLoadingText}>{claimLoadingText}</Text>
                <Text style={styles.claimLoadingSubText}>
                  의료 보안 팩스 게이트웨이 채널 연동을 보안 수립 중입니다.{'\n'}잠시만 기다려 주세요.
                </Text>
              </View>
            )}

            {claimStep === 'success' && (
              <View style={styles.claimLoadingContainer}>
                <Text style={styles.claimSuccessIcon}>🎉</Text>
                <Text style={[styles.claimLoadingText, { color: '#4CAF82' }]}>보험금 팩스청구 제출 완료!</Text>
                <Text style={styles.claimLoadingSubText}>
                  선택하신 {selectedInsurance} 전산망(팩스: {claimFaxNo})에{'\n'}처방 영수 서류 팩스 전송이 성공적으로 접수 처리되었습니다.
                </Text>
                <TouchableOpacity
                  style={styles.claimSuccessBtn}
                  onPress={() => { setActiveModal('none'); setClaimStep('form'); setSelectedRecordId(null); }}
                >
                  <Text style={styles.claimSuccessBtnText}>확인</Text>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 4. 상품 주문 내역 모달 (상세 연동 활성화) */}
      {/* ======================================================== */}
      <Modal visible={activeModal === 'orders'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🛍️ 상품 주문 내역</Text>
              <TouchableOpacity onPress={() => setActiveModal('none')} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#555" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {orders.map((ord) => (
                <TouchableOpacity
                  key={ord.id}
                  style={styles.orderCard}
                  onPress={() => handleOrderPress(ord.productId)}
                  activeOpacity={0.8}
                >
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNo}>주문번호: {ord.id} (클릭 시 상품 페이지로 이동)</Text>
                    <Text style={[
                      styles.orderStatus,
                      { color: ord.status === '배송중' ? '#FF9800' : '#4CAF82' }
                    ]}>
                      {ord.status}
                    </Text>
                  </View>
                  <Text style={styles.orderItemName}>{ord.name}</Text>
                  <Text style={styles.orderPrice}>결제 금액: {ord.price}원</Text>
                  <Text style={styles.orderDate}>주문 일자: {ord.date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 5. 간편 결제 카드 등록 모달 */}
      {/* ======================================================== */}
      <Modal visible={activeModal === 'cards'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💳 간편 결제 카드 지갑</Text>
              <TouchableOpacity onPress={() => setActiveModal('none')} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#555" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {cards.map((c) => (
                <View key={c.id} style={[styles.creditCard, { backgroundColor: c.color }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFF' }}>{c.company}</Text>
                    <View style={styles.cardChip} />
                  </View>
                  <Text style={styles.cardNumber}>{c.number}</Text>
                  <View style={styles.cardHolderRow}>
                    <View>
                      <Text style={styles.cardHolder}>CARD HOLDER</Text>
                      <Text style={styles.cardExpiry}>{user.name} ({c.expiry})</Text>
                    </View>
                    <TouchableOpacity style={styles.cardDeleteBtn} onPress={() => handleDeleteCard(c.id, c.company)}>
                      <Text style={styles.cardDeleteText}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.addCardForm}>
                <Text style={styles.formTitle}>➕ 신규 신용/체크카드 연동</Text>
                
                <TextInput
                  style={styles.inputField}
                  placeholder="카드 회사 (예: 신한카드, 국민카드)"
                  placeholderTextColor="#AAA"
                  value={newCardCompany}
                  onChangeText={setNewCardCompany}
                />

                <TextInput
                  style={styles.inputField}
                  placeholder="카드 번호 (16자리, 1234-5678-...)"
                  placeholderTextColor="#AAA"
                  value={newCardNo}
                  onChangeText={setNewCardNo}
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.inputField}
                  placeholder="만료 기간 (MM/YY, 예: 12/28)"
                  placeholderTextColor="#AAA"
                  value={newCardExp}
                  onChangeText={setNewCardExp}
                  keyboardType="numeric"
                />

                <TouchableOpacity style={styles.addCardSubmitBtn} onPress={handleAddCard} activeOpacity={0.8}>
                  <Text style={styles.addCardSubmitBtnText}>간편 결제 지갑에 추가하기</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}
