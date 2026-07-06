import { useState } from 'react';

export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface SymptomCheckerState {
  step: number;               // 1단계(부위선택) ~ 5단계(강도설정) 흐름 제어
  selectedPart: string | null;// 선택된 신체 부위 (head, chest 등)
  partLabel: string | null;   // 신체 부위 한글명 (머리, 가슴 등)
  isInternal: boolean;        // 내부/외부 여부
  subcategory: string | null; // 통증 종류 (stabbing, burning 등)
  selectedSymptoms: string[]; // 선택된 구체적 증상 목록
  intensity: number;          // 통증 강도 (1 ~ 10)
}

// 순수 함수로 구성된 통증 위험 등급 계산 알고리즘
export function calculateRisk(symptomsCount: number, intensity: number): RiskLevel {
  if (intensity >= 8 || symptomsCount >= 4) return 'very_high';
  if (intensity >= 6 || symptomsCount >= 3) return 'high';
  if (intensity >= 4) return 'medium';
  return 'low';
}

export function useSymptomChecker() {
  const [state, setState] = useState<SymptomCheckerState>({
    step: 1,
    selectedPart: null,
    partLabel: null,
    isInternal: false,
    subcategory: null,
    selectedSymptoms: [],
    intensity: 5,
  });

  const nextStep = () => setState(prev => ({ ...prev, step: Math.min(prev.step + 1, 5) }));
  const prevStep = () => setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  
  const selectPart = (part: string, label: string) => {
    setState(prev => ({
      ...prev,
      selectedPart: part,
      partLabel: label,
      // 부위 변경 시 하위 응답들 초기화
      subcategory: null,
      selectedSymptoms: []
    }));
  };

  const setInternalExternal = (isInternal: boolean) => {
    setState(prev => ({ ...prev, isInternal }));
  };

  const selectSubcategory = (sub: string) => {
    setState(prev => ({ ...prev, subcategory: sub, selectedSymptoms: [] }));
  };
  
  const toggleSymptom = (symptom: string) => {
    setState(prev => {
      const alreadySelected = prev.selectedSymptoms.includes(symptom);
      const nextSymptoms = alreadySelected
        ? prev.selectedSymptoms.filter(s => s !== symptom)
        : [...prev.selectedSymptoms, symptom];
      return { ...prev, selectedSymptoms: nextSymptoms };
    });
  };

  const setIntensity = (level: number) => {
    setState(prev => ({ ...prev, intensity: level }));
  };

  const resetChecker = () => {
    setState({
      step: 1,
      selectedPart: null,
      partLabel: null,
      isInternal: false,
      subcategory: null,
      selectedSymptoms: [],
      intensity: 5,
    });
  };

  const riskLevel = calculateRisk(state.selectedSymptoms.length, state.intensity);

  return {
    ...state,
    riskLevel,
    selectPart,
    setInternalExternal,
    selectSubcategory,
    toggleSymptom,
    setIntensity,
    nextStep,
    prevStep,
    resetChecker,
  };
}
