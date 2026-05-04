import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Home } from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';
import { UserIcon } from './animate-ui/icons/user';
import { UsersIcon } from './animate-ui/icons/users';
import { FlaskIcon } from './animate-ui/icons/flask';
import { BookmarkIcon } from './animate-ui/icons/bookmark';

interface BottomNavProps {
  activeTab: 'home' | 'stats' | 'quran' | 'friends' | 'profile';
  onTabChange: (tab: 'home' | 'stats' | 'quran' | 'friends' | 'profile') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { isDark } = useAppTheme();
  const fontFamily = Platform.OS === 'web' 
    ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
    : 'System';

  const navItems = [
    { 
      id: 'home', 
      title: 'Негізгі', 
      icon: Home
    },
    { 
      id: 'stats', 
      title: 'Зертхана', 
      icon: FlaskIcon
    },
    { 
      id: 'quran', 
      title: 'Құран', 
      icon: BookmarkIcon
    },
    { 
      id: 'friends', 
      title: 'Достар', 
      icon: UsersIcon
    },
    { 
      id: 'profile', 
      title: 'Профиль', 
      icon: UserIcon
    },
  ] as const;

  const bgColor = isDark ? '#1c1c1e' : '#ffffff';
  const borderColor = isDark ? '#2c2c2e' : '#e5e5ea';
  const inactiveColor = '#8e8e93';
  const activeColor = isDark ? '#ffffff' : '#1c1c1e';

  return (
    <View style={[styles.navContainer, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
      {navItems.map((item) => {
        const Icon: any = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <TouchableOpacity 
            key={item.id}
            style={styles.navItem} 
            onPress={() => onTabChange(item.id)}
            activeOpacity={0.7}
          >
            <View style={{ height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Icon 
                color={isActive ? activeColor : inactiveColor} 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
            </View>
            <Text style={[
              styles.navText, 
              isActive && { color: activeColor, fontWeight: '700' }, 
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
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 8, 
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  navText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8e8e93',
    textAlign: 'center',
  },
});
