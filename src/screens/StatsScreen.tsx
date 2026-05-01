import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { BarChart2, CalendarDays } from 'lucide-react';
import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Таң', value: 400, fill: '#10b981' },
  { name: 'Бесін', value: 300, fill: '#3b82f6' },
  { name: 'Екінті', value: 300, fill: '#ef4444' },
  { name: 'Шам', value: 200, fill: '#1c1c1e' },
  { name: 'Құптан', value: 100, fill: '#10b981' },
];

function PieChartWithPaddingAngle() {
  if (Platform.OS !== 'web') {
    return <Text style={{ fontFamily }}>Диаграмма тек браузерде жұмыс істейді</Text>;
  }
  return (
    <View style={{ width: '100%', height: 300, alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius="75%"
            outerRadius="100%"
            cornerRadius={40}
            paddingAngle={5}
            dataKey="value"
            isAnimationActive={true}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </View>
  );
}

export default function StatsScreen() {
  const [activeSegment, setActiveSegment] = useState<'stats'|'calendar'>('stats');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ақпарат</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <View style={styles.segmentBackground}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'stats' && styles.segmentBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveSegment('stats')}
          >
            <BarChart2 color={activeSegment === 'stats' ? '#1c1c1e' : '#8e8e93'} size={18} strokeWidth={2.5} />
            <Text style={[styles.segmentText, activeSegment === 'stats' && styles.segmentTextActive]}>
              Статистика
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'calendar' && styles.segmentBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveSegment('calendar')}
          >
            <CalendarDays color={activeSegment === 'calendar' ? '#1c1c1e' : '#8e8e93'} size={18} strokeWidth={2.5} />
            <Text style={[styles.segmentText, activeSegment === 'calendar' && styles.segmentTextActive]}>
              Күнтізбе
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeSegment === 'stats' ? (
          <View style={styles.statsContainer}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Намаз оқу активтілігі</Text>
              <PieChartWithPaddingAngle />
              
              <View style={styles.legendContainer}>
                {data.map((item, idx) => (
                  <View key={idx} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.fill }]} />
                    <Text style={styles.legendText}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.iconCircle}>
              <CalendarDays color="#3b82f6" size={32} />
            </View>
            <Text style={styles.emptyTitle}>Күнтізбе</Text>
            <Text style={styles.emptyDesc}>Мұнда намаз уақыттарының айлық күнтізбесі көрсетіледі.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const fontFamily = Platform.OS === 'web' 
  ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
  : 'System';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1c1c1e',
    fontFamily,
    letterSpacing: -0.5,
  },
  segmentContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  segmentBackground: {
    flexDirection: 'row',
    backgroundColor: '#e5e5ea',
    borderRadius: 14,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily,
    color: '#8e8e93',
  },
  segmentTextActive: {
    color: '#1c1c1e',
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsContainer: {
    flex: 1,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    fontFamily,
    marginBottom: 24,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8e8e93',
    fontFamily,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 60,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
    fontFamily,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 15,
    color: '#8e8e93',
    fontFamily,
    textAlign: 'center',
    lineHeight: 22,
  },
});
