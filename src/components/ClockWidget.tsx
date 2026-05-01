import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');
const CLOCK_SIZE = Math.min(width - 60, 320);
const RADIUS = CLOCK_SIZE / 2;
const CENTER_X = RADIUS;
const CENTER_Y = RADIUS;

interface Prayer {
  id: number;
  name: string;
  time: string;
}

export default function ClockWidget() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const d = new Date();
        const year = d.getFullYear();
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        const todayStr = `${year}-${monthStr}-${dayStr}`;
        
        const lat = 51.133333; // Default Astana
        const lng = 71.433333;

        const url = `/api/prayer-times?year=${year}&lat=${lat}&lng=${lng}`;
        const response = await axios.get(url, { timeout: 25000 });
        const data = response.data;

        if (data && data.result && Array.isArray(data.result)) {
          const todayData = data.result.find((d: any) => d.Date === todayStr);
          if (todayData) {
            setPrayers([
              { id: 0, name: 'Таң', time: todayData.fajr },
              { id: 1, name: 'Бесін', time: todayData.dhuhr },
              { id: 2, name: 'Екінті', time: todayData.asr },
              { id: 3, name: 'Шам', time: todayData.maghrib },
              { id: 4, name: 'Құптан', time: todayData.isha },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch prayer times for clock", err);
      }
    };

    fetchPrayerTimes();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getAngle = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return ((h % 12) + m / 60) * 30; // 30 degrees per hour
  };

  // Pre-calculate positions
  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const isHour = i % 5 === 0;
      const angle = i * 6; // 6 degrees per minute
      
      const tickLength = isHour ? 12 : 6;
      const tickWidth = isHour ? 2 : 1;
      const tickColor = isHour ? '#8e8e93' : '#e5e5ea';
      
      ticks.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CLOCK_SIZE,
            height: CLOCK_SIZE,
            transform: [{ rotate: `${angle}deg` }],
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <View style={{ width: tickWidth, height: tickLength, backgroundColor: tickColor, marginTop: 10 }} />
        </View>
      );
    }
    return ticks;
  };

  const getPrayerColor = (name: string) => {
    switch (name) {
      case 'Таң':
      case 'Құптан': return '#10b981';
      case 'Бесін': return '#3b82f6';
      case 'Екінті': return '#ef4444';
      case 'Шам': return '#1c1c1e';
      default: return '#1c1c1e';
    }
  };

  const renderPrayerHands = () => {
    // Determine next prayer
    const nowStr = currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let nextPrayerIndex = prayers.findIndex(p => p.time > nowStr);
    if (nextPrayerIndex === -1 && prayers.length > 0) nextPrayerIndex = 0; // wrap around to tomorrow's fajr

    return prayers.map((prayer, index) => {
      const angle = getAngle(prayer.time);
      const isActive = index === nextPrayerIndex;
      const pillColor = getPrayerColor(prayer.name);
      const lineColor = '#1c1c1e';
      const textColor = '#ffffff';

      // To keep text readable, if angle is between 180 and 360 (pointing to the left half of the clock)
      // we flip the text 180 deg inside.
      const isUpsideDown = angle > 180 && angle < 360;
      
      const handLength = RADIUS - 10; // hand goes to the edge near numbers
      const lineThickness = 2;

      return (
        <View
          key={prayer.id}
          style={{
            position: 'absolute',
            top: CENTER_Y - 10,
            left: CENTER_X - handLength, // start from left edge to span 2x
            width: handLength * 2, // 2x so center is exactly at CENTER_X
            height: 20,
            transform: [
              { rotate: `${angle - 90}deg` }
            ],
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: isActive ? 50 : 10,
          } as any}
        >
          {/* We only draw on the RIGHT half of the container. The left half is empty. */}
          <View style={{ width: handLength }} />
          
          <View style={{ width: handLength, flexDirection: 'row', alignItems: 'center' }}>
            {/* Line segment from center - now fixed to lineColor (black) */}
            <View style={{ flex: 1, height: lineThickness, backgroundColor: lineColor }} />
            
            {/* Pill label positioned at the outer end - remains in prayer color */}
            <View style={{
              backgroundColor: pillColor,
              flexDirection: 'row',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              transform: isUpsideDown ? [{ rotate: '180deg' }] : [],
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ color: textColor, fontSize: 10, fontWeight: '700', marginRight: 4 }}>
                {prayer.name}
              </Text>
              <Text style={{ color: isActive ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '500' }}>
                {prayer.time}
              </Text>
            </View>
          </View>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clock</Text>
      
      <View style={styles.clockContainer}>
        {/* Outline */}
        <View style={styles.clockCircle}>
          {renderTicks()}
          
          {/* Numbers inside the ticks */}
          {[12, 3, 6, 9].map((num) => {
            const angle = num === 12 ? 0 : num === 3 ? 90 : num === 6 ? 180 : 270;
            return (
              <View
                key={num}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: CLOCK_SIZE,
                  height: CLOCK_SIZE,
                  transform: [{ rotate: `${angle}deg` }],
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                <View style={{ marginTop: 26, transform: [{ rotate: `-${angle}deg` }] }}>
                  <Text style={styles.number}>{num}</Text>
                </View>
              </View>
            );
          })}

          {renderPrayerHands()}

          {/* Current Time Hands */}
          {(() => {
            const h = currentTime.getHours();
            const m = currentTime.getMinutes();
            const s = currentTime.getSeconds();
            
            const hourAngle = ((h % 12) + m / 60) * 30;
            const minuteAngle = m * 6;
            const secondAngle = s * 6;

            return (
              <>
                {/* Hour Hand */}
                <View style={{
                  position: 'absolute',
                  top: CENTER_Y - 3,
                  left: CENTER_X - (RADIUS - 80),
                  width: (RADIUS - 80) * 2,
                  height: 6,
                  transform: [{ rotate: `${hourAngle - 90}deg` }],
                  flexDirection: 'row',
                  alignItems: 'center',
                  zIndex: 200,
                }}>
                  <View style={{ width: RADIUS - 80 }} />
                  <View style={{ width: RADIUS - 80, height: 6, backgroundColor: '#1c1c1e', borderRadius: 3 }} />
                </View>

                {/* Minute Hand */}
                <View style={{
                  position: 'absolute',
                  top: CENTER_Y - 2,
                  left: CENTER_X - (RADIUS - 40),
                  width: (RADIUS - 40) * 2,
                  height: 4,
                  transform: [{ rotate: `${minuteAngle - 90}deg` }],
                  flexDirection: 'row',
                  alignItems: 'center',
                  zIndex: 201,
                }}>
                  <View style={{ width: RADIUS - 40 }} />
                  <View style={{ width: RADIUS - 40, height: 4, backgroundColor: '#1c1c1e', borderRadius: 2 }} />
                </View>

                {/* Second Hand */}
                <View style={{
                  position: 'absolute',
                  top: CENTER_Y - 1,
                  left: CENTER_X - (RADIUS - 20),
                  width: (RADIUS - 20) * 2,
                  height: 2,
                  transform: [{ rotate: `${secondAngle - 90}deg` }],
                  flexDirection: 'row',
                  alignItems: 'center',
                  zIndex: 202,
                }}>
                  {/* Tail of second hand: we can make it extend a bit backward */}
                  <View style={{ width: RADIUS - 20, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                     <View style={{ width: 20, height: 2, backgroundColor: '#ff9500' }} />
                  </View>
                  <View style={{ width: RADIUS - 20, height: 2, backgroundColor: '#ff9500' }} />
                </View>
              </>
            );
          })()}

        {/* Current Time Hand Center */}
          <View style={styles.centerPoint} />
        </View>
      </View>

      <View style={styles.footerInfo}>
        <View style={styles.timeTravelContainer}>
          <Text style={styles.digitalTime}>
            {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </Text>
          <Text style={styles.resetText}>Қазір</Text>
        </View>

        {/* Fake slider to mimic video */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>-12h</Text>
          <View style={styles.sliderTrack}>
            <View style={styles.sliderThumb} />
          </View>
          <Text style={styles.sliderLabel}>+12h</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    alignSelf: 'flex-start',
    marginBottom: 40,
  },
  clockContainer: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  clockCircle: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    borderWidth: 0,
    backgroundColor: '#ffffff',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  number: {
    fontSize: 20,
    fontWeight: '400',
    color: '#8e8e93',
  },
  centerPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff9500',
    top: CENTER_Y - 3,
    left: CENTER_X - 3,
    zIndex: 300,
  },
  footerInfo: {
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f7',
  },
  timeTravelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  digitalTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ff9500',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    color: '#c7c7cc',
    fontSize: 12,
    fontWeight: '600',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#f2f2f7',
    borderRadius: 2,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  sliderThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'center',
  }
});
