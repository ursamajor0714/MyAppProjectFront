import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';

type ScreenState = 'initial' | 'new_clinic';

export default function ClinicScreen() {
  const [screenState, setScreenState] = useState<ScreenState>('initial');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [isAnimating, setIsAnimating] = useState(false);
  const transitionTo = (nextState: ScreenState) => {
    if (isAnimating) return;

    setIsAnimating(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setScreenState(nextState);

      slideAnim.setValue(20);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const handleNewClinicPress = () => {
    transitionTo('new_clinic');
  };

  const handleBackPress = () => {
    transitionTo('initial');
  };

  const handleSelfCheckPress = () => {
    router.push('/');
  };

  return (
    <View style={styles.container}>
      {screenState === 'new_clinic' && (
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.9}
          onPress={handleBackPress}
        >
          <Text style={styles.backBtnText}>← 이전으로</Text>
        </TouchableOpacity>
      )}

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {screenState === 'initial' ? (
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => router.push('/resume-clinic')}
              style={[
                styles.card,
                {
                  flex: 1,
                  backgroundColor: '#E8F5E9',
                  borderColor: '#A5D6A7',
                },
              ]}
            >
              <View style={styles.contentWrap}>
                <Text style={styles.iconText}>🔄</Text>

                <Text style={styles.cardTitle}>
                  기존 진료 이어받기
                </Text>

                <Text style={styles.cardSub}>
                  이전에 진행하던 진료를
                  {'\n'}
                  이어서 진행합니다.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.95}
              onPress={handleNewClinicPress}
              style={[
                styles.card,
                {
                  flex: 1,
                  backgroundColor: '#E3F2FD',
                  borderColor: '#90CAF9',
                },
              ]}
            >
              <View style={styles.contentWrap}>
                <Text style={styles.iconText}>✨</Text>

                <Text style={styles.cardTitle}>
                  새로운 진료 받기
                </Text>

                <Text style={styles.cardSub}>
                  새로운 증상을 선택하고
                  {'\n'}
                  진료를 시작합니다.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 14, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. 아픈 곳 자가진단 */}
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={handleSelfCheckPress}
              style={[
                styles.card,
                {
                  height: 135,
                  backgroundColor: '#FFF3E0',
                  borderColor: '#FFB74D',
                },
              ]}
            >
              <View style={styles.contentWrap}>
                <Text style={styles.iconText}>🩺</Text>
                <Text style={styles.cardTitle}>아픈 곳 자가진단</Text>
                <Text style={styles.cardSub}>불편 부위와 세부 증상을 선택하여 분석 결과를 도출합니다.</Text>
              </View>
            </TouchableOpacity>

            {/* 2. 비대면 화상 진료 (신규) */}
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => router.push('/telemedicine')}
              style={[
                styles.card,
                {
                  height: 135,
                  backgroundColor: '#E0F2F1',
                  borderColor: '#4DB6AC',
                },
              ]}
            >
              <View style={styles.contentWrap}>
                <Text style={styles.iconText}>📹</Text>
                <Text style={styles.cardTitle}>비대면 화상 진료</Text>
                <Text style={styles.cardSub}>원격으로 전면 카메라를 연결해 실시간 화상 진료를 진행합니다.</Text>
              </View>
            </TouchableOpacity>

            {/* 3. 대면 진료 병원 예약 */}
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => router.push('/clinic-hospitals' as any)}
              style={[
                styles.card,
                {
                  height: 135,
                  backgroundColor: '#F3E5F5',
                  borderColor: '#BA68C8',
                },
              ]}
            >
              <View style={styles.contentWrap}>
                <Text style={styles.iconText}>🏥</Text>
                <Text style={styles.cardTitle}>대면 진료 병원 예약</Text>
                <Text style={styles.cardSub}>주변 의원을 선택해 직접 내원 예약 및 접수를 접수합니다.</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignSelf: 'flex-start',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#616161',
  },
  buttonWrapper: {
    flex: 1,
    gap: 16,
  },
  card: {
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  iconText: {
    fontSize: 34,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
    textAlign: 'center',
    lineHeight: 16,
  },
});
