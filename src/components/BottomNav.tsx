import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Home, FlaskConical, LayoutGrid, BarChart2 } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'test' | 'widgets' | 'stats';
  onTabChange: (tab: 'home' | 'test' | 'widgets' | 'stats') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const fontFamily = Platform.OS === 'web' 
    ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
    : 'System';

  const navItems = [
    { id: 'home', title: 'Негізгі', icon: Home },
    { id: 'test', title: 'Сынақ', icon: FlaskConical },
    { id: 'stats', title: 'Статистика', icon: BarChart2 },
    { id: 'widgets', title: 'Виджет', icon: LayoutGrid },
  ] as const;

  return (
    <View style={styles.navContainer}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <TouchableOpacity 
            key={item.id}
            style={styles.navItem} 
            onPress={() => onTabChange(item.id)}
            activeOpacity={0.7}
          >
            <Icon 
              color={isActive ? '#1c1c1e' : '#8e8e93'} 
              size={24} 
              strokeWidth={isActive ? 2.5 : 2} 
            />
            <Text style={[
              styles.navText, 
              isActive && styles.navTextActive, 
              { fontFamily }
            ]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    paddingTop: 12,
    paddingBottom: 28, // safe area approximation
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8e8e93',
    textAlign: 'center',
  },
  navTextActive: {
    color: '#1c1c1e',
    fontWeight: '600',
  },
});
