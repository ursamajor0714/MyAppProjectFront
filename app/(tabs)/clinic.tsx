import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';

export default function ClinicScreen() {
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
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => router.push('/resume-clinic')}
            style={[
              styles.card,
              {
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
            onPress={() => router.push('/clinic-hospitals')}
            style={[
              styles.card,
              {
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
    flex: 1,
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
    padding: 16,
  },
  iconText: {
    fontSize: 52,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555555',
    textAlign: 'center',
    lineHeight: 24,
  },
});
