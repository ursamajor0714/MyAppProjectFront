import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResumeClinicScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* ── 헤더 ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Text style={styles.headerBackBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기존 진료 이어받기</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.emptyText}>기존 진료 이어받기 기능은 준비 중입니다.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  headerBackBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerBackBtnText: { fontSize: 20, color: '#333' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#999', fontWeight: '500' }
});
