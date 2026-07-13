import { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';

interface LoginForm {
  email: string;
  password: string;
}

type FieldProps = {
  name: keyof LoginForm;
  label: string;
  placeholder: string;
  rules?: RegisterOptions<LoginForm>;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isLoggedIn } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const [rememberEmail, setRememberEmail] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isLoggedIn) router.replace('/profile');
  }, [isLoggedIn]);

  useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const saved = await AsyncStorage.getItem('remembered_email');
        if (saved) {
          setValue('email', saved);
          setRememberEmail(true);
        }
      } catch (e) {
        console.warn('Failed to load remembered email:', e);
      }
    };
    loadRememberedEmail();
  }, []);

  const onSubmit = async (data: LoginForm) => {
    try {
      const resData = await api.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { token, user } = resData;

      if (rememberEmail) {
        await AsyncStorage.setItem('remembered_email', data.email);
      } else {
        await AsyncStorage.removeItem('remembered_email');
      }

      await login(
        {
          id: String(user.id),
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          profileImage: user.profileImage || null,
          age: user.age ? String(user.age) : '',
          gender: user.gender || null,
          height: user.height ? String(user.height) : '',
          weight: user.weight ? String(user.weight) : '',
        },
        token
      );
      router.replace('/profile');
    } catch (err: any) {
      console.error(err);
      Alert.alert('로그인 실패', err.message || '서버와 통신하는 중 오류가 발생했습니다.');
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
        {/* 뒤로가기 버튼 */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 32 }} />
        </View>

        {/* 로고 */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>💚</Text>
          <Text style={styles.logoText}>건강체크</Text>
          <Text style={styles.logoSub}>나의 건강을 스마트하게 관리하세요</Text>
        </View>

        {/* 이메일 */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.label}>이메일</Text>
          <Controller
            control={control}
            name="email"
            rules={{
              required: '이메일을 입력해주세요',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: '올바른 이메일 형식이 아닙니다',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="example@email.com"
                placeholderTextColor="#AAAAAA"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ''}
              />
            )}
          />
          {errors.email?.message && (
            <Text style={styles.errorText}>{errors.email.message}</Text>
          )}
        </View>

        {/* 비밀번호 — state 토글로 iOS 버그 방지 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.label}>비밀번호</Text>
          <Controller
            control={control}
            name="password"
            rules={{
              required: '비밀번호를 입력해주세요',
              minLength: { value: 6, message: '비밀번호는 6자 이상이어야 합니다' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="비밀번호 입력"
                  placeholderTextColor="#AAAAAA"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
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
          {errors.password?.message && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}
        </View>

        {/* 아이디 기억하기 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 }}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            activeOpacity={0.8}
            onPress={() => setRememberEmail(prev => !prev)}
          >
            <Ionicons 
              name={rememberEmail ? 'checkbox' : 'square-outline'} 
               size={20} 
              color={rememberEmail ? '#4CAF82' : '#888'} 
            />
            <Text style={{ fontSize: 13, color: '#555', fontWeight: '600' }}>아이디 기억하기</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, isSubmitting && styles.loginBtnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBtnText}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Text>
        </TouchableOpacity>

        {/* 아이디/비밀번호 찾기 */}
        <View style={styles.findRow}>
          <TouchableOpacity onPress={() => router.push('/find-info')} activeOpacity={0.7}>
            <Text style={styles.findText}>아이디 찾기</Text>
          </TouchableOpacity>
          <Text style={styles.findDivider}>|</Text>
          <TouchableOpacity onPress={() => router.push('/find-info')} activeOpacity={0.7}>
            <Text style={styles.findText}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push('/register')}
          activeOpacity={0.85}
        >
          <Text style={styles.registerBtnText}>회원가입</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 20, color: '#333' },

  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { fontSize: 52, marginBottom: 8 },
  logoText: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', marginBottom: 6 },
  logoSub: { fontSize: 13, color: '#9E9E9E', textAlign: 'center' },

  label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 8 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1A1A1A',
  },
  inputError: { borderColor: '#E53935' },
  errorText: { fontSize: 11, color: '#E53935', marginTop: 4 },

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
  eyeBtn: { paddingLeft: 8, paddingRight: 4 },

  loginBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: 'center',
  },
  loginBtnDisabled: { backgroundColor: '#A5D6A7' },
  loginBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEEEEE' },
  dividerText: { fontSize: 12, color: '#AAAAAA' },

  registerBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4CAF82',
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: 'center',
  },
  registerBtnText: { fontSize: 15, fontWeight: '800', color: '#4CAF82' },

  findRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  findText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  findDivider: {
    fontSize: 12,
    color: '#DDDDDD',
  },
});
