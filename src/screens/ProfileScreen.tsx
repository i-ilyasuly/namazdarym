import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Switch, Image, ActivityIndicator, Modal, Pressable } from 'react-native';
import { User, Moon, Sun, Palette, Settings, Bell, ChevronRight, LogOut, Droplet, Lock, AlertTriangle } from 'lucide-react';
import { useAppTheme, VIBRANT_COLORS, MONOCHROME_COLORS, MINIMAL_COLORS } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import EditProfileModal from '../components/EditProfileModal';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfileScreen() {
  const fontFamily = Platform.OS === 'web' 
    ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
    : 'System';

  const { isDark, setIsDark, colorMode, setColorMode } = useAppTheme();
  const { user, login, logout, loading, profile, updateProfileData } = useAuth();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrivateLoading, setIsPrivateLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const togglePrivate = async () => {
    if (!profile) return;
    setIsPrivateLoading(true);
    try {
      await updateProfileData({ isPrivate: !profile.isPrivate });
    } finally {
      setIsPrivateLoading(false);
    }
  };

  const themes = [
    { id: 'vibrant', name: 'Жарқын (Vibrant)', colors: VIBRANT_COLORS, icon: Palette },
    { id: 'monochrome', name: 'Ақ-қара (Monochrome)', colors: MONOCHROME_COLORS, icon: Droplet },
    { id: 'minimal', name: 'Минимал (Minimal)', colors: MINIMAL_COLORS, icon: Palette },
  ] as const;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1c1c1e' : '#f1f1f6', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={isDark ? '#fff' : '#1c1c1e'} size="large" />
        <Text style={{ fontFamily, color: isDark ? '#fff' : '#1c1c1e', marginTop: 12, fontWeight: '500' }}>Жүктелуде...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1c1c1e' : '#f1f1f6' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontFamily, color: isDark ? '#fff' : '#1c1c1e' }]}>Профиль</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* User Badge */}
        {user ? (
          <View style={[styles.userCard, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }]}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBg}>
                {user.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                ) : (
                  <User color="#10b981" size={32} strokeWidth={2} />
                )}
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { fontFamily, color: isDark ? '#fff' : '#1c1c1e' }]}>
                {profile?.displayName || user.displayName || 'Пайдаланушы'}
              </Text>
              <Text style={[styles.userEmail, { fontFamily }]}>
                {profile?.username ? `@${profile.username}` : user.email}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.editBtn, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6' }]}
              onPress={() => setIsEditModalOpen(true)}
            >
              <Text style={[styles.editBtnText, { fontFamily, color: isDark ? '#fff' : '#1c1c1e' }]}>Өңдеу</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.userCard, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff', justifyContent: 'center', paddingVertical: 24 }]}
            onPress={login}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarBg, { marginRight: 16 }]}>
              <User color="#10b981" size={32} strokeWidth={2} />
            </View>
            <View>
              <Text style={[styles.userName, { fontFamily, color: isDark ? '#fff' : '#1c1c1e' }]}>Кіру / Тіркелу</Text>
              <Text style={[styles.userEmail, { fontFamily }]}>Деректерді сақтау үшін кіріңіз</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Display Settings */}
        <Text style={[styles.sectionTitle, { fontFamily }]}>Көрініс</Text>
        
        <View style={[styles.settingsBlock, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }]}>
          {/* Dark Mode Toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6' }]}>
              {isDark ? <Moon color="#fff" size={20} /> : <Sun color="#1c1c1e" size={20} />}
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { fontFamily, color: isDark ? '#fff' : '#1c1c1e' }]}>Түнгі/күндізгі режим</Text>
              <Text style={[styles.settingSub, { fontFamily }]}>{isDark ? 'Түнгі' : 'Күндізгі'}</Text>
            </View>
            <Switch 
              value={isDark} 
              onValueChange={setIsDark} 
              trackColor={{ false: '#e5e5ea', true: '#10b981' }}
              thumbColor={'#ffffff'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6' }]} />

          {/* Theme Selector */}
          <View style={[styles.settingRow, { alignItems: 'flex-start', paddingTop: 16, paddingBottom: 16 }]}>
            <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6' }]}>
              <Palette color={isDark ? '#fff' : '#1c1c1e'} size={20} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { fontFamily, color: isDark ? '#fff' : '#1c1c1e' }]}>Сынақ бетінің түстері</Text>
              <Text style={[styles.settingSub, { fontFamily }]}>Намаз статусының түс тақырыбы</Text>
              
              <View style={styles.themesContainer}>
                {themes.map((theme) => (
                  <TouchableOpacity 
                    key={theme.id} 
                    style={[
                      styles.themeOption, 
                      colorMode === theme.id && styles.themeOptionActive,
                      { borderColor: colorMode === theme.id ? '#10b981' : (isDark ? '#2c2c2e' : '#e5e5ea') },
                      colorMode !== theme.id && isDark && { backgroundColor: '#1c1c1e' }
                    ]}
                    onPress={() => setColorMode(theme.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.themeColors}>
                      {theme.colors.slice(0, 4).map((c, i) => (
                        <View key={i} style={[styles.themeDot, { backgroundColor: c }]} />
                      ))}
                    </View>
                    <Text style={[
                      styles.themeName, 
                      colorMode === theme.id && styles.themeNameActive, 
                      { fontFamily },
                      colorMode !== theme.id && isDark && { color: '#a1a1aa' }
                    ]}>
                      {theme.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* General Settings */}
        <Text style={[styles.sectionTitle, { fontFamily }]}>Қосымша</Text>
        
        <View style={[styles.settingsBlock, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }]}>
          {user && profile && (
            <>
              <View style={styles.settingRow}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                  <Lock color="#ef4444" size={20} />
                </View>
                <View style={styles.settingLabelContainer}>
                  <Text style={[styles.settingLabel, { fontFamily, color: isDark ? '#fff' : '#1c1c1e' }]}>Жабық профиль</Text>
                  <Text style={[styles.settingSub, { fontFamily }]}>Тек достар ғана статистикаңызды көре алады</Text>
                </View>
                {isPrivateLoading ? (
                  <ActivityIndicator size="small" color="#ef4444" style={{ marginRight: 8 }} />
                ) : (
                  <Switch 
                    value={!!profile.isPrivate} 
                    onValueChange={togglePrivate} 
                    trackColor={{ false: '#e5e5ea', true: '#ef4444' }}
                    thumbColor={'#ffffff'}
                  />
                )}
              </View>
              <View style={[styles.divider, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6' }]} />
            </>
          )}

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={[styles.settingIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Bell color="#3b82f6" size={20} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { fontFamily, color: isDark ? '#fff' : '#1c1c1e' }]}>Хабарландырулар</Text>
            </View>
            <ChevronRight color={isDark ? '#52525b' : '#c7c7cc'} size={20} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6' }]} />
          
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={[styles.settingIconBg, { backgroundColor: isDark ? 'rgba(161, 161, 170, 0.1)' : 'rgba(142, 142, 147, 0.1)' }]}>
              <Settings color={isDark ? '#a1a1aa' : '#8e8e93'} size={20} />
            </View>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { fontFamily, color: isDark ? '#fff' : '#1c1c1e' }]}>Жалпы баптаулар</Text>
            </View>
            <ChevronRight color={isDark ? '#52525b' : '#c7c7cc'} size={20} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        {user && (
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={() => setIsLogoutModalOpen(true)}>
            <LogOut color="#ef4444" size={20} />
            <Text style={[styles.logoutText, { fontFamily }]}>Шығу</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      
      {/* Logout Confirmation Modal */}
      <Modal
        visible={isLogoutModalOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsLogoutModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => setIsLogoutModalOpen(false)} 
          />
          <AnimatePresence>
            {isLogoutModalOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  backgroundColor: isDark ? '#2c2c2e' : '#ffffff',
                  width: '85%',
                  maxWidth: 400,
                  borderRadius: 24,
                  padding: 24,
                  alignItems: 'center',
                  boxShadow: isDark ? '0px 10px 30px rgba(0, 0, 0, 0.5)' : '0px 10px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <View style={[styles.warningIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <AlertTriangle color="#ef4444" size={32} />
                </View>

                <Text style={[styles.modalTitle, { fontFamily, color: isDark ? '#fff' : '#1c1c1e' }]}>
                  Шығуды растау
                </Text>
                <Text style={[styles.modalSub, { fontFamily, color: isDark ? '#a1a1aa' : '#6b7280' }]}>
                  Есептік жазбаңыздан шығғыңыз келетініне сенімдісіз бе?
                </Text>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity 
                    style={[styles.modalBtn, styles.modalBtnCancel, { backgroundColor: isDark ? '#3f3f46' : '#f1f1f6' }]}
                    onPress={() => setIsLogoutModalOpen(false)}
                  >
                    <Text style={[styles.modalBtnText, { color: isDark ? '#fff' : '#1c1c1e' }]}>Болдырмау</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalBtn, styles.modalBtnConfirm]}
                    onPress={() => {
                      setIsLogoutModalOpen(false);
                      logout();
                    }}
                  >
                    <Text style={[styles.modalBtnText, { color: '#fff' }]}>Шығу</Text>
                  </TouchableOpacity>
                </View>
              </motion.div>
            )}
          </AnimatePresence>
        </View>
      </Modal>

      {user && profile && (
        <EditProfileModal 
          visible={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#f1f1f6',
  },
  modalBtnConfirm: {
    backgroundColor: '#ef4444',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 8,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatarBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#8e8e93',
  },
  editBtn: {
    backgroundColor: '#f1f1f6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  settingsBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  settingIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f1f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1c1c1e',
  },
  settingSub: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f1f6',
    marginLeft: 62,
  },
  themesContainer: {
    marginTop: 14,
    gap: 6,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  themeOptionActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  themeColors: {
    flexDirection: 'row',
    gap: 4,
  },
  themeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8e8e93',
  },
  themeNameActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
});
