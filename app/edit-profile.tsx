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
  import { api } from '../services/api';
  
  interface EditProfileForm {
    name: string;
    phone: string;
    age: string;
    gender?: 'male' | 'female';
    height: string;
    weight: string;
  }
  
  type FieldProps = {
    name: keyof EditProfileForm;
    label: string;
    placeholder: string;
    rules?: RegisterOptions<EditProfileForm>;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  };
  
  export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const { user, updateUser } = useAuthStore();
  
    const {
      control,
      handleSubmit,
      formState: { errors, isSubmitting, isDirty },
    } = useForm<EditProfileForm>({
      defaultValues: {
        name: user?.name ?? '',
        phone: user?.phone ?? '',
        age: user?.age ?? '',
        gender: user?.gender ?? undefined,
        height: user?.height ?? '',
        weight: user?.weight ?? '',
      },
    });
  
    const onSubmit = async (data: EditProfileForm) => {
      try {
        const resData = await api.put('/api/auth/me', {
          name: data.name,
          phone: data.phone || undefined,
          age: data.age ? Number(data.age) : undefined,
          gender: data.gender || undefined,
          height: data.height ? parseFloat(data.height) : undefined,
          weight: data.weight ? parseFloat(data.weight) : undefined,
        });

        updateUser({
          name: resData.name,
          phone: resData.phone || '',
          age: resData.age ? String(resData.age) : '',
          gender: resData.gender || null,
          height: resData.height ? String(resData.height) : '',
          weight: resData.weight ? String(resData.weight) : '',
          profileImage: resData.profileImage || null,
        });

        Alert.alert('저장 완료', '정보가 수정되었습니다', [
          { text: '확인', onPress: () => router.back() },
        ]);
      } catch (err: any) {
        console.error(err);
        Alert.alert('수정 실패', err.message || '서버와 통신하는 중 오류가 발생했습니다.');
      }
    };
  
    const Field = ({
      name,
      label,
      placeholder,
      rules,
      keyboardType = 'default',
    }: FieldProps) => (
      <View style={styles.fieldWrap}>
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
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={(text) => {
                if (name === 'phone') {
                  onChange(text.replace(/[^0-9]/g, ''));
                } else {
                  onChange(text);
                }
              }}
              value={value as string}
            />
          )}
        />
        {errors[name]?.message && (
          <Text style={styles.errorText}>{errors[name]?.message}</Text>
        )}
      </View>
    );
  
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 헤더 */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>정보 수정</Text>
            <View style={{ width: 32 }} />
          </View>
  
          {/* 이메일 (수정 불가) */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>이메일</Text>
            <View style={styles.inputReadonly}>
              <Text style={styles.inputReadonlyText}>{user?.email ?? '-'}</Text>
            </View>
            <Text style={styles.readonlyHint}>이메일은 변경할 수 없습니다</Text>
          </View>
  
          <Text style={styles.sectionTitle}>기본 정보</Text>
  
          <Field
            name="name"
            label="이름"
            placeholder="홍길동"
            rules={{
              required: '이름을 입력해주세요',
              pattern: { value: /^[a-zA-Z가-힣\s]{2,15}$/, message: '이름은 한글/영문 2자~15자 이내여야 합니다' }
            }}
          />
          <Field
            name="phone"
            label="전화번호"
            placeholder="예) 01012345678"
            keyboardType="phone-pad"
            rules={{
              required: '전화번호를 입력해주세요',
              pattern: { value: /^01[016789]\d{7,8}$/, message: '올바른 전화번호 형식(10~11자리 숫자)이 아닙니다' }
            }}
          />
  
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>건강 정보</Text>
  
          <Field
            name="age"
            label="나이"
            placeholder="예) 30"
            keyboardType="number-pad"
            rules={{
              validate: (val) => {
                if (!val) return true;
                const num = parseInt(val, 10);
                return (!isNaN(num) && num >= 1 && num <= 120) || '나이는 1세~120세 사이여야 합니다';
              }
            }}
          />
  
          {/* 성별 */}
          <View style={styles.fieldWrap}>
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
                      onPress={() => onChange(value === g ? undefined : g)}
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
            keyboardType="number-pad"
            rules={{
              validate: (val) => {
                if (!val) return true;
                const num = parseFloat(val);
                return (!isNaN(num) && num >= 2 && num <= 250) || '몸무게는 2kg~250kg 사이여야 합니다';
              }
            }}
          />
  
          {/* 저장 버튼 */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!isDirty || isSubmitting) && styles.saveBtnDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isSubmitting}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>
              {isSubmitting ? '저장 중...' : '저장하기'}
            </Text>
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
  
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    backBtnText: { fontSize: 20, color: '#333' },
    title: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#4CAF82',
      marginBottom: 16,
      marginTop: 8,
    },
  
    fieldWrap: { marginBottom: 16 },
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
  
    inputReadonly: {
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 26,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    inputReadonlyText: { fontSize: 14, color: '#AAAAAA' },
    readonlyHint: { fontSize: 11, color: '#BBBBBB', marginTop: 4 },
  
    genderRow: { flexDirection: 'row', gap: 10 },
    genderBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
    },
    genderBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF82' },
    genderBtnText: { fontSize: 14, fontWeight: '600', color: '#999' },
    genderBtnTextActive: { color: '#2E7D32', fontWeight: '800' },
  
    saveBtn: {
      backgroundColor: '#4CAF82',
      borderRadius: 26,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 16,
    },
    saveBtnDisabled: { backgroundColor: '#D9D9D9' },
    saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  });
