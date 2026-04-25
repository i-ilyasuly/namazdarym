import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { Sun, Volume2, VolumeX, Eclipse, Sunset, SunDim, MoonStar } from 'lucide-react';

const SC = 0.7; // 30% scale reduction base
const s = (v: number) => v * SC;
const sy = (v: number) => s(v) * 0.75; // Additional 25% vertical scale reduction

export default function HomeScreen() {
  const { width, height } = useWindowDimensions(); // Grab height for exact centering
  // To avoid unmount issues when switching tabs, we use states
  const [isMuted, setIsMuted] = useState(false);
  const [isMuted1, setIsMuted1] = useState(false);
  const [isMuted2, setIsMuted2] = useState(false);
  const [isMuted3, setIsMuted3] = useState(false);
  const [isMuted4, setIsMuted4] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(8 * 3600 + 15 * 60 + 40); // 08:15:40
  
  const spinValue = useRef(new Animated.Value(0)).current;
  
  // Animation values for each card
  const scaleTop = useRef(new Animated.Value(1)).current;
  const scaleCard1 = useRef(new Animated.Value(1)).current;
  const scaleCard2 = useRef(new Animated.Value(1)).current;
  const scaleCard3 = useRef(new Animated.Value(1)).current;
  const scaleCard4 = useRef(new Animated.Value(1)).current;

  const handlePressIn = (val: Animated.Value) => {
    Animated.spring(val, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = (val: Animated.Value) => {
    Animated.spring(val, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Determine actual rendered widths based on screen
  const maxContainerWidth = 600;
  const isMobile = width < 500;
  const screenPadding = isMobile ? 16 : 32;
  
  // Exact width of the white widget, scaled down 30%
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

  // Task 6: top block extra vertical height
  const topBlockExtraStretch = isMobile ? sy(15) : sy(25); 

  // Task 4: small rectangles vertical padding
  const gridVerticalPadding = gridInnerPaddingY * 0.9;

  // Task 3: small times font size reduced 10%
  const smallTimeFontSize = Math.min((widgetWidth / 2) * 0.21, s(44)) * 0.72;

  // Task 1: Reduce all border radiuses 
  const radiusMultiplier = 0.72 * 0.7; // Base 0.72 times another 0.7 (approx another 30%)
  const outerRadius = s(40) * radiusMultiplier;
  const topBlockRadius = s(28) * radiusMultiplier;
  const gridRectRadius = s(26) * radiusMultiplier;

  // Calculate top text sizing
  const topClockAvailWidth = widgetWidth - (widgetInnerPaddingX * 2) - (topBlockPaddingX * 2);
  const mainTimeFontSize = Math.min(topClockAvailWidth / 4.1, s(92));

  // Font Stack
  const fontFamily = Platform.OS === 'web' 
    ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
    : 'System';

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const sVar = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sVar.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.scrollContent, { minHeight: height - 80 }]} // Leave space for nav
      showsVerticalScrollIndicator={false}
    >
      <View style={[
        styles.widgetContainer, 
        { 
          paddingHorizontal: widgetInnerPaddingX, 
          paddingVertical: widgetInnerPaddingY,
          width: widgetWidth, 
          borderRadius: outerRadius 
        }
      ]}>
        
        {/* Top Gray Set */}
        <Animated.View style={{ transform: [{ scale: scaleTop }] }}>
          <Pressable 
            onPressIn={() => handlePressIn(scaleTop)}
            onPressOut={() => handlePressOut(scaleTop)}
            style={[
              styles.topBlock, 
              { 
                paddingHorizontal: topBlockPaddingX,
                paddingBottom: topBlockPaddingY,
                paddingTop: topBlockPaddingY,
                borderRadius: topBlockRadius,
              }
            ]}
          >
            
            {/* Stretch spacer to keep the vertical height longer */}
            <View style={{ height: topBlockExtraStretch }} />

            {/* Big Sun Icon in top right */}
            <Animated.View style={[styles.bigSunIcon, { transform: [{ rotate: spin }] }]} pointerEvents="none">
              <Sun color="#f7bc2e" fill="#f7bc2e" size={s(56)} strokeWidth={2} />
            </Animated.View>

            {/* Time Details Row */}
            <View style={styles.cityDateRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.cityText, { fontFamily, fontSize: s(22) * 1.2, transform: [{ translateY: -s(8) }] }]}>Бесін</Text>
                <TouchableOpacity 
                  style={styles.soundButton} 
                  activeOpacity={0.8}
                  onPress={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX color="#ef4444" size={s(16)} strokeWidth={2.5} />
                  ) : (
                    <Volume2 color="#1c1c1e" size={s(16)} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Time: Moved down effectively by increasing marginTop */}
            <Text 
              style={[styles.mainTimeText, { fontSize: mainTimeFontSize, fontFamily, marginTop: s(60) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatTime(timeLeft)}
            </Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: gridGapY }} />

        {/* Grid 2-Column Layout */}
        <View style={[styles.gridRow, { columnGap: gridGapX }]}>
          
          {/* LEFT COLUMN */}
          <View style={[styles.gridCol, { rowGap: gridGapY }]}>
            {/* London -> Таң */}
            <Animated.View style={{ transform: [{ scale: scaleCard1 }] }}>
              <Pressable 
                onPressIn={() => handlePressIn(scaleCard1)}
                onPressOut={() => handlePressOut(scaleCard1)}
                style={[
                  styles.cardLight, 
                  { paddingHorizontal: gridInnerPaddingX, paddingVertical: gridVerticalPadding, borderRadius: gridRectRadius, aspectRatio: 1.4 }
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardCityLight, { fontFamily }]} numberOfLines={1}>Таң</Text>
                  <Eclipse color="#f7bc2e" fill="#f7bc2e" size={s(32)} />
                </View>
                <View style={{ flex: 1 }} />
                <View style={styles.cardFooter}>
                  <Text style={[styles.cardTimeLight, { fontSize: smallTimeFontSize, fontFamily }]} adjustsFontSizeToFit numberOfLines={1}>06:15</Text>
                  <TouchableOpacity 
                    style={styles.smallSoundBtnLight}
                    activeOpacity={0.8}
                    onPress={() => setIsMuted1(!isMuted1)}
                  >
                    {isMuted1 ? (
                      <VolumeX color="#ef4444" size={s(14)} strokeWidth={2.5} />
                    ) : (
                      <Volume2 color="#1c1c1e" size={s(14)} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Animated.View>

            {/* Tokyo -> Шам */}
            <Animated.View style={{ transform: [{ scale: scaleCard2 }] }}>
              <Pressable 
                onPressIn={() => handlePressIn(scaleCard2)}
                onPressOut={() => handlePressOut(scaleCard2)}
                style={[
                  styles.cardLight, 
                  { paddingHorizontal: gridInnerPaddingX, paddingVertical: gridVerticalPadding, borderRadius: gridRectRadius, aspectRatio: 1.4 }
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardCityLight, { fontFamily }]} numberOfLines={1}>Шам</Text>
                  <Sunset color="#f7bc2e" fill="#f7bc2e" size={s(32)} />
                </View>
                <View style={{ flex: 1 }} />
                <View style={styles.cardFooter}>
                  <Text style={[styles.cardTimeLight, { fontSize: smallTimeFontSize, fontFamily }]} adjustsFontSizeToFit numberOfLines={1}>14:15</Text>
                  <TouchableOpacity 
                    style={styles.smallSoundBtnLight}
                    activeOpacity={0.8}
                    onPress={() => setIsMuted2(!isMuted2)}
                  >
                    {isMuted2 ? (
                      <VolumeX color="#ef4444" size={s(14)} strokeWidth={2.5} />
                    ) : (
                      <Volume2 color="#1c1c1e" size={s(14)} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Animated.View>
          </View>

          {/* RIGHT COLUMN */}
          <View style={[styles.gridCol, { rowGap: gridGapY }]}>
            {/* New York -> Екінті */}
            <Animated.View style={{ transform: [{ scale: scaleCard3 }] }}>
              <Pressable 
                onPressIn={() => handlePressIn(scaleCard3)}
                onPressOut={() => handlePressOut(scaleCard3)}
                style={[
                  styles.cardDark, 
                  { paddingHorizontal: gridInnerPaddingX, paddingVertical: gridVerticalPadding, borderRadius: gridRectRadius, aspectRatio: 1.4 }
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardCityDark, { fontFamily }]} numberOfLines={1}>Екінті</Text>
                  <SunDim color="#f7bc2e" fill="#f7bc2e" size={s(32)} />
                </View>
                <View style={{ flex: 1 }} />
                <View style={styles.cardFooter}>
                  <Text style={[styles.cardTimeDark, { fontSize: smallTimeFontSize, fontFamily }]} adjustsFontSizeToFit numberOfLines={1}>01:15</Text>
                  <TouchableOpacity 
                    style={styles.smallSoundBtnDark}
                    activeOpacity={0.8}
                    onPress={() => setIsMuted3(!isMuted3)}
                  >
                    {isMuted3 ? (
                      <VolumeX color="#ef4444" size={s(14)} strokeWidth={2.5} />
                    ) : (
                      <Volume2 color="#ffffff" size={s(14)} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Animated.View>

            {/* Los Angeles -> Құптан */}
            <Animated.View style={{ transform: [{ scale: scaleCard4 }] }}>
              <Pressable 
                onPressIn={() => handlePressIn(scaleCard4)}
                onPressOut={() => handlePressOut(scaleCard4)}
                style={[
                  styles.cardDark, 
                  { paddingHorizontal: gridInnerPaddingX, paddingVertical: gridVerticalPadding, borderRadius: gridRectRadius, aspectRatio: 1.4 }
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardCityDark, { fontFamily }]} numberOfLines={1}>Құптан</Text>
                  <MoonStar color="#f7bc2e" fill="#f7bc2e" size={s(32)} />
                </View>
                <View style={{ flex: 1 }} />
                <View style={styles.cardFooter}>
                  <Text style={[styles.cardTimeDark, { fontSize: smallTimeFontSize, fontFamily }]} adjustsFontSizeToFit numberOfLines={1}>22:15</Text>
                  <TouchableOpacity 
                    style={styles.smallSoundBtnDark}
                    activeOpacity={0.8}
                    onPress={() => setIsMuted4(!isMuted4)}
                  >
                    {isMuted4 ? (
                      <VolumeX color="#ef4444" size={s(14)} strokeWidth={2.5} />
                    ) : (
                      <Volume2 color="#ffffff" size={s(14)} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Animated.View>
          </View>
          
        </View>
      </View>
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

  widgetContainer: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: s(24) },
    shadowOpacity: 0.12,
    shadowRadius: s(56),
    elevation: 8,
  },

  topBlock: {
    backgroundColor: '#f1f1f6',
    position: 'relative',
  },
  
  bigSunIcon: {
    position: 'absolute',
    top: s(24),
    right: s(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundButton: {
    zIndex: 10,
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: s(2) },
    shadowOpacity: 0.05,
    shadowRadius: s(6),
    elevation: 3,
    marginLeft: s(12),
    transform: [{ translateY: -s(8) }],
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
  smallSoundBtnDark: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: '#303036',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: s(2) },
    shadowOpacity: 0.2,
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
    backgroundColor: '#f1f1f6',
  },
  cardDark: {
    backgroundColor: '#1b1b1e', 
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
  cardCityDark: {
    fontSize: s(16),
    fontWeight: '500',
    color: '#ffffff',
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
  cardTimeDark: {
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: s(-1),
  },
});
