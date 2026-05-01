import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Moon, Sun, Palette, Droplet } from 'lucide-react';
import NamazWidget from '../components/namaz-block/NamazWidget';
import QuranStreamWidget from '../components/quran-stream/QuranStreamWidget';

const SC = 0.7; // 30% scale reduction base
const s = (v: number) => v * SC;

export type ColorMode = 'vibrant' | 'monochrome' | 'minimal';

// Create a simple Theme Context
export const ThemeContext = React.createContext({ 
  isDark: false, 
  colorMode: 'vibrant' as ColorMode,
  toggleTheme: () => {},
  toggleColorMode: () => {}
});

export default function TestScreen() {
  const { height } = useWindowDimensions(); 
  const [isDark, setIsDark] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>('vibrant');
  
  return (
    <ThemeContext.Provider value={{ 
      isDark, 
      colorMode,
      toggleTheme: () => setIsDark(!isDark),
      toggleColorMode: () => setColorMode(prev => {
        if (prev === 'vibrant') return 'monochrome';
        if (prev === 'monochrome') return 'minimal';
        return 'vibrant';
      })
    }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}
        contentContainerStyle={[styles.scrollContent, { minHeight: height - 80 }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => setColorMode(prev => {
              if (prev === 'vibrant') return 'monochrome';
              if (prev === 'monochrome') return 'minimal';
              return 'vibrant';
            })}
            activeOpacity={0.8}
          >
            {colorMode === 'vibrant' ? (
               <Palette color={isDark ? '#fff' : '#1c1c1e'} size={24} />
            ) : colorMode === 'monochrome' ? (
               <Droplet color={isDark ? '#fff' : '#1c1c1e'} size={24} />
            ) : (
               <Palette color={isDark ? '#fff' : '#1c1c1e'} size={24} opacity={0.5} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => setIsDark(!isDark)}
            activeOpacity={0.8}
          >
            {isDark ? <Sun color="#fff" size={24} /> : <Moon color="#1c1c1e" size={24} />}
          </TouchableOpacity>
        </View>

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
  controlsContainer: {
    position: 'absolute',
    top: s(20),
    right: s(20),
    zIndex: 10,
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  }
});



