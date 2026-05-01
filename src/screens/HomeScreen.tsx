import React from 'react';
import { StyleSheet, View, ScrollView, useWindowDimensions } from 'react-native';
import NamazWidgetMain from '../components/namaz-block-main/NamazWidgetMain';

const SC = 0.7; // 30% scale reduction base
const s = (v: number) => v * SC;

export default function HomeScreen() {
  const { height } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { minHeight: height - 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <NamazWidgetMain />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(40),
  },
});
