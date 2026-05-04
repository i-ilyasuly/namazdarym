import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, ActivityIndicator } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import QuranScreen from './screens/QuranScreen';
import StatsScreen from './screens/StatsScreen';
import ProfileScreen from './screens/ProfileScreen';
import FriendsScreen from './screens/FriendsScreen';
import BottomNav from './components/BottomNav';
import EditProfileModal from './components/EditProfileModal';
import { ThemeProvider, useAppTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider, useUI } from './context/UIContext';
import { motion, AnimatePresence } from 'motion/react';

import AuthScreen from './screens/AuthScreen';

const MotionView = motion(View);

function AppContent() {
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'quran' | 'friends' | 'profile'>('home');
  const { user, profile, loading } = useAuth();
  const { isDark } = useAppTheme();
  const { isTabBarVisible } = useUI();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1c1c1e' : '#f1f1f6' }]}>
        <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#1c1c1e'} />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const needsUsername = profile && (!profile.username || !profile.gender || profile.gender === 'none');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#1c1c1e' : '#f1f1f6' }]}>
      <View style={styles.container}>
        <View style={[styles.screenContainer, activeTab !== 'home' && styles.hidden]}>
          <HomeScreen />
        </View>
        <View style={[styles.screenContainer, activeTab !== 'stats' && styles.hidden]}>
          <StatsScreen />
        </View>
        <View style={[styles.screenContainer, activeTab !== 'friends' && styles.hidden]}>
          <FriendsScreen />
        </View>
        <View style={[styles.screenContainer, activeTab !== 'quran' && styles.hidden]}>
          <QuranScreen />
        </View>
        <View style={[styles.screenContainer, activeTab !== 'profile' && styles.hidden]}>
          <ProfileScreen />
        </View>
      </View>
      
      <AnimatePresence>
        {isTabBarVisible && (
          <MotionView
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ 
              position: 'absolute', 
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              backgroundColor: isDark ? '#1c1c1e' : '#ffffff' 
            }}
          >
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </MotionView>
        )}
      </AnimatePresence>
      
      {needsUsername && (
        <EditProfileModal visible={true} onClose={() => {}} forceUsername={true} />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UIProvider>
          <AppContent />
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  screenContainer: {
    flex: 1,
  },
  hidden: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
    top: -9999,
    left: -9999,
  },
});
