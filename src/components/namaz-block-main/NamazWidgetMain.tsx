import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import NumberFlow from '@number-flow/react';
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { Volume2, VolumeX, Check, Users, Clock, AlertCircle, X } from 'lucide-react';
import { EclipseIcon, SunIcon, SunDimIcon, SunsetIcon, MoonStarIcon } from './PrayerIconsMain';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';


const SC = 0.7; // 30% scale reduction base
const s = (v: number) => v * SC;
const sy = (v: number) => s(v) * 0.75; // Additional 25% vertical scale reduction

interface Prayer {
  id: number;
  name: string;
  time: string;
  Icon: React.FC<any>;
}

const DEFAULT_PRAYERS: Prayer[] = [
  { id: 0, name: 'Таң', time: '06:15', Icon: EclipseIcon },
  { id: 1, name: 'Бесін', time: '13:15', Icon: SunIcon },
  { id: 2, name: 'Екінті', time: '16:15', Icon: SunDimIcon },
  { id: 3, name: 'Шам', time: '18:15', Icon: SunsetIcon },
  { id: 4, name: 'Құптан', time: '22:15', Icon: MoonStarIcon },
];

const STATUS_COLORS: Record<number, string> = {
  0: '#10b981', // green
  1: '#3b82f6', // blue
  2: '#ef4444', // red
  3: '#1c1c1e', // black
  4: '#10b981', // green
};

const MONOCHROME_STATUS_COLORS: Record<number, string> = {
  0: 'rgba(28, 28, 30, 1.00)', 
  1: 'rgba(28, 28, 30, 0.75)', 
  2: 'rgba(28, 28, 30, 0.45)', 
  3: 'rgba(28, 28, 30, 0.20)', 
  4: 'rgba(28, 28, 30, 1.00)', 
};

const BG_COLORS: Record<number, string> = {
  0: 'rgba(16, 185, 129, 0.1)', 
  1: 'rgba(59, 130, 246, 0.1)', 
  2: 'rgba(239, 68, 68, 0.1)',  
  3: 'rgba(28, 28, 30, 0.06)',  
  4: 'rgba(16, 185, 129, 0.1)', 
};

const MINIMAL_BG_COLORS: Record<number, string> = {
  0: '#3f3f46',
  1: '#3f3f46',
  2: '#3f3f46',
  3: '#3f3f46',
  4: '#3f3f46',
};

const MONOCHROME_BG_COLORS: Record<number, string> = {
  0: '#ffffff', 
  1: '#f1f1f6', 
  2: '#3f3f46', 
  3: '#000000', 
  4: '#ffffff', 
};

const DARK_MONOCHROME_BG_COLORS: Record<number, string> = {
  0: '#27272a', 
  1: '#18181b', 
  2: '#3f3f46', 
  3: '#09090b', 
  4: '#27272a', 
};

const DARK_MONOCHROME_STATUS_COLORS: Record<number, string> = {
  0: 'rgba(255, 255, 255, 0.4)', 
  1: 'rgba(255, 255, 255, 0.3)', 
  2: 'rgba(255, 255, 255, 0.5)', 
  3: 'rgba(255, 255, 255, 0.2)', 
  4: 'rgba(255, 255, 255, 0.4)', 
};

const PRAYER_KEYS: Record<number, string> = {
  0: 'fajr',
  1: 'dhuhr',
  2: 'asr',
  3: 'maghrib',
  4: 'isha',
};

function ScrollTransition({ 
  current, 
  renderItem, 
  style,
  distance
}: { 
  current: any, 
  renderItem: (item: any) => React.ReactNode, 
  style?: any,
  distance: number
}) {
  const [items, setItems] = useState([{ item: current, key: current.id }]);
  const animValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (items.length > 0 && items[items.length - 1].key === current.id) return;
    
    setItems((prev) => {
      const last = prev[prev.length - 1];
      return [last, { item: current, key: current.id }];
    });

    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic)
    }).start(({ finished }) => {
      if (finished) {
        setItems([{ item: current, key: current.id }]);
      }
    });
  }, [current.id]);

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <View style={{ opacity: 0 }} pointerEvents="none" aria-hidden={true}>
        {renderItem(items[items.length - 1].item)}
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {items.map((entry, index) => {
          const isCurrent = index === items.length - 1;
          const isPrev = index === items.length - 2;

          if (!isCurrent && !isPrev) return null;

          const translateY = isCurrent 
            ? animValue.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] })
            : animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });

          const opacity = isCurrent
            ? animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })
            : animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

          return (
            <Animated.View key={entry.key} style={[
              StyleSheet.absoluteFill,
              { transform: [{ translateY }], opacity }
            ]} pointerEvents={isCurrent ? "auto" : "none"}>
              {renderItem(entry.item)}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

export default function NamazWidgetMain() {
  const { width } = useWindowDimensions(); 
  const { isDark, colorMode } = useAppTheme();
  const { user, logPrayer } = useAuth();
  
  const DARK_BG_COLORS: Record<number, string> = {
    0: 'rgba(16, 185, 129, 0.15)',
    1: 'rgba(59, 130, 246, 0.15)',
    2: 'rgba(239, 68, 68, 0.15)', 
    3: 'rgba(255, 255, 255, 0.08)',
    4: 'rgba(16, 185, 129, 0.15)',
  };

  const statusColors = STATUS_COLORS;
  const bgColorsSelection = colorMode === 'minimal' 
    ? (isDark ? MINIMAL_BG_COLORS : BG_COLORS) 
    : (colorMode === 'monochrome' 
      ? (isDark ? DARK_MONOCHROME_BG_COLORS : MONOCHROME_BG_COLORS)
      : (isDark ? DARK_BG_COLORS : BG_COLORS));
  const bgColors = bgColorsSelection;

  const getTextColor = (id: number) => {
    if (colorMode === 'monochrome' && (id === 2 || id === 3)) return '#ffffff';
    if (colorMode === 'minimal') return isDark ? '#ffffff' : '#1c1c1e';
    if (isDark) return '#ffffff';
    return '#1c1c1e';
  };

  const [location, setLocation] = useState({ lat: 51.133333, lng: 71.433333 }); // default Astana
  const [isLocating, setIsLocating] = useState(false);
  
  const handleLocate = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      }, (error) => {
        console.error("Location error:", error);
        setIsLocating(false);
      });
    } else {
      setIsLocating(false);
    }
  };

  const [prayersData, setPrayersData] = useState<Prayer[]>(DEFAULT_PRAYERS);
  const [activeId, setActiveId] = useState(1);
  const [displayedActiveId, setDisplayedActiveId] = useState(1);
  const [displayedSmall, setDisplayedSmall] = useState(DEFAULT_PRAYERS.filter(p => p.id !== 1));

  const [muteState, setMuteState] = useState<Record<number, boolean>>({});
  const toggleMute = (id: number) => setMuteState(prev => ({ ...prev, [id]: !prev[id] }));

  // Prayer statuses and editing state
  const [prayerStatuses, setPrayerStatuses] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const prayerDocRef = doc(db, 'users', user.uid, 'prayers', today);

    const unsubscribe = onSnapshot(prayerDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setPrayerStatuses({
          0: data.fajr || 'none',
          1: data.dhuhr || 'none',
          2: data.asr || 'none',
          3: data.maghrib || 'none',
          4: data.isha || 'none',
        });
      } else {
        setPrayerStatuses({
          0: 'none',
          1: 'none',
          2: 'none',
          3: 'none',
          4: 'none',
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const STATUS_OPTIONS = [
    { 
      id: 'jamaat', 
      label: 'Жамағат', 
      color: '#10b981', 
      bgColor: colorMode === 'monochrome' ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(28, 28, 30, 0.06)') : 'rgba(16, 185, 129, 0.12)', 
      Icon: Users 
    },
    { 
      id: 'on_time', 
      label: 'Уақыт', 
      color: '#3b82f6', 
      bgColor: colorMode === 'monochrome' ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(28, 28, 30, 0.04)') : 'rgba(59, 130, 246, 0.12)', 
      Icon: Check 
    },
    { 
      id: 'late', 
      label: 'Кешікті', 
      color: '#ef4444', 
      bgColor: colorMode === 'monochrome' ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(28, 28, 30, 0.02)') : 'rgba(239, 68, 68, 0.12)', 
      Icon: AlertCircle 
    },
    { 
      id: 'qaza', 
      label: 'Қаза', 
      color: isDark ? '#ffffff' : '#1c1c1e', 
      bgColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(28, 28, 30, 0.08)', 
      Icon: X 
    },
  ];

  const handleStatusSelect = async (prayerId: number, status: string) => {
    if (!user) return;
    
    const prayerKey = PRAYER_KEYS[prayerId];
    if (prayerKey) {
      try {
        await logPrayer(prayerKey, status);
      } catch (err) {
        console.error("Error logging prayer:", err);
      }
    }
    setEditingId(null);
  };

  const getStatusColor = (prayerId: number) => {
    const status = prayerStatuses[prayerId];
    if (!status) return statusColors[prayerId] || '#f7bc2e';
    const opt = STATUS_OPTIONS.find(o => o.id === status);
    return opt ? opt.color : statusColors[prayerId];
  };

  const getCellBgColor = (prayerId: number) => {
    const status = prayerStatuses[prayerId];
    if (status) {
      const opt = STATUS_OPTIONS.find(o => o.id === status);
      if (opt) {
        if (isDark && status === 'qaza') return 'rgba(255, 255, 255, 0.12)';
        return opt.bgColor;
      }
    }
    return bgColors[prayerId] || '#f1f1f6';
  };

  const [timeLeft, setTimeLeft] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const pressScales = useRef(DEFAULT_PRAYERS.map(() => new Animated.Value(1))).current;
  const [topDim, setTopDim] = useState({ w: 0, h: 0 });

  const handlePressIn = (val: Animated.Value) => {
    Animated.spring(val, { toValue: 0.85, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };
  const handlePressOut = (val: Animated.Value) => {
    Animated.spring(val, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  // Pulse animation logic
  useEffect(() => {
    if (timeLeft <= 1200 && timeLeft > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [timeLeft <= 1200, timeLeft > 0]);

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      // Ensure we have coordinates
      const lat = location.lat || 51.133333; // Default to Astana
      const lng = location.lng || 71.433333;

      try {
        const d = new Date();
        const year = d.getFullYear();
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        const todayStr = `${year}-${monthStr}-${dayStr}`;
        
        const url = `/api/prayer-times?year=${year}&lat=${lat}&lng=${lng}`;
        
        console.log(`[Fetch] Prayer times from: ${url}`);
        const response = await axios.get(url, {
          timeout: 10000
        });
        
        const data = response.data;
        if (data && data.result && Array.isArray(data.result)) {
          const todayData = data.result.find((d: any) => d.Date === todayStr);
          
          if (todayData) {
            const newPrayers = [
              { id: 0, name: 'Таң', time: todayData.fajr, Icon: EclipseIcon },
              { id: 1, name: 'Бесін', time: todayData.dhuhr, Icon: SunIcon },
              { id: 2, name: 'Екінті', time: todayData.asr, Icon: SunDimIcon },
              { id: 3, name: 'Шам', time: todayData.maghrib, Icon: SunsetIcon },
              { id: 4, name: 'Құптан', time: todayData.isha, Icon: MoonStarIcon },
            ];
            setPrayersData(newPrayers);
          }
        }
      } catch (error) {
        console.error("!! Error fetching prayer times !!", error);
        if (error instanceof Error) {
          console.error("Error Message:", error.message);
        }
      }
    };

    fetchPrayerTimes();
  }, [location.lat, location.lng]);

  useEffect(() => {
    // 10 second animation loop as per previous user request ("Бесін, екінті, құптанның анимациялары өшіп қалыпты. Соларды қос.")
    const transitionTimer = setInterval(() => {
      setActiveId(curr => (curr + 1) % 5);
    }, 10000);
    return () => clearInterval(transitionTimer);
  }, []);

  useEffect(() => {
    if (activeId === displayedActiveId) return;
    setDisplayedActiveId(activeId);
    setDisplayedSmall(prayersData.filter(p => p.id !== activeId));
  }, [activeId, displayedActiveId, prayersData]);

  // Sync displayed small when prayers data loads
  useEffect(() => {
    setDisplayedSmall(prayersData.filter(p => p.id !== displayedActiveId));
  }, [prayersData]);

  // For demonstration, keep static timer or dynamic timer based on real current active prayer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 8 * 3600 + 15 * 60 + 40)); 
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const maxContainerWidth = 600;
  const isMobile = width < 500;
  const screenPadding = isMobile ? 16 : 32;
  
  const unscaledWidgetWidth = Math.min(width - (screenPadding * 2), maxContainerWidth);
  const widgetWidth = unscaledWidgetWidth * SC;

  const widgetInnerPaddingX = isMobile ? s(16) : s(20);
  const widgetInnerPaddingY = isMobile ? sy(16) : sy(20);
  const topBlockPaddingX = isMobile ? s(22) : s(28);
  const topBlockPaddingY = isMobile ? sy(22) : sy(28);
  const gridGapX = (isMobile ? s(12) : s(14)) * 0.8;
  const gridGapY = (isMobile ? sy(12) : sy(14)) * 0.8;
  const gridInnerPaddingX = isMobile ? s(18) : s(22);
  const gridInnerPaddingY = isMobile ? sy(18) : sy(22);

  const cardWidth = (widgetWidth - (widgetInnerPaddingX * 2) - gridGapX) / 2;
  const cardHeight = cardWidth / 1.4;
  const topBlockHeight = cardHeight * 2 + gridGapY;

  const topBlockExtraStretch = isMobile ? sy(15) : sy(25); 
  const gridVerticalPadding = gridInnerPaddingY * 0.9;
  const smallTimeFontSize = Math.min((widgetWidth / 2) * 0.21, s(44)) * 0.72;

  const radiusMultiplier = 0.72 * 0.7;
  const outerRadius = s(40) * radiusMultiplier;
  const topBlockRadius = s(28) * radiusMultiplier;
  const topBlockBottomPadding = topBlockPaddingY * 1.1;
  const gridRectRadius = s(26) * radiusMultiplier;

  const topClockAvailWidth = widgetWidth - (widgetInnerPaddingX * 2) - (topBlockPaddingX * 2);
  const mainTimeFontSize = Math.min(topClockAvailWidth / 4.1, s(92)) * 0.8;

  const fontFamily = Platform.OS === 'web' 
    ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
    : 'System';

  const TimerDisplay = ({ seconds, style }: { seconds: number, style: any }) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const sVar = seconds % 60;

    const baseStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;

    return (
      <View style={baseStyle} pointerEvents="none">
        <div style={{ 
          fontFamily: baseStyle.fontFamily, 
          fontSize: baseStyle.fontSize,
          color: baseStyle.color || '#1a1a1c',
          fontWeight: baseStyle.fontWeight,
          letterSpacing: baseStyle.letterSpacing || 'normal',
          display: 'flex',
          alignItems: 'center'
        }}>
          <NumberFlow trend={-1} value={h} format={{ minimumIntegerDigits: 2 }} />
          <span style={{ margin: '0 4px', transform: 'translateY(-2%)' }}>:</span>
          <NumberFlow trend={-1} value={m} format={{ minimumIntegerDigits: 2 }} />
          <span style={{ margin: '0 4px', transform: 'translateY(-2%)' }}>:</span>
          <NumberFlow trend={-1} value={sVar} format={{ minimumIntegerDigits: 2 }} />
        </div>
      </View>
    );
  };

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <View style={[
        styles.widgetContainer, 
        { 
          paddingHorizontal: widgetInnerPaddingX, 
          paddingVertical: widgetInnerPaddingY,
          width: widgetWidth, 
          borderRadius: outerRadius,
          backgroundColor: isDark ? '#2c2c2e' : '#ffffff',
          shadowOpacity: isDark ? 0.3 : 0.12
        }
      ]}>
      <Animated.View 
        onLayout={(e) => setTopDim({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        style={{ 
          zIndex: 10,
          transform: [
            { scale: pressScales[displayedActiveId] || 1 }
          ] 
        }}
      >
        {(() => {
          const currentPrayer = prayersData.find(p => p.id === displayedActiveId) || prayersData[1];

          return (
            <Pressable 
              onPress={() => setEditingId(currentPrayer.id)}
              onPressIn={() => handlePressIn(pressScales[displayedActiveId])}
              onPressOut={() => handlePressOut(pressScales[displayedActiveId])}
              style={[
                styles.topBlock, 
                  { 
                    backgroundColor: getCellBgColor(currentPrayer.id),
                    height: topBlockHeight,
                    paddingHorizontal: topBlockPaddingX,
                  paddingBottom: topBlockBottomPadding,
                  paddingTop: topBlockPaddingY * 1.1,
                  borderRadius: topBlockRadius,
                  overflow: 'hidden'
                }
              ]}
            >
              <ScrollTransition
                current={currentPrayer}
                distance={sy(40)}
                renderItem={(prayer) => {
                  const IconCmp = prayer.Icon;
                  const statusColor = getStatusColor(prayer.id);
                  const txtColor = getTextColor(prayer.id);
                  
                  return (
                    <View style={{ flex: 1 }}>
                      <View style={{ height: topBlockExtraStretch * 1.6 }} />

                      <View style={styles.bigSunIcon} pointerEvents="none">
                        <IconCmp color="#f7bc2e" fill="#f7bc2e" size={s(64)} strokeWidth={2} animated={true} />
                      </View>

                      <View style={styles.cityDateRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.cityText, { color: txtColor, fontFamily, fontSize: s(22) * 1.2, transform: [{ translateY: -s(8) }] }]}>{prayer.name}</Text>
                          <View style={{ width: s(8), height: s(8), borderRadius: s(4), backgroundColor: statusColor, marginLeft: s(10), transform: [{ translateY: -s(8) }] }} />
                        </View>
                      </View>

                      <View style={{ marginTop: sy(20), flex: 1, justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                        <Animated.View style={{ opacity: pulseAnim }}>
                          <TimerDisplay 
                            seconds={timeLeft} 
                            style={[styles.mainTimeText, { color: txtColor, fontSize: mainTimeFontSize * 1.0, fontFamily, marginLeft: 0 }]} 
                          />
                        </Animated.View>
                      </View>
                    </View>
                  );
                }}
              />

              {editingId === currentPrayer.id && (
                <View style={[StyleSheet.absoluteFill, styles.statusOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)' }]}>
                  <View style={styles.statusOptionsRow}>
                    {STATUS_OPTIONS.map((opt) => (
                      <TouchableOpacity 
                        key={opt.id} 
                        style={styles.statusOptionBtn}
                        onPress={() => handleStatusSelect(currentPrayer.id, opt.id)}
                      >
                        <View style={[styles.statusIconCircle, { backgroundColor: `${opt.color}20` }]}>
                          <opt.Icon color={opt.color} size={s(28)} />
                        </View>
                        <Text style={[styles.statusOptionLabel, { color: isDark ? '#fff' : '#1c1c1e', fontFamily }]}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.closeStatusBtn} onPress={() => setEditingId(null)}>
                    <X color={isDark ? '#fff' : '#1c1c1e'} size={s(20)} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.bigSoundBtnLight, {
                  position: 'absolute',
                  bottom: topBlockBottomPadding,
                  right: topBlockPaddingX * 0.8,
                }]}
                activeOpacity={0.8}
                onPress={() => toggleMute(currentPrayer.id)}
              >
                {muteState[currentPrayer.id] ? (
                  <VolumeX color="#ef4444" size={s(18)} strokeWidth={2.5} />
                ) : (
                  <Volume2 color={getTextColor(currentPrayer.id)} size={s(18)} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </Pressable>
          );
        })()}
      </Animated.View>

      <View style={{ height: gridGapY }} />

      <View style={[styles.gridRow, { columnGap: gridGapX }]}>
        
        <View style={[styles.gridCol, { rowGap: gridGapY }]}>
          {[0, 2].map((idx) => {
            const currentPrayer = displayedSmall[idx];
            if (!currentPrayer) return null;

            return (
              <Animated.View key={`left-${currentPrayer.id}`} style={{ 
                transform: [
                  { scale: pressScales[currentPrayer.id] || 1 }
                ] 
              }}>
                <Pressable 
                  onPress={() => setEditingId(currentPrayer.id)}
                  onPressIn={() => handlePressIn(pressScales[currentPrayer.id])}
                  onPressOut={() => handlePressOut(pressScales[currentPrayer.id])}
                  style={[
                    styles.cardLight, 
                    { backgroundColor: getCellBgColor(currentPrayer.id), paddingHorizontal: gridInnerPaddingX, paddingVertical: gridVerticalPadding, borderRadius: gridRectRadius, aspectRatio: 1.4, overflow: 'hidden' }
                  ]}
                >
                  <ScrollTransition
                    current={currentPrayer}
                    distance={sy(30)}
                    renderItem={(prayer) => {
                      const IconCmp = prayer.Icon;
                      const statusColor = getStatusColor(prayer.id);
                      const txtColor = getTextColor(prayer.id);
                      return (
                        <View style={{ flex: 1, justifyContent: 'space-between' }}>
                          <View style={styles.cardHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={[styles.cardCityLight, { color: txtColor, fontFamily }]} numberOfLines={1}>{prayer.name}</Text>
                              <View style={{ width: s(6), height: s(6), borderRadius: s(3), backgroundColor: statusColor, marginLeft: s(6), transform: [{ translateY: s(1) }] }} />
                            </View>
                            <IconCmp color="#f7bc2e" fill="#f7bc2e" size={s(32)} animated={false} />
                          </View>
                          <View style={{ flex: 1 }} />
                          <View style={styles.cardFooter}>
                            <Text style={[styles.cardTimeLight, { color: txtColor, fontSize: smallTimeFontSize, fontFamily }]} adjustsFontSizeToFit numberOfLines={1}>{prayer.time}</Text>
                            <View style={[styles.smallSoundBtnLight, { opacity: 0 }]} pointerEvents="none">
                              <Volume2 size={s(14)} strokeWidth={2.5} />
                            </View>
                          </View>
                        </View>
                      );
                    }}
                  />
                  
                  <View style={[StyleSheet.absoluteFill, { paddingHorizontal: gridInnerPaddingX, paddingVertical: gridVerticalPadding }]} pointerEvents="box-none">
                    <View style={styles.cardHeader} pointerEvents="none">
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.cardCityLight, { fontFamily, opacity: 0 }]} numberOfLines={1}>{currentPrayer.name}</Text>
                        <View style={{ width: s(6), height: s(6), marginLeft: s(6), transform: [{ translateY: s(1) }] }} />
                      </View>
                      <View style={{ width: s(32), height: s(32) }} />
                    </View>
                    <View style={{ flex: 1 }} pointerEvents="none" />
                    <View style={styles.cardFooter} pointerEvents="box-none">
                      <Text style={[styles.cardTimeLight, { fontSize: smallTimeFontSize, fontFamily, opacity: 0 }]} adjustsFontSizeToFit numberOfLines={1}>{currentPrayer.time}</Text>
                      <TouchableOpacity style={styles.smallSoundBtnLight} activeOpacity={0.8} onPress={() => toggleMute(currentPrayer.id)}>
                        {muteState[currentPrayer.id] ? (
                          <VolumeX color="#ef4444" size={s(14)} strokeWidth={2.5} />
                        ) : (
                          <Volume2 color={getTextColor(currentPrayer.id)} size={s(14)} strokeWidth={2.5} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {editingId === currentPrayer.id && (
                    <View style={[StyleSheet.absoluteFill, styles.statusOverlaySmall, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)' }]}>
                      <View style={styles.statusOptionsGrid}>
                        {STATUS_OPTIONS.map((opt) => (
                          <TouchableOpacity 
                            key={opt.id} 
                            style={styles.statusOptionBtnSmall}
                            onPress={() => handleStatusSelect(currentPrayer.id, opt.id)}
                          >
                            <View style={[styles.statusIconCircleSmall, { backgroundColor: `${opt.color}20` }]}>
                              <opt.Icon color={opt.color} size={s(18)} />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity style={styles.closeStatusBtnSmall} onPress={() => setEditingId(null)}>
                        <X color={isDark ? '#fff' : '#1c1c1e'} size={s(14)} />
                      </TouchableOpacity>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <View style={[styles.gridCol, { rowGap: gridGapY }]}>
          {[1, 3].map((idx) => {
            const currentPrayer = displayedSmall[idx];
            if (!currentPrayer) return null;

            return (
              <Animated.View key={`right-${currentPrayer.id}`} style={{ 
                transform: [
                  { scale: pressScales[currentPrayer.id] || 1 }
                ] 
              }}>
                <Pressable 
                  onPress={() => setEditingId(currentPrayer.id)}
                  onPressIn={() => handlePressIn(pressScales[currentPrayer.id])}
                  onPressOut={() => handlePressOut(pressScales[currentPrayer.id])}
                  style={[
                    styles.cardLight, 
                    { backgroundColor: getCellBgColor(currentPrayer.id), paddingHorizontal: gridInnerPaddingX, paddingVertical: gridVerticalPadding, borderRadius: gridRectRadius, aspectRatio: 1.4, overflow: 'hidden' }
                  ]}
                >
                  <ScrollTransition
                    current={currentPrayer}
                    distance={sy(30)}
                    renderItem={(prayer) => {
                      const IconCmp = prayer.Icon;
                      const statusColor = getStatusColor(prayer.id);
                      const txtColor = getTextColor(prayer.id);
                      return (
                        <View style={{ flex: 1, justifyContent: 'space-between' }}>
                          <View style={styles.cardHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={[styles.cardCityLight, { color: txtColor, fontFamily }]} numberOfLines={1}>{prayer.name}</Text>
                              <View style={{ width: s(6), height: s(6), borderRadius: s(3), backgroundColor: statusColor, marginLeft: s(6), transform: [{ translateY: s(1) }] }} />
                            </View>
                            <IconCmp color="#f7bc2e" fill="#f7bc2e" size={s(32)} animated={false} />
                          </View>
                          <View style={{ flex: 1 }} />
                          <View style={styles.cardFooter}>
                            <Text style={[styles.cardTimeLight, { color: txtColor, fontSize: smallTimeFontSize, fontFamily }]} adjustsFontSizeToFit numberOfLines={1}>{prayer.time}</Text>
                            <View style={[styles.smallSoundBtnLight, { opacity: 0 }]} pointerEvents="none">
                              <Volume2 size={s(14)} strokeWidth={2.5} />
                            </View>
                          </View>
                        </View>
                      );
                    }}
                  />
                  
                  <View style={[StyleSheet.absoluteFill, { paddingHorizontal: gridInnerPaddingX, paddingVertical: gridVerticalPadding }]} pointerEvents="box-none">
                    <View style={styles.cardHeader} pointerEvents="none">
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.cardCityLight, { fontFamily, opacity: 0 }]} numberOfLines={1}>{currentPrayer.name}</Text>
                        <View style={{ width: s(6), height: s(6), marginLeft: s(6), transform: [{ translateY: s(1) }] }} />
                      </View>
                      <View style={{ width: s(32), height: s(32) }} />
                    </View>
                    <View style={{ flex: 1 }} pointerEvents="none" />
                    <View style={styles.cardFooter} pointerEvents="box-none">
                      <Text style={[styles.cardTimeLight, { fontSize: smallTimeFontSize, fontFamily, opacity: 0 }]} adjustsFontSizeToFit numberOfLines={1}>{currentPrayer.time}</Text>
                      <TouchableOpacity style={styles.smallSoundBtnLight} activeOpacity={0.8} onPress={() => toggleMute(currentPrayer.id)}>
                        {muteState[currentPrayer.id] ? (
                          <VolumeX color="#ef4444" size={s(14)} strokeWidth={2.5} />
                        ) : (
                          <Volume2 color={getTextColor(currentPrayer.id)} size={s(14)} strokeWidth={2.5} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {editingId === currentPrayer.id && (
                    <View style={[StyleSheet.absoluteFill, styles.statusOverlaySmall, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)' }]}>
                      <View style={styles.statusOptionsGrid}>
                        {STATUS_OPTIONS.map((opt) => (
                          <TouchableOpacity 
                            key={opt.id} 
                            style={styles.statusOptionBtnSmall}
                            onPress={() => handleStatusSelect(currentPrayer.id, opt.id)}
                          >
                            <View style={[styles.statusIconCircleSmall, { backgroundColor: `${opt.color}20` }]}>
                              <opt.Icon color={opt.color} size={s(18)} />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity style={styles.closeStatusBtnSmall} onPress={() => setEditingId(null)}>
                        <X color={isDark ? '#fff' : '#1c1c1e'} size={s(14)} />
                      </TouchableOpacity>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
        
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  widgetContainer: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: s(24) },
    shadowOpacity: 0.12,
    shadowRadius: s(56),
    elevation: 8,
  },
  topBlock: {
    position: 'relative',
    justifyContent: 'center',
  },
  bigSunIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  bigSoundBtnLight: {
    width: s(40) * 1.1,
    height: s(40) * 1.1,
    borderRadius: (s(40) * 1.1) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: s(2) },
    shadowOpacity: 0.05,
    shadowRadius: s(6),
    elevation: 3,
  },
  
  smallSoundBtnLight: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: s(2) },
    shadowOpacity: 0.05,
    shadowRadius: s(4),
    elevation: 2,
  },

  cityDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 0, 
  },
  cityText: {
    fontSize: s(22),
    fontWeight: '600',
    color: '#1c1c1e',
    letterSpacing: s(-0.3),
  },
  mainTimeText: {
    fontWeight: '500',
    color: '#1a1a1c',
    letterSpacing: s(-2.5),
    marginLeft: s(-2),
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCol: {
    flex: 1,
  },
  cardLight: {
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardCityLight: {
    fontSize: s(16),
    fontWeight: '500',
    color: '#1c1c1e',
    flexShrink: 1,
    marginRight: s(4),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardTimeLight: {
    fontWeight: '500',
    color: '#1c1c1e',
    letterSpacing: s(-1),
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  locateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginLeft: 8,
  },
  statusOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  statusOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(16),
  },
  statusOptionBtn: {
    alignItems: 'center',
    gap: s(8),
  },
  statusIconCircle: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptionLabel: {
    fontSize: s(12),
    fontWeight: '600',
    opacity: 0.9,
  },
  closeStatusBtn: {
    position: 'absolute',
    top: s(16),
    right: s(16),
    padding: s(10),
  },
  statusOverlaySmall: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  statusOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: s(12),
    gap: s(10),
  },
  statusOptionBtnSmall: {
    width: '40%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconCircleSmall: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeStatusBtnSmall: {
    position: 'absolute',
    top: s(8),
    right: s(8),
    padding: s(4),
  },
});

