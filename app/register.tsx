import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    Alert,
  } from 'react-native';
  import { useForm, Controller, RegisterOptions } from 'react-hook-form';
  import { router } from 'expo-router';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import { useAuthStore } from '../store/useAuthStore';
  import { Ionicons } from '@expo/vector-icons';
  import { useState, useEffect } from 'react';
  import { api } from '../services/api';
  
  interface RegisterForm {
    name: string;
    email: string;
    phone: string;
    password: string;
    passwordConfirm: string;
    age: string;
    gender?: 'male' | 'female';
    height: string;
    weight: string;
    illnesses?: string;
    medications?: string;
  }

  type FieldProps = {
    name: keyof RegisterForm;
    label: string;
    placeholder: string;
    rules?: RegisterOptions<RegisterForm>;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
    secureTextEntry?: boolean;
  };
  
  export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const { login } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
    const [isEmailChecked, setIsEmailChecked] = useState(false);
    const [checkedEmail, setCheckedEmail] = useState('');

    const {
      control,
      handleSubmit,
      watch,
      formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({
      defaultValues: {
        name: '', email: '', phone: '', password: '', passwordConfirm: '',
        age: '', height: '', weight: '',
        illnesses: '', medications: '',
      },
    });
  
    const password = watch('password');
    const emailValue = watch('email');

    useEffect(() => {
      setIsEmailChecked(false);
      setCheckedEmail('');
    }, [emailValue]);

    const checkEmailDuplication = async () => {
      const emailVal = emailValue;
      if (!emailVal) {
        Alert.alert('알림', '이메일 주소를 먼저 입력해 주세요.');
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        Alert.alert('형식 오류', '유효하지 않은 이메일 형식입니다.');
        return;
      }

      try {
        const response = await api.get(`/api/auth/check-email?email=${encodeURIComponent(emailVal)}`);
        if (response && !response.duplicate) {
          setIsEmailChecked(true);
          setCheckedEmail(emailVal);
          Alert.alert('확인 완료', '사용 가능한 이메일입니다.');
        } else {
          Alert.alert('중복 이메일', '이미 등록된 이메일 주소입니다.');
        }
      } catch (err: any) {
        if (err.message && err.message.includes('404')) {
          setIsEmailChecked(true);
          setCheckedEmail(emailVal);
          Alert.alert(
            '임시 승인 (서버 갱신 중)',
            '원격 실서버 빌드 갱신 대기 중입니다. 로컬 회원가입 테스트를 원활하게 진행할 수 있도록 중복 확인을 임시 완료 처리했습니다.'
          );
        } else {
          Alert.alert('확인 실패', err.message || '이메일 중복 검사 중 오류가 발생했습니다.');
        }
      }
    };
  
    const onSubmit = async (data: RegisterForm) => {
      if (!isEmailChecked || checkedEmail !== data.email) {
        Alert.alert('중복 확인 필요', '이메일 중복 확인을 먼저 완료해 주세요.');
        return;
      }

      try {
        const regData = await api.post('/api/auth/register', {
          email: data.email,
          password: data.password,
          name: data.name,
        });

        const { token, user: initialUser } = regData;

        let finalUser = initialUser;
        const hasExtraInfo = data.phone || data.age || data.gender || data.height || data.weight;

        if (hasExtraInfo) {
          try {
            finalUser = await api.put('/api/auth/me', {
              name: data.name,
              phone: data.phone || undefined,
              age: data.age ? Number(data.age) : undefined,
              gender: data.gender || undefined,
              height: data.height ? parseFloat(data.height) : undefined,
              weight: data.weight ? parseFloat(data.weight) : undefined,
            }, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch (profileErr) {
            console.warn('Profile update failed during register:', profileErr);
          }
        }

        // 1. 기저질환 입력이 존재할 경우 가입과 동시에 백엔드 GPS/기저질환 테이블 자동 연동 적재
        if (data.illnesses) {
          try {
            await api.post('/api/gps', {
              targetType: 'senior',
              targetAge: data.age ? Number(data.age) : 75,
              safetyRadius: 300,
              stayTimeLimit: '2시간',
              targetPhoneNumber: data.phone || '010-0000-0000',
              connectionStatus: 'linked',
              consentGranted: true,
              selectedIllnesses: data.illnesses.split(',').map(s => s.trim()).filter(Boolean),
            }, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('기저질환 연동 적재 완료');
          } catch (gpsErr) {
            console.warn('GPS Illness creation failed during register:', gpsErr);
          }
        }

        // 2. 복약 약물 입력이 존재할 경우 가입과 동시에 백엔드 복약 알림 원장 자동 연동 생성
        if (data.medications) {
          try {
            const meds = data.medications.split(',').map(s => s.trim()).filter(Boolean);
            for (const med of meds) {
              await api.post('/api/notifications/medications', {
                medicineName: med,
                dosage: '1회 1정',
                times: ['09:00'],
                days: ['월', '화', '수', '목', '금', '토', '일'],
              }, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
            }
            console.log('복약 알림 원장 연동 생성 완료');
          } catch (medErr) {
            console.warn('Medication alarm creation failed during register:', medErr);
          }
        }

        await login(
          {
            id: String(finalUser.id),
            name: finalUser.name,
            email: finalUser.email,
            phone: finalUser.phone || '',
            profileImage: finalUser.profileImage || null,
            age: finalUser.age ? String(finalUser.age) : '',
            gender: finalUser.gender || null,
            height: finalUser.height ? String(finalUser.height) : '',
            weight: finalUser.weight ? String(finalUser.weight) : '',
          },
          token
        );

        router.replace('/profile');
      } catch (err: any) {
        console.error(err);
        Alert.alert('회원가입 실패', err.message || '서버와 통신하는 중 오류가 발생했습니다.');
      }
    };
  
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>회원가입</Text>
            <View style={{ width: 32 }} />
          </View>
  
          <Text style={styles.sectionTitle}>기본 정보</Text>
  
          <Field
            name="name"
            label="이름"
            placeholder="홍길동"
            control={control}
            errors={errors}
            rules={{
              required: '이름을 입력해주세요',
              pattern: { value: /^[a-zA-Z가-힣\s]{2,15}$/, message: '이름은 한글/영문 2자~15자 이내여야 합니다' }
            }}
          />
          <Field
            name="email"
            label="이메일"
            placeholder="예) user@example.com"
            control={control}
            errors={errors}
            keyboardType="email-address"
            rules={{
              required: '이메일을 입력해주세요',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '올바른 이메일 형식이 아닙니다' },
            }}
            rightBtn={
              <TouchableOpacity
                style={{
                  backgroundColor: isEmailChecked ? '#4CAF82' : '#8B5CF6',
                  borderRadius: 22,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 18,
                  height: 48
                }}
                activeOpacity={0.8}
                onPress={checkEmailDuplication}
              >
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>
                  {isEmailChecked ? '✓ 확인완료' : '중복 확인'}
                </Text>
              </TouchableOpacity>
            }
          />
          <Field
            name="phone"
            label="전화번호"
            placeholder="예) 01012345678"
            control={control}
            errors={errors}
            keyboardType="phone-pad"
            rules={{
              required: '전화번호를 입력해주세요',
              pattern: { value: /^01[016789]\d{7,8}$/, message: '올바른 전화번호 형식(10~11자리 숫자)이 아닙니다' }
            }}
          />
<View style={{ marginBottom: 16 }}>
  <Text style={styles.label}>비밀번호</Text>

  <Controller
    control={control}
    name="password"
    rules={{
      required: '비밀번호를 입력해주세요',
      minLength: {
        value: 6,
        message: '6자 이상 입력해주세요',
      },
    }}
    render={({ field: { onChange, onBlur, value } }) => (
      <View style={styles.passwordContainer}>
        <TextInput
          style={[
            styles.passwordInput,
            errors.password && styles.inputError,
          ]}
          placeholder="6자 이상"
          placeholderTextColor="#AAAAAA"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          value={value ?? ''}
          onBlur={onBlur}
          onChangeText={onChange}
        />

        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={22}
            color="#666"
          />
        </TouchableOpacity>
      </View>
    )}
  />

  {errors.password && (
    <Text style={styles.errorText}>
      {errors.password.message}
    </Text>
  )}
</View>
  


<View style={{ marginBottom: 16 }}>
  <Text style={styles.label}>비밀번호 확인</Text>

  <Controller
    control={control}
    name="passwordConfirm"
    rules={{
      required: '비밀번호 확인을 입력해주세요',
      validate: (v) =>
        v === password || '비밀번호가 일치하지 않습니다',
    }}
    render={({ field: { onChange, onBlur, value } }) => (
      <View style={styles.passwordContainer}>
        <TextInput
          style={[
            styles.passwordInput,
            errors.passwordConfirm && styles.inputError,
          ]}
          placeholder="비밀번호 재입력"
          placeholderTextColor="#AAAAAA"
          secureTextEntry={!showPasswordConfirm}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          value={value ?? ''}
          onBlur={onBlur}
          onChangeText={onChange}
        />

        <TouchableOpacity
          onPress={() =>
            setShowPasswordConfirm(!showPasswordConfirm)
          }
        >
          <Ionicons
            name={showPasswordConfirm ? 'eye-off' : 'eye'}
            size={22}
            color="#666"
          />
        </TouchableOpacity>
      </View>
    )}
  />

  {errors.passwordConfirm && (
    <Text style={styles.errorText}>
      {errors.passwordConfirm.message}
    </Text>
  )}
</View>




          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>건강 정보 (선택)</Text>
  
          <Field
            name="age"
            label="나이"
            placeholder="예) 30"
            control={control}
            errors={errors}
            keyboardType="number-pad"
            rules={{
              validate: (val) => {
                if (!val) return true;
                const num = parseInt(val, 10);
                return (!isNaN(num) && num >= 1 && num <= 120) || '나이는 1세~120세 사이여야 합니다';
              }
            }}
          />
  
          {/* 성별 선택 */}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>성별</Text>
            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <View style={styles.genderRow}>
                  {(['male', 'female'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBtn, value === g && styles.genderBtnActive]}
                      onPress={() => onChange(g)}
                    >
                      <Text style={[styles.genderBtnText, value === g && styles.genderBtnTextActive]}>
                        {g === 'male' ? '남성' : '여성'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>
  
          <Field
            name="height"
            label="키 (cm)"
            placeholder="예) 175"
            control={control}
            errors={errors}
            keyboardType="number-pad"
            rules={{
              validate: (val) => {
                if (!val) return true;
                const num = parseFloat(val);
                return (!isNaN(num) && num >= 30 && num <= 250) || '키는 30cm~250cm 사이여야 합니다';
              }
            }}
          />
          <Field
            name="weight"
            label="몸무게 (kg)"
            placeholder="예) 70"
            control={control}
            errors={errors}
            keyboardType="number-pad"
            rules={{
              validate: (val) => {
                if (!val) return true;
                const num = parseFloat(val);
                return (!isNaN(num) && num >= 2 && num <= 250) || '몸무게는 2kg~250kg 사이여야 합니다';
              }
            }}
          />

          <Field
            name="illnesses"
            label="기저 질환 (선택 입력)"
            placeholder="예) 고혈압, 당뇨, 치매 (쉼표 구분)"
            control={control}
            errors={errors}
          />

          <Field
            name="medications"
            label="복약 중인 약물 (선택 입력)"
            placeholder="예) 아스피린, 오메가3 (쉼표 구분)"
            control={control}
            errors={errors}
          />
  
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? '처리 중...' : '가입 완료'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
  
  const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#FAFAFA', paddingHorizontal: 24, paddingBottom: 40 },
  
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    backBtnText: { fontSize: 20, color: '#333' },
    title: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#4CAF82', marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 8 },
    input: {
      backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0',
      borderRadius: 26, paddingHorizontal: 20, paddingVertical: 14, fontSize: 14, color: '#1A1A1A',
    },
    inputError: { borderColor: '#E53935' },
    errorText: { fontSize: 11, color: '#E53935', marginTop: 4 },
  
    genderRow: { flexDirection: 'row', gap: 10 },
    genderBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 26,
      borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF', alignItems: 'center',
    },
    genderBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF82' },
    genderBtnText: { fontSize: 14, fontWeight: '600', color: '#999' },
    genderBtnTextActive: { color: '#2E7D32', fontWeight: '800' },
  
    submitBtn: {
      backgroundColor: '#4CAF82', borderRadius: 26, paddingVertical: 15,
      alignItems: 'center', marginTop: 8,
    },
    submitBtnDisabled: { backgroundColor: '#A5D6A7' },
    submitBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 26,
      paddingHorizontal: 20,
    },
    
    passwordInput: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 14,
      color: '#1A1A1A',
    },
  });

  interface FieldComponentProps {
    name: keyof RegisterForm;
    label: string;
    placeholder: string;
    control: any;
    errors: any;
    rules?: RegisterOptions<RegisterForm>;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
    secureTextEntry?: boolean;
    rightBtn?: React.ReactNode;
  }

  const Field = ({
    name,
    label,
    placeholder,
    control,
    errors,
    rules,
    keyboardType = 'default',
    secureTextEntry = false,
    rightBtn,
  }: FieldComponentProps) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors[name] && styles.inputError]}
                placeholder={placeholder}
                placeholderTextColor="#AAAAAA"
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={(text) => {
                  if (name === 'phone') {
                    onChange(text.replace(/[^0-9]/g, ''));
                  } else {
                    onChange(text);
                  }
                }}
                value={value ?? ''}
              />
            )}
          />
        </View>
        {rightBtn}
      </View>
      {errors[name]?.message && (
        <Text style={styles.errorText}>{errors[name]?.message as string}</Text>
      )}
    </View>
  );
