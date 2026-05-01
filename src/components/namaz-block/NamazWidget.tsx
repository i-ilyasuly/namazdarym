import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
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
import { Volume2, VolumeX, MapPin } from 'lucide-react';
import { EclipseIcon, SunIcon, SunDimIcon, SunsetIcon, MoonStarIcon } from './PrayerIcons';
import { ThemeContext } from '../../screens/TestScreen';

import { UserIcon } from '../animate-ui/icons/user';
import { UsersIcon } from '../animate-ui/icons/users';
import { TimerIcon } from '../animate-ui/icons/timer';
import { XIcon } from '../animate-ui/icons/x';

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

const VIBRANT_STATUS_COLORS: Record<number, string> = {
  0: '#10b981', // green
  1: '#3b82f6', // blue
  2: '#ef4444', // red
  3: '#1c1c1e', // black
  4: '#10b981', // green
};

const MONOCHROME_STATUS_COLORS: Record<number, string> = {
  0: 'rgba(28, 28, 30, 1.00)', // Darkest (1st rank)
  1: 'rgba(28, 28, 30, 0.75)', // Mid-dark (2nd rank)
  2: 'rgba(28, 28, 30, 0.45)', // Mid-light (3rd rank)
  3: 'rgba(28, 28, 30, 0.20)', // Lightest (4th rank)
  4: 'rgba(28, 28, 30, 1.00)', // Darkest (1st rank)
};

const VIBRANT_BG_COLORS: Record<number, string> = {
  0: 'rgba(16, 185, 129, 0.1)', // green light
  1: 'rgba(59, 130, 246, 0.1)', // blue light
  2: 'rgba(239, 68, 68, 0.1)',  // red light
  3: 'rgba(28, 28, 30, 0.06)',  // black light
  4: 'rgba(16, 185, 129, 0.1)', // green light
};

const MINIMAL_BG_COLORS: Record<number, string> = {
  0: '#f1f1f6',
  1: '#f1f1f6',
  2: '#f1f1f6',
  3: '#f1f1f6',
  4: '#f1f1f6',
};

const MONOCHROME_BG_COLORS: Record<number, string> = {
  0: '#ffffff', // Best (Rank 1) - Pure White
  1: '#f1f1f6', // Rank 2 (Blue) - Soft Gray
  2: '#3f3f46', // Rank 3 (Red) - Deep Charcoal
  3: '#000000', // Worst (Rank 4) - Pure Black
  4: '#ffffff', // Best (Rank 1)
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

// --- Mock Stats Data ---
const PRAYER_STATUSES = {
  JAMAHAT: { color: '#10b981', height: 1.0 },
  ALONE: { color: '#3b82f6', height: 0.7 },
  LATE: { color: '#ef4444', height: 0.4 },
  QAZA: { color: '#1c1c1e', height: 0.1 }
};

const getMockStats = (prayerId: number) => {
  const statuses = [PRAYER_STATUSES.JAMAHAT, PRAYER_STATUSES.ALONE, PRAYER_STATUSES.LATE, PRAYER_STATUSES.QAZA];
  return Array.from({ length: 7 }, (_, i) => {
    const idx = (prayerId + i * 3) % statuses.length;
    return statuses[idx];
  });
};

const PrayerMiniGraph = React.memo(({ prayerId, color, prayerColor, bgColor }: { prayerId: number, color: string, prayerColor: string, bgColor: string }) => {
  const stats = getMockStats(prayerId);
  const graphWidth = s(220);
  const graphHeight = s(80);
  const dotSize = s(16); // Increased base size
  const spacing = (graphWidth - dotSize) / 6;

  return (
    <View style={{ width: graphWidth, height: graphHeight }}>
      <svg width={graphWidth} height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`} style={{ overflow: 'visible' }}>
        {/* Lines */}
        {stats.map((stat, i) => {
          if (i === 0) return null;
          const prevStat = stats[i - 1];
          const x1 = (i - 1) * spacing + dotSize/2;
          const y1 = graphHeight - (prevStat.height * graphHeight);
          const x2 = i * spacing + dotSize/2;
          const y2 = graphHeight - (stat.height * graphHeight);
          return (
            <line
              key={`l-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color}
              strokeWidth={2}
              opacity={0.1}
            />
          );
        })}
        
        {/* Dots */}
        {stats.map((stat, i) => {
          const x = i * spacing + dotSize/2;
          const y = graphHeight - (stat.height * graphHeight);
          const isToday = i === 6;
          const finalColor = isToday ? prayerColor : stat.color;

          return (
            <g key={`d-${i}`}>
              {/* Background mask to hide lines behind dots */}
              <circle cx={x} cy={y} r={dotSize / 2} fill={bgColor} />
              
              {isToday && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r={dotSize / 2}
                  fill={finalColor}
                  initial={{ opacity: 0.6, scale: 1 }}
                  animate={{ 
                    opacity: [0.6, 0],
                    scale: [1, 3]
                  }}
                  transition={{
                    duration: 2.5, 
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={dotSize / 2} // Consistent size for all dots
                fill={finalColor}
                opacity={isToday ? 1 : 0.3} 
              />
            </g>
          );
        })}
      </svg>
    </View>
  );
});
// --- End Mock Stats Data ---

export default function NamazWidget() {
  const { width } = useWindowDimensions(); 
  const { colorMode, isDark } = useContext(ThemeContext);

  const statusColors = colorMode === 'monochrome' ? MONOCHROME_STATUS_COLORS : VIBRANT_STATUS_COLORS;
  const bgColors = colorMode === 'minimal' ? MINIMAL_BG_COLORS : (colorMode === 'monochrome' ? MONOCHROME_BG_COLORS : VIBRANT_BG_COLORS);

  const getTextColor = (id: number) => {
    if (colorMode === 'monochrome' && (id === 2 || id === 3)) return '#ffffff';
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

  const [timeLeft, setTimeLeft] = useState(0);

  const [topDim, setTopDim] = useState({ w: 0, h: 0 });

  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  // States for back face icons
  const [icon1Color, setIcon1Color] = useState(false);
  const [icon2Color, setIcon2Color] = useState(false);
  const [icon3Color, setIcon3Color] = useState(false);
  const [icon4Color, setIcon4Color] = useState(false);

  const handleFlip = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg']
        })
      }
    ]
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg']
        })
      }
    ]
  };

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
    const timer = setInterval(() => {
      const now = new Date();
      const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      let nextPrayerId = prayersData[0].id;
      let timeDiff = 0;
      let found = false;

      for (let i = 0; i < prayersData.length; i++) {
        const parts = prayersData[i].time.split(':');
        const pSeconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60;

        if (pSeconds > currentSeconds) {
          nextPrayerId = prayersData[i].id;
          timeDiff = pSeconds - currentSeconds;
          found = true;
          break;
        }
      }

      if (!found) {
        // Next prayer is Fajr tomorrow
        const fajrParts = prayersData[0].time.split(':');
        const fajrSeconds = parseInt(fajrParts[0], 10) * 3600 + parseInt(fajrParts[1], 10) * 60;
        nextPrayerId = prayersData[0].id;
        timeDiff = (24 * 3600 - currentSeconds) + fajrSeconds;
      }

      setActiveId(nextPrayerId);
      setTimeLeft(timeDiff);
    }, 1000);

    return () => clearInterval(timer);
  }, [prayersData]);

  useEffect(() => {
    if (activeId === displayedActiveId) return;
    setDisplayedActiveId(activeId);
    setDisplayedSmall(prayersData.filter(p => p.id !== activeId));
  }, [activeId, displayedActiveId, prayersData]);

  // Sync displayed small when prayers data loads
  useEffect(() => {
    setDisplayedSmall(prayersData.filter(p => p.id !== displayedActiveId));
  }, [prayersData]);

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

  const topBlockExtraStretch = isMobile ? sy(15) : sy(25); 
  const gridVerticalPadding = gridInnerPaddingY * 0.9;
  const smallTimeFontSize = Math.min((widgetWidth / 2) * 0.21, s(44)) * 0.72;

  const radiusMultiplier = 0.72 * 0.7;
  const outerRadius = s(40) * radiusMultiplier;
  const topBlockRadius = s(28) * radiusMultiplier;
  const gridRectRadius = s(26) * radiusMultiplier;

  const topClockAvailWidth = widgetWidth - (widgetInnerPaddingX * 2) - (topBlockPaddingX * 2);
  const mainTimeFontSize = Math.min(topClockAvailWidth / 4.1, s(92)) * 0.8;

  const smallBlockAspectRatio = 1.4;
  const smallBlockWidth = (widgetWidth - (widgetInnerPaddingX * 2) - gridGapX) / 2;
  const smallBlockHeight = smallBlockWidth / smallBlockAspectRatio;
  const topBlockHeightMultiplier = 2; // Twice as long as small blocks
  const topBlockHeight = (smallBlockHeight * topBlockHeightMultiplier) + gridGapY;

  const fontFamily = Platform.OS === 'web' 
    ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
    : 'System';
  const monoFontFamily = Platform.OS === 'web' 
    ? '"Roboto Mono", monospace'
    : 'System';

  const TimerDisplay = ({ seconds, style }: { seconds: number, style: any }) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const sVar = seconds % 60;

    const pad = (n: number) => (n < 10 ? `0${n}` : n);

    return (
      <Text style={style} pointerEvents="none">
        {pad(h)}:{pad(m)}:{pad(sVar)}
      </Text>
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
          borderRadius: outerRadius 
        }
      ]}>
      <View 
        onLayout={(e) => setTopDim({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        style={{ zIndex: 10, position: 'relative' }}
      >
        <Animated.View style={[{ backfaceVisibility: 'hidden' as any }, frontAnimatedStyle, !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: s(4) }, shadowOpacity: 0.08, shadowRadius: s(10), elevation: 4, backgroundColor: 'transparent', borderRadius: topBlockRadius }]}>
        {(() => {
          const currentPrayer = prayersData.find(p => p.id === displayedActiveId) || prayersData[1];

          return (
            <View 
              style={[
                styles.topBlock, 
                { 
                  backgroundColor: bgColors[currentPrayer.id] || '#f1f1f6',
                  borderRadius: topBlockRadius,
                  overflow: 'hidden',
                  height: topBlockHeight,
                  borderWidth: 0.5,
                  borderColor: 'rgba(28, 28, 30, 0.03)'
                }
              ]}
            >
              <View 
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    paddingHorizontal: topBlockPaddingX,
                    paddingBottom: topBlockPaddingY * 1.5,
                    paddingTop: topBlockPaddingY,
                    zIndex: 0,
                  }
                ]}
              >
              <ScrollTransition

                current={currentPrayer}
                distance={sy(40)}
                renderItem={(prayer) => {
                  const IconCmp = prayer.Icon;
                  const statusColor = statusColors[prayer.id] || '#f7bc2e';
                  const txtColor = getTextColor(prayer.id);
                  return (
                    <View style={{ height: topBlockHeight - (topBlockPaddingY * 2.5) }}>
                      <View style={{ height: topBlockExtraStretch * 1.6 }} />

                      <View style={styles.bigSunIcon} pointerEvents="none">
                        <IconCmp color="#f7bc2e" fill="#f7bc2e" size={s(64)} strokeWidth={2} animated={true} />
                      </View>

                      <View style={{ position: 'absolute', bottom: s(54), left: 0 }}>
                        <Text style={{ 
                          fontFamily, 
                          fontSize: s(16), 
                          fontWeight: '600', 
                          color: txtColor, 
                          opacity: prayer.id === 0 ? 0.7 : 0,
                        }}>
                          Күннің шығуы:
                        </Text>
                      </View>

                      <View style={{ position: 'absolute', bottom: -s(8), left: 0 }}>
                        <TimerDisplay 
                          seconds={timeLeft} 
                          style={[styles.mainTimeText, { color: txtColor, fontSize: mainTimeFontSize * 0.72, fontFamily }]} 
                        />
                      </View>

                      <View style={styles.cityDateRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.cityText, { color: txtColor, fontFamily, fontSize: s(22) * 1.2, transform: [{ translateY: -s(8) }] }]}>{prayer.name}</Text>
                          <View style={{ width: s(8), height: s(8), borderRadius: s(4), backgroundColor: statusColor, marginLeft: s(10), transform: [{ translateY: -s(8) }] }} />
                        </View>
                      </View>

                      {/* Mini Statistics Graph */}
                      <View style={{ 
                        position: 'absolute', 
                        top: '55%', 
                        left: '50%', 
                        transform: [{ translateX: -s(105) }, { translateY: -s(40) }],
                        opacity: 0.9 
                      }}>
                        <PrayerMiniGraph 
                          prayerId={prayer.id} 
                          color={txtColor} 
                          prayerColor={statusColor}
                          bgColor={bgColors[prayer.id]}
                        />
                      </View>

                      <View style={{ height: (mainTimeFontSize * 0.72) + s(4) }} />
                    </View>
                  );
                }}
              />
              </View>

              <TouchableOpacity
                activeOpacity={0.95}
                onPress={handleFlip}
                style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
              />

              <TouchableOpacity
                style={[styles.bigSoundBtnLight, {
                  position: 'absolute',
                  bottom: s(16) + (topBlockPaddingY * 0.5),
                  right: topBlockPaddingX + s(12),
                  zIndex: 2,
                }]}
                activeOpacity={0.8}
                onPress={() => toggleMute(currentPrayer.id)}
              >
                {muteState[currentPrayer.id] ? (
                  <VolumeX color="#ef4444" size={s(20)} strokeWidth={2.5} />
                ) : (
                  <Volume2 color="#1c1c1e" size={s(20)} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>
          );
        })()}
        </Animated.View>

        <Animated.View 
          style={[
            { 
              backfaceVisibility: 'hidden' as any, 
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0 
            }, 
            backAnimatedStyle,
            !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: s(4) }, shadowOpacity: 0.08, shadowRadius: s(10), elevation: 4, backgroundColor: 'transparent', borderRadius: topBlockRadius }
          ]} 
          pointerEvents={isFlipped ? "auto" : "none"}
        >
          <View 
            style={[
              styles.topBlock, 
              { 
                backgroundColor: '#f1f1f6',
                paddingHorizontal: topBlockPaddingX,
                paddingBottom: topBlockPaddingY * 1.5,
                paddingTop: topBlockPaddingY,
                borderRadius: topBlockRadius,
                overflow: 'hidden',
                height: topBlockHeight,
                borderWidth: 0.5,
                borderColor: 'rgba(28, 28, 30, 0.03)',
                alignItems: 'center',
                justifyContent: 'center',
              }
            ]}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={handleFlip}
              style={StyleSheet.absoluteFill} 
            />
            <View pointerEvents="box-none" style={{ flex: 1, width: '100%', justifyContent: 'flex-start', paddingTop: s(16) }}>
              <View pointerEvents="box-none" style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%' }}>
                <UserIcon 
                  size={s(28)} 
                  color={icon1Color ? '#3b82f6' : (colorMode === 'vibrant' ? '#1c1c1e' : (isDark ? '#fff' : '#1c1c1e'))} 
                  onClick={() => setIcon1Color(!icon1Color)} 
                  containerStyle={{
                    flexDirection: 'row',
                    backgroundColor: icon1Color ? 'rgba(59, 130, 246, 0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                    borderRadius: s(16),
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: s(56),
                    height: s(56),
                  }}
                />
                <UsersIcon 
                  size={s(28)} 
                  color={icon2Color ? '#10b981' : (colorMode === 'vibrant' ? '#1c1c1e' : (isDark ? '#fff' : '#1c1c1e'))} 
                  onClick={() => setIcon2Color(!icon2Color)}
                  containerStyle={{
                    flexDirection: 'row',
                    backgroundColor: icon2Color ? 'rgba(16, 185, 129, 0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                    borderRadius: s(16),
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: s(56),
                    height: s(56),
                  }}
                />
                <TimerIcon 
                  size={s(28)} 
                  color={icon3Color ? '#ef4444' : (colorMode === 'vibrant' ? '#1c1c1e' : (isDark ? '#fff' : '#1c1c1e'))} 
                  onClick={() => setIcon3Color(!icon3Color)}
                  containerStyle={{
                    flexDirection: 'row',
                    backgroundColor: icon3Color ? 'rgba(239, 68, 68, 0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                    borderRadius: s(16),
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: s(56),
                    height: s(56),
                  }}
                />
                <XIcon 
                  size={s(28)} 
                  color={icon4Color ? (isDark ? '#fff' : '#1c1c1e') : (colorMode === 'vibrant' ? '#1c1c1e' : (isDark ? '#fff' : '#1c1c1e'))} 
                  onClick={() => setIcon4Color(!icon4Color)}
                  containerStyle={{
                    flexDirection: 'row',
                    backgroundColor: icon4Color ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(28, 28, 30, 0.15)') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                    borderRadius: s(16),
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: s(56),
                    height: s(56),
                  }}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={{ height: gridGapY }} />

      <View style={[styles.gridRow, { columnGap: gridGapX }]}>
        
        <View style={[styles.gridCol, { rowGap: gridGapY }]}>
          {[0, 2].map((idx) => {
            const currentPrayer = displayedSmall[idx];
            if (!currentPrayer) return null;

            return (
              <View key={`left-${currentPrayer.id}`}>
                <View 
                  style={[
                    styles.cardLight, 
                    { 
                      backgroundColor: bgColors[currentPrayer.id] || '#f1f1f6', 
                      borderRadius: gridRectRadius, 
                      aspectRatio: 1.4, 
                      overflow: 'hidden',
                      borderWidth: 0.5,
                      borderColor: 'rgba(28, 28, 30, 0.03)'
                    }
                  ]}
                >
                  <TouchableOpacity activeOpacity={0.9} style={StyleSheet.absoluteFill} />
                  <View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { paddingHorizontal: gridInnerPaddingX, paddingVertical: gridVerticalPadding }]}
                  >
                  <ScrollTransition
                    current={currentPrayer}
                    distance={sy(30)}
                    renderItem={(prayer) => {
                      const IconCmp = prayer.Icon;
                      const statusColor = statusColors[prayer.id] || "#f7bc2e";
                      const txtColor = getTextColor(prayer.id);
                      return (
                        <View style={{ height: smallBlockHeight - (gridVerticalPadding * 2) }}>
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
                  </View>
                  
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
                          <Volume2 color="#1c1c1e" size={s(14)} strokeWidth={2.5} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.gridCol, { rowGap: gridGapY }]}>
          {[1, 3].map((idx) => {
            const currentPrayer = displayedSmall[idx];
            if (!currentPrayer) return null;

            return (
              <View key={`right-${currentPrayer.id}`}>
                <View 
                  style={[
                    styles.cardLight, 
                    { 
                      backgroundColor: bgColors[currentPrayer.id] || '#f1f1f6', 
                      borderRadius: gridRectRadius, 
                      aspectRatio: 1.4, 
                      overflow: 'hidden',
                      borderWidth: 0.5,
                      borderColor: 'rgba(28, 28, 30, 0.03)'
                    }
                  ]}
                >
                  <TouchableOpacity activeOpacity={0.9} style={StyleSheet.absoluteFill} />
                  <View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { paddingHorizontal: gridInnerPaddingX, paddingVertical: gridVerticalPadding }]}
                  >
                  <ScrollTransition
                    current={currentPrayer}
                    distance={sy(30)}
                    renderItem={(prayer) => {
                      const IconCmp = prayer.Icon;
                      const statusColor = statusColors[prayer.id] || "#f7bc2e";
                      const txtColor = getTextColor(prayer.id);
                      return (
                        <View style={{ height: smallBlockHeight - (gridVerticalPadding * 2) }}>
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
                  </View>
                  
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
                          <Volume2 color="#1c1c1e" size={s(14)} strokeWidth={2.5} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
        
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.locateBtn, { marginTop: s(24) }]} 
        onPress={handleLocate}
        disabled={isLocating}
      >
        <MapPin color="#1c1c1e" size={s(20)} strokeWidth={2.5} />
        <Text style={[styles.locateText, { fontFamily }]}>
          {isLocating ? 'Орын анықталуда...' : 'Орнымды анықтау'}
        </Text>
      </TouchableOpacity>
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
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
});

