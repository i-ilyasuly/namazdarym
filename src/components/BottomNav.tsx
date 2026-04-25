import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';

interface BottomNavProps {
  activeTab: 'home' | 'test';
  onTabChange: (tab: 'home' | 'test') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const fontFamily = Platform.OS === 'web' 
    ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
    : 'System';

  return (
    <View style={styles.navContainer}>
      <TouchableOpacity 
        style={[styles.navItem, activeTab === 'home' && styles.navItemActive]} 
        onPress={() => onTabChange('home')}
        activeOpacity={0.7}
      >
        <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive, { fontFamily }]}>
          Негізгі
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, activeTab === 'test' && styles.navItemActive]} 
        onPress={() => onTabChange('test')}
        activeOpacity={0.7}
      >
        <Text style={[styles.navText, activeTab === 'test' && styles.navTextActive, { fontFamily }]}>
          Сынақ
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    paddingBottom: 20, // safe area approximation
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    // optional active styling like top border or background tint
  },
  navText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8e8e93',
  },
  navTextActive: {
    color: '#1c1c1e',
    fontWeight: '700',
  },
});
