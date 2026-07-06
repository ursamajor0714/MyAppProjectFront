export interface Doctor {
  name: string;
  role: string;
  intro: string;
  bio: string[];
}

export interface Hospital {
  id: number;
  name: string;
  distance: string;
  dept: string;
  rating: number;
  open: boolean;
  color: string;
  parking: boolean;       // 주차 가능 여부
  elevator: boolean;      // 엘리베이터 여부
  lunchTime: string;      // 점심 시간
  closedDays: string[];   // 휴진일
  phone: string;          // 전화번호
  address: string;        // 주소
  intro: string;          // 병원 소개
  doctors: Doctor[];
}

export interface Department {
  id: string;
  label: string;
  icon: string;
}

export const DEPARTMENTS: Department[] = [
  { id: 'internal', label: '내과', icon: '🩺' },
  { id: 'surgery', label: '외과', icon: '🔪' },
  { id: 'ortho', label: '정형외과', icon: '🦴' },
  { id: 'derma', label: '피부과', icon: '🧴' },
  { id: 'dental', label: '치과', icon: '🦷' },
  { id: 'ent', label: '이비인후과', icon: '👂' },
  { id: 'eye', label: '안과', icon: '👁️' },
  { id: 'neuro', label: '신경외과', icon: '🧠' },
  { id: 'ob', label: '산부인과', icon: '🤰' },
  { id: 'psych', label: '정신건강의학과', icon: '💭' },
  { id: 'pediatric', label: '소아청소년과', icon: '🧸' },
  { id: 'family', label: '가정의학과', icon: '👨‍👩‍👧' },
];

export const HOSPITALS: Hospital[] = [
  {
    id: 1,
    name: '서울365연합의원',
    distance: '0.3km',
    dept: '내과',
    rating: 4.8,
    open: true,
    color: '#A5D6A7',
    parking: true,
    elevator: true,
    lunchTime: '13:00 - 14:00',
    closedDays: ['일요일', '공휴일'],
    phone: '02-2043-1089',
    address: '서울시 강남구 테헤란로 15길 4 (내과 빌딩 2층)',
    intro: '서울365연합의원은 환자 중심의 따뜻한 의원입니다. 소화기 질환부터 만성질환 관리까지 세심하게 봐드립니다.',
    doctors: [
      {
        name: '김민우',
        role: '대표원장/전문의',
        intro: '안녕하세요, 내과 전문의 김민우입니다. 환자의 마음까지 어루만지는 따뜻하고 성실한 진료를 약속합니다.',
        bio: ['서울대학교 의과대학 졸업 및 동 대학원 석사 수료', '내과 전문의 자격 취득', '대한내과학회 학술이사 및 정회원', '前 서울대학교병원 내과 전임의', '대한의사협회 정회원']
      },
      {
        name: '이지영',
        role: '부원장/전문의',
        intro: '가족을 치료하는 마음으로 정밀하고 섬세하게 진료하겠습니다.',
        bio: ['연세대학교 의과대학 졸업', '세브란스병원 임상강사', '대한소화기학회 정회원', '대한의사협회 정회원']
      }
    ]
  },
  {
    id: 2,
    name: '튼튼정형외과',
    distance: '0.5km',
    dept: '정형외과',
    rating: 4.6,
    open: true,
    color: '#90CAF9',
    parking: true,
    elevator: true,
    lunchTime: '12:30 - 13:30',
    closedDays: ['일요일'],
    phone: '02-2086-1178',
    address: '서울시 서초구 반포대로 30길 8 (정형외과 빌딩 2층)',
    intro: '튼튼정형외과는 척추 관절 질환의 비수술적 보존 치료를 우선으로 생각하는 정직한 정형외과입니다.',
    doctors: [
      {
        name: '박성진',
        role: '대표원장/전문의',
        intro: '안녕하세요, 정형외과 전문의 박성진입니다. 통증 없는 건강한 관절을 만들어 드리겠습니다.',
        bio: ['서울대학교 의과대학 졸업', '정형외과 전문의 자격 취득', '대한척추외과학회 정회원', '前 서울대학교병원 정형외과 전임의', '대한의사협회 정회원']
      },
      {
        name: '조현우',
        role: '부원장/전문의',
        intro: '스포츠 외상 및 무릎/어깨 관절 치료의 길잡이가 되어 드리겠습니다.',
        bio: ['가톨릭대학교 의과대학 졸업', '성모병원 정형외과 전공의 수료', '대한관절학회 정회원', '대한의사협회 정회원']
      }
    ]
  },
  {
    id: 3,
    name: '미소피부과의원',
    distance: '0.7km',
    dept: '피부과',
    rating: 4.9,
    open: false,
    color: '#FFAB91',
    parking: false,
    elevator: true,
    lunchTime: '13:00 - 14:00',
    closedDays: ['수요일', '일요일'],
    phone: '02-2129-1267',
    address: '서울시 송파구 올림픽로 45길 12 (피부과 빌딩 2층)',
    intro: '미소피부과의원은 아토피, 여드름 등 피부 질환부터 메디컬 에스테틱까지 피부를 위한 모든 솔루션을 제안합니다.',
    doctors: [
      {
        name: '이소현',
        role: '대표원장/전문의',
        intro: '피부 본연의 건강한 미소를 찾아드리겠습니다.',
        bio: ['연세대학교 의과대학 졸업', '피부과 전문의 자격 취득', '대한피부연구학회 정회원', '前 신촌세브란스 피부과 임상교수', '대한의사협회 정회원']
      },
      {
        name: '정다혜',
        role: '과장/전문의',
        intro: '자극 없이 건강한 피부 관리를 지향합니다.',
        bio: ['한양대학교 의과대학 졸업', '강북삼성병원 피부과 전임의', '대한아토피피부염학회 정회원', '대한의사협회 정회원']
      }
    ]
  },
  {
    id: 4,
    name: '맑은이비인후과',
    distance: '0.8km',
    dept: '이비인후과',
    rating: 4.5,
    open: true,
    color: '#CE93D8',
    parking: true,
    elevator: false,
    lunchTime: '13:00 - 14:00',
    closedDays: ['일요일', '공휴일'],
    phone: '02-2172-1356',
    address: '서울시 마포구 양화로 60길 16 (이비인후과 빌딩 2층)',
    intro: '맑은이비인후과는 귀, 코, 목 관련 질환의 정밀한 진단과 알레르기 비염 치료에 특화되어 있습니다.',
    doctors: [
      {
        name: '최준호',
        role: '대표원장/전문의',
        intro: '가장 편안한 호흡을 찾을 수 있도록 성심성의껏 돌보겠습니다.',
        bio: ['서울대학교 의과대학 졸업', '이비인후과 전문의 자격 취득', '대한이비인후과학회 정회원', '前 서울대학교병원 전임의', '대한의사협회 정회원']
      },
      {
        name: '한상우',
        role: '원장/전문의',
        intro: '환자분들의 불편한 이비인후 질환을 신속히 치유해 드리겠습니다.',
        bio: ['아주대학교 의과대학 졸업', '아주대병원 이비인후과 전임의', '대한비과학회 정회원', '대한의사협회 정회원']
      }
    ]
  },
  {
    id: 5,
    name: '연세안과의원',
    distance: '1.1km',
    dept: '안과',
    rating: 4.7,
    open: true,
    color: '#80CBC4',
    parking: true,
    elevator: true,
    lunchTime: '12:30 - 13:30',
    closedDays: ['일요일'],
    phone: '02-2215-1445',
    address: '서울시 용산구 한강대로 75길 20 (안과 빌딩 2층)',
    intro: '연세안과의원은 백내장, 녹내장, 안구건조증 케어 등 평생 시력 건강을 책임지는 안과 전문 의원입니다.',
    doctors: [
      {
        name: '정다은',
        role: '대표원장/전문의',
        intro: '소중한 눈 건강, 맑고 밝게 지켜드리겠습니다.',
        bio: ['부산대학교 의과대학 졸업', '안과 전문의 자격 취득', '대한안과학회 정회원', '前 삼성서울병원 안과 임상교수', '대한의사협회 정회원']
      },
      {
        name: '임재혁',
        role: '원장/전문의',
        intro: '정밀 검사를 통한 미세 맞춤형 안과 수술을 담당합니다.',
        bio: ['경북대학교 의과대학 졸업', '강남성심병원 안과 전임의', '대한백내장굴절수술학회 정회원', '대한의사협회 정회원']
      }
    ]
  },
  {
    id: 6,
    name: '건강한가정의학과',
    distance: '1.2km',
    dept: '가정의학과',
    rating: 4.4,
    open: true,
    color: '#FFCC80',
    parking: true,
    elevator: true,
    lunchTime: '13:00 - 14:00',
    closedDays: ['목요일 오후', '일요일'],
    phone: '02-2258-1534',
    address: '서울시 종로구 대학로 90길 24 (가정의학과 빌딩 2층)',
    intro: '건강한가정의학과원은 온 가족의 건강 예방부터 영양 상담, 만성 성인병 맞춤 케어까지 아우르는 평생 주치의입니다.',
    doctors: [
      {
        name: '윤지훈',
        role: '대표원장/전문의',
        intro: '가족 모두의 평생 건강 지킴이가 되겠습니다.',
        bio: ['서울대학교 의과대학 졸업', '가정의학과 전문의 자격 취득', '대한가정의학회 정회원', '前 서울대병원 가정의학과 전공의 수료', '대한의사협회 정회원']
      },
      {
        name: '민아름',
        role: '부원장/전문의',
        intro: '여성 건강 및 맞춤형 비만 케어를 도와드립니다.',
        bio: ['순천향대학교 의과대학 졸업', '순천향대병원 임상강사', '대한비만학회 정회원', '대한의사협회 정회원']
      }
    ]
  },
  {
    id: 7,
    name: '참사랑치과의원',
    distance: '1.4km',
    dept: '치과',
    rating: 4.6,
    open: false,
    color: '#9FA8DA',
    parking: false,
    elevator: true,
    lunchTime: '13:00 - 14:00',
    closedDays: ['일요일', '공휴일'],
    phone: '02-2301-1623',
    address: '서울시 성동구 왕십리로 105길 28 (치과 빌딩 2층)',
    intro: '참사랑치과의원은 양심 진료를 최우선으로 합니다. 자연치아 보존 치료와 임플란트에 최적의 장비를 구비하고 있습니다.',
    doctors: [
      {
        name: '한재희',
        role: '대표원장/치의학박사',
        intro: '과잉 진료 없는 정직한 치과를 만들겠습니다.',
        bio: ['서울대학교 치의학대학원 졸업', '보건복지부인증 구강악안면외과 전문의', '대한구강악안면외과학회 정회원', '대한의사협회 정회원']
      },
      {
        name: '백승우',
        role: '과장/전문의',
        intro: '아프지 않은 무통 치과 치료 시스템을 지원합니다.',
        bio: ['연세대학교 치과대학 졸업', '세브란스 치과병원 인턴/레지던트', '대한치과보존학회 정회원', '대한의사협회 정회원']
      }
    ]
  },
  {
    id: 8,
    name: '서울숲내과',
    distance: '1.6km',
    dept: '내과',
    rating: 4.3,
    open: true,
    color: '#A5D6A7',
    parking: true,
    elevator: true,
    lunchTime: '13:00 - 14:00',
    closedDays: ['일요일'],
    phone: '02-2344-1712',
    address: '서울시 영등포구 여의대방로 120길 32 (내과 빌딩 2층)',
    intro: '서울숲내과는 직장인을 위한 종합 건강검진과 내시경 검증, 수액 클리닉에 풍부한 실적을 보유하고 있습니다.',
    doctors: [
      {
        name: '최현석',
        role: '대표원장/전문의',
        intro: '정확한 1대1 검진 진단 및 심혈관 조기 발견을 보장합니다.',
        bio: ['고려대학교 의과대학 졸업', '삼성서울병원 전임의 수료', '대한심장학회 정회원', '대한의사협회 정회원']
      },
      {
        name: '이지영',
        role: '원장/전문의',
        intro: '환자분들의 피로 해소와 영양 균형 관리를 담당합니다.',
        bio: ['연세대학교 의과대학 졸업', '세브란스병원 임상강사', '대한소화기학회 정회원', '대한의사협회 정회원']
      }
    ]
  },
  {
    id: 9,
    name: '바른정형외과',
    distance: '1.9km',
    dept: '정형외과',
    rating: 4.5,
    open: true,
    color: '#90CAF9',
    parking: true,
    elevator: true,
    lunchTime: '12:30 - 13:30',
    closedDays: ['토요일 오후', '일요일'],
    phone: '02-2387-1801',
    address: '서울시 강서구 공항대로 135길 36 (정형외과 빌딩 2층)',
    intro: '바른정형외과는 목/허리 디스크, 관절 도수치료 및 물리치료를 통해 척추 관절 교정을 전담합니다.',
    doctors: [
      {
        name: '박성진',
        role: '대표원장/전문의',
        intro: '바른 뼈, 바른 관절로 일상의 활력을 돌려드리겠습니다.',
        bio: ['서울대학교 의과대학 졸업', '정형외과 전문의 자격 취득', '대한척추외과학회 정회원', '대한의사협회 정회원']
      },
      {
        name: '윤서연',
        role: '원장/전문의',
        intro: '체계적인 체형 교정 도수 치료 가이드를 처방해 드립니다.',
        bio: ['경희대학교 의과대학 졸업', '경희의료원 전임의 수료', '대한스포츠의학회 정회원', '대한의사협회 정회원']
      }
    ]
  },
  {
    id: 10,
    name: '하늘소아청소년과',
    distance: '2.0km',
    dept: '소아청소년과',
    rating: 4.8,
    open: true,
    color: '#F48FB1',
    parking: true,
    elevator: true,
    lunchTime: '13:00 - 14:00',
    closedDays: ['일요일', '공휴일'],
    phone: '02-2430-1890',
    address: '서울시 은평구 통일로 150길 40 (소아청소년과 빌딩 2층)',
    intro: '하늘소아청소년과는 영유아 건강검진, 필수 예방접종 및 급성 영유아 호흡기 질환 치료를 성심껏 담당합니다.',
    doctors: [
      {
        name: '송아름',
        role: '대표원장/전문의',
        intro: '소중한 우리 아이들의 건강을 밝게 보살피겠습니다.',
        bio: ['가톨릭대학교 의과대학 졸업', '소아청소년과 전문의 자격 취득', '대한소아과학회 정회원', '대한의사협회 정회원']
      },
      {
        name: '오세훈',
        role: '원장/전문의',
        intro: '소아 알레르기 및 아토피 질환의 체계적인 호전 케어를 제공합니다.',
        bio: ['서울대학교 의과대학 졸업', '서울대어린이병원 전공의 수료', '대한소아알레르기호흡기학회 정회원', '대한의사협회 정회원']
      }
    ]
  },
  {
    id: 11,
    name: '편안신경외과',
    distance: '2.3km',
    dept: '신경외과',
    rating: 4.2,
    open: false,
    color: '#B0BEC5',
    parking: true,
    elevator: false,
    lunchTime: '13:00 - 14:00',
    closedDays: ['일요일'],
    phone: '02-2473-1979',
    address: '서울시 서대문구 신촌로 165길 44 (신경외과 빌딩 2층)',
    intro: '편안신경외과는 두통, 어지럼증, 급성 뇌혈관 및 목 디스크 방사통 통증 관리에 특화되어 있습니다.',
    doctors: [
      {
        name: '강동우',
        role: '대표원장/전문의',
        intro: '신경 손상 걱정 없는 안전한 척추 주사 치료를 지향합니다.',
        bio: ['서울대학교 의과대학 졸업', '신경외과 전문의 자격 취득', '대한신경외과학회 정회원', '대한의사협회 정회원']
      },
      {
        name: '신민수',
        role: '과장/전문의',
        intro: '만성 두통 및 뇌신경계 혈류 검진을 꼼꼼히 해 드립니다.',
        bio: ['한양대학교 의과대학 졸업', '한양대병원 전임의 수료', '대한뇌혈관외과학회 정회원', '대한의사협회 정회원']
      }
    ]
  },
  {
    id: 12,
    name: '여성사랑산부인과',
    distance: '2.5km',
    dept: '산부인과',
    rating: 4.7,
    open: true,
    color: '#F48FB1',
    parking: true,
    elevator: true,
    lunchTime: '13:00 - 14:00',
    closedDays: ['일요일', '공휴일'],
    phone: '02-2516-2068',
    address: '서울시 광진구 능동로 180길 48 (산부인과 빌딩 2층)',
    intro: '여성사랑산부인과는 여성의 생애주기별 검진과 안전한 부인과 초음파 및 산전 케어를 제공합니다.',
    doctors: [
      {
        name: '홍혜원',
        role: '대표원장/전문의',
        intro: '여성 건강, 늘 편안하고 편안하게 상담해 드리겠습니다.',
        bio: ['이화여대 의과대학 졸업', '산부인과 전문의 자격 취득', '대한산부인과학회 정회원', '대한의사협회 정회원']
      },
      {
        name: '유은지',
        role: '원장/전문의',
        intro: '여성 질환 검사 및 백신 예방접종을 세심하게 책임집니다.',
        bio: ['연세대학교 의과대학 졸업', '신촌세브란스병원 임상강사', '대한부인종양학회 정회원', '대한의사협회 정회원']
      }
    ]
  }
];
