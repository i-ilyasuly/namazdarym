import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ClockWidget from '../components/ClockWidget';

export default function WidgetsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ClockWidget />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
});
