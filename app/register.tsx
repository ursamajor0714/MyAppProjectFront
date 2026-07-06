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
  import { useState } from 'react';
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
  }


  
  export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const { login } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
    const {
      control,
      handleSubmit,
      watch,
      formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({
      defaultValues: {
        name: '', email: '', phone: '', password: '', passwordConfirm: '',
        age: '', height: '', weight: '',
      },
    });
  
    const password = watch('password');
  
    const onSubmit = async (data: RegisterForm) => {
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
            placeholder="example@email.com"
            control={control}
            errors={errors}
            keyboardType="email-address"
            rules={{
              required: '이메일을 입력해주세요',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '올바른 이메일 형식이 아닙니다' },
            }}
          />
          <Field
            name="phone"
            label="전화번호"
            placeholder="010-0000-0000"
            control={control}
            errors={errors}
            keyboardType="phone-pad"
            rules={{
              required: '전화번호를 입력해주세요',
              pattern: { value: /^01[016789]-\d{3,4}-\d{4}$/, message: '올바른 전화번호 형식(010-XXXX-XXXX)이 아닙니다' }
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
  }: FieldComponentProps) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
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
            onChangeText={onChange}
            value={value ?? ''}
          />
        )}
      />
      {errors[name]?.message && (
        <Text style={styles.errorText}>{errors[name]?.message as string}</Text>
      )}
    </View>
  );
