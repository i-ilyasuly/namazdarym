import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import NamazWidgetMain from '../components/namaz-block-main/NamazWidgetMain';

const SC = 0.7; // 30% scale reduction base
const s = (v: number) => v * SC;

export default function HomeScreen() {
  const { height } = useWindowDimensions();

  return (
    <ScrollView 
      contentContainerStyle={[styles.scrollContent, { minHeight: height - 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <NamazWidgetMain />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(40),
  },
});
