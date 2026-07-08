/**
 * 건강체크 어플리케이션 전용 입력 양식 검증 유틸리티
 */

// 이메일 정규식 양식
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// 비밀번호 제약 조건: 최소 6자 이상, 최대 20자 이하
export const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 20;
};

// 휴대폰 번호 제약 조건: 숫자만 11자리 (01012345678) 형태 또는 대시 포함 형식
// phone-pad 키보드에서 대시(-) 입력 불가능 이슈로 숫자만 형식을 기본으로 지원
export const validatePhone = (phone: string): boolean => {
  // 숫자만 10~11자리 형식 (01012345678, 0101234567)
  const pureDigitsRegex = /^01[016789]\d{7,8}$/;
  // 레거시: 대시 포함 형식 (010-1234-5678) - 하위 호환성 유지
  const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;
  return pureDigitsRegex.test(phone) || phoneRegex.test(phone);
};

// 이름 제약 조건: 한글 또는 영문만 허용, 2자 이상 15자 이하
export const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z가-힣\s]{2,15}$/;
  return nameRegex.test(name.trim());
};

// 나이 제약 조건: 1세 이상 120세 이하
export const validateAge = (ageStr: string): boolean => {
  const age = parseInt(ageStr, 10);
  return !isNaN(age) && age >= 1 && age <= 120;
};

// 신장(키) 제약 조건: 30cm 이상 250cm 이하
export const validateHeight = (heightStr: string): boolean => {
  const height = parseFloat(heightStr);
  return !isNaN(height) && height >= 30 && height <= 250;
};

// 체중(몸무게) 제약 조건: 2kg 이상 250kg 이하
export const validateWeight = (weightStr: string): boolean => {
  const weight = parseFloat(weightStr);
  return !isNaN(weight) && weight >= 2 && weight <= 250;
};

// 신용카드 16자리 숫자 제약 조건
export const validateCardNumber = (cardNo: string): boolean => {
  // 대시 포함 19자(1234-5678-1234-5678) 혹은 대시 없는 16자리 숫자
  const cardRegex = /^\d{4}-\d{4}-\d{4}-\d{4}$/;
  const pureCardRegex = /^\d{16}$/;
  return cardRegex.test(cardNo) || pureCardRegex.test(cardNo);
};

// 신용카드 만료일 MM/YY 양식 검증
export const validateCardExpiry = (expiry: string): boolean => {
  const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
  return expiryRegex.test(expiry);
};
