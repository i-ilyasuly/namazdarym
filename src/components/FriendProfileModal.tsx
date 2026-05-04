import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, ScrollView, Image } from 'react-native';
import { X, Flame, Trophy, Activity } from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';

const fontFamily = Platform.OS === 'web' 
  ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
  : 'System';

// Generate simple heatmap data showing activity levels (0-4)
const generateHeatmap = () => Array.from({ length: 30 }, (_, i) => Math.floor(Math.random() * 5));

export default function FriendProfileModal({ visible, friend, onClose }: { visible: boolean; friend: any; onClose: () => void }) {
  const { isDark, themeColors } = useAppTheme();
  
  // Use useMemo to avoid regenerating random data
  const heatmapData = React.useMemo(() => generateHeatmap(), [friend?.id]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#1c1c1e' }]}>Жеке парақша</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color={isDark ? '#fff' : '#1c1c1e'} size={24} />
          </TouchableOpacity>
        </View>

        {friend && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={[styles.profileCard, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
              <View style={[styles.avatar, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6', overflow: 'hidden' }]}>
                {friend.photoURL ? (
                  <Image source={{ uri: friend.photoURL }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={[styles.avatarText, { color: isDark ? '#fff' : '#1c1c1e' }]}>{friend.avatar}</Text>
                )}
              </View>
              <Text style={[styles.name, { color: isDark ? '#fff' : '#1c1c1e' }]}>{friend.name}</Text>
              
              {friend.isPrivate && !friend.friendshipId && !friend.isSelf ? (
                <View style={{ marginTop: 24, alignItems: 'center', opacity: 0.7 }}>
                  <Text style={[styles.status, { color: isDark ? '#fff' : '#1c1c1e' }]}>Бұл профиль жабық</Text>
                  <Text style={{ fontSize: 14, color: '#8e8e93', fontFamily, textAlign: 'center' }}>Ақпаратты көру үшін дос болуыңыз керек.</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.status}>Досыңыз намазын уақытында оқуда, МашаАллаһ!</Text>
                  
                  <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: isDark ? '#2c2c2e' : '#f8f9fa' }]}>
                      <Flame color="#ef4444" size={24} />
                      <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1c1c1e' }]}>{friend.streak || 0}</Text>
                      <Text style={styles.statLabel}>Күн қатарынан</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: isDark ? '#2c2c2e' : '#f8f9fa' }]}>
                      <Trophy color="#fbbf24" size={24} />
                      <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1c1c1e' }]}>{friend.points || 0}</Text>
                      <Text style={styles.statLabel}>Ұпай</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
            
            {!(friend.isPrivate && !friend.friendshipId && !friend.isSelf) && (
              <>
                <View style={[styles.prayersCard, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff', marginBottom: 24 }]}>
                   {['Таң', 'Бесін', 'Екінті', 'Шам', 'Құптан'].map((name, idx) => {
                     const status = friend.prayers ? friend.prayers[idx] : 'none';
                     const color = status === 'jamaat' ? '#10b981' : status === 'on_time' ? '#3b82f6' : status === 'late' ? '#ef4444' : status === 'qaza' ? '#1c1c1e' : (isDark ? '#2c2c2e' : '#e5e5ea');
                     
                     return (
                       <View key={name} style={styles.prayerRow}>
                         <Text style={[styles.prayerName, { color: isDark ? '#a1a1aa' : '#8e8e93', opacity: status === 'none' ? 0.6 : 1 }]}>{name}</Text>
                         <View style={[styles.prayerStatusBadge, { backgroundColor: color + '15' }]}>
                           <View style={[styles.prayerDot, { backgroundColor: color }]} />
                           <Text style={[styles.prayerStatusText, { color: status === 'none' ? (isDark ? '#a1a1aa' : '#8e8e93') : color }]}>
                             {status === 'jamaat' ? 'Жамағат' : status === 'on_time' ? 'Уақытында' : status === 'late' ? 'Кешіктірілді' : status === 'qaza' ? 'Қаза' : 'Оқылмады'}
                           </Text>
                         </View>
                       </View>
                     );
                   })}
                </View>

                <View style={[styles.chartCard, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
                  <View style={styles.heatmapHeader}>
                    <Activity color={themeColors[0]} size={20} />
                    <Text style={[styles.chartTitle, { color: isDark ? '#fff' : '#1c1c1e', marginBottom: 0 }]}>Белсенділік картасы</Text>
                  </View>
                  <View style={styles.heatmapGrid}>
                    {heatmapData.map((val, idx) => (
                      <View 
                        key={idx} 
                        style={[styles.heatmapCell, { backgroundColor: (isDark ? '#2c2c2e' : '#f1f1f6') + (val > 0 ? '' : ''), 
                          ...(val > 0 ? { backgroundColor: themeColors[0] + (val === 1 ? '40' : val === 2 ? '70' : val === 3 ? 'A0' : val === 4 ? 'D0' : '') } : {}) }]} 
                      />
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: { fontSize: 20, fontWeight: '700', fontFamily },
  closeBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: '700', fontFamily },
  name: { fontSize: 22, fontWeight: '700', fontFamily, marginBottom: 8 },
  status: { fontSize: 15, color: '#8e8e93', fontFamily, marginBottom: 24, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  statValue: { fontSize: 20, fontWeight: '700', fontFamily, marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#8e8e93', fontFamily },
  sectionTitle: { fontSize: 18, fontWeight: '700', fontFamily, marginBottom: 12, marginLeft: 4 },
  prayersCard: { 
    borderRadius: 20, 
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2, 
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  prayerName: { fontSize: 16, fontWeight: '600', fontFamily },
  prayerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  prayerDot: { width: 8, height: 8, borderRadius: 4 },
  prayerStatusText: { fontSize: 13, fontWeight: '600', fontFamily },
  chartCard: { 
    borderRadius: 20, 
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2, 
  },
  chartTitle: { fontSize: 18, fontWeight: '700', fontFamily, marginLeft: 8 },
  heatmapHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  heatmapCell: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
});
