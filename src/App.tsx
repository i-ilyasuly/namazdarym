import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import TestScreen from './screens/TestScreen';
import BottomNav from './components/BottomNav';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'test'>('home');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {activeTab === 'home' ? <HomeScreen /> : <TestScreen />}
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
});
