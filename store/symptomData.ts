import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useAuthStore } from './useAuthStore';

export interface DiagnosisRecord {
  id: string;
  timestamp: number;
  part: string;
  partLabel: string;
  isInternal: boolean | null;
  subcategory: string | null;
  symptoms: string[];
  duration: string | null;
  intensity: number | null;
  riskLevel: 'low' | 'medium' | 'high' | 'emergency';
  inferredCause: string;
  inferredCauseDesc?: string;
  selfCareAdvice?: string;
}

export const RED_FLAGS = [
  '극심한 두통',
  '편측마비',
  '언어장애',
  '경직 및 발열',
  '외상으로 인한 손상',
  '호흡 곤란 및 가슴 통증',
  '의식 변화'
];

export const BODY_PARTS_DETAIL: Record<
  string,
  {
    label: string;
    external: {
      muscle: string[];
      vein: string[];
      bone: string[];
      skin: string[];
      tumor: string[];
      discharge: string[];
    };
    internal: {
      stabbing: string[];
      squeezing: string[];
      burning: string[];
      heavy: string[];
      pulsating: string[];
      bloating: string[];
    };
  }
> = {
  head: {
    label: '머리',
    external: {
      muscle: ['머리 뒤쪽 뻐근함', '뒷목 당김 근육통', '관자놀이 압박 통증'],
      vein: ['박동성 관자놀이 통증', '뇌 혈관 찌릿함', '편두통성 박동'],
      bone: ['두개골 압박감', '충격 후 골절 의심', '턱관절 삐걱거림'],
      skin: ['두피 가려움', '두피 뾰루지/염증', '두피 감각 예민'],
      tumor: ['머리에 만져지는 혹', '두피 아래 말랑한 멍울 (지방종 의심)', '머리 뒤쪽 딱딱한 종괴'],
      discharge: ['두피에서 나는 진물/고름', '상처 부위 삼출물', '두피 찰과상 및 상처']
    },
    internal: {
      stabbing: ['극심한 두통', '송곳으로 찌르는 통증', '바늘로 콕콕 찌르는 느낌', '눈 뒤쪽 통증'],
      squeezing: ['편두통', '머리를 띠로 조이는 듯한 통증', '편측마비'],
      burning: ['머리 전체 열감', '두피 화끈거림', '경직 및 발열'],
      heavy: ['머리가 묵직함', '어지러움', '머릿속이 꽉 찬 듯한 답답함', '언어장애', '의식 변화'],
      pulsating: ['맥박에 맞춰 지끈거림', '박동성 관자놀이 통증', '관자놀이가 욱신거림'],
      bloating: ['머리 내부 압박감', '뇌압이 오르는 듯한 느낌', '두개골 내 팽창감']
    }
  },
  neck: {
    label: '목',
    external: {
      muscle: ['목덜미 뻐근함', '어깨 연결 부위 근육 뭉침', '목 좌우 움직임 시 뻐근함'],
      vein: ['목 혈관 박동성 통증', '경동맥 부위 지릿함', '목 주변 부종'],
      bone: ['목뼈 삐걱거림', '거북목 증후군 의심 통증', '목 디스크 방사통'],
      skin: ['목 주변 피부 발진', '가려움증', '목 뒤 아토피성 염증'],
      tumor: ['목 주변에 만져지는 림프절 멍울', '목 뒤편 말랑한 종괴 (지방종 의심)', '갑상선 부위 혹'],
      discharge: ['목 주변 상처 및 진물', '피부 쓸림 찰과상', '염증성 고름 분비']
    },
    internal: {
      stabbing: ['침 삼킬 때 목 따가움', '목구멍 송곳 통증', '편도선 붓고 찌름'],
      squeezing: ['목이 조이는 듯한 답답함', '식도 이물감', '삼킴 곤란'],
      burning: ['목구멍 화끈거림', '역류성 식도염 증상', '목 안쪽 열감'],
      heavy: ['목 주변이 묵직함', '갑상선 부위 붓고 묵직함', '목소리 쉼'],
      pulsating: ['목 주변 박동성 박동감', '경동맥 부위 욱신거림', '목 부근 혈류 압박감'],
      bloating: ['목구멍 부어오름', '기도 협착감', '식도 팽만감 및 이물감']
    }
  },
  chest: {
    label: '가슴',
    external: {
      muscle: ['가슴 앞쪽 근육통', '갈비뼈 주변 뻐근함', '움직일 때만 아픈 통증'],
      vein: ['가슴 핏줄 비침', '가슴 혈관 압박감', '왼쪽 가슴 저릿함'],
      bone: ['흉골 압박 통증', '갈비뼈 골절 의심 통증', '기침 시 갈비뼈 통증'],
      skin: ['가슴 피부 발진', '유두 주변 통증/염증', '가슴 땀띠/가려움'],
      tumor: ['유방/가슴 주변 만져지는 멍울', '가슴 피부 아래 말랑한 혹', '흉부 피부 종양 의심 덩어리'],
      discharge: ['가슴 상처 및 찰과상', '유두 주변 분비물/진물', '피부 염증성 고름']
    },
    internal: {
      stabbing: ['가슴 찌르는 통증', '숨 쉴 때 콕콕 쑤심', '기침 시 날카로운 통증'],
      squeezing: ['호흡 곤란 및 가슴 통증', '심장이 쥐어짜는 듯한 압박', '명치 끝 쥐어짜는 통증'],
      burning: ['가슴 쓰림', '식도 타는 듯한 통증', '가슴 속 열감'],
      heavy: ['가슴 답답함', '심장 두근거림', '가슴이 막힌 듯한 느낌'],
      pulsating: ['심장 박동 요동', '부정맥성 지끈거림', '가슴 속 욱신거리는 불쾌감'],
      bloating: ['가슴 가스 차고 답답함', '폐 팽창 압박감', '흉부 압박 팽만감']
    }
  },
  abdomen: {
    label: '복부',
    external: {
      muscle: ['복직근 근육통', '옆구리 당김', '배 힘줄 때 통증'],
      vein: ['복부 혈관 확장 비침', '하복부 저릿함', '장벽 혈행 장애 의심'],
      bone: ['갈비뼈 아래 압박 통증', '골반뼈 연결부 뻐근함', '하복부 뼈 통증'],
      skin: ['배 주변 가려움', '복부 피부 두드러기', '배꼽 주변 진물/염증'],
      tumor: ['복부 피부 아래 말랑한 멍울 (지방종 의심)', '배 주변에 잡히는 덩어리', '옆구리 혹/종괴'],
      discharge: ['복부 찰과상 및 쓸린 상처', '배꼽 주변 염증 및 진물/고름', '상처 부위 삼출물']
    },
    internal: {
      stabbing: ['콕콕 찌르는 복통', '맹장 부위 칼로 찌르는 통증', '옆구리 송곳 통증'],
      squeezing: ['위가 쥐어짜는 듯한 위경련', '창자가 뒤틀리는 통증', '하복부 쥐어짜는 생리통'],
      burning: ['속쓰림', '위산 역류 열감', '명치 아래 타는 듯한 느낌'],
      heavy: ['소화불량 및 더부룩함', '메스꺼움 및 구토', '설사'],
      pulsating: ['복부 대동맥 욱신거림', '장기 박동성 찌릿함', '하복부 욱신거림'],
      bloating: ['복부 팽만감 및 가스 참', '배가 빵빵하게 터질 듯한 압박', '위장관 팽창 및 더부룩함']
    }
  }
};

// Fallback helper for other body parts
export const getSymptomsForPart = (part: string, isInternal: boolean, subcategory: string): string[] => {
  const detail = BODY_PARTS_DETAIL[part];
  if (!detail) {
    const label = part.includes('Arm') ? '팔' : part.includes('Wrist') ? '손목' : part.includes('Knee') ? '무릎' : part.includes('Ankle') ? '발목' : part.includes('Leg') || part.includes('Thigh') || part.includes('Calf') ? '다리' : '신체';
    if (isInternal) {
      if (subcategory === 'stabbing') return [`${label} 속 콕콕 쑤심`, `${label} 내부 찌르는 통증`, '신경 자극성 찌릿함'];
      if (subcategory === 'squeezing') return [`${label} 쥐어짜는 통증`, `${label} 내부 근육 경련`, '조이는 듯한 조임'];
      if (subcategory === 'burning') return [`${label} 내부 후끈거림`, `${label} 속 타는 듯한 통증`, '열감 동반'];
      if (subcategory === 'pulsating') return [`${label} 욱신거리는 통증`, `${label} 박동성 찌릿함`, '지끈거리는 쑤심'];
      if (subcategory === 'bloating') return [`${label} 내부 팽만감`, `${label} 속 가스 차고 부푼 느낌`, '답답한 압박감'];
      return [`${label} 내부 묵직함`, `${label} 속 둔한 통증`, '저림 및 감각 둔화'];
    } else {
      if (subcategory === 'muscle') return [`${label} 근육 뻐근함`, `${label} 당기는 통증`, '알 배긴 듯한 근육통'];
      if (subcategory === 'vein') return [`${label} 혈관 저림`, `${label} 핏줄 찌릿함`, '순환 장애 의심'];
      if (subcategory === 'bone') return [`${label} 관절 삐걱거림`, `${label} 뼈 통증`, '관절 부위 쑤심'];
      if (subcategory === 'tumor') return [`${label} 부근 피부 속 혹/멍울 (지방종)`, `${label} 밑 만져지는 덩어리`, '종괴/종양 의심'];
      if (subcategory === 'discharge') return [`${label} 표면 찰과상 및 상처`, `${label} 부위 진물 및 고름`, '삼출물 분비'];
      return [`${label} 가려움증`, `${label} 피부 뾰루지/염증`, '부종 및 피부 붉어짐'];
    }
  }
  if (isInternal) {
    return detail.internal[subcategory as keyof typeof detail.internal] || [];
  } else {
    return detail.external[subcategory as keyof typeof detail.external] || [];
  }
};

export const CAUSE_RULES: {
  id: string;
  title: string;
  description: string;
  advice: string;
  keywords: string[];
  severity: 'low' | 'medium' | 'high' | 'emergency';
}[] = [
  {
    id: 'emergency_neurological',
    title: '응급 뇌신경계 반응군 (뇌졸중 의심)',
    description: '한쪽 몸의 마비, 언어 마비, 혹은 평생 처음 겪는 수준의 극심한 두통이 관찰됩니다. 급성 뇌혈관 질환(뇌경색, 뇌출혈)의 초응급 신호일 수 있습니다.',
    advice: '🚨 즉시 119를 불러 응급실로 이동하십시오. 골든타임(3시간) 내에 치료해야 후유증을 최소화할 수 있습니다. 환자에게 임의로 청심환이나 약물, 물을 먹이지 마십시오(기도 흡인 위험).',
    keywords: ['편측마비', '언어장애', '의식 변화', '극심한 두통'],
    severity: 'emergency'
  },
  {
    id: 'emergency_circulatory',
    title: '응급 심혈관계 반응군 (심근경색 의심)',
    description: '가슴을 쥐어짜거나 짓누르는 듯한 압박 통증과 함께 호흡 곤란이 동반됩니다. 급성 심근경색 등 심장혈관의 급격한 폐쇄 가능성이 매우 높습니다.',
    advice: '🚨 지체하지 말고 즉시 119 구급대를 호출해 심장 전용 장비가 구비된 병원으로 이동하십시오. 환자는 안정을 취하고 모든 신체 활동을 즉시 멈춰야 합니다.',
    keywords: ['호흡 곤란 및 가슴 통증', '심장이 쥐어짜는 듯한 압박'],
    severity: 'emergency'
  },
  {
    id: 'vascular_migraine',
    title: '혈관성 편두통 및 박동성 두통',
    description: '맥박 소리처럼 쿵쾅거리거나 지끈지끈 쑤시는 박동성 두통 양상입니다. 뇌 혈관의 일시적 확장이나 삼차신경 자극으로 인한 혈관성 두통으로 추정됩니다.',
    advice: '💡 강한 빛과 소음을 차단하고 어둡고 조용한 방에서 눈에 냉찜질을 하며 안정을 취하십시오. 진통제는 증상 초기에 복용하는 것이 효과적입니다.',
    keywords: ['맥박에 맞춰 지끈거림', '박동성 관자놀이 통증', '관자놀이가 욱신거림', '편두통', '뇌 혈관 찌릿함', '편두통성 박동'],
    severity: 'medium'
  },
  {
    id: 'intracranial_pressure',
    title: '뇌압 상승성 및 팽만 두통',
    description: '머리가 팽팽하게 부풀거나 뇌압이 올라가는 듯한 압박성 두통입니다. 스트레스, 혈압 상승, 혹은 수액 정체 등으로 인한 두개내압 변화와 연관될 수 있습니다.',
    advice: '💡 베개를 평소보다 높게 벨 수 있도록 하고, 편안히 앉아 심호흡을 취해 혈압을 낮추십시오. 구토나 시야 장애가 동반될 경우 즉시 응급 진료를 권장합니다.',
    keywords: ['머리 내부 압박감', '뇌압이 오르는 듯한 느낌', '두개골 내 팽창감'],
    severity: 'medium'
  },
  {
    id: 'tension_headache',
    title: '긴장성 두통 및 신경성 두통',
    description: '머리 뒷부분이 뻐근하고 뒷목이 뻣뻣하게 조여오는 통증입니다. 스트레스, 피로 누적, 혹은 스마트폰 장시간 사용 등 나쁜 자세로 인한 두경부 근육 수축 및 긴장이 주원인입니다.',
    advice: '💡 뭉친 어깨와 뒷목에 온찜질을 하고, 가볍게 목을 스트레칭해 주십시오. 카페인 섭취를 줄이고 타이레놀 등 진통소염제를 복용 후 안정을 취하십시오.',
    keywords: [
      '머리 뒤쪽 뻐근함', '뒷목 당김 근육통', '관자놀이 압박 통증', '머리가 묵직함', '어지러움',
      '송곳으로 찌르는 통증', '바늘로 콕콕 찌르는 느낌', '눈 뒤쪽 통증', '머리를 띠로 조이는 듯한 통증',
      '머릿속이 꽉 찬 듯한 답답함'
    ],
    severity: 'low'
  },
  {
    id: 'head_fever',
    title: '두부 열감 및 감염성 염증 반응',
    description: '두부 부위에 높은 열감이나 피부 화끈거림이 관찰되는 상태입니다. 감기 몸살, 일시적 일사병, 혹은 뇌수막염 초기 감염 징후일 수 있습니다.',
    advice: '💡 충분한 수분을 섭취하고 환부를 시원한 물수건으로 진정시키십시오. 38도 이상의 고열이 지속되거나 목 경직이 뚜렷하다면 즉시 진료를 받으십시오.',
    keywords: ['머리 전체 열감', '두피 화끈거림', '경직 및 발열'],
    severity: 'medium'
  },
  {
    id: 'head_lipoma',
    title: '두피 피하 종괴 (지방종/표피낭종 의심)',
    description: '두피 부위에 말랑말랑하거나 딱딱하게 멍울이 만져집니다. 대개 유해성이 크지 않은 피하지방종, 표피낭종, 혹은 모낭종일 가능성이 높습니다.',
    advice: '💡 통증이 없거나 크기가 급격히 커지지 않는다면 응급 상황은 아닙니다. 다만, 세균 감염 예방을 위해 억지로 짜거나 바늘로 찌르지 마시고 병원(외과/피부과)에서 초음파 검사를 통해 정밀 진단을 받으십시오.',
    keywords: ['머리에 만져지는 혹', '두피 아래 말랑한 멍울 (지방종 의심)', '머리 뒤쪽 딱딱한 종괴'],
    severity: 'low'
  },
  {
    id: 'head_wound',
    title: '두피 감염성 상처 및 진물/고름',
    description: '두피의 찰과상 부위에 염증이 발생하여 진물이나 고름 등의 삼출액 분비가 관찰됩니다.',
    advice: '💡 상처 부위를 소독제로 가볍게 소독하고 건조하게 유지하십시오. 고름이 지속될 경우 세균성 2차 감염 방지를 위해 피부과에서 항생제 처방 및 연고 도포 치료를 받아야 합니다.',
    keywords: ['두피에서 나는 진물/고름', '상처 부위 삼출물', '두피 찰과상 및 상처'],
    severity: 'medium'
  },
  {
    id: 'tonsillitis',
    title: '급성 편도염 및 인두염',
    description: '침을 삼키기 어려울 정도로 목 안이 부어오르고 침 삼킬 때마다 찌르는 듯한 날카로운 목구멍 통증이 발생합니다.',
    advice: '💡 미지근한 물을 자주 섭취하여 목 점막을 촉촉하게 유지하십시오. 식염수로 자주 목 가글을 해 주시고 소염진통제를 복용하십시오. 고열이 동반될 경우 이비인후과 치료를 통한 항생제 투여가 필요합니다.',
    keywords: ['침 삼킬 때 목 따가움', '목구멍 송곳 통증', '편도선 붓고 찌름', '목구멍 부어오름'],
    severity: 'medium'
  },
  {
    id: 'gerd',
    title: '위식도 역류 질환 및 후두 자극 증상',
    description: '목 안쪽이 화끈거리거나 신물이 넘어오는 작열감이 느껴지며 식도 부위에 무언가 걸린 듯한 이물감이 있습니다.',
    advice: '💡 식사 후 2~3시간 동안 절대 눕지 마십시오. 취침 시 베개를 높여 머리 부분을 위보다 높게 위치 시키고, 자극적인 탄산, 매운 음식, 카페인 섭취를 중단하십시오.',
    keywords: [
      '목구멍 화끈거림', '역류성 식도염 증상', '목 안쪽 열감', '식도 이물감', '삼킴 곤란',
      '기도 협착감', '식도 팽만감 및 이물감'
    ],
    severity: 'medium'
  },
  {
    id: 'cervical_disc',
    title: '경추 디스크 (경추추간판탈출증 의심)',
    description: '목덜미부터 어깨, 날개뼈 주위까지 뻐근하게 통증이 뻗치며 움직일 때 뼈 소리가 나거나 찌릿한 방사통이 유발됩니다.',
    advice: '💡 목을 뒤로 젖히거나 갑작스럽게 돌리는 과격한 스트레칭을 중단하십시오. 경추용 기능성 베개를 사용하고 며칠간 목보호대 착용을 고려하며, 증상이 호전되지 않을 시 정형외과 물리치료를 받으십시오.',
    keywords: ['목뼈 삐걱거림', '거북목 증후군 의심 통증', '목 디스크 방사통', '어깨 연결 부위 근육 뭉침', '목덜미 뻐근함', '목 좌우 움직임 시 뻐근함'],
    severity: 'high'
  },
  {
    id: 'neck_vascular',
    title: '경부 혈관 반응 및 순환 장애',
    description: '경동맥 부위의 욱신거림이나 목 주변의 박동성 통증이 관찰됩니다. 일시적인 혈류 압박이나 혈관계 자극 증상일 수 있습니다.',
    advice: '💡 목을 조이는 넥타이나 옷을 피하고 턱을 당겨 바른 자세를 유지하십시오. 안정을 취한 뒤에도 경동맥 부근 통증이 지속된다면 병원을 찾아 혈류 및 초음파 검사를 받아보십시오.',
    keywords: ['목 혈관 박동성 통증', '경동맥 부위 지릿함', '목 주변 부종', '목 주변 박동성 박동감', '경동맥 부위 욱신거림', '목 부근 혈류 압박감'],
    severity: 'medium'
  },
  {
    id: 'neck_tumor',
    title: '경부 림프절 결절 및 종양 (임파선염)',
    description: '목의 옆이나 뒤편에 멍울이 만져집니다. 감기나 염증 등으로 임파선이 일시적으로 부어오른 반응이거나 갑상선 혹 및 지방종일 수 있습니다.',
    advice: '💡 염증성 임파선염의 경우 대개 무해하나 종양 감별을 요합니다. 멍울 부위를 손으로 문지르거나 자극하지 마시고 이비인후과 초음파 검사를 받아 결절의 크기와 성상을 확인하십시오.',
    keywords: ['목 주변에 만져지는 림프절 멍울', '목 뒤편 말랑한 종괴 (지방종 의심)', '갑상선 부위 혹', '갑상선 부위 붓고 묵직함', '목소리 쉼', '목 주변이 묵직함'],
    severity: 'medium'
  },
  {
    id: 'neck_wound',
    title: '경부 피부 찰과상 및 염증성 진물',
    description: '목 피부 표면에 외상성 찰과상 혹은 긁힌 상처가 생겨 진물이 나거나 감염성 염증 반응이 나타납니다.',
    advice: '💡 목 부위는 땀이 차기 쉬우므로 청결히 하고 습윤 밴드를 사용하여 흉터를 예방하십시오. 붉어짐과 열감이 심해진다면 항생 연고를 도포하고 피부과 진료를 권장합니다.',
    keywords: ['목 주변 상처 및 진물', '피부 쓸림 찰과상', '염증성 고름 분비'],
    severity: 'low'
  },
  {
    id: 'pleurisy',
    title: '늑막염 및 기흉 (흉부 급성 손상)',
    description: '호흡을 깊게 들이마시거나 기침할 때 갈비뼈 안쪽 깊은 곳에서 칼로 찌르는 듯한 극심한 흉통이 느껴집니다.',
    advice: '💡 숨이 급하게 차거나 가슴에 찢어지는 통증이 있다면 기흉이나 흉수 고임일 가능성이 있습니다. 지체 없이 흉부 엑스레이 검사가 가능한 종합병원 응급실이나 내과를 즉시 방문하십시오.',
    keywords: ['숨 쉴 때 콕콕 쑤심', '기침 시 날카로운 통증', '가슴 찌르는 통증', '가슴 가스 차고 답답함', '폐 팽창 압박감', '흉부 압박 팽만감'],
    severity: 'high'
  },
  {
    id: 'costochondritis',
    title: '늑골 연골염 및 가슴 근골격통',
    description: '숨 쉴 때 갈비뼈 주변이 뻐근하게 조여오거나 특정 동작 시 통증이 일시적으로 심해집니다.',
    advice: '💡 흉골 주변을 손가락으로 지그시 누를 때 국소 통증이 가중된다면 단순 늑막염보다는 연골염일 가능성이 높습니다. 무거운 물건 들기나 상체 과도 운동을 피하고 충분히 휴식하십시오.',
    keywords: ['가슴 앞쪽 근육통', '갈비뼈 주변 뻐근함', '움직일 때만 아픈 통증', '흉골 압박 통증', '가슴 핏줄 비침', '가슴 혈관 압박감', '왼쪽 가슴 저릿함'],
    severity: 'low'
  },
  {
    id: 'breast_tumor',
    title: '흉부/유방 종양 (양성 낭종/지방종)',
    description: '가슴 표면이나 유방 주변에 부드럽고 말랑한 멍울 혹은 딱딱한 혹이 만져집니다.',
    advice: '💡 유방 조직의 섬유선종, 단순 피하 지방종, 혹은 악성 종양 여부의 조기 감별이 요구됩니다. 유방외과/외과에서 유방 촬영술 및 초음파 정밀 검진을 꼭 받으시기를 권장합니다.',
    keywords: ['유방/가슴 주변 만져지는 멍울', '가슴 피부 아래 말랑한 혹', '흉부 피부 종양 의심 덩어리'],
    severity: 'medium'
  },
  {
    id: 'chest_wound',
    title: '흉부 찰과상 및 염증성 고름',
    description: '가슴 부위에 외상으로 인한 상처 및 찰과상이 생겼거나 유두 주변 모낭 감염으로 고름 및 삼출물이 발생했습니다.',
    advice: '💡 특히 유두 주변의 만성 고름/진물은 단순 피부염 외에 심부 유선염의 신호일 수 있습니다. 상처 소독과 함께 깨끗한 거즈를 덧대고 외과 진료를 받으십시오.',
    keywords: ['가슴 상처 및 찰과상', '유두 주변 분비물/진물', '피부 염증성 고름'],
    severity: 'medium'
  },
  {
    id: 'acute_appendicitis',
    title: '급성 충수염 (맹장염 의심)',
    description: '복부 우하단(오른쪽 아랫배) 부위에 칼로 찌르는 듯한 날카롭고 찢어지는 듯한 복통과 옆구리 당김이 나타납니다.',
    advice: '🚨 충수(맹장) 파열로 인한 복막염으로 진행될 수 있으므로, 즉시 물을 포함하여 금식을 유지한 채 종합병원 응급실이나 외과를 찾으십시오. 아픈 배 부위에 뜨거운 팩을 대는 것은 파열 위험을 높이므로 절대 금물입니다.',
    keywords: ['맹장 부위 칼로 찌르는 통증', '옆구리 송곳 통증', '창자가 뒤틀리는 통증', '콕콕 찌르는 복통'],
    severity: 'high'
  },
  {
    id: 'peptic_ulcer',
    title: '급성 위경련 및 위십이지장궤양',
    description: '명치 부위가 쥐어짜듯 극심하게 아프고 속쓰림과 타는 듯한 작열통이 동반됩니다.',
    advice: '💡 차가운 음식이나 자극적인 위산 자극 요소를 차단하고 따뜻한 물로 위장을 덮어준 뒤 편안한 정자세로 안정을 취하십시오. 위경련용 진경제가 있다면 처방 복용을 조언합니다.',
    keywords: ['위가 쥐어짜는 듯한 위경련', '속쓰림', '위산 역류 열감', '명치 아래 타는 듯한 느낌', '하복부 쥐어짜는 생리통'],
    severity: 'medium'
  },
  {
    id: 'gastroenteritis',
    title: '급성 위장염 및 소화관 증상',
    description: '음식물 섭취 후 속이 꽉 막힌 듯한 더부룩함과 함께 오한, 구토, 물설사 등이 발생합니다.',
    advice: '💡 수분 탈수를 막기 위해 미지근한 보리차나 이온음료를 자주 마시십시오. 억지로 지사제(설사 멈추는 약)를 드실 경우 독소가 장내 머무는 기간이 길어져 좋지 않을 수 있으니 금식을 유지하며 지켜보십시오.',
    keywords: [
      '소화불량 및 더부룩함', '메스꺼움 및 구토', '설사', '복부 팽만감 및 가스 참',
      '배가 빵빵하게 터질 듯한 압박', '위장관 팽창 및 더부룩함', '복직근 근육통', '옆구리 당김',
      '배 힘줄 때 통증', '복부 대동맥 욱신거림', '장기 박동성 찌릿함', '하복부 욱신거림',
      '복부 혈관 확장 비침', '하복부 저릿함', '장벽 혈행 장애 의심'
    ],
    severity: 'low'
  },
  {
    id: 'abdominal_lipoma',
    title: '복부 지방종 및 서타성 탈장',
    description: '배 주변이나 옆구리 피부 밑에 눌렀을 때 아프지 않고 말랑하게 잘 움직이는 멍울이 감지됩니다.',
    advice: '💡 누우면 사라졌다가 서 있을 때 복압 상승으로 튀어 나오는 혹 형태라면 단순 지방종이 아닌 "탈장(Hernia)"의 우려가 있습니다. 통증이 없더라도 탈장이 교착되면 긴급 수술이 필요하므로 외과 상담을 추천합니다.',
    keywords: ['복부 피부 아래 말랑한 멍울 (지방종 의심)', '배 주변에 잡히는 덩어리', '옆구리 혹/종괴'],
    severity: 'medium'
  },
  {
    id: 'abdominal_wound',
    title: '복부 외부 찰과상 및 배꼽 염증 진물',
    description: '복부에 외부 충격으로 인한 찰과상 상처나, 특히 배꼽 주변 부위에 2차 감염으로 진물 및 고름이 분비됩니다.',
    advice: '💡 배꼽은 피부 구조상 세균 침투와 증식이 쉬워 요막관 기형 등이 배후 원인일 수 있습니다. 배꼽을 만지거나 딱지를 떼지 마시고 소독 후 외과/피부과 치료를 조언합니다.',
    keywords: ['복부 찰과상 및 쓸린 상처', '배꼽 주변 염증 및 진물/고름', '상처 부위 삼출물'],
    severity: 'medium'
  },
  {
    id: 'dermatitis_common',
    title: '접촉성 피부염 및 알레르기 반응',
    description: '피부가 벌겋게 부어오르고 가렵거나 모낭 주변에 자잘한 뾰루지가 번집니다.',
    advice: '💡 긁을 경우 손톱 세균으로 인한 봉와직염 등 2차 감염 위험이 높으므로 절대 긁지 말고 얼음찜질로 가려움을 완화시키십시오. 필요시 일반의약품 항히스타민제를 복용하십시오.',
    keywords: [
      '가려움증', '피부 뾰루지/염증', '피부 발진', '두피 가려움', '두피 뾰루지/염증',
      '두피 감각 예민', '목 주변 피부 발진', '목 뒤 아토피성 염증', '가슴 피부 발진',
      '유두 주변 통증/염증', '가슴 땀띠/가려움', '배 주변 가려움', '복부 피부 두드러기'
    ],
    severity: 'low'
  },
  {
    id: 'abscess_common',
    title: '화농성 피부 질환 (종기/농양)',
    description: '피부 속이 붉고 단단하게 부풀며 만질 때 강한 통증이 있고 농양이나 진물이 흘러 나옵니다.',
    advice: '💡 고름을 억지로 짜내면 염증 주머니가 터져 주변 진피층으로 세균이 번집니다. 따뜻한 압박찜질로 배농을 돕되 항생제 복용 및 외과적 절개 배농 처치(피부과/외과)를 강력히 권장합니다.',
    keywords: ['진물 및 고름', '염증성 고름 분비', '피부에서 나는 진물/고름', '상처 부위 삼출물', '삼출물 분비'],
    severity: 'medium'
  },
  {
    id: 'trauma_common',
    title: '외상성 피부 손상 및 표면 찰과상',
    description: '넘어짐이나 긁힘 등 마찰로 인한 외부 피부 찰과상 상처입니다.',
    advice: '💡 먼저 흐르는 깨끗한 물이나 식리식염수로 흙과 이물질을 깨끗이 씻어내십시오. 항생 연고를 도포하고 딱지가 앉기 전 습윤 밴드를 붙여 마찰로부터 상처를 보호하십시오.',
    keywords: [
      '찰과상', '상처', '피부 쓸림 찰과상', '상처 및 진물', '두피 찰과상 및 상처',
      '목 주변 상처 및 진물', '가슴 상처 및 찰과상', '복부 찰과상 및 쓸린 상처'
    ],
    severity: 'low'
  },
  {
    id: 'trauma_bone_injury',
    title: '일반 외상성 골격 및 관절 손상',
    description: '외부 강한 마찰 또는 충격으로 뼈나 관절 부위에 통증이나 삐걱거림이 감지됩니다.',
    advice: '💡 뼈의 골절 또는 미세 실금일 가능성이 있습니다. 상해 부위를 최대한 고정하여 압박이나 신체 하중을 가하지 마시고 즉시 정형외과 엑스레이 검진을 받으십시오.',
    keywords: ['충격 후 골절 의심', '관절 삐걱거림', '뼈 통증', '갈비뼈 아래 압박 통증', '골반뼈 연결부 뻐근함', '하복부 뼈 통증'],
    severity: 'high'
  },
  {
    id: 'limb_muscle_tension',
    title: '사지 근육 긴장 및 건초염',
    description: '팔, 다리, 손목, 혹은 관절 주변 근육의 뻐근함과 당기는 근육통이 느껴집니다. 급격한 근육 과사용 또는 힘줄의 피로 부하(건초염)가 주원인입니다.',
    advice: '💡 통증이 완화될 때까지 환부의 관절 운동 및 물리적 사용을 줄이십시오. 소염진통제를 가볍게 복용하시고 통증 부위를 냉찜질하는 것이 통증 및 붓기 가라앉힘에 좋습니다.',
    keywords: [
      '팔 근육 뻐근함', '팔 당기는 통증', '팔 알 배긴 듯한 근육통',
      '손목 근육 뻐근함', '손목 당기는 통증', '손목 알 배긴 듯한 근육통',
      '무릎 근육 뻐근함', '무릎 당기는 통증', '무릎 알 배긴 듯한 근육통',
      '발목 근육 뻐근함', '발목 당기는 통증', '발목 알 배긴 듯한 근육통',
      '다리 근육 뻐근함', '다리 당기는 통증', '다리 알 배긴 듯한 근육통',
      '신체 근육 뻐근함', '신체 당기는 통증', '신체 알 배긴 듯한 근육통'
    ],
    severity: 'low'
  },
  {
    id: 'limb_joint_injury',
    title: '관절 염좌 및 골격계 자극 손상',
    description: '팔, 손목, 다리, 무릎, 발목 관절 부위의 통증과 움직일 때 삐걱거리는 느낌이 있습니다. 인대 염좌 또는 연골판 자극 손상이 의심됩니다.',
    advice: '💡 관절에 하중을 싣는 격렬한 움직임을 삼가고, 환부 관절을 고정한 채 안정을 취하십시오. 부어오른다면 즉시 냉찜질을 해 주시고 정형외과에서 엑스레이 또는 초음파 검사를 통해 정밀 상태를 확인받으십시오.',
    keywords: [
      '팔 관절 삐걱거림', '팔 뼈 통증', '팔 관절 부위 쑤심',
      '손목 관절 삐걱거림', '손목 뼈 통증', '손목 관절 부위 쑤심',
      '무릎 관절 삐걱거림', '무릎 뼈 통증', '무릎 관절 부위 쑤심',
      '발목 관절 삐걱거림', '발목 뼈 통증', '발목 관절 부위 쑤심',
      '다리 관절 삐걱거림', '다리 뼈 통증', '다리 관절 부위 쑤심',
      '신체 관절 삐걱거림', '신체 뼈 통증', '신체 관절 부위 쑤심'
    ],
    severity: 'medium'
  },
  {
    id: 'limb_neuropathy',
    title: '사지 말초신경 압박 및 순환 장애',
    description: '팔, 다리, 손목, 발목 부위의 찌릿지릿하고 차가워지는 혈류 저림 현상입니다. 디스크성 신경근 압박(방사통) 또는 말초 부위의 혈류 흐름 불량 때문일 가능성이 큽니다.',
    advice: '💡 컴퓨터 마우스 사용이나 반복 작업 시 30분마다 스트레칭을 해 주십시오. 한 자세로 굳어 있지 않도록 자주 움직여 주시고, 저림이나 감각 저하가 풀리지 않는다면 신경과 진료를 추천합니다.',
    keywords: [
      '팔 혈관 저림', '팔 핏줄 찌릿함', '팔 순환 장애 의심',
      '손목 혈관 저림', '손목 핏줄 찌릿함', '손목 순환 장애 의심',
      '무릎 혈관 저림', '무릎 핏줄 찌릿함', '무릎 순환 장애 의심',
      '발목 혈관 저림', '발목 핏줄 찌릿함', '발목 순환 장애 의심',
      '다리 혈관 저림', '다리 핏줄 찌릿함', '다리 순환 장애 의심',
      '신체 혈관 저림', '신체 핏줄 찌릿함', '신체 순환 장애 의심'
    ],
    severity: 'low'
  },
  {
    id: 'limb_lipoma',
    title: '사지 피하 양성 종괴 (지방종/결절종)',
    description: '팔, 다리, 손목 등의 피부 밑에 말랑하게 잘 움직이는 멍울 혹은 딱딱한 혹이 만져집니다. 대부분 지방종이나 손목 관절의 결절종(물혹)일 가능성이 높습니다.',
    advice: '💡 지방종이나 관절 물혹은 억지로 힘을 주어 짜면 터지지 않고 내부에서 염증이 일어날 위험이 큽니다. 자연스레 소멸되지 않는 덩어리는 정형외과나 외과 진료를 통해 감별 및 제거 수술을 의논하십시오.',
    keywords: [
      '팔 부근 피부 속 혹/멍울 (지방종)', '팔 밑 만져지는 덩어리', '종괴/종양 의심',
      '손목 부근 피부 속 혹/멍울 (지방종)', '손목 밑 만져지는 덩어리',
      '무릎 부근 피부 속 혹/멍울 (지방종)', '무릎 밑 만져지는 덩어리',
      '발목 부근 피부 속 혹/멍울 (지방종)', '발목 밑 만져지는 덩어리',
      '다리 부근 피부 속 혹/멍울 (지방종)', '다리 밑 만져지는 덩어리',
      '신체 부근 피부 속 혹/멍울 (지방종)', '신체 밑 만져지는 덩어리'
    ],
    severity: 'low'
  },
  {
    id: 'limb_wound',
    title: '사지 피부 찰과상 및 감염성 진물',
    description: '팔다리, 손목 부위 표면에 외상성 긁힘 상처가 발생했거나 고름 및 삼출성 염증이 생성되었습니다.',
    advice: '💡 오염을 씻어내기 위해 식리식염수로 먼저 소독해 주시고 항생제 연고 도포 후 밴드를 씌우십시오. 고름이 지속되면 2차 봉와직염 감염 차단을 위해 병원 소독이 안전합니다.',
    keywords: [
      '팔 표면 찰과상 및 상처', '팔 부위 진물 및 고름', '삼출물 분비',
      '손목 표면 찰과상 및 상처', '손목 부위 진물 및 고름',
      '무릎 표면 찰과상 및 상처', '무릎 부위 진물 및 고름',
      '발목 표면 찰과상 및 상처', '발목 부위 진물 및 고름',
      '다리 표면 찰과상 및 상처', '다리 부위 진물 및 고름',
      '신체 표면 찰과상 및 상처', '신체 부위 진물 및 고름'
    ],
    severity: 'low'
  },
  {
    id: 'limb_internal_neuralgia',
    title: '사지 내부 신경 자극 및 신경통',
    description: '사지 깊숙한 내부에서 콕콕 쑤시거나 찌릿찌릿한 날카로운 고통이 느껴집니다. 일시적 신경통 또는 척추 디스크로 인한 척수신경 압박이 방사통 형태로 전달되었을 수 있습니다.',
    advice: '💡 허리와 목을 구부정하게 숙이는 동작을 피하시고, 척추를 바로 세워 안정을 취하십시오. 저림과 내부 찌릿함이 이틀 이상 계속된다면 신경외과나 신경과 검사를 제안합니다.',
    keywords: [
      '팔 속 콕콕 쑤심', '팔 내부 찌르는 통증', '신경 자극성 찌릿함',
      '손목 속 콕콕 쑤심', '손목 내부 찌르는 통증',
      '무릎 속 콕콕 쑤심', '무릎 내부 찌르는 통증',
      '발목 속 콕콕 쑤심', '발목 내부 찌르는 통증',
      '다리 속 콕콕 쑤심', '다리 내부 찌르는 통증',
      '신체 속 콕콕 쑤심', '신체 내부 찌르는 통증'
    ],
    severity: 'low'
  },
  {
    id: 'limb_muscle_spasm',
    title: '사지 근육 경련 및 위장성 쥐남',
    description: '팔이나 다리 내부의 근육이 비정상적으로 급격히 수축하여 비틀리거나 굳으면서 극심한 통증(근경련)이 일어납니다.',
    advice: '💡 쥐가 난 근육을 부드럽게 반대 방향으로 늘려 스트레칭 마사지를 하고 따뜻하게 덮어주십시오. 전해질 불균형이나 탈수가 원인일 수 있으므로 수분과 바나나 같은 미네랄 식품을 복용하십시오.',
    keywords: [
      '팔 쥐어짜는 통증', '팔 내부 근육 경련', '조이는 듯한 조임',
      '손목 쥐어짜는 통증', '손목 내부 근육 경련',
      '무릎 쥐어짜는 통증', '무릎 내부 근육 경련',
      '발목 쥐어짜는 통증', '발목 내부 근육 경련',
      '다리 쥐어짜는 통증', '다리 내부 근육 경련',
      '신체 쥐어짜는 통증', '신체 내부 근육 경련'
    ],
    severity: 'low'
  },
  {
    id: 'limb_internal_heat',
    title: '사지 내부 열감 및 심부 염증 반응',
    description: '팔다리 속이 화끈거리고 타는 듯한 작열통 또는 열감이 느껴집니다. 신경 자극뿐 아니라 심부 세균성 피부 감염(봉와직염)의 초기 전조 현상일 수 있습니다.',
    advice: '💡 환부 표면이 점점 빨개지고 붓거나 열감이 관찰된다면 항생제 복용이 필수적인 응급 봉와직염이므로 즉시 이비인후과, 피부과 또는 응급실을 내원하십시오. 겉의 변화가 없다면 온찜질을 유도합니다.',
    keywords: [
      '팔 내부 후끈거림', '팔 속 타는 듯한 통증', '열감 동반',
      '손목 내부 후끈거림', '손목 속 타는 듯한 통증',
      '무릎 내부 후끈거림', '무릎 속 타는 듯한 통증',
      '발목 내부 후끈거림', '발목 속 타는 듯한 통증',
      '다리 내부 후끈거림', '다리 속 타는 듯한 통증',
      '신체 내부 후끈거림', '신체 속 타는 듯한 통증'
    ],
    severity: 'medium'
  },
  {
    id: 'limb_internal_throbbing',
    title: '사지 박동성 통증 및 혈류성 욱신거림',
    description: '심장 맥박에 연동되어 팔다리 속이 지끈지끈 쑤시거나 욱신거립니다. 급성 림프관염 또는 관절낭 내부의 압력 상승으로 인한 동통입니다.',
    advice: '💡 환부 관절을 고정하고 심장 높이보다 높게 올려 부종을 감쇠시켜 준 뒤 얼음찜질로 염증 대사를 낮춰주십시오. 통증이 매우 심하면 정형외과 내원을 제안합니다.',
    keywords: [
      '팔 욱신거리는 통증', '팔 박동성 찌릿함', '지끈거리는 쑤심',
      '손목 욱신거리는 통증', '손목 박동성 찌릿함',
      '무릎 욱신거리는 통증', '무릎 박동성 찌릿함',
      '발목 욱신거리는 통증', '발목 박동성 찌릿함',
      '다리 욱신거리는 통증', '다리 박동성 찌릿함',
      '신체 욱신거리는 통증', '신체 박동성 찌릿함'
    ],
    severity: 'low'
  },
  {
    id: 'limb_edema_bloating',
    title: '사지 부종 및 내부 압박 팽만감',
    description: '팔다리가 무겁게 붓고 팽팽하게 차오르는 듯한 압박감입니다. 림프관 정체, 신장/심장 기능 저하로 인한 전신 부종, 혹은 하지 혈전성 폐쇄일 가능성이 있습니다.',
    advice: '💡 다리를 올려 혈류 복귀를 돕고 꽉 조이는 밴드나 옷을 해제하십시오. 한쪽 하지만 급격히 붓고 열이 나며 터질 듯한 팽창감이 있으면 심부정맥혈전증(DVT) 초응급 상태일 수 있으므로 즉시 응급실로 가십시오.',
    keywords: [
      '팔 내부 팽만감', '팔 속 가스 차고 부푼 느낌', '답답한 압박감',
      '손목 내부 팽만감', '손목 속 가스 차고 부푼 느낌',
      '무릎 내부 팽만감', '무릎 속 가스 차고 부푼 느낌',
      '발목 내부 팽만감', '발목 속 가스 차고 부푼 느낌',
      '다리 내부 팽만감', '다리 속 가스 차고 부푼 느낌',
      '신체 내부 팽만감', '신체 속 가스 차고 부푼 느낌'
    ],
    severity: 'medium'
  }
];

interface SymptomState {
  currentDiagnosis: Omit<DiagnosisRecord, 'id' | 'timestamp' | 'riskLevel' | 'inferredCause'>;
  history: DiagnosisRecord[];
  setPart: (part: string, label: string) => void;
  setIsInternal: (isInternal: boolean | null) => void;
  setSubcategory: (subcategory: string | null) => void;
  toggleSymptom: (symptom: string) => void;
  setDuration: (duration: string | null) => void;
  setIntensity: (intensity: number | null) => void;
  resetCurrentDiagnosis: () => void;
  loadHistory: () => Promise<void>;
  saveDiagnosis: () => Promise<DiagnosisRecord>;
}

const HISTORY_STORAGE_KEY = 'diagnosis_history';

export const useSymptomStore = create<SymptomState>((set, get) => ({
  currentDiagnosis: {
    part: '',
    partLabel: '',
    isInternal: null,
    subcategory: null,
    symptoms: [],
    duration: null,
    intensity: null,
  },
  history: [],

  setPart: (part, label) => set((state) => ({
    currentDiagnosis: { ...state.currentDiagnosis, part, partLabel: label, symptoms: [] }
  })),

  setIsInternal: (isInternal) => set((state) => ({
    currentDiagnosis: { ...state.currentDiagnosis, isInternal, subcategory: null, symptoms: [] }
  })),

  setSubcategory: (subcategory) => set((state) => ({
    currentDiagnosis: { ...state.currentDiagnosis, subcategory, symptoms: [] }
  })),

  toggleSymptom: (symptom) => set((state) => {
    const symptoms = state.currentDiagnosis.symptoms.includes(symptom)
      ? state.currentDiagnosis.symptoms.filter((s) => s !== symptom)
      : [...state.currentDiagnosis.symptoms, symptom];
    return { currentDiagnosis: { ...state.currentDiagnosis, symptoms } };
  }),

  setDuration: (duration) => set((state) => ({
    currentDiagnosis: { ...state.currentDiagnosis, duration }
  })),

  setIntensity: (intensity) => set((state) => ({
    currentDiagnosis: { ...state.currentDiagnosis, intensity }
  })),

  resetCurrentDiagnosis: () => set({
    currentDiagnosis: {
      part: '',
      partLabel: '',
      isInternal: null,
      subcategory: null,
      symptoms: [],
      duration: null,
      intensity: null,
    }
  }),

  loadHistory: async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        set({ history: JSON.parse(raw) });
      }

      // 로그인 세션이 있을 경우 서버 원격 진단 리포트 병합 로드
      const isLoggedIn = useAuthStore.getState().isLoggedIn;
      if (isLoggedIn) {
        try {
          const reports = await api.get('/api/reports');
          if (Array.isArray(reports)) {
            const serverHistory: DiagnosisRecord[] = reports.map((rep: any) => {
              try {
                return JSON.parse(rep.content);
              } catch (e) {
                return {
                  id: String(rep.id),
                  timestamp: new Date(rep.createdAt).getTime(),
                  part: 'general',
                  partLabel: '일반',
                  isInternal: null,
                  subcategory: null,
                  symptoms: [],
                  duration: null,
                  intensity: null,
                  riskLevel: rep.riskLevel,
                  inferredCause: rep.title,
                  inferredCauseDesc: rep.content,
                };
              }
            });

            // 로컬 히스토리와 중복 체크 후 병합
            const merged = [...get().history];
            serverHistory.forEach((srv) => {
              if (!merged.some((loc) => loc.id === srv.id)) {
                merged.push(srv);
              }
            });

            merged.sort((a, b) => b.timestamp - a.timestamp);

            set({ history: merged });
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(merged));
          }
        } catch (serverErr) {
          console.warn('Failed to fetch diagnosis history from server:', serverErr);
        }
      }
    } catch (_) {}
  },

  saveDiagnosis: async () => {
    const current = get().currentDiagnosis;
    const history = get().history;
    const now = Date.now();

    const hasRedFlag = current.symptoms.some((sym) => RED_FLAGS.includes(sym));

    let riskLevel: DiagnosisRecord['riskLevel'] = 'low';
    let inferredCause = '전반적인 신체 불편 및 피로';
    let inferredCauseDesc = '특이적인 중증 질환 징후는 관찰되지 않으나, 몸의 면역력 저하 또는 피로 누적으로 발생한 증상일 수 있습니다.';
    let selfCareAdvice = '충분한 수면과 균형 있는 영양을 섭취하고 2-3일간 안정을 취하십시오. 증상이 지속되거나 악화될 시 의사 진료를 권장합니다.';

    const matchedRules = CAUSE_RULES.filter((rule) => 
      rule.keywords.some((keyword) => current.symptoms.includes(keyword))
    ).sort((a, b) => {
      const aCount = a.keywords.filter((k: string) => current.symptoms.includes(k)).length;
      const bCount = b.keywords.filter((k: string) => current.symptoms.includes(k)).length;
      return bCount - aCount;
    });

    if (matchedRules.length > 0) {
      const topRule = matchedRules[0];
      riskLevel = topRule.severity;
      inferredCause = topRule.title;
      inferredCauseDesc = topRule.description;
      selfCareAdvice = topRule.advice;
    }

    if (hasRedFlag) {
      riskLevel = 'emergency';
    }

    if (riskLevel !== 'emergency' && current.intensity && current.intensity >= 8) {
      if (riskLevel === 'low') riskLevel = 'medium';
      else if (riskLevel === 'medium') riskLevel = 'high';
      else if (riskLevel === 'high') riskLevel = 'emergency';
    }

    if (riskLevel !== 'emergency' && (current.duration === '지속적' || current.duration === '48시간 이상' || current.duration === '24시간')) {
      if (riskLevel === 'low') riskLevel = 'medium';
      else if (riskLevel === 'medium') riskLevel = 'high';
    }

    const activePeriod = 24 * 60 * 60 * 1000;
    const recentCheckCount = history.filter((record) => {
      const isRecent = (now - record.timestamp) < activePeriod;
      const samePart = record.part === current.part;
      const hasOverlap = record.symptoms.some((s) => current.symptoms.includes(s));
      return isRecent && samePart && hasOverlap;
    }).length;

    if (recentCheckCount > 0 && riskLevel !== 'emergency') {
      if (recentCheckCount === 1) {
        if (riskLevel === 'low') riskLevel = 'medium';
        else if (riskLevel === 'medium') riskLevel = 'high';
        else if (riskLevel === 'high') riskLevel = 'emergency';
      } else {
        if (riskLevel === 'low' || riskLevel === 'medium') riskLevel = 'high';
        else if (riskLevel === 'high') riskLevel = 'emergency';
      }
    }

    const record: DiagnosisRecord = {
      ...current,
      id: now.toString(),
      timestamp: now,
      riskLevel,
      inferredCause,
      inferredCauseDesc,
      selfCareAdvice
    };

    const updatedHistory = [record, ...history];
    set({ history: updatedHistory });
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));

    // 로그인된 사용자의 경우 백엔드 서버에도 진단 결과 백업 업로드
    const isLoggedIn = useAuthStore.getState().isLoggedIn;
    if (isLoggedIn) {
      try {
        await api.post('/api/reports', {
          title: `${record.partLabel} 자가진단 (${record.inferredCause})`,
          content: JSON.stringify(record),
          riskLevel: record.riskLevel,
        });
      } catch (serverErr) {
        console.warn('Failed to upload diagnosis record to server:', serverErr);
      }
    }

    return record;
  }
}));
