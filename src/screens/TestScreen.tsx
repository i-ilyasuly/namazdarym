import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Moon, Sun } from 'lucide-react';
import NamazWidget from '../components/namaz-block/NamazWidget';
import QuranStreamWidget from '../components/quran-stream/QuranStreamWidget';

const SC = 0.7; // 30% scale reduction base
const s = (v: number) => v * SC;

// Create a simple Theme Context
export const ThemeContext = React.createContext({ isDark: false, toggleTheme: () => {} });

export default function TestScreen() {
  const { height } = useWindowDimensions(); 
  const [isDark, setIsDark] = useState(false);
  
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(!isDark) }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}
        contentContainerStyle={[styles.scrollContent, { minHeight: height - 80 }]} 
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.themeToggle} 
          onPress={() => setIsDark(!isDark)}
          activeOpacity={0.8}
        >
          {isDark ? <Sun color="#fff" size={24} /> : <Moon color="#1c1c1e" size={24} />}
        </TouchableOpacity>

        <View style={{ width: '100%', gap: 24, alignItems: 'center' }}>
          <QuranStreamWidget />
          <NamazWidget />
        </View>
      </ScrollView>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(40),
  },
  themeToggle: {
    position: 'absolute',
    top: s(20),
    right: s(20),
    zIndex: 10,
    padding: 8,
  }
});



