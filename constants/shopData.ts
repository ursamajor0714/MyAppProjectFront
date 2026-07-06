// ── 증상별 카테고리 ──
export const SYMPTOM_CATEGORIES = [
  { id: 'fatigue', label: '피로', icon: '🔋' },
  { id: 'immunity', label: '면역', icon: '🛡️' },
  { id: 'digestion', label: '소화', icon: '🍃' },
  { id: 'joint', label: '관절', icon: '🦴' },
  { id: 'sleep', label: '수면', icon: '🌙' },
  { id: 'eye', label: '눈건강', icon: '👁️' },
  { id: 'skin', label: '피부', icon: '✨' },
  { id: 'circulation', label: '혈액순환', icon: '❤️' },
  { id: 'memory', label: '기억력', icon: '🧠' },
  { id: 'women', label: '여성건강', icon: '🌸' },
  { id: 'men', label: '남성건강', icon: '👔' },
];

// ── 종류 태그 ──
export const TYPE_TAGS = [
  '비타민', '유산균', '오메가3', '단백질', '미네랄', '한방', '콜라겐', '밀크씨슬', '테아닌', '쏘팔메토', '다이어트', '코엔자임Q10', '의약외품', '의료기기'
];

// ── 더미 상품 데이터 (기본 50종) ──
const RAW_PRODUCTS = [
  { id: 1, name: '데일리 멀티비타민 90정', price: 18900, category: 'fatigue', type: '비타민', rating: 4.7, reviewCount: 1284, color: '#FFE0B2', desc: '바쁜 일상 속 영양 균형을 위한 종합비타민입니다. 13종 비타민 and 미네랄을 한 알에 담아 매일 간편하게 챙길 수 있습니다.' },
  { id: 2, name: '프로바이오틱스 유산균 60포', price: 25900, category: 'digestion', type: '유산균', rating: 4.8, reviewCount: 2156, color: '#C8E6C9', desc: '장 건강을 위한 19종 복합 유산균입니다. 위산에 강한 코팅 기술로 장까지 살아서 도달합니다.' },
  { id: 3, name: '오메가3 1000mg 180캡슐', price: 32900, category: 'circulation', type: '오메가3', rating: 4.6, reviewCount: 987, color: '#B3E5FC', desc: '혈행 개선에 도움을 주는 고순도 오메가3입니다. 비린맛을 줄인 캡슐 코팅으로 부담 없이 섭취할 수 있습니다.' },
  { id: 4, name: '관절 글루코사민 콘드로이친', price: 28900, category: 'joint', type: '관절', rating: 4.5, reviewCount: 743, color: '#D7CCC8', desc: '무릎 and 관절 건강을 위한 글루코사민, 콘드로이친, MSM 복합 성분입니다.' },
  { id: 5, name: '루테인 지아잔틴 눈건강', price: 21900, category: 'eye', type: '비타민', rating: 4.7, reviewCount: 1532, color: '#FFF9C4', desc: '블루라이트 노출이 많은 현대인을 위한 눈 건강 영양제입니다. 루테인과 지아잔틴이 함께 들어있습니다.' },
  { id: 6, name: '마그네슘 수면 영양제', price: 16900, category: 'sleep', type: '미네랄', rating: 4.6, reviewCount: 891, color: '#D1C4E9', desc: '신경과 근육의 정상 기능에 필요한 마그네슘입니다. 편안한 휴식과 숙면에 도움을 줍니다.' },
  { id: 7, name: '저분자 콜라겐 펩타이드', price: 29900, category: 'skin', type: '콜라겐', rating: 4.8, reviewCount: 2034, color: '#F8BBD0', desc: '피부 탄력에 도움을 주는 저분자 콜라겐 펩타이드입니다. 흡수율을 높인 가수분해 공법을 사용했습니다.' },
  { id: 8, name: '홍삼정 에브리타임', price: 45900, category: 'fatigue', type: '한방', rating: 4.9, reviewCount: 3201, color: '#FFCCBC', desc: '6년근 홍삼을 농축한 스틱형 홍삼정입니다. 피로 개선과 면역력 증진에 도움을 줍니다.' },
  { id: 9, name: '비타민D 1000IU', price: 12900, category: 'immunity', type: '비타민', rating: 4.5, reviewCount: 1102, color: '#FFECB3', desc: '실내 활동이 많은 현대인에게 부족하기 쉬운 비타민D를 보충합니다. 면역 기능 유지에 도움을 줍니다.' },
  { id: 10, name: '단백질 쉐이크 초콜릿맛', price: 38900, category: 'fatigue', type: '단백질', rating: 4.4, reviewCount: 654, color: '#D7CCC8', desc: '운동 후 근육 회복을 돕는 식물성 단백질 쉐이크입니다. 부드러운 초콜릿 맛으로 부담 없이 즐길 수 있습니다.' },
  { id: 11, name: '징코빌로바 기억력 개선', price: 22900, category: 'memory', type: '한방', rating: 4.3, reviewCount: 478, color: '#E1BEE7', desc: '두뇌 혈류 개선에 도움을 주는 은행잎 추출물입니다. 집중력과 기억력 유지에 도움이 됩니다.' },
  { id: 12, name: '여성 종합영양제 이브닝', price: 26900, category: 'women', type: '비타민', rating: 4.7, reviewCount: 1389, color: '#F8BBD0', desc: '여성에게 필요한 철분, 엽산, 비타민을 균형있게 담은 전용 영양제입니다.' },
  { id: 13, name: '밀크씨슬 실리마린 120정', price: 24900, category: 'fatigue', type: '밀크씨슬', rating: 4.8, reviewCount: 1845, color: '#E8F5E9', desc: '간 세포 보호와 간 기능 개선에 도움을 주는 실리마린 고함량 제품입니다. 만성 피로와 숙취 해소에 탁월합니다.' },
  { id: 14, name: 'L-테아닌 스트레스 릴리프', price: 19800, category: 'sleep', type: '테아닌', rating: 4.6, reviewCount: 712, color: '#E8EAF6', desc: '스트레스로 인한 긴장 완화에 도움을 주는 L-테아닌 제품입니다. 알파파 발생을 유도하여 마음에 안정을 줍니다.' },
  { id: 15, name: '옥타코사놀 쏘팔메토 맥스', price: 34900, category: 'men', type: '쏘팔메토', rating: 4.7, reviewCount: 923, color: '#ECEFF1', desc: '남성 전립선 건강과 지구력 증진을 위한 쏘팔메토 및 옥타코사놀 복합제입니다.' },
  { id: 16, name: '가르시니아 다이어트 핏', price: 22500, category: 'digestion', type: '다이어트', rating: 4.4, reviewCount: 1105, color: '#FCE4EC', desc: '탄수화물의 지방 합성을 억제하여 체지방 감소에 도움을 주는 HCA 고함량 다이어트 보조제입니다.' },
  { id: 17, name: '코엔자임 Q10 항산화 90캡슐', price: 27900, category: 'circulation', type: '코엔자임Q10', rating: 4.7, reviewCount: 814, color: '#FFF3E0', desc: '높은 혈압 감소 및 항산화에 도움을 주는 코엔자임 Q10입니다. 유해산소로부터 세포를 보호합니다.' },
  { id: 18, name: '구강 프로폴리스 스프레이', price: 15000, category: 'immunity', type: '미네랄', rating: 4.8, reviewCount: 1244, color: '#FFFDE7', desc: '구강 내 항균 작용에 도움을 주는 호주산 프로폴리스 스프레이형 제품입니다.' },
  { id: 19, name: '히알루론산 수분케어 60캡슐', price: 23900, category: 'skin', type: '콜라겐', rating: 4.6, reviewCount: 512, color: '#E1F5FE', desc: '피부 속 수분을 채워주어 건조함을 방지하고 보습을 유지해 주는 히알루론산 영양제입니다.' },
  { id: 20, name: '유기농 맥주효모 비오틴 10000', price: 18500, category: 'skin', type: '비타민', rating: 4.5, reviewCount: 630, color: '#EFEBE9', desc: '풍성한 모발 and 손톱 건강을 위한 고함량 비오틴과 유기농 맥주효모의 결합 제품입니다.' },
  { id: 21, name: 'L-아르기닌 오르니틴 6000mg', price: 29800, category: 'fatigue', type: '단백질', rating: 4.6, reviewCount: 843, color: '#FFEBEE', desc: '활력 증진과 운동 능력 향상에 도움을 주는 고함량 L-아르기닌과 시너지 성분 오르니틴 배합 제품입니다.' },
  { id: 22, name: '타우린 에너지 파우더 30포', price: 15900, category: 'fatigue', type: '아미노산', rating: 4.5, reviewCount: 510, color: '#FFF9C4', desc: '피로 물질 억제와 신진대사 활성화에 필수적인 타우린을 물에 타서 간편하게 섭취하는 파우더형 에너지 보충제입니다.' },
  { id: 23, name: '활성 비타민B 콤플렉스', price: 27900, category: 'fatigue', type: '비타민', rating: 4.8, reviewCount: 1622, color: '#FFE0B2', desc: '체내 에너지 생성과 세포 대사에 필요한 고함량 활성형 비타민 B군 8종 복합제입니다.' },
  { id: 24, name: '아연 앤 구리 이뮨 부스트', price: 14500, category: 'immunity', type: '미네랄', rating: 4.6, reviewCount: 420, color: '#E0F2F1', desc: '정상적인 면역 기능과 세포 분열에 필수적인 아연에, 흡수율 균형을 위한 구리를 황금 비율로 배합했습니다.' },
  { id: 25, name: '유기농 스피루리나 500mg', price: 22000, category: 'immunity', type: '미네랄', rating: 4.5, reviewCount: 310, color: '#E8F5E9', desc: '단백질, 미네랄, 비타민이 풍부한 미세조류 스피루리나 100% 제품으로 피부 건강과 항산화에 도움을 줍니다.' },
  { id: 26, name: '초유 이뮤노글로불린 120정', price: 38000, category: 'immunity', type: '단백질', rating: 4.7, reviewCount: 580, color: '#FFF8E1', desc: '면역글로불린(IgG) 성분이 다량 함유된 초유 단백질 영양제로 신체 방어력 강화에 우수합니다.' },
  { id: 27, name: '고농축 엘더베리 시럽', price: 21000, category: 'immunity', type: '비타민', rating: 4.8, reviewCount: 1432, color: '#F3E5F5', desc: '안토시아닌이 풍부한 블랙 엘더베리를 고농축한 시럽으로 환절기 온 가족 면역 건강을 지켜줍니다.' },
  { id: 28, name: '차전자피 식이섬유 쾌변', price: 17900, category: 'digestion', type: '다이어트', rating: 4.4, reviewCount: 1989, color: '#EFEBE9', desc: '물과 만나 40배 팽창하는 차전자피 식이섬유로 장의 연동 운동을 촉진하여 원활한 배변 활동에 도움을 줍니다.' },
  { id: 29, name: '파파야 브로멜라인 효소 90정', price: 23500, category: 'digestion', type: '미네랄', rating: 4.7, reviewCount: 864, color: '#FFFDE7', desc: '단백질 소화를 돕는 파파야 파파인 효소 and 파인애플 브로멜라인 효소를 담은 천연 소화 효소제입니다.' },
  { id: 30, name: '위건강 매스틱검 60캡슐', price: 31900, category: 'digestion', type: '한방', rating: 4.6, reviewCount: 1045, color: '#F1F8E9', desc: '그리스 키오스섬의 매스틱나무 수액 추출물로 위 점막 보호와 소화 불량 개선에 도움을 줍니다.' },
  { id: 31, name: '낙산균 프로바이오틱스 60포', price: 28900, category: 'digestion', type: '유산균', rating: 4.7, reviewCount: 654, color: '#E8F5E9', desc: '대장 건강의 핵심 성분인 낙산을 생성하여 장내 유해균을 억제하고 민감한 장을 안정시켜주는 유산균입니다.' },
  { id: 32, name: '뉴질랜드 초록입홍합 오일 10000', price: 42000, category: 'joint', type: '관절', rating: 4.7, reviewCount: 887, color: '#E0F7FA', desc: '뉴질랜드 청정해역 초록입홍합에서 추출한 고순도 오일로 관절 염증 완화 및 관절 기능 개선에 우수합니다.' },
  { id: 33, name: '천연 유기유황 MSM 2000mg', price: 19900, category: 'joint', type: '관절', rating: 4.5, reviewCount: 912, color: '#ECEFF1', desc: '관절 및 연골 건강에 도움을 주는 유기유황(MSM) 고함량 제품으로 무릎과 뼈마디의 뻣뻣함을 해소해 줍니다.' },
  { id: 34, name: '칼맥디아연 종합 칼슘제', price: 18500, category: 'joint', type: '미네랄', rating: 4.6, reviewCount: 1109, color: '#FFF3E0', desc: '뼈와 치아 형성에 필요한 칼슘, 마그네슘, 비타민D, 아연을 골고루 담아 흡수율을 높였습니다.' },
  { id: 35, name: '감태 추출물 슬립 타이트', price: 32900, category: 'sleep', type: '테아닌', rating: 4.5, reviewCount: 432, color: '#E0F2F1', desc: '제주 청정 바다 감태에서 추출한 플로로탄닌 성분으로 수면 장애를 개선하고 숙면을 취하도록 돕습니다.' },
  { id: 36, name: '타트체리 멜라 슬립 60포', price: 21900, category: 'sleep', type: '비타민', rating: 4.4, reviewCount: 704, color: '#FFEBEE', desc: '천연 멜라토닌과 몽모랑시 타트체리를 통째로 짜내어 꿀잠과 푹 쉬는 숙면 분위기를 유도해 줍니다.' },
  { id: 37, name: '카모마일 아피제닌 릴랙서', price: 17500, category: 'sleep', type: '테아닌', rating: 4.3, reviewCount: 298, color: '#FFF8E1', desc: '마음의 평온 and 긴장 이완에 탁월한 카모마일 아피제닌 성분을 정제 형태로 만든 천연 이완제입니다.' },
  { id: 38, name: '아스타잔틴 아이핏 30캡슐', price: 24000, category: 'eye', type: '오메가3', rating: 4.6, reviewCount: 689, color: '#FFEBEE', desc: '헤마토코쿠스 추출 아스타잔틴으로 스마트폰이나 PC 화면을 보느라 지친 눈의 피로도 개선을 돕습니다.' },
  { id: 39, name: '야생 빌베리 추출물 안토시아닌', price: 22000, category: 'eye', type: '비타민', rating: 4.5, reviewCount: 541, color: '#EDE7F6', desc: '야생 빌베리에 풍부한 안토시아닌 성분으로 야간 시력 개선 및 안구 보호에 효과적입니다.' },
  { id: 40, name: '먹는 가다랑어 엘라스틴 펩타이드', price: 34900, category: 'skin', type: '콜라겐', rating: 4.7, reviewCount: 812, color: '#FCE4EC', desc: '콜라겐 기둥을 묶어주는 3대 피부 구성 성분인 엘라스틴을 보충하여 피부 장벽과 탄력을 세워줍니다.' },
  { id: 41, name: '스킨 세라마이드 장벽 케어', price: 25000, category: 'skin', type: '콜라겐', rating: 4.6, reviewCount: 387, color: '#E0F2F1', desc: '피부 바깥 장벽을 튼튼하게 만들어 수분 증발을 막고 자극으로부터 피부를 보호해 주는 세라마이드입니다.' },
  { id: 42, name: '스킨 글루타치온 화이트 필름', price: 29000, category: 'skin', type: '비타민', rating: 4.8, reviewCount: 1544, color: '#FFF9C4', desc: '구강 점막으로 직접 흡수되어 미백 및 항산화에 즉각 도움을 주는 프리미엄 글루타치온 필름 제품입니다.' },
  { id: 43, name: '보라지유 감마리놀렌산 1000', price: 23900, category: 'circulation', type: '오메가3', rating: 4.6, reviewCount: 712, color: '#FFF8E1', desc: '여성 호르몬 균형과 콜레스테롤 저하, 혈행 개선에 좋은 감마리놀렌산이 보라지 종자유로 함유된 건강 기능식품입니다.' },
  { id: 44, name: '크릴오일 500 인지질 56%', price: 29800, category: 'circulation', type: '오메가3', rating: 4.5, reviewCount: 654, color: '#FFEBEE', desc: '물에 잘 녹는 친수성 인지질 구조로 체내 흡수율을 획기적으로 높인 깨끗한 남극해 크릴오일입니다.' },
  { id: 45, name: '낫토키나제 혈류 골드', price: 26000, category: 'circulation', type: '한방', rating: 4.4, reviewCount: 498, color: '#FFF3E0', desc: '청국장의 끈적한 점성 속에 함유된 낫토 키나제 성분으로 혈전 예방과 원활한 피의 흐름에 관여합니다.' },
  { id: 46, name: '포스파티딜세린 PS 300', price: 39000, category: 'memory', type: '미네랄', rating: 4.7, reviewCount: 512, color: '#E8F5E9', desc: '뇌 세포막의 중요 인지질인 PS를 공급하여 노화로 저하된 인지 기능 및 기억력 개선에 유효합니다.' },
  { id: 47, name: '대두 레시틴 브레인 포커스', price: 18900, category: 'memory', type: '오메가3', rating: 4.5, reviewCount: 387, color: '#FFFDE7', desc: '뇌에 신경전달 물질인 아세틸콜린을 생성하도록 영양을 주는 대두 추출 레시틴 영양제입니다.' },
  { id: 48, name: '크랜베리 요로 케어 밸런스', price: 19800, category: 'women', type: '유산균', rating: 4.6, reviewCount: 899, color: '#FFEBEE', desc: '요로에 유해균이 흡착되는 것을 방지하여 방광 건강과 요로 계통 위생 관리를 보조하는 크랜베리 농축 제품입니다.' },
  { id: 49, name: '석류 콜라겐 뷰티 젤리 30포', price: 22000, category: 'women', type: '콜라겐', rating: 4.7, reviewCount: 1102, color: '#FCE4EC', desc: '여성 호르몬 촉진에 탁월한 터키산 석류 농축액과 흡수 빠른 콜라겐 젤리가 결합된 뷰티 간식입니다.' },
  { id: 50, name: '블랙 마카 아르기닌 맥스 90정', price: 28500, category: 'men', type: '쏘팔메토', rating: 4.8, reviewCount: 1450, color: '#ECEFF1', desc: '페루의 인삼이라 불리는 고농축 블랙 마카와 아르기닌을 함유하여 남성의 스태미나와 에너지 공급에 최적화되었습니다.' }
];

// ── 더미 상품 데이터 (의약외품/기기 10종) ──
const RAW_MEDICALS = [
  { id: 51, name: 'KF94 황사방역 마스크 50매', price: 25000, category: 'immunity', type: '의약외품', rating: 4.8, reviewCount: 1420, color: '#ECEFF1', desc: '황사, 초미세먼지 및 호흡기 감염원으로부터 안전하게 보호해 주는 식약처 의약외품 허가 KF94 마스크입니다.' },
  { id: 52, name: '상처 보호 하이드로콜로이드 습윤밴드', price: 6500, category: 'skin', type: '의약외품', rating: 4.7, reviewCount: 890, color: '#FFE0B2', desc: '상처 부위 삼출액을 흡수하여 최적의 습윤 상태를 유지하고 흉터 없는 회복을 돕는 습윤 패드입니다.' },
  { id: 53, name: '손소독제 겔 500ml 3개입', price: 12000, category: 'immunity', type: '의약외품', rating: 4.6, reviewCount: 560, color: '#E1F5FE', desc: '물 없이 언제 어디서나 간편하게 유해 세균을 99.9% 신속 살균하는 고보습 손소독제입니다.' },
  { id: 54, name: '구강 세정 안티플라그 가글 750ml', price: 9800, category: 'immunity', type: '의약외품', rating: 4.5, reviewCount: 340, color: '#E8F5E9', desc: '불소막 형성으로 충치를 예방하고, 입 냄새 원인균을 즉각 억제하는 청량 가글 제품입니다.' },
  { id: 55, name: '가정용 스마트 자동 혈압계', price: 55000, category: 'circulation', type: '의료기기', rating: 4.8, reviewCount: 670, color: '#ECEFF1', desc: '혼자서도 정밀 측정이 가능한 오실로메트릭 방식 팔뚝 가압형 스마트 자동 혈압측정기입니다.' },
  { id: 56, name: '스마트 모바일 연동 혈당측정기', price: 39000, category: 'circulation', type: '의료기기', rating: 4.7, reviewCount: 430, color: '#F3E5F5', desc: '아주 소량의 채혈로 5초 만에 정확한 수치를 앱으로 자동 연동하여 표시해 주는 혈당 측정기입니다.' },
  { id: 57, name: '의료용 정밀 비접촉 체온계', price: 45000, category: 'immunity', type: '의료기기', rating: 4.9, reviewCount: 1120, color: '#FFF8E1', desc: '이마 중앙에 조준하여 접촉 없이 적외선으로 1초 만에 안전하고 빠르게 측정하는 고성능 무접촉 체온계입니다.' },
  { id: 58, name: '생리식염수 코세척용 1000ml', price: 8000, category: 'immunity', type: '의약외품', rating: 4.6, reviewCount: 290, color: '#E0F2F1', desc: '비강 내 점막의 보습과 분비물 세척에 유용한 의약외품 규격의 정밀 멸균 생리식염수입니다.' },
  { id: 59, name: '의료용 멸균 거즈 100매', price: 7500, category: 'skin', type: '의약외품', rating: 4.5, reviewCount: 180, color: '#FAFAFA', desc: '외상 치료 시 환부 소독 및 삼출액 흡수를 위해 위생적으로 개별 멸균 포장된 거즈입니다.' },
  { id: 60, name: '바르는 약용 모기/벌레 물림 치료제', price: 5000, category: 'skin', type: '의약외품', rating: 4.4, reviewCount: 310, color: '#FFFDE7', desc: '벌레나 모기에 물려 가렵고 붓거나 염증이 발생한 부위에 부드럽게 롤링 도포하는 치료제입니다.' }
];

const getDetailsByType = (type: string, name: string) => {
  if (type === '비타민') return {
    nutrition: '비타민 A, B군, C, D, E, 아연, 셀레늄 등 필수 영양소 복합',
    dosage: '1일 1회, 1회 1정을 충분한 물과 함께 섭취하십시오.',
    warning: '특이체질, 알레르기 체질의 경우 원료를 꼭 확인 후 섭취하십시오.'
  };
  if (type === '유산균') return {
    nutrition: '19종 혼합 프로바이오틱스 (생균 100억 마리 CFU 보장)',
    dosage: '1일 1회, 1회 1포를 아침 공복에 섭취하시는 것이 좋습니다.',
    warning: '질환이 있거나 약물 복용 중일 경우 섭취 전 전문의와 상의하십시오.'
  };
  if (type === '오메가3') return {
    nutrition: 'EPA 및 DHA 함유 유지 1000mg, 토코페롤(비타민E) 배합',
    dosage: '1일 1회, 1회 2캡슐을 식후 즉시 물과 함께 섭취하십시오.',
    warning: '항응고제, 항혈소판제 등 복용 시 혈행 영향이 있을 수 있으니 주의하십시오.'
  };
  if (type === '관절') return {
    nutrition: '글루코사민 황산염 1500mg, 식이유황(MSM) 1000mg 함유',
    dosage: '1일 2회, 1회 1정을 물과 함께 식후 복용하십시오.',
    warning: '새우, 게 등 갑각류 알레르기가 있으신 분은 섭취를 피하십시오.'
  };
  if (type === '미네랄') return {
    nutrition: '쌀추출 마그네슘 315mg, 건조효모 아연 8.5mg 배합',
    dosage: '1일 1회, 1회 1정을 취침 30분 전 복용을 권장합니다.',
    warning: '신장 질환이나 만성 질환이 있는 경우 의사와 상담이 필요합니다.'
  };
  if (type === '콜라겐') return {
    nutrition: '저분자 피쉬콜라겐 펩타이드 3000mg, 히알루론산, 비타민C',
    dosage: '1일 1회, 1회 1포를 직접 털어 넣거나 음료에 섞어 드십시오.',
    warning: '임산부, 수유부 및 어린이의 경우 원료 안전성을 확인 후 드십시오.'
  };
  if (type === '한방' || name.includes('홍삼') || name.includes('마카')) return {
    nutrition: '국산 6년근 홍삼 농축액 (진세노사이드 Rg1+Rb1+Rg3 총 11.6mg)',
    dosage: '1일 1회, 1회 1포(스틱)를 그대로 섭취하십시오.',
    warning: '당뇨치료제 또는 혈액항응고제 복용 시 혈류 활성화에 주의가 필요합니다.'
  };
  if (type === '밀크씨슬') return {
    nutrition: '실리마린 130mg, 비타민B1, B2, B6 1일 권장량 100%',
    dosage: '1일 1회, 1회 1정을 매일 일정한 시간에 식후 복용하십시오.',
    warning: '섭취 후 위장 불쾌감, 설사 등 알레르기 반응 시 중단하십시오.'
  };
  if (type === '테아닌') return {
    nutrition: 'L-테아닌 200mg, 스트레스 긴장 완화용 알파파 유도 성분',
    dosage: '1일 1회, 1회 1정을 물과 함께 밤에 편안할 때 드십시오.',
    warning: '카페인 함유 음료와 병용 시 테아닌 작용이 상쇄될 수 있습니다.'
  };
  if (type === '쏘팔메토') return {
    nutrition: '쏘팔메토 열매 추출 로르산 115mg, 글루콘산 아연 8.5mg',
    dosage: '1일 1회, 1회 1캡슐을 식후에 미지근한 물과 복용하십시오.',
    warning: '성인 남성 전용 제품입니다. 수술 전후 혈행 약물 복용 시 주의하십시오.'
  };
  if (type === '다이어트' || name.includes('가르시니아') || name.includes('식이섬유')) return {
    nutrition: '가르시니아 캄보지아 추출물(HCA 750mg), 치커리 식이섬유',
    dosage: '1일 2회, 1회 1정을 탄수화물 섭취 식사 30분 전 복용하십시오.',
    warning: '간 질환, 심장 질환이 있거나 임산부 및 수유부는 섭취를 피하십시오.'
  };
  return {
    nutrition: '체내 대사 활성을 돕는 종합 영양 및 미네랄 배합',
    dosage: '1일 1회, 1회 1정을 충분한 물과 섭취하십시오.',
    warning: '과다 섭취 시 설사 등 부작용 우려가 있으니 정량 복용을 준수하십시오.'
  };
};

const getMedicalDetails = (name: string) => {
  if (name.includes('마스크')) return {
    nutrition: '규격: KF94 황사/방역 식약처 허가, 고밀도 정전 필터',
    dosage: '코 지지대를 위로 향하게 밀착하여 입과 코를 완전히 밀착 덮어 착용',
    warning: '산소 농도 18% 미만 밀폐 장소 사용 금지. 마스크 변형 사용 금지.'
  };
  if (name.includes('밴드')) return {
    nutrition: '규격: 친수성 하이드로콜로이드 패드, 하이포알러제닉 점착제',
    dosage: '상처 환부를 소독/건조 후 밴드를 붙여 가장자리를 3초간 지그시 압착',
    warning: '감염이 이미 진행된 붉거나 깊은 상처 부위에는 붙이지 마십시오.'
  };
  if (name.includes('소독제')) return {
    nutrition: '규격: 의약외품 소독 에탄올 62%, 피부 보호 글리세린 배합',
    dosage: '물 없이 손바닥에 적당량을 짜서 손톱 밑, 손등까지 마를 때까지 마찰',
    warning: '눈이나 찢어진 상처 피부에는 닿지 않게 주의하며 화기 주변을 피하십시오.'
  };
  if (name.includes('가글')) return {
    nutrition: '규격: 안티플라그 CPC 0.05%, 일불소인산나트륨 100ppm',
    dosage: '약 10ml를 입안에 머금고 30초간 고루 가글한 후 즉시 뱉어내십시오.',
    warning: '삼키지 않도록 주의하고, 사용 후 약 30분 동안은 음식을 삼가십시오.'
  };
  if (name.includes('체온계')) return {
    nutrition: '규격: 2등급 적외선 비접촉 의료기기 인증, LCD 액정',
    dosage: '이마 중앙 부위에서 2~3cm 이격 후 측정 스위치를 1초간 눌러 계측',
    warning: '센서 필터에 이물질이 묻지 않게 하고 상온 보관 상태에서 측정하십시오.'
  };
  if (name.includes('혈압계')) return {
    nutrition: '규격: 커프 탈착식 디지털 가압 혈압계, 고정밀 오실로메트릭',
    dosage: '커프를 위팔 심장 높이에 맞추어 지그시 감은 후 전원을 켜 측정',
    warning: '움직이거나 기침, 말을 할 경우 비정상 고혈압 오류가 뜰 수 있습니다.'
  };
  if (name.includes('혈당측정기')) return {
    nutrition: '규격: 체외 진단용 당 측정 기기, 미세 흡입식 검사지',
    dosage: '시험지를 꽂고 채혈침 핀셋으로 소량 채혈 후 시험지 끝에 혈액 접촉',
    warning: '시험지 용기가 열린 상태로 방치되면 습기로 센서가 영구 손상됩니다.'
  };
  return {
    nutrition: '의약외품 및 의료기기 제조 기준 정밀 인증 규격 준수',
    dosage: '동봉된 상세 사용 설명서를 완전히 숙지한 후 안전 지침에 따라 조작',
    warning: '의료기기의 경우 고장이 의심되면 임의 분해하지 말고 AS 센터에 의뢰하십시오.'
  };
};

export const PRODUCTS = [
  ...RAW_PRODUCTS.map((p) => {
    const details = getDetailsByType(p.type, p.name);
    return {
      ...p,
      mainCategory: 'supplement' as const,
      ...details
    };
  }),
  ...RAW_MEDICALS.map((p) => {
    const details = getMedicalDetails(p.name);
    return {
      ...p,
      mainCategory: 'medical' as const,
      ...details
    };
  })
];

export type Product = (typeof PRODUCTS)[number];
