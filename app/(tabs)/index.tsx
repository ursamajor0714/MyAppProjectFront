import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAuthStore } from '../../store/useAuthStore';
import { useSymptomStore, getSymptomsForPart, RED_FLAGS } from '../../store/symptomData';
import { useNotificationStore } from '../../store/useNotificationStore';
import HumanBody from '../../components/HumanBody';
import { styles } from '../../styles/index.styles';

const GREETING = '안녕하세요';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type WizardStep = 'part' | 'internal_external' | 'subcategory' | 'symptoms' | 'intensity_duration';

const DURATION_OPTIONS = [
  '1분 미만',
  '10분',
  '1시간',
  '6시간',
  '24시간',
  '48시간 이상',
  '지속적',
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const userName = user?.name ?? '홍길동';
  const WELCOME = `${userName}님 환영합니다.`;

  // Autoload store actions
  const {
    currentDiagnosis,
    setPart,
    setIsInternal,
    setSubcategory,
    toggleSymptom,
    setDuration,
    setIntensity,
    resetCurrentDiagnosis,
    saveDiagnosis,
    loadHistory,
  } = useSymptomStore();

  useEffect(() => {
    loadHistory();
  }, []);

  // Intro animation states
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const [showWelcome, setShowWelcome] = useState(false);
  const letterAnims = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0))
  ).current;

  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const [showBody, setShowBody] = useState(false);
  const hintScale = useRef(new Animated.Value(1)).current;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  // Wizard Flow State
  const [wizardStep, setWizardStep] = useState<WizardStep>('part');
  const [showGuardianGuide, setShowGuardianGuide] = useState(false); // 보호자 대리 자가 확인 가이드 모달 토글 추가

  const bodyAreaHeight = wizardStep === 'part' ? SCREEN_H * 0.76 : SCREEN_H * 0.30;
  const bodyScale = Math.min(SCREEN_W / 350, bodyAreaHeight / 700) * 0.95;

  // Reanimated Shared Values for Pan & Zoom
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const savedTranslationX = useSharedValue(0);
  const savedTranslationY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 0.6) {
        scale.value = withTiming(0.6);
      } else if (scale.value > 4) {
        scale.value = withTiming(4);
      }
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translationX.value = savedTranslationX.value + e.translationX;
      translationY.value = savedTranslationY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslationX.value = translationX.value;
      savedTranslationY.value = translationY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      scale.value = withTiming(1);
      savedScale.value = 1;
      translationX.value = withTiming(0);
      translationY.value = withTiming(0);
      savedTranslationX.value = 0;
      savedTranslationY.value = 0;
    });

  const gesture = Gesture.Race(
    Gesture.Simultaneous(pinchGesture, panGesture),
    doubleTapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: scale.value },
    ],
  }));

  const resetZoom = () => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translationX.value = withTiming(0);
    translationY.value = withTiming(0);
    savedTranslationX.value = 0;
    savedTranslationY.value = 0;
  };

  useEffect(() => {
    // Snappy fade-in for greeting wrap
    Animated.timing(greetingOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start(() => {
      setShowWelcome(true);
      Animated.stagger(
        15,
        letterAnims.map((a) =>
          Animated.timing(a, { toValue: 1, duration: 50, useNativeDriver: true })
        )
      ).start(() => {
        setTimeout(() => {
          Animated.timing(greetingOpacity, { toValue: 0, duration: 200, useNativeDriver: true })
            .start(() => {
              setShowBody(true);
              Animated.timing(bodyOpacity, { toValue: 1, duration: 250, useNativeDriver: true })
                .start(() => startHintLoop());
            });
        }, 400);
      });
    });
  }, []);

  const startHintLoop = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(hintScale, { toValue: 1.1, duration: 600, useNativeDriver: true }),
        Animated.timing(hintScale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const handlePartPress = useCallback((part: string) => {
    const labels: Record<string, string> = {
      head: '머리', neck: '목', chest: '가슴', abdomen: '복부',
      leftUpperArm: '왼쪽 상박', leftForearm: '왼쪽 하박', leftWrist: '왼쪽 손목',
      rightUpperArm: '오른쪽 상박', rightForearm: '오른쪽 하박', rightWrist: '오른쪽 손목',
      leftThigh: '왼쪽 허벅지', leftKnee: '왼쪽 무릎', leftCalf: '왼쪽 종아리', leftAnkle: '왼쪽 발목',
      rightThigh: '오른쪽 허벅지', rightKnee: '오른쪽 무릎', rightCalf: '오른쪽 종아리', rightAnkle: '오른쪽 발목'
    };
    const label = labels[part] || '지정 부위';
    setPart(part, label);
    setWizardStep('internal_external');
    resetZoom();

    if (!hasAnimated.current) {
      hasAnimated.current = true;
      sheetTranslateY.setValue(0);
    }
  }, [setPart]);

  const handleClose = useCallback(() => {
    resetCurrentDiagnosis();
    setWizardStep('part');
    resetZoom();
    hasAnimated.current = false;
    sheetTranslateY.setValue(0);
  }, [resetCurrentDiagnosis]);

  const handleBack = () => {
    if (wizardStep === 'internal_external') {
      handleClose();
    } else if (wizardStep === 'subcategory') {
      setWizardStep('internal_external');
    } else if (wizardStep === 'symptoms') {
      setWizardStep('subcategory');
    } else if (wizardStep === 'intensity_duration') {
      setWizardStep('symptoms');
    }
  };

  const handleNextFromSymptoms = () => {
    // Red flag direct skip: check if any selected symptom is in Red Flag list
    const hasRedFlag = currentDiagnosis.symptoms.some((s: string) => RED_FLAGS.includes(s));
    if (hasRedFlag) {
      // Set default severity parameters and skip straight to diagnosis result saving!
      setDuration('1분 미만');
      setIntensity(10);
      submitDiagnosis();
    } else {
      setWizardStep('intensity_duration');
    }
  };

  const submitDiagnosis = async () => {
    const record = await saveDiagnosis();

    // 알림 발송
    const riskTexts = {
      low: '경미 (자가관리)',
      medium: '주의 (경과 관찰)',
      high: '경고 (병원 방문 권장)',
      emergency: '응급 (즉시 내원 또는 119)'
    };
    const riskText = riskTexts[record.riskLevel as keyof typeof riskTexts] || '주의';

    useNotificationStore.getState().addNotification({
      title: '🩺 자가진단 결과 등록',
      body: `부위: ${record.partLabel}, 위험수준: ${riskText}. 추천 치료법을 결과 화면에서 확인해 보세요.`,
      type: 'general',
      relatedId: record.id
    });

    // Reset wizard and route to result screen with the saved record ID
    resetCurrentDiagnosis();
    setWizardStep('part');
    hasAnimated.current = false;
    sheetTranslateY.setValue(0);
    router.push({
      pathname: '/symptom-result',
      params: { id: record.id }
    });
  };

  // Fetch symptoms list based on selections
  const symptomsList = currentDiagnosis.part
    ? getSymptomsForPart(
        currentDiagnosis.part,
        currentDiagnosis.isInternal ?? true,
        currentDiagnosis.subcategory ?? ''
      )
    : [];

  const isRedFlagSelected = currentDiagnosis.symptoms.some((s: string) => RED_FLAGS.includes(s));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>

        {/* ── 인삿말 ── */}
        {!showBody && (
          <View style={styles.greetingScreen}>
            <Animated.View style={[styles.greetingWrap, { opacity: greetingOpacity }]}>
              <Text style={styles.greeting}>
                {GREETING}
              </Text>
              {showWelcome && (
                <View style={styles.welcomeRow}>
                  {WELCOME.split('').map((char, i) => (
                    <Animated.Text key={i} style={[styles.welcome, { opacity: letterAnims[i] }]}>
                      {char}
                    </Animated.Text>
                  ))}
                </View>
              )}
            </Animated.View>
          </View>
        )}

        {/* ── 인체모형 + 증상 ── */}
        {showBody && (
          <Animated.View style={[styles.bodySection, { opacity: bodyOpacity }]}>

            {/* 상단 고정: 인체모형 (부위 선택 단계에서만 렌더링) */}
            {wizardStep === 'part' && (
              <View style={[styles.bodyArea, { height: bodyAreaHeight }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24), alignItems: 'center', width: '100%', zIndex: 50 }}>
                  <Animated.View style={[styles.hintRow, { transform: [{ scale: hintScale }], flex: 1, marginVertical: 0 }]}>
                    <Text style={styles.hintIcon}>{user?.age && Number(user.age) < 14 ? '🧒' : '👆'}</Text>
                    <Text style={[styles.hintLabel, { fontSize: 12 }]} numberOfLines={1}>
                      {user?.age && Number(user.age) < 14
                        ? `아동 진단 모드 (만 ${user.age}세)`
                        : '신체 부위를 탭해 주세요'}
                    </Text>
                  </Animated.View>
                  <TouchableOpacity 
                    onPress={() => setShowGuardianGuide(true)}
                    style={{
                      backgroundColor: 'rgba(139, 92, 246, 0.15)',
                      borderWidth: 1,
                      borderColor: 'rgba(139, 92, 246, 0.3)',
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      marginLeft: 8,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#c084fc', fontSize: 11, fontWeight: '700' }}>📋 대리 진단 가이드</Text>
                  </TouchableOpacity>
                </View>

                {/* HumanBody를 SCREEN_W 기준으로 스케일 */}
                <View style={[styles.bodyScaleWrapper, { height: bodyAreaHeight }]}>
                  <GestureDetector gesture={gesture}>
                    <Reanimated.View style={animatedStyle}>
                      <View style={{ transform: [{ scale: bodyScale }] }}>
                        <HumanBody
                          selectedPart={currentDiagnosis.part}
                          onPress={handlePartPress}
                          isChild={user?.age !== undefined && Number(user.age) < 14}
                        />
                      </View>
                    </Reanimated.View>
                  </GestureDetector>
                </View>
              </View>
            )}

            {/* 하단: 증상 단계 스크롤 */}
            <Animated.View style={[styles.symptomSection, { transform: [{ translateY: sheetTranslateY }] }]}>
              {wizardStep !== 'part' && (
                <View style={[styles.wizardHeader, { paddingTop: insets.top > 0 ? insets.top : 12 }]}>
                  <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← 이전</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepTitle}>
                    {wizardStep === 'internal_external' && '내/외부 구분'}
                    {wizardStep === 'subcategory' && '부위 세부 분류'}
                    {wizardStep === 'symptoms' && '세부 증상 선택'}
                    {wizardStep === 'intensity_duration' && '고통 강도 및 시간'}
                  </Text>
                  <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                    <Text style={styles.closeButtonText}>✕ 취소</Text>
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView
                style={styles.symptomScroll}
                contentContainerStyle={styles.symptomScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* STEP 1: NONE (부위 선택 대기) */}
                {wizardStep === 'part' && (
                  <View style={styles.emptyHint}>
                    <Text style={styles.emptyHintEmoji}>🩺</Text>
                    <Text style={styles.emptyHintText}>
                      자가진단을 시작하려면 위 인체 모형에서 불편하거나 통증이 느껴지는 부위를 선택해주세요.
                    </Text>
                  </View>
                )}

                {/* STEP 2: INTERNAL / EXTERNAL */}
                {wizardStep === 'internal_external' && (
                  <View style={styles.stepContainer}>
                    <Text style={styles.sectionLabel}>{currentDiagnosis.partLabel}</Text>
                    <Text style={styles.sectionSubLabel}>증상이 느껴지거나 관찰되는 위치를 골라주세요.</Text>

                    <TouchableOpacity
                      style={styles.cardSelectBtn}
                      onPress={() => {
                        setIsInternal(true);
                        setWizardStep('subcategory');
                      }}
                    >
                      <Text style={styles.cardSelectEmoji}>🧠</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardSelectTitle}>내부 문제</Text>
                        <Text style={styles.cardSelectDesc}>장기나 머리 속 등 겉으로 보이지 않는 깊은 부위의 증상</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardSelectBtn}
                      onPress={() => {
                        setIsInternal(false);
                        setWizardStep('subcategory');
                      }}
                    >
                      <Text style={styles.cardSelectEmoji}>🦴</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardSelectTitle}>외부 문제</Text>
                        <Text style={styles.cardSelectDesc}>혹, 상처, 피부, 관절 등 겉으로 드러나거나 만져지는 증상</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* STEP 3: SUBCATEGORY */}
                {wizardStep === 'subcategory' && (
                  <View style={styles.stepContainer}>
                    <Text style={styles.sectionLabel}>
                      {currentDiagnosis.partLabel} ({currentDiagnosis.isInternal ? '내부 문제' : '외부 문제'})
                    </Text>
                    <Text style={styles.sectionSubLabel}>
                      {currentDiagnosis.isInternal ? '어떤 양상의 증상이 있나요?' : '어떤 분류의 증상이 관찰되나요?'}
                    </Text>

                    {currentDiagnosis.isInternal ? (
                      // 내부용 의학적 통증 분류
                      <View style={styles.gridContainer}>
                        {[
                          { key: 'stabbing', label: '예리한 통증\n(찌름통증)', emoji: '📍' },
                          { key: 'squeezing', label: '산통성 통증\n(쥐어짜는 조임통)', emoji: '✊' },
                          { key: 'burning', label: '신경병성 통증\n(타는 듯한 작열통)', emoji: '🔥' },
                          { key: 'heavy', label: '내장성 둔통\n(묵직하고 둔한 통증)', emoji: '☁️' },
                          { key: 'pulsating', label: '혈관성 박동통\n(욱신거리고 지끈거림)', emoji: '💓' },
                          { key: 'bloating', label: '압박성 팽만통\n(가스 차고 부풀어오름)', emoji: '🎈' }
                        ].map((item) => (
                          <TouchableOpacity
                            key={item.key}
                            style={styles.gridCard}
                            onPress={() => {
                              setSubcategory(item.key);
                              setWizardStep('symptoms');
                            }}
                          >
                            <Text style={styles.gridCardEmoji}>{item.emoji}</Text>
                            <Text style={styles.gridCardLabel}>{item.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      // 외부용 의학적 증상 분류
                      <View style={styles.gridContainer}>
                        {[
                          { key: 'muscle', label: '근골격계 문제\n(근육통, 뻐근함)', emoji: '💪' },
                          { key: 'bone', label: '골관절계 문제\n(관절통, 골격 통증)', emoji: '🦴' },
                          { key: 'vein', label: '말초신경 및 순환\n(저림, 찌릿함)', emoji: '⚡' },
                          { key: 'skin', label: '피부 질환 및 발진\n(가려움, 뾰루지)', emoji: '🧴' },
                          { key: 'tumor', label: '표면 종괴 및 지방종\n(혹, 멍울, 덩어리)', emoji: '🛡️' },
                          { key: 'discharge', label: '상처 및 고름/진물\n(찰과상, 분비물)', emoji: '🩹' }
                        ].map((item) => (
                          <TouchableOpacity
                            key={item.key}
                            style={styles.gridCard}
                            onPress={() => {
                              setSubcategory(item.key);
                              setWizardStep('symptoms');
                            }}
                          >
                            <Text style={styles.gridCardEmoji}>{item.emoji}</Text>
                            <Text style={styles.gridCardLabel}>{item.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* STEP 4: SYMPTOMS SELECTION */}
                {wizardStep === 'symptoms' && (
                  <View style={styles.stepContainer}>
                    <Text style={styles.sectionLabel}>아래 증상 중 해당하는 것을 선택하세요</Text>
                    <Text style={styles.sectionSubLabel}>정확한 분석을 위해 복수 선택이 가능합니다.</Text>

                    {symptomsList.length === 0 ? (
                      <Text style={styles.noSymptomsText}>선택 가능한 세부 증상이 없습니다. 다음 단계로 넘어가주세요.</Text>
                    ) : (
                      symptomsList.map((symptom: string, idx: number) => {
                        const checked = currentDiagnosis.symptoms.includes(symptom);
                        const isRed = RED_FLAGS.includes(symptom);
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.symptomRowCard,
                              checked && styles.symptomRowCardChecked,
                              isRed && styles.symptomRowCardRedFlag
                            ]}
                            onPress={() => toggleSymptom(symptom)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                              {checked && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.symptomText, checked && styles.symptomTextChecked]}>
                                {symptom}
                              </Text>
                              {isRed && (
                                <Text style={styles.redFlagBadge}>🚨 즉시 진료 필요 위험 증상</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}

                    {isRedFlagSelected && (
                      <View style={styles.redFlagAlertBox}>
                        <Text style={styles.redFlagAlertText}>
                          ⚠️ 고위험 증상이 포함되어 있습니다. 강도/시간 조사를 생략하고 즉시 위험 판정 및 진단 결과로 건너뜁니다.
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        currentDiagnosis.symptoms.length === 0 && styles.actionBtnDisabled
                      ]}
                      onPress={handleNextFromSymptoms}
                      disabled={currentDiagnosis.symptoms.length === 0}
                    >
                      <Text style={styles.actionBtnText}>
                        {isRedFlagSelected ? '즉시 결과 보기' : '다음 단계로'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* STEP 5: INTENSITY & DURATION */}
                {wizardStep === 'intensity_duration' && (
                  <View style={styles.stepContainer}>
                    <Text style={styles.sectionLabel}>통증 강도를 선택해 주세요 (1 ~ 10)</Text>
                    <Text style={styles.sectionSubLabel}>1은 아주 약함, 10은 참기 힘든 극심한 통증입니다.</Text>

                    <View style={styles.intensitySelector}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
                        const isSelected = currentDiagnosis.intensity === val;
                        let colorClass = styles.intLow;
                        if (val >= 4 && val <= 7) colorClass = styles.intMed;
                        if (val >= 8) colorClass = styles.intHigh;

                        return (
                          <TouchableOpacity
                            key={val}
                            style={[
                              styles.intBtn,
                              colorClass,
                              isSelected && styles.intBtnSelected
                            ]}
                            onPress={() => setIntensity(val)}
                          >
                            <Text style={[styles.intBtnText, isSelected && styles.intBtnTextSelected]}>
                              {val}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={[styles.sectionLabel, { marginTop: 24 }]}>지속 시간을 선택해 주세요</Text>
                    <View style={styles.durationSelector}>
                      {DURATION_OPTIONS.map((opt) => {
                        const isSelected = currentDiagnosis.duration === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.durationChip,
                              isSelected && styles.durationChipSelected
                            ]}
                            onPress={() => setDuration(opt)}
                          >
                            <Text style={[styles.durationChipText, isSelected && styles.durationChipTextSelected]}>
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        (!currentDiagnosis.intensity || !currentDiagnosis.duration) && styles.actionBtnDisabled
                      ]}
                      onPress={submitDiagnosis}
                      disabled={!currentDiagnosis.intensity || !currentDiagnosis.duration}
                    >
                      <Text style={styles.actionBtnText}>진단 완료 및 결과 보기</Text>
                    </TouchableOpacity>
                  </View>
                )}

              </ScrollView>
            </Animated.View>
          </Animated.View>
        )}
      </View>
      {/* ── 팝업: 보호자용 자가 확인 가이드 모달 ── */}
      <Modal visible={showGuardianGuide} transparent animationType="slide">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.65)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: SCREEN_W * 0.88,
            backgroundColor: '#1e293b',
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: '#475569',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 8,
          }}>
            <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
              📋 보호자 대리 진단 가이드 (육안 확인)
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
              어르신 또는 아동 피보호자를 대리하여 증상을 체크하기 전, 다음 물리적 상태를 먼저 육안으로 신속하게 관찰해 주세요.
            </Text>

            <ScrollView style={{ maxHeight: 280, marginBottom: 20 }} showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10 }}>
                <Text style={{ color: '#c084fc', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>1. 의식 및 인지 반응 상태</Text>
                <Text style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 16 }}>
                  환자와 눈을 맞추고 이름을 불렀을 때 눈동자가 잘 따라오며 대답을 하나요? 혼미한 인지 반응이 있는지 관찰하세요.
                </Text>
              </View>

              <View style={{ marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10 }}>
                <Text style={{ color: '#c084fc', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>2. 거동 및 기립 상태</Text>
                <Text style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 16 }}>
                  도움 없이 스스로 척추를 세우고 일어설 수 있나요? 편마비 증세나 비틀거림, 외상 흔적이 있는지 점검해 주세요.
                </Text>
              </View>

              <View style={{ marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10 }}>
                <Text style={{ color: '#c084fc', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>3. 안색 및 식은땀 여부</Text>
                <Text style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 16 }}>
                  얼굴이 창백해지거나 끈적끈적한 식은땀이 흐르나요? 입술이나 손톱끝이 파랗게 변하는 청색증 여부를 확인하세요.
                </Text>
              </View>

              <View style={{ marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10 }}>
                <Text style={{ color: '#c084fc', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>4. 호흡 상태 점검</Text>
                <Text style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 16 }}>
                  숨소리가 가쁘고 쌕쌕거리거나, 가슴 아랫부분이 과도하게 쑥쑥 들어가며 힘겹게 호흡하지 않는지 관찰해 주세요.
                </Text>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity 
                onPress={() => {
                  setShowGuardianGuide(false);
                  Alert.alert('응급 신호 전송', 'SOS 긴급 신호 연동 맵으로 이동하시겠습니까?', [
                    { text: '취소', style: 'cancel' },
                    { text: '이동', onPress: () => router.push('/gps') }
                  ]);
                }}
                style={{
                  backgroundColor: '#ef4444',
                  borderRadius: 12,
                  flex: 1,
                  paddingVertical: 14,
                  marginRight: 8,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>🚨 응급 (119 연계)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setShowGuardianGuide(false)}
                style={{
                  backgroundColor: '#8b5cf6',
                  borderRadius: 12,
                  flex: 1.2,
                  paddingVertical: 14,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>✅ 상태 양호 (진단)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}


