import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native';
import Svg, { Circle, Rect, Line, G } from 'react-native-svg';

type Props = {
  selectedPart?: string | null;
  onPress?: (part: string) => void;
  isChild?: boolean; // 아동 여부에 따라 인체 비례도 동적 스위칭
};

const PART_COLORS: Record<string, { bg: string; border: string }> = {
  head:          { bg: 'rgba(255, 99, 132, 0.25)',  border: 'rgba(255, 99, 132, 0.6)' },
  neck:          { bg: 'rgba(54, 162, 235, 0.25)',  border: 'rgba(54, 162, 235, 0.6)' },
  chest:         { bg: 'rgba(255, 206, 86, 0.25)',  border: 'rgba(255, 206, 86, 0.6)' },
  abdomen:       { bg: 'rgba(75, 192, 192, 0.25)',  border: 'rgba(75, 192, 192, 0.6)' },
  leftUpperArm:  { bg: 'rgba(153, 102, 255, 0.25)', border: 'rgba(153, 102, 255, 0.6)' },
  leftForearm:   { bg: 'rgba(255, 159, 64, 0.25)',  border: 'rgba(255, 159, 64, 0.6)' },
  leftWrist:     { bg: 'rgba(201, 203, 207, 0.3)',   border: 'rgba(201, 203, 207, 0.7)' },
  rightUpperArm: { bg: 'rgba(153, 102, 255, 0.25)', border: 'rgba(153, 102, 255, 0.6)' },
  rightForearm:  { bg: 'rgba(255, 159, 64, 0.25)',  border: 'rgba(255, 159, 64, 0.6)' },
  rightWrist:    { bg: 'rgba(201, 203, 207, 0.3)',   border: 'rgba(201, 203, 207, 0.7)' },
  leftThigh:     { bg: 'rgba(233, 30, 99, 0.25)',   border: 'rgba(233, 30, 99, 0.6)' },
  leftKnee:      { bg: 'rgba(0, 150, 136, 0.25)',   border: 'rgba(0, 150, 136, 0.6)' },
  leftCalf:      { bg: 'rgba(255, 87, 34, 0.25)',   border: 'rgba(255, 87, 34, 0.6)' },
  leftAnkle:     { bg: 'rgba(121, 85, 72, 0.25)',   border: 'rgba(121, 85, 72, 0.6)' },
  rightThigh:    { bg: 'rgba(233, 30, 99, 0.25)',   border: 'rgba(233, 30, 99, 0.6)' },
  rightKnee:     { bg: 'rgba(0, 150, 136, 0.25)',   border: 'rgba(0, 150, 136, 0.6)' },
  rightCalf:     { bg: 'rgba(255, 87, 34, 0.25)',   border: 'rgba(255, 87, 34, 0.6)' },
  rightAnkle:    { bg: 'rgba(121, 85, 72, 0.25)',   border: 'rgba(121, 85, 72, 0.6)' },
};

export default function HumanBody({
  selectedPart,
  onPress,
  isChild = false,
}: Props) {

  const getSegmentColor = (part: string) => {
    return selectedPart === part ? '#8b5cf6' : '#B0BEC5'; // 보라색 최신 포인트 컬러 적용
  };

  const getSegmentStrokeWidth = (part: string) => {
    return selectedPart === part ? 5 : 2.5;
  };

  const getHitboxStyle = (part: string) => {
    const isSelected = selectedPart === part;
    const colors = PART_COLORS[part] || { bg: 'rgba(0,0,0,0.1)', border: 'rgba(0,0,0,0.3)' };
    return {
      borderWidth: isSelected ? 2.5 : 1,
      borderColor: isSelected ? '#8b5cf6' : colors.border,
      backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.35)' : colors.bg,
    };
  };

  // 🧒 아동 대칭 치수 vs 🧑 성인 대칭 치수 매핑
  const metrics = {
    head: isChild 
      ? { svg: { cx: 175, cy: 100, r: 38 }, hitbox: { top: 62, left: 137, width: 76, height: 76, borderRadius: 38 } }
      : { svg: { cx: 175, cy: 65, r: 28 }, hitbox: { top: 35, left: 145, width: 60, height: 60, borderRadius: 30 } },
    neck: isChild
      ? { svg: { x: 165, y: 138, w: 20, h: 14, rx: 3 }, hitbox: { top: 136, left: 163, width: 24, height: 18, borderRadius: 4 } }
      : { svg: { x: 164, y: 94, w: 22, h: 20, rx: 4 }, hitbox: { top: 92, left: 162, width: 26, height: 24, borderRadius: 6 } },
    chest: isChild
      ? { svg: { x: 125, y: 152, w: 100, h: 60, rx: 14 }, hitbox: { top: 150, left: 123, width: 104, height: 64, borderRadius: 20 } }
      : { svg: { x: 120, y: 114, w: 110, h: 68, rx: 16 }, hitbox: { top: 112, left: 118, width: 114, height: 72, borderRadius: 24 } },
    abdomen: isChild
      ? { svg: { x: 132, y: 212, w: 86, h: 65, rx: 10 }, hitbox: { top: 210, left: 130, width: 90, height: 69, borderRadius: 14 } }
      : { svg: { x: 128, y: 188, w: 94, h: 78, rx: 12 }, hitbox: { top: 186, left: 126, width: 98, height: 82, borderRadius: 18 } },
    leftUpperArm: isChild
      ? { svg: { x1: 122, y1: 158, x2: 96, y2: 205 }, hitbox: { top: 150, left: 86, width: 24, height: 60, borderRadius: 12, transform: [{ rotate: '15deg' }] } }
      : { svg: { x1: 112, y1: 120, x2: 84, y2: 180 }, hitbox: { top: 110, left: 70, width: 28, height: 80, borderRadius: 16, transform: [{ rotate: '12deg' }] } },
    leftForearm: isChild
      ? { svg: { x1: 96, y1: 205, x2: 78, y2: 255 }, hitbox: { top: 200, left: 72, width: 22, height: 58, borderRadius: 10, transform: [{ rotate: '15deg' }] } }
      : { svg: { x1: 84, y1: 180, x2: 60, y2: 245 }, hitbox: { top: 185, left: 58, width: 24, height: 78, borderRadius: 14, transform: [{ rotate: '12deg' }] } },
    leftWrist: isChild
      ? { svg: { cx: 77, cy: 275, r: 7 }, hitbox: { top: 267, left: 69, width: 16, height: 16, borderRadius: 8 } }
      : { svg: { cx: 61, cy: 269, r: 8 }, hitbox: { top: 258, left: 50, width: 22, height: 22, borderRadius: 11 } },
    rightUpperArm: isChild
      ? { svg: { x1: 228, y1: 158, x2: 254, y2: 205 }, hitbox: { top: 150, left: 240, width: 24, height: 60, borderRadius: 12, transform: [{ rotate: '-15deg' }] } }
      : { svg: { x1: 238, y1: 120, x2: 266, y2: 180 }, hitbox: { top: 110, left: 252, width: 28, height: 80, borderRadius: 16, transform: [{ rotate: '-12deg' }] } },
    rightForearm: isChild
      ? { svg: { x1: 254, y1: 205, x2: 272, y2: 255 }, hitbox: { top: 200, left: 256, width: 22, height: 58, borderRadius: 10, transform: [{ rotate: '-15deg' }] } }
      : { svg: { x1: 266, y1: 180, x2: 290, y2: 245 }, hitbox: { top: 185, left: 268, width: 24, height: 78, borderRadius: 14, transform: [{ rotate: '-12deg' }] } },
    rightWrist: isChild
      ? { svg: { cx: 273, cy: 275, r: 7 }, hitbox: { top: 267, left: 265, width: 16, height: 16, borderRadius: 8 } }
      : { svg: { cx: 291, cy: 269, r: 8 }, hitbox: { top: 258, left: 280, width: 22, height: 22, borderRadius: 11 } },
    leftThigh: isChild
      ? { svg: { x1: 147, y1: 278, x2: 147, y2: 365 }, hitbox: { top: 290, left: 133, width: 28, height: 80, borderRadius: 12 } }
      : { svg: { x1: 147, y1: 280, x2: 147, y2: 425 }, hitbox: { top: 330, left: 132, width: 30, height: 105, borderRadius: 16 } },
    leftKnee: isChild
      ? { svg: { cx: 148, cy: 388, r: 8 }, hitbox: { top: 378, left: 138, width: 20, height: 20, borderRadius: 10 } }
      : { svg: { cx: 148, cy: 452, r: 10 }, hitbox: { top: 438, left: 134, width: 28, height: 28, borderRadius: 14 } },
    leftCalf: isChild
      ? { svg: { x1: 148, y1: 398, x2: 148, y2: 470 }, hitbox: { top: 398, left: 138, width: 20, height: 72, borderRadius: 10 } }
      : { svg: { x1: 148, y1: 468, x2: 148, y2: 545 }, hitbox: { top: 468, left: 136, width: 26, height: 90, borderRadius: 14 } },
    leftAnkle: isChild
      ? { svg: { cx: 148, cy: 494, r: 7 }, hitbox: { top: 486, left: 140, width: 16, height: 16, borderRadius: 8 } }
      : { svg: { cx: 148, cy: 572, r: 8 }, hitbox: { top: 560, left: 136, width: 24, height: 24, borderRadius: 12 } },
    rightThigh: isChild
      ? { svg: { x1: 203, y1: 278, x2: 203, y2: 365 }, hitbox: { top: 290, left: 189, width: 28, height: 80, borderRadius: 12 } }
      : { svg: { x1: 217, y1: 280, x2: 217, y2: 425 }, hitbox: { top: 330, left: 202, width: 30, height: 105, borderRadius: 16 } },
    rightKnee: isChild
      ? { svg: { cx: 202, cy: 388, r: 8 }, hitbox: { top: 378, left: 192, width: 20, height: 20, borderRadius: 10 } }
      : { svg: { cx: 218, cy: 452, r: 10 }, hitbox: { top: 438, left: 204, width: 28, height: 28, borderRadius: 14 } },
    rightCalf: isChild
      ? { svg: { x1: 202, y1: 398, x2: 202, y2: 470 }, hitbox: { top: 398, left: 192, width: 20, height: 72, borderRadius: 10 } }
      : { svg: { x1: 218, y1: 468, x2: 218, y2: 545 }, hitbox: { top: 468, left: 206, width: 26, height: 90, borderRadius: 14 } },
    rightAnkle: isChild
      ? { svg: { cx: 202, cy: 494, r: 7 }, hitbox: { top: 486, left: 194, width: 16, height: 16, borderRadius: 8 } }
      : { svg: { cx: 218, cy: 572, r: 8 }, hitbox: { top: 560, left: 206, width: 24, height: 24, borderRadius: 12 } },
    joints: isChild
      ? [ { cx: 122, cy: 158 }, { cx: 228, cy: 158 }, { cx: 96, cy: 205 }, { cx: 254, cy: 205 }, { cx: 147, cy: 278 }, { cx: 203, cy: 278 } ]
      : [ { cx: 112, cy: 120 }, { cx: 238, cy: 120 }, { cx: 84, cy: 180 }, { cx: 266, cy: 180 }, { cx: 147, cy: 280 }, { cx: 217, cy: 280 } ],
  };

  return (
    <View style={styles.container}>
      {/* ── 배경 Grid ── */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <G opacity="0.12">
            <Line x1={87} y1={0} x2={87} y2={700} stroke="#8b5cf6" strokeWidth={1} />
            <Line x1={175} y1={0} x2={175} y2={700} stroke="#8b5cf6" strokeWidth={1.5} />
            <Line x1={262} y1={0} x2={262} y2={700} stroke="#8b5cf6" strokeWidth={1} />
            <Line x1={0} y1={175} x2={350} y2={175} stroke="#8b5cf6" strokeWidth={1} />
            <Line x1={0} y1={350} x2={350} y2={350} stroke="#8b5cf6" strokeWidth={1.5} />
            <Line x1={0} y1={525} x2={350} y2={525} stroke="#8b5cf6" strokeWidth={1} />
          </G>
        </Svg>
      </View>

      {/* ── 인체모형 무한해상도 벡터 (SVG) ── */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="350" height="700" viewBox="0 0 350 700">
          {/* 머리 */}
          <Circle cx={metrics.head.svg.cx} cy={metrics.head.svg.cy} r={metrics.head.svg.r} stroke={getSegmentColor('head')} strokeWidth={getSegmentStrokeWidth('head')} fill="rgba(255,255,255,0.7)" />

          {/* 목 */}
          <Rect x={metrics.neck.svg.x} y={metrics.neck.svg.y} width={metrics.neck.svg.w} height={metrics.neck.svg.h} rx={metrics.neck.svg.rx} stroke={getSegmentColor('neck')} strokeWidth={getSegmentStrokeWidth('neck')} fill="rgba(255,255,255,0.7)" />

          {/* 가슴 */}
          <Rect x={metrics.chest.svg.x} y={metrics.chest.svg.y} width={metrics.chest.svg.w} height={metrics.chest.svg.h} rx={metrics.chest.svg.rx} stroke={getSegmentColor('chest')} strokeWidth={getSegmentStrokeWidth('chest')} fill="rgba(255,255,255,0.7)" />

          {/* 복부 */}
          <Rect x={metrics.abdomen.svg.x} y={metrics.abdomen.svg.y} width={metrics.abdomen.svg.w} height={metrics.abdomen.svg.h} rx={metrics.abdomen.svg.rx} stroke={getSegmentColor('abdomen')} strokeWidth={getSegmentStrokeWidth('abdomen')} fill="rgba(255,255,255,0.7)" />

          {/* 왼쪽 팔 */}
          <Line x1={metrics.leftUpperArm.svg.x1} y1={metrics.leftUpperArm.svg.y1} x2={metrics.leftUpperArm.svg.x2} y2={metrics.leftUpperArm.svg.y2} stroke={getSegmentColor('leftUpperArm')} strokeWidth={getSegmentStrokeWidth('leftUpperArm')} strokeLinecap="round" />
          <Line x1={metrics.leftForearm.svg.x1} y1={metrics.leftForearm.svg.y1} x2={metrics.leftForearm.svg.x2} y2={metrics.leftForearm.svg.y2} stroke={getSegmentColor('leftForearm')} strokeWidth={getSegmentStrokeWidth('leftForearm')} strokeLinecap="round" />
          <Circle cx={metrics.leftWrist.svg.cx} cy={metrics.leftWrist.svg.cy} r={metrics.leftWrist.svg.r} stroke={getSegmentColor('leftWrist')} strokeWidth={getSegmentStrokeWidth('leftWrist')} fill="rgba(255,255,255,0.7)" />

          {/* 오른쪽 팔 */}
          <Line x1={metrics.rightUpperArm.svg.x1} y1={metrics.rightUpperArm.svg.y1} x2={metrics.rightUpperArm.svg.x2} y2={metrics.rightUpperArm.svg.y2} stroke={getSegmentColor('rightUpperArm')} strokeWidth={getSegmentStrokeWidth('rightUpperArm')} strokeLinecap="round" />
          <Line x1={metrics.rightForearm.svg.x1} y1={metrics.rightForearm.svg.y1} x2={metrics.rightForearm.svg.x2} y2={metrics.rightForearm.svg.y2} stroke={getSegmentColor('rightForearm')} strokeWidth={getSegmentStrokeWidth('rightForearm')} strokeLinecap="round" />
          <Circle cx={metrics.rightWrist.svg.cx} cy={metrics.rightWrist.svg.cy} r={metrics.rightWrist.svg.r} stroke={getSegmentColor('rightWrist')} strokeWidth={getSegmentStrokeWidth('rightWrist')} fill="rgba(255,255,255,0.7)" />

          {/* 왼쪽 다리 */}
          <Line x1={metrics.leftThigh.svg.x1} y1={metrics.leftThigh.svg.y1} x2={metrics.leftThigh.svg.x2} y2={metrics.leftThigh.svg.y2} stroke={getSegmentColor('leftThigh')} strokeWidth={getSegmentStrokeWidth('leftThigh')} strokeLinecap="round" />
          <Circle cx={metrics.leftKnee.svg.cx} cy={metrics.leftKnee.svg.cy} r={metrics.leftKnee.svg.r} stroke={getSegmentColor('leftKnee')} strokeWidth={getSegmentStrokeWidth('leftKnee')} fill="rgba(255,255,255,0.7)" />
          <Line x1={metrics.leftCalf.svg.x1} y1={metrics.leftCalf.svg.y1} x2={metrics.leftCalf.svg.x2} y2={metrics.leftCalf.svg.y2} stroke={getSegmentColor('leftCalf')} strokeWidth={getSegmentStrokeWidth('leftCalf')} strokeLinecap="round" />
          <Circle cx={metrics.leftAnkle.svg.cx} cy={metrics.leftAnkle.svg.cy} r={metrics.leftAnkle.svg.r} stroke={getSegmentColor('leftAnkle')} strokeWidth={getSegmentStrokeWidth('leftAnkle')} fill="rgba(255,255,255,0.7)" />

          {/* 오른쪽 다리 */}
          <Line x1={metrics.rightThigh.svg.x1} y1={metrics.rightThigh.svg.y1} x2={metrics.rightThigh.svg.x2} y2={metrics.rightThigh.svg.y2} stroke={getSegmentColor('rightThigh')} strokeWidth={getSegmentStrokeWidth('rightThigh')} strokeLinecap="round" />
          <Circle cx={metrics.rightKnee.svg.cx} cy={metrics.rightKnee.svg.cy} r={metrics.rightKnee.svg.r} stroke={getSegmentColor('rightKnee')} strokeWidth={getSegmentStrokeWidth('rightKnee')} fill="rgba(255,255,255,0.7)" />
          <Line x1={metrics.rightCalf.svg.x1} y1={metrics.rightCalf.svg.y1} x2={metrics.rightCalf.svg.x2} y2={metrics.rightCalf.svg.y2} stroke={getSegmentColor('rightCalf')} strokeWidth={getSegmentStrokeWidth('rightCalf')} strokeLinecap="round" />
          <Circle cx={metrics.rightAnkle.svg.cx} cy={metrics.rightAnkle.svg.cy} r={metrics.rightAnkle.svg.r} stroke={getSegmentColor('rightAnkle')} strokeWidth={getSegmentStrokeWidth('rightAnkle')} fill="rgba(255,255,255,0.7)" />

          {/* 주요 관절 조인트 노드 */}
          {metrics.joints.map((j, idx) => (
            <Circle key={idx} cx={j.cx} cy={j.cy} r={4} fill="#8b5cf6" />
          ))}
        </Svg>
      </View>

      {selectedPart && (
        <View style={styles.selectedLabel}>
          <Text style={styles.selectedLabelText}>
            {selectedPart.toUpperCase()}
          </Text>
        </View>
      )}

      {/* ── 인터랙티브 선택 히트박스 ── */}
      {/* 머리 */}
      <Pressable onPress={() => onPress?.('head')} style={[styles.hitbox, metrics.head.hitbox, getHitboxStyle('head')]} />

      {/* 목 */}
      <Pressable onPress={() => onPress?.('neck')} style={[styles.hitbox, metrics.neck.hitbox, getHitboxStyle('neck')]} />

      {/* 가슴 */}
      <Pressable onPress={() => onPress?.('chest')} style={[styles.hitbox, metrics.chest.hitbox, getHitboxStyle('chest')]} />

      {/* 복부 */}
      <Pressable onPress={() => onPress?.('abdomen')} style={[styles.hitbox, metrics.abdomen.hitbox, getHitboxStyle('abdomen')]} />

      {/* 왼쪽 팔 */}
      <Pressable onPress={() => onPress?.('leftUpperArm')} style={[styles.hitbox, metrics.leftUpperArm.hitbox, getHitboxStyle('leftUpperArm')]} />
      <Pressable onPress={() => onPress?.('leftForearm')} style={[styles.hitbox, metrics.leftForearm.hitbox, getHitboxStyle('leftForearm')]} />
      <Pressable onPress={() => onPress?.('leftWrist')} style={[styles.hitbox, metrics.leftWrist.hitbox, getHitboxStyle('leftWrist')]} />

      {/* 오른쪽 팔 */}
      <Pressable onPress={() => onPress?.('rightUpperArm')} style={[styles.hitbox, metrics.rightUpperArm.hitbox, getHitboxStyle('rightUpperArm')]} />
      <Pressable onPress={() => onPress?.('rightForearm')} style={[styles.hitbox, metrics.rightForearm.hitbox, getHitboxStyle('rightForearm')]} />
      <Pressable onPress={() => onPress?.('rightWrist')} style={[styles.hitbox, metrics.rightWrist.hitbox, getHitboxStyle('rightWrist')]} />

      {/* 왼쪽 다리 */}
      <Pressable onPress={() => onPress?.('leftThigh')} style={[styles.hitbox, metrics.leftThigh.hitbox, getHitboxStyle('leftThigh')]} />
      <Pressable onPress={() => onPress?.('leftKnee')} style={[styles.hitbox, metrics.leftKnee.hitbox, getHitboxStyle('leftKnee')]} />
      <Pressable onPress={() => onPress?.('leftCalf')} style={[styles.hitbox, metrics.leftCalf.hitbox, getHitboxStyle('leftCalf')]} />
      <Pressable onPress={() => onPress?.('leftAnkle')} style={[styles.hitbox, metrics.leftAnkle.hitbox, getHitboxStyle('leftAnkle')]} />

      {/* 오른쪽 다리 */}
      <Pressable onPress={() => onPress?.('rightThigh')} style={[styles.hitbox, metrics.rightThigh.hitbox, getHitboxStyle('rightThigh')]} />
      <Pressable onPress={() => onPress?.('rightKnee')} style={[styles.hitbox, metrics.rightKnee.hitbox, getHitboxStyle('rightKnee')]} />
      <Pressable onPress={() => onPress?.('rightCalf')} style={[styles.hitbox, metrics.rightCalf.hitbox, getHitboxStyle('rightCalf')]} />
      <Pressable onPress={() => onPress?.('rightAnkle')} style={[styles.hitbox, metrics.rightAnkle.hitbox, getHitboxStyle('rightAnkle')]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 350,
    height: 700,
    alignSelf: 'center',
    backgroundColor: '#FAFAFA',
  },
  hitbox: {
    position: 'absolute',
  },
  selectedLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  selectedLabelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
