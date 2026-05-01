import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import TestScreen from './screens/TestScreen';
import WidgetsScreen from './screens/WidgetsScreen';
import StatsScreen from './screens/StatsScreen';
import BottomNav from './components/BottomNav';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'test' | 'widgets' | 'stats'>('widgets');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.screenContainer, activeTab !== 'home' && styles.hidden]}>
          <HomeScreen />
        </View>
        <View style={[styles.screenContainer, activeTab !== 'test' && styles.hidden]}>
          <TestScreen />
        </View>
        <View style={[styles.screenContainer, activeTab !== 'widgets' && styles.hidden]}>
          <WidgetsScreen />
        </View>
        <View style={[styles.screenContainer, activeTab !== 'stats' && styles.hidden]}>
          <StatsScreen />
        </View>
      </View>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
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
