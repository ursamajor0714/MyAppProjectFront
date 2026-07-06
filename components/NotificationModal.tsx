import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore, NotificationItem } from '../store/useNotificationStore';

const { height: SCREEN_H } = Dimensions.get('window');

export default function NotificationModal() {
  const {
    isModalOpen,
    setModalOpen,
    notifications,
    markAllAsRead,
    clearAll,
    deleteNotification,
  } = useNotificationStore();

  const handleClose = () => {
    setModalOpen(false);
    markAllAsRead(); // Close marks all as read to clean up badges
  };

  const getIconAndColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'medication':
        return { icon: 'medical-sharp' as const, color: '#4CAF82', bg: '#E8F5E9' };
      case 'booking':
        return { icon: 'calendar-sharp' as const, color: '#2196F3', bg: '#E3F2FD' };
      case 'gps':
        return { icon: 'location-sharp' as const, color: '#FF9800', bg: '#FFF3E0' };
      case 'sos':
        return { icon: 'alert-circle-sharp' as const, color: '#F44336', bg: '#FFEBEE' };
      default:
        return { icon: 'notifications-sharp' as const, color: '#9C27B0', bg: '#F3E5F5' };
    }
  };

  return (
    <Modal
      visible={isModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>알림 센터</Text>
              {notifications.filter(n => !n.read).length > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {notifications.filter(n => !n.read).length}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          {notifications.length > 0 && (
            <View style={styles.actionsBar}>
              <TouchableOpacity onPress={markAllAsRead} style={styles.actionBtn}>
                <Ionicons name="checkmark-done" size={14} color="#4CAF82" />
                <Text style={[styles.actionText, { color: '#4CAF82' }]}>모두 읽음</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAll} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={14} color="#888" />
                <Text style={[styles.actionText, { color: '#888' }]}>전체 삭제</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scroll List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>현재 수신된 알림이 없습니다.</Text>
                <Text style={styles.emptySubText}>건강 일정, 복약 알림, GPS 안전 소식이 여기에 표시됩니다.</Text>
              </View>
            ) : (
              notifications.map((item) => {
                const config = getIconAndColor(item.type);
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.card,
                      !item.read && styles.unreadCard,
                    ]}
                  >
                    {/* Icon Column */}
                    <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
                      <Ionicons name={config.icon} size={20} color={config.color} />
                    </View>

                    {/* Text Column */}
                    <View style={styles.textCol}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.cardBody}>{item.body}</Text>
                    </View>

                    {/* Delete and Read Indicator Column */}
                    <View style={styles.rightCol}>
                      {!item.read && <View style={styles.dot} />}
                      <TouchableOpacity
                        onPress={() => deleteNotification(item.id)}
                        style={styles.deleteBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle-outline" size={18} color="#AAA" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    height: SCREEN_H * 0.8,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  unreadBadge: {
    backgroundColor: '#E53935',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FAFAFA',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666666',
  },
  emptySubText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#F7FAF8',
    borderColor: '#E2F0E9',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#222222',
  },
  cardTime: {
    fontSize: 10,
    color: '#999999',
  },
  cardBody: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 17,
  },
  rightCol: {
    width: 24,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF82',
    marginTop: 4,
  },
  deleteBtn: {
    marginTop: 'auto',
    paddingTop: 10,
  },
});
