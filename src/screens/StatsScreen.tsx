import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { BarChart2, CalendarDays, PieChart as PieChartIcon, Radar as RadarIcon, LineChart as LineChartIcon, BarChart as BarChartIcon, AreaChart as AreaChartIcon, Flame, Target, Trophy, Activity, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  Pie, PieChart, ResponsiveContainer, Cell, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Area, AreaChart as RechartsAreaChart,
  Bar as RechartsBar, BarChart as RechartsBarChart,
  RadialBarChart, RadialBar
} from 'recharts';
import { EclipseIcon, SunIcon, SunDimIcon, SunsetIcon, MoonStarIcon } from '../components/namaz-block/PrayerIcons';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const lineData = [
  { day: 'Дүй', value: 20 },
  { day: 'Сей', value: 45 },
  { day: 'Сәр', value: 30 },
  { day: 'Бей', value: 80 },
  { day: 'Жұма', value: 95 },
  { day: 'Сен', value: 60 },
  { day: 'Жек', value: 85 },
];

const barData = [
  { name: 'Таң', onTime: 85, qaza: 15 },
  { name: 'Бесін', onTime: 90, qaza: 10 },
  { name: 'Екінті', onTime: 75, qaza: 25 },
  { name: 'Шам', onTime: 95, qaza: 5 },
  { name: 'Құптан', onTime: 80, qaza: 20 },
];

const radialData = [
  { name: 'Орындалды', value: 80 }
];

// Generate simple heatmap data showing activity levels (0-4)
const heatmapData = Array.from({ length: 30 }, (_, i) => Math.floor(Math.random() * 5));

const PERIODS = [
  { id: 'today', title: 'Бүгін' },
  { id: 'week', title: 'Апта' },
  { id: 'month', title: 'Ай' },
  { id: '3month', title: '3 ай' },
  { id: '6month', title: '6 ай' },
  { id: 'year', title: '1 жыл' },
] as const;

const fontFamily = Platform.OS === 'web' 
  ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
  : 'System';

function CustomRadarTick({ payload, x, y, cx, cy, ...rest }: any) {
  const iconSize = 24;
  let IconToRender = null;
  let iconColor = '#8e8e93';

  // All radar icons should be yellow as requested
  iconColor = '#fbbf24';

  switch (payload.value) {
    case 'Таң': IconToRender = EclipseIcon; break;
    case 'Бесін': IconToRender = SunIcon; break;
    case 'Екінті': IconToRender = SunDimIcon; break;
    case 'Шам': IconToRender = SunsetIcon; break;
    case 'Құптан': IconToRender = MoonStarIcon; break;
    default: return null;
  }

  // Push the icon slightly further out from the center (cx, cy)
  const pushOut = 28;
  const dx = x - cx;
  const dy = y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const nx = distance === 0 ? x : x + (dx / distance) * pushOut;
  const ny = distance === 0 ? y : y + (dy / distance) * pushOut;

  // Adjust nx and ny so the icon is centered
  const posX = nx - (iconSize / 2);
  const posY = ny - (iconSize / 2);

  // Instead of text, render the animated SVG icon at the position
  return (
    <g transform={`translate(${posX}, ${posY})`}>
      <IconToRender 
        animated={true} 
        size={iconSize} 
        color={iconColor} 
      />
    </g>
  );
}

function PieChartWithPaddingAngle({ isAnimationActive = true, data }: { isAnimationActive?: boolean, data?: any[] }) {
  const { isDark, themeColors } = useAppTheme();
  const defaultData = [
    { name: 'Таң', value: 400, fill: themeColors[0] },
    { name: 'Бесін', value: 300, fill: themeColors[1] },
    { name: 'Екінті', value: 300, fill: themeColors[2] },
    { name: 'Шам', value: 200, fill: themeColors[3] },
    { name: 'Құптан', value: 100, fill: themeColors[4] },
  ];
  const finalData = data || defaultData;

  if (Platform.OS !== 'web') {
    return <Text style={{ fontFamily, color: isDark ? '#a1a1aa' : '#1c1c1e' }}>Диаграмма тек браузерде жұмыс істейді</Text>;
  }
  return (
    <View style={{ width: '100%', height: 220, alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={finalData}
            innerRadius="75%"
            outerRadius="100%"
            cornerRadius={40}
            paddingAngle={5}
            dataKey="value"
            isAnimationActive={isAnimationActive}
            stroke="none"
          >
            {finalData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </View>
  );
}

function PrayerRadarChart({ isAnimationActive = true, data }: { isAnimationActive?: boolean, data?: any[] }) {
  const { isDark, themeColors } = useAppTheme();
  
  const defaultRadarData = [
    { name: 'Таң', value: 100, fullMark: 100, color: themeColors[0] },
    { name: 'Бесін', value: 80, fullMark: 100, color: themeColors[1] },
    { name: 'Екінті', value: 70, fullMark: 100, color: themeColors[2] },
    { name: 'Шам', value: 90, fullMark: 100, color: themeColors[3] },
    { name: 'Құптан', value: 85, fullMark: 100, color: themeColors[4] },
  ];

  const finalData = data || defaultRadarData;

  if (Platform.OS !== 'web') {
    return <Text style={{ fontFamily, color: isDark ? '#a1a1aa' : '#1c1c1e' }}>Радар тек браузерде жұмыс істейді</Text>;
  }
  return (
    <View style={{ width: '100%', height: 220, alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={finalData}>
          <PolarGrid stroke={isDark ? '#2c2c2e' : '#e5e5ea'} />
          <PolarAngleAxis 
            dataKey="name" 
            tick={<CustomRadarTick />}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, Math.max(...finalData.map(d => d.value), 100)]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar 
            name="Намаз" 
            dataKey="value" 
            stroke={themeColors[1]} 
            fill={themeColors[1]} 
            fillOpacity={0.6} 
            isAnimationActive={isAnimationActive}
          />
        </RadarChart>
      </ResponsiveContainer>
    </View>
  );
}

function PrayerLineChart({ isAnimationActive = true, data = lineData }: { isAnimationActive?: boolean, data?: any[] }) {
  const { isDark, themeColors } = useAppTheme();
  
  if (Platform.OS !== 'web') {
    return <Text style={{ fontFamily, color: isDark ? '#a1a1aa' : '#1c1c1e' }}>График тек браузерде жұмыс істейді</Text>;
  }
  return (
    <View style={{ width: '100%', height: 220, alignItems: 'center', paddingTop: 10 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2c2c2e' : '#e5e5ea'} />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#a1a1aa' : '#8e8e93', fontSize: 11, fontFamily }}
            dy={10}
            minTickGap={20}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#a1a1aa' : '#8e8e93', fontSize: 11, fontFamily }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: 10, borderWidth: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: isDark ? '#1c1c1e' : '#fff', padding: 8 }}
            itemStyle={{ color: isDark ? '#fff' : '#1c1c1e', fontFamily, fontWeight: '600', fontSize: 13 }}
            labelStyle={{ color: isDark ? '#a1a1aa' : '#8e8e93', fontFamily, paddingBottom: 2, fontSize: 11 }}
            cursor={{ stroke: isDark ? '#333' : '#e5e5ea', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            name="Белсенділік"
            stroke={themeColors[0]} 
            strokeWidth={3}
            dot={data.length > 15 ? false : { r: 4, strokeWidth: 2, fill: isDark ? '#1c1c1e' : '#ffffff', stroke: themeColors[0] }}
            activeDot={{ r: 6, strokeWidth: 2, fill: isDark ? '#1c1c1e' : '#ffffff', stroke: themeColors[0] }}
            isAnimationActive={isAnimationActive}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </View>
  );
}

function PrayerAreaChart({ isAnimationActive = true, data = lineData }: { isAnimationActive?: boolean, data?: any[] }) {
  const { isDark, themeColors } = useAppTheme();
  if (Platform.OS !== 'web') {
    return <Text style={{ fontFamily, color: isDark ? '#a1a1aa' : '#1c1c1e' }}>Аудандық диаграмма тек браузерде жұмыс істейді</Text>;
  }
  return (
    <View style={{ width: '100%', height: 220, alignItems: 'center', paddingTop: 10 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={themeColors[0]} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={themeColors[0]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2c2c2e' : '#e5e5ea'} />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#a1a1aa' : '#8e8e93', fontSize: 11, fontFamily }}
            dy={10}
            minTickGap={20}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#a1a1aa' : '#8e8e93', fontSize: 11, fontFamily }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: 10, borderWidth: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: isDark ? '#1c1c1e' : '#fff', padding: 8 }}
            itemStyle={{ color: isDark ? '#fff' : '#1c1c1e', fontFamily, fontWeight: '600', fontSize: 13 }}
            labelStyle={{ color: isDark ? '#a1a1aa' : '#8e8e93', fontFamily, paddingBottom: 2, fontSize: 11 }}
            cursor={{ stroke: isDark ? '#333' : '#e5e5ea', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            name="Белсенділік"
            stroke={themeColors[0]} 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            isAnimationActive={isAnimationActive} 
            activeDot={{ r: 6, strokeWidth: 2, fill: isDark ? '#1c1c1e' : '#ffffff', stroke: themeColors[0] }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </View>
  );
}

function PrayerBarChart({ isAnimationActive = true, data = barData }: { isAnimationActive?: boolean, data?: any[] }) {
  const { isDark, themeColors, colorMode } = useAppTheme();
  
  const getColors = () => {
    if (colorMode === 'monochrome') {
      return {
        jamaat: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(28, 28, 30, 1.00)',
        onTime: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(28, 28, 30, 0.75)',
        late: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(28, 28, 30, 0.45)',
        qaza: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(28, 28, 30, 0.20)',
      };
    }
    if (colorMode === 'minimal') {
      return {
        jamaat: '#10b981',
        onTime: '#3b82f6',
        late: '#ef4444',
        qaza: isDark ? '#fff' : '#1c1c1e',
      };
    }
    return {
      jamaat: '#10b981',
      onTime: '#3b82f6',
      late: '#ef4444',
      qaza: isDark ? '#fff' : '#1c1c1e',
    };
  };

  const colors = getColors();

  if (Platform.OS !== 'web') {
    return <Text style={{ fontFamily, color: isDark ? '#a1a1aa' : '#1c1c1e' }}>Бағаналық диаграмма тек браузерде жұмыс істейді</Text>;
  }
  return (
    <View style={{ width: '100%', height: 220, alignItems: 'center', paddingTop: 10 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: -20, bottom: 5 }} barSize={12}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2c2c2e' : '#e5e5ea'} />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#a1a1aa' : '#8e8e93', fontSize: 11, fontFamily }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#a1a1aa' : '#8e8e93', fontSize: 11, fontFamily }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: 10, borderWidth: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: isDark ? '#1c1c1e' : '#fff', padding: 8 }}
            itemStyle={{ color: isDark ? '#fff' : '#1c1c1e', fontFamily, fontWeight: '600', fontSize: 13 }}
            labelStyle={{ color: isDark ? '#a1a1aa' : '#8e8e93', fontFamily, paddingBottom: 2, fontSize: 11 }}
            cursor={{ fill: isDark ? '#2c2c2e' : '#f1f1f6', opacity: 0.6 }}
          />
          <RechartsBar dataKey="jamaat" name="Жамағат" stackId="a" fill={colors.jamaat} isAnimationActive={isAnimationActive} radius={[0, 0, 0, 0]} />
          <RechartsBar dataKey="onTime" name="Уақытында" stackId="a" fill={colors.onTime} isAnimationActive={isAnimationActive} radius={[0, 0, 0, 0]} />
          <RechartsBar dataKey="late" name="Кешіктірілді" stackId="a" fill={colors.late} isAnimationActive={isAnimationActive} radius={[0, 0, 0, 0]} />
          <RechartsBar dataKey="qaza" name="Қаза" stackId="a" fill={colors.qaza} isAnimationActive={isAnimationActive} radius={[4, 4, 4, 4]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </View>
  );
}

function MonthlyCalendar() {
  const { isDark, themeColors } = useAppTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust to start from Monday (0: Mon, 6: Sun)
  const shift = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const daysArr = [];
  for (let i = 0; i < shift; i++) daysArr.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysArr.push(i);

  const monthNames = ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"];
  const dayLabels = ["Дүй", "Сей", "Сәр", "Бей", "Жұм", "Сен", "Жек"];

  const changeMonth = (delta: number) => {
    setSelectedDate(new Date(year, month + delta, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  return (
    <View style={[styles.calendarContainer, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff', borderWidth: isDark ? 1 : 0, borderColor: '#3a3a3c' }]}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <ChevronLeft size={20} color={isDark ? '#fff' : '#1c1c1e'} />
        </TouchableOpacity>
        <Text style={[styles.calendarTitle, { color: isDark ? '#fff' : '#1c1c1e' }]}>
          {monthNames[month]} {year}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
          <ChevronRight size={20} color={isDark ? '#fff' : '#1c1c1e'} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.calendarGrid}>
        {dayLabels.map(label => (
          <Text key={label} style={[styles.dayLabel, { color: isDark ? '#a1a1aa' : '#8e8e93' }]}>{label}</Text>
        ))}
        {daysArr.map((day, idx) => (
          <View key={idx} style={styles.dayCell}>
            {day !== null && (
              <View style={[
                styles.dayTouch,
                isToday(day) && { backgroundColor: themeColors[0], borderRadius: 10 }
              ]}>
                <Text style={[
                  styles.dayText, 
                  { color: isDark ? '#fff' : '#1c1c1e' },
                  isToday(day) && { color: '#fff', fontWeight: '800' }
                ]}>
                  {day}
                </Text>
                {/* Simulated activity dots */}
                <View style={styles.dotsRow}>
                  {day % 3 === 0 && <View style={[styles.miniDot, { backgroundColor: themeColors[0] }]} />}
                  {day % 4 === 0 && <View style={[styles.miniDot, { backgroundColor: themeColors[1] }]} />}
                  {day % 5 === 0 && <View style={[styles.miniDot, { backgroundColor: themeColors[2] }]} />}
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const { user } = useAuth();
  const [activeSegment, setActiveSegment] = useState<'stats'|'calendar'>('stats');
  const [activeChart, setActiveChart] = useState<'pie'|'radar'|'line'|'area'|'bar'>('pie');
  const [activePeriod, setActivePeriod] = useState<string>('week');
  const [isMounting, setIsMounting] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { isDark, themeColors, colorMode } = useAppTheme();

  // Generate 1 year of mock data for testing
  const generateMockYearData = () => {
    const data = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayName = d.toLocaleDateString('kk-KZ', { weekday: 'short' });
        // Mostly on_time, occasionally qaza or jamaat
        const randomStatus = () => {
            const r = Math.random();
            if (r > 0.85) return 'qaza';
            if (r > 0.7) return 'jamaat';
            if (r > 0.4) return 'on_time';
            return 'late';
        };
        data.push({
            date: d.toISOString().split('T')[0],
            day: dayName,
            fajr: randomStatus(),
            dhuhr: randomStatus(),
            asr: randomStatus(),
            maghrib: randomStatus(),
            isha: randomStatus(),
        });
    }
    return data;
  };

  const [mockRecords, setMockRecords] = useState<any[]>([]);

  const handleGenerateMock = async () => {
    if (!user) return;
    setIsGenerating(true);
    setMockRecords(generateMockYearData());
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        points: Math.floor(Math.random() * 800) + 200,
        streak: Math.floor(Math.random() * 30) + 1,
        // Also simulate an up/down history of the last 7 days for the chart
        history: Array.from({length: 7}, (_, i) => Math.floor(Math.random() * 50) + 50 + (i * 10))
      });
    } catch(err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    setMockRecords(generateMockYearData());
    const timer = setTimeout(() => setIsMounting(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const isAnimActive = !isMounting;

  // Defined status colors based on theme
  const getStatusColors = () => {
    if (colorMode === 'monochrome') {
      return {
        jamaat: isDark ? '#27272a' : '#ffffff',
        on_time: isDark ? '#18181b' : '#f1f1f6',
        late: isDark ? '#3f3f46' : '#3f3f46',
        qaza: isDark ? '#09090b' : '#000000',
      };
    }
    if (colorMode === 'minimal') {
      return {
        jamaat: '#10b981',
        on_time: '#3b82f6',
        late: '#ef4444',
        qaza: isDark ? '#fff' : '#1c1c1e',
      };
    }
    return {
      jamaat: '#10b981',
      on_time: '#3b82f6',
      late: '#ef4444',
      qaza: isDark ? '#fff' : '#1c1c1e',
    };
  };

  const statusColors = getStatusColors();

  const statusLabels = {
    jamaat: 'Жамағат',
    on_time: 'Уақытында',
    late: 'Кешіктірілді',
    qaza: 'Қаза',
  };

  const getDaysForPeriod = (period: string) => {
    switch (period) {
      case 'today': return 1;
      case 'week': return 7;
      case 'month': return 30;
      case '3month': return 90;
      case '6month': return 180;
      case 'year': return 365;
      default: return 7;
    }
  };

  const displayRecords = mockRecords.length > 0 ? mockRecords.slice(0, getDaysForPeriod(activePeriod)) : [];

  // Derived data from mockRecords or defaults
  const currentChartData = displayRecords.length > 0 
    ? (() => {
        const counts = { jamaat: 0, on_time: 0, late: 0, qaza: 0 };
        displayRecords.forEach(r => {
          (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).forEach(p => {
             const status = r[p] as keyof typeof counts;
             if (counts[status] !== undefined) counts[status]++;
          });
        });
        return [
          { name: statusLabels.jamaat, value: counts.jamaat, fill: statusColors.jamaat },
          { name: statusLabels.on_time, value: counts.on_time, fill: statusColors.on_time },
          { name: statusLabels.late, value: counts.late, fill: statusColors.late },
          { name: statusLabels.qaza, value: counts.qaza, fill: statusColors.qaza },
        ];
      })()
    : [
        { name: 'Жамағат', value: 40, fill: statusColors.jamaat },
        { name: 'Уақытында', value: 35, fill: statusColors.on_time },
        { name: 'Кешіктірілді', value: 15, fill: statusColors.late },
        { name: 'Қаза', value: 10, fill: statusColors.qaza },
      ];

  let currentLineData = displayRecords.length > 0 
    ? displayRecords.slice().reverse().map(r => ({ 
        day: displayRecords.length > 7 ? `${r.date.split('-')[2]}.${r.date.split('-')[1]}` : r.day, 
        value: [r.fajr, r.dhuhr, r.asr, r.maghrib, r.isha].filter(s => s === 'on_time' || s === 'jamaat').length * 20 
      }))
    : lineData;

  if (currentLineData.length > 15) {
    const step = Math.ceil(currentLineData.length / 10);
    currentLineData = currentLineData.filter((_, i) => i % step === 0 || i === currentLineData.length - 1);
  }

  const currentRadarData = displayRecords.length > 0
    ? (() => {
        const counts = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
        displayRecords.forEach(r => {
          (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).forEach(p => {
             if (r[p] === 'on_time' || r[p] === 'jamaat') counts[p]++;
          });
        });
        const total = displayRecords.length;
        return [
          { name: 'Таң', value: Math.round(counts.fajr/total*100) || 0 },
          { name: 'Бесін', value: Math.round(counts.dhuhr/total*100) || 0 },
          { name: 'Екінті', value: Math.round(counts.asr/total*100) || 0 },
          { name: 'Шам', value: Math.round(counts.maghrib/total*100) || 0 },
          { name: 'Құптан', value: Math.round(counts.isha/total*100) || 0 },
        ];
      })()
    : [
        { name: 'Таң', value: 85 },
        { name: 'Бесін', value: 90 },
        { name: 'Екінті', value: 75 },
        { name: 'Шам', value: 95 },
        { name: 'Құптан', value: 80 },
      ];

  let currentBarData = displayRecords.length > 0
    ? (() => {
        const stats = {
          fajr: { jamaat: 0, on_time: 0, late: 0, qaza: 0 },
          dhuhr: { jamaat: 0, on_time: 0, late: 0, qaza: 0 },
          asr: { jamaat: 0, on_time: 0, late: 0, qaza: 0 },
          maghrib: { jamaat: 0, on_time: 0, late: 0, qaza: 0 },
          isha: { jamaat: 0, on_time: 0, late: 0, qaza: 0 },
        };
        displayRecords.forEach(r => {
          (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).forEach(p => {
            const status = r[p] as keyof (typeof stats)['fajr'];
            if (stats[p][status] !== undefined) stats[p][status]++;
          });
        });
        const total = displayRecords.length;
        const format = (p: keyof typeof stats, label: string) => ({
          name: label,
          jamaat: Math.round(stats[p].jamaat/total*100) || 0,
          onTime: Math.round(stats[p].on_time/total*100) || 0,
          late: Math.round(stats[p].late/total*100) || 0,
          qaza: Math.round(stats[p].qaza/total*100) || 0,
        });
        return [
          format('fajr', 'Таң'),
          format('dhuhr', 'Бесін'),
          format('asr', 'Екінті'),
          format('maghrib', 'Шам'),
          format('isha', 'Құптан'),
        ];
      })()
    : barData.map(d => ({ ...d, jamaat: 20, onTime: 60, late: 10, qaza: d.qaza }));

  const currentHeatmapData = displayRecords.length > 0
    ? displayRecords.map(r => [r.fajr, r.dhuhr, r.asr, r.maghrib, r.isha].filter(s => s === 'on_time' || s === 'jamaat').length)
    : heatmapData;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#1c1c1e' }]}>Зертхана</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <View style={[styles.segmentBackground, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6' }]}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'stats' && styles.segmentBtnActive, activeSegment === 'stats' && isDark && { backgroundColor: '#3a3a3c' }]}
            activeOpacity={0.8}
            onPress={() => setActiveSegment('stats')}
          >
            <BarChart2 color={activeSegment === 'stats' ? (isDark ? '#fff' : '#1c1c1e') : '#8e8e93'} size={18} strokeWidth={2.5} />
            <Text style={[styles.segmentText, activeSegment === 'stats' && styles.segmentTextActive, activeSegment === 'stats' && isDark && { color: '#fff' }]}>
              Зертхана
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'calendar' && styles.segmentBtnActive, activeSegment === 'calendar' && isDark && { backgroundColor: '#3a3a3c' }]}
            activeOpacity={0.8}
            onPress={() => setActiveSegment('calendar')}
          >
            <CalendarDays color={activeSegment === 'calendar' ? (isDark ? '#fff' : '#1c1c1e') : '#8e8e93'} size={18} strokeWidth={2.5} />
            <Text style={[styles.segmentText, activeSegment === 'calendar' && styles.segmentTextActive, activeSegment === 'calendar' && isDark && { color: '#fff' }]}>
              Күнтізбе
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Sub-Segmented Control for Charts - SLEEK PILL DESIGN */}
      {activeSegment === 'stats' && (
        <>
          <View style={styles.periodContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScroll}>
              <View style={[styles.periodBackground, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6' }]}>
                {[
                  { id: 'pie', title: 'Дөңгелек', icon: PieChartIcon },
                  { id: 'radar', title: 'Радар', icon: RadarIcon },
                  { id: 'line', title: 'Сызық', icon: LineChartIcon },
                  { id: 'area', title: 'Аудан', icon: AreaChartIcon },
                  { id: 'bar', title: 'Бағана', icon: BarChartIcon },
                ].map((c) => (
                  <TouchableOpacity 
                    key={c.id}
                    style={[
                      styles.periodBtn, 
                      { flexDirection: 'row', gap: 6 },
                      activeChart === c.id && styles.periodBtnActive, 
                      activeChart === c.id && isDark && { backgroundColor: '#3a3a3c' }
                    ]}
                    onPress={() => setActiveChart(c.id as any)}
                    activeOpacity={0.8}
                  >
                    <c.icon color={activeChart === c.id ? (isDark ? '#fff' : '#1c1c1e') : '#8e8e93'} size={14} strokeWidth={2.5} />
                    <Text style={[styles.periodText, activeChart === c.id && styles.periodTextActive, activeChart === c.id && isDark && { color: '#fff' }]}>
                      {c.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Period Selection */}
          <View style={styles.periodContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScroll}>
              <View style={[styles.periodBackground, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6' }]}>
                {PERIODS.map(p => (
                  <TouchableOpacity 
                    key={p.id}
                    style={[styles.periodBtn, activePeriod === p.id && styles.periodBtnActive, activePeriod === p.id && isDark && { backgroundColor: '#3a3a3c' }]}
                    onPress={() => setActivePeriod(p.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.periodText, activePeriod === p.id && styles.periodTextActive, activePeriod === p.id && isDark && { color: '#fff' }]}>
                      {p.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </>
      )}

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeSegment === 'stats' ? (
          <View style={styles.statsContainer}>
            
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity 
                onPress={handleGenerateMock}
                disabled={isGenerating}
                style={{
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                }}
              >
                <Text style={{ color: '#3b82f6', fontWeight: '700', fontSize: 13, fontFamily }}>
                  {isGenerating ? 'Күте тұрыңыз...' : 'Жасанды дерек жасау (Тест)'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.chartCard, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff', borderWidth: isDark ? 1 : 0, borderColor: '#3a3a3c' }]}>
              <Text style={[styles.chartTitle, { color: isDark ? '#fff' : '#1c1c1e' }]}>Намаз оқу активтілігі</Text>
              
              {activeChart === 'pie' && <PieChartWithPaddingAngle isAnimationActive={isAnimActive} data={currentChartData} />}
              {activeChart === 'radar' && <PrayerRadarChart isAnimationActive={isAnimActive} data={currentRadarData} />}
              {activeChart === 'line' && <PrayerLineChart isAnimationActive={isAnimActive} data={currentLineData} />}
              {activeChart === 'area' && <PrayerAreaChart isAnimationActive={isAnimActive} data={currentLineData} />}
              {activeChart === 'bar' && <PrayerBarChart isAnimationActive={isAnimActive} data={currentBarData} />}
              
              <View style={styles.legendContainer}>
                {currentChartData.map((item, idx) => (
                  <View key={idx} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.fill }]} />
                    <Text style={[styles.legendText, { color: isDark ? '#a1a1aa' : '#8e8e93' }]}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.metricContainer}>
              {[
                { title: 'Үздіксіз', value: displayRecords.length > 0 ? '45 күн' : '12 күн', icon: Flame, color: themeColors[2] },
                { title: 'Уақытында', value: displayRecords.length > 0 ? `${Math.round(currentChartData.find((d: any) => d.name === statusLabels.on_time)?.value / Math.max(1, displayRecords.length * 5) * 100 || 0)}%` : '85%', icon: Target, color: themeColors[0] },
                { title: 'Жетістік', value: displayRecords.length > 0 ? `${Math.round(currentChartData.find((d: any) => d.name === statusLabels.jamaat)?.value / Math.max(1, displayRecords.length * 5) * 100 || 0)}%` : '4/5', icon: Trophy, color: themeColors[4] || '#fbbf24' },
              ].map((item, idx) => (
                <View key={idx} style={[styles.metricCard, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }]}>
                  <View style={[styles.metricIconBg, { backgroundColor: `${item.color}20`, marginRight: 6, marginBottom: 0 }]}>
                    <item.icon color={item.color} size={14} strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text style={[styles.metricValue, { color: isDark ? '#fff' : '#1c1c1e' }]}>{item.value}</Text>
                    <Text style={[styles.metricTitle, isDark && { color: '#a1a1aa' }]}>{item.title}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.chartCard, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff', borderWidth: isDark ? 1 : 0, borderColor: '#3a3a3c' }]}>
              <View style={styles.heatmapHeader}>
                <Activity color={themeColors[0]} size={20} />
                <Text style={[styles.chartTitle, { color: isDark ? '#fff' : '#1c1c1e', marginBottom: 0 }]}>Белсенділік картасы</Text>
              </View>
              <View style={styles.heatmapGrid}>
                {currentHeatmapData.map((val, idx) => (
                  <View 
                    key={idx} 
                    style={[styles.heatmapCell, { backgroundColor: (isDark ? '#3a3a3c' : '#f1f1f6') + (val > 0 ? '' : ''), 
                      ...(val > 0 ? { backgroundColor: themeColors[0] + (val === 1 ? '40' : val === 2 ? '70' : val === 3 ? 'A0' : val === 4 ? 'D0' : '') } : {}) }]} 
                  />
                ))}
              </View>
            </View>

          </View>
        ) : (
          <MonthlyCalendar />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1c1e',
    fontFamily,
    letterSpacing: -0.5,
  },
  segmentContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  segmentBackground: {
    flexDirection: 'row',
    backgroundColor: '#e5e5ea',
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily,
    color: '#8e8e93',
  },
  segmentTextActive: {
    color: '#1c1c1e',
    fontWeight: '700',
  },
  periodContainer: {
    marginBottom: 12,
  },
  periodScroll: {
    paddingHorizontal: 16,
  },
  periodBackground: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f6',
    borderRadius: 12,
    padding: 3,
    alignSelf: 'flex-start',
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily,
    color: '#8e8e93',
  },
  periodTextActive: {
    color: '#1c1c1e',
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  statsContainer: {
    flex: 1,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1c1e',
    fontFamily,
    marginBottom: 16,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8e8e93',
    fontFamily,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 40,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
    fontFamily,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#8e8e93',
    fontFamily,
    textAlign: 'center',
    lineHeight: 18,
  },
  metricContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  metricIconBg: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1c1c1e',
    fontFamily,
    marginBottom: 1,
  },
  metricTitle: {
    fontSize: 8,
    fontWeight: '500',
    color: '#8e8e93',
    fontFamily,
  },
  heatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'center',
    marginBottom: 14,
  },
  heatmapCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heatmapLegendText: {
    fontSize: 9,
    color: '#8e8e93',
    fontFamily,
    fontWeight: '500',
  },
  heatmapLegendColors: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapCellSm: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  calendarContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily,
  },
  navBtn: {
    padding: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    fontFamily,
    marginBottom: 12,
  },
  dayCell: {
    width: '14.28%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayTouch: {
    width: 38,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily,
    marginBottom: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    height: 4,
    alignItems: 'center',
  },
  miniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
