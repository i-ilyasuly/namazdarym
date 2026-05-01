import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { CirclePlay, CirclePause } from 'lucide-react';
import { useLocalStorage } from 'react-use';
import { fetchChapterVerses, VerseItem } from './quranApi';
import { ThemeContext } from '../../screens/TestScreen';

export default function QuranStreamWidget() {
  const { isDark } = useContext(ThemeContext);
  
  const [currentChapter] = useLocalStorage<number>('quran_chapter', 1);
  const [verses, setVerses] = useState<VerseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  // Animation values - Essential for GPU-accelerated translateX
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const textWidthRef = useRef(0);
  const containerWidthRef = useRef(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Fetch when chapter changes
  useEffect(() => {
    if (!currentChapter) return;
    setIsLoading(true);
    fetchChapterVerses(currentChapter).then(data => {
      setVerses(data);
      setIsLoading(false);
      // Reset measurements and animation
      textWidthRef.current = 0;
      setMeasuredCount(prev => prev + 1);
    });
  }, [currentChapter]);

  // Combine verses into one single text line
  const combinedText = verses.map(v => `${v.text_uthmani} ﴿${v.number}﴾`).join('   ۞   ');

  // Animation logic using translateX for maximum performance
  useEffect(() => {
    if (isLoading || verses.length === 0 || !isPlaying) {
      if (animationRef.current) animationRef.current.stop();
      return;
    }

    let isCancelled = false;

    const startTicker = () => {
      if (isCancelled) return;

      // Ensure we have dimensions before starting
      if (textWidthRef.current === 0 || containerWidthRef.current === 0) {
        // Retry shortly if layout isn't measured yet
        setTimeout(startTicker, 200);
        return;
      }

      const totalDistance = textWidthRef.current + containerWidthRef.current;
      
      // Arabic flows Right-To-Left.
      translateXAnim.setValue(-textWidthRef.current);
      
      const anim = Animated.timing(translateXAnim, {
        toValue: containerWidthRef.current, // Exit through the right edge
        duration: totalDistance * 20,  // Faster duration so we can see it moving
        easing: Easing.linear,
        useNativeDriver: true,         
      });

      animationRef.current = anim;
      anim.start(({ finished }) => {
        if (finished && !isCancelled && isPlaying) {
          startTicker(); // Re-trigger for continuous loop
        }
      });
    };

    startTicker();

    return () => {
      isCancelled = true;
      if (animationRef.current) animationRef.current.stop();
    };
  }, [combinedText, isPlaying, isLoading]); // Removed measuredCount dependency

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1c1c1e' : '#f8f8fa' }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#1c1c1e' }]}>Құран ағыны</Text>
          <Text style={styles.subtitle}>{currentChapter}-ші сүре</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setIsPlaying(!isPlaying)}
          style={styles.playButton}
        >
          {isPlaying ? (
            <CirclePause size={28} color="#10b981" />
          ) : (
            <CirclePlay size={28} color="#10b981" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.streamWrapper}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color="#10b981" />
          </View>
        ) : (
          <View 
            style={styles.tickerContainer}
            onLayout={(e) => { 
                const w = e.nativeEvent.layout.width;
                if (w > 0) {
                  containerWidthRef.current = w;
                }
            }}
          >
            <Animated.View 
              style={[
                styles.scrollingText,
                { transform: [{ translateX: translateXAnim }] }
              ]}
            >
              <Text 
                numberOfLines={1}
                style={[styles.verseText, { color: isDark ? '#e5e5ea' : '#333' }]}
                onLayout={(e) => { 
                  const w = e.nativeEvent.layout.width;
                  if (w > 0) {
                    textWidthRef.current = w;
                  }
                }}
              >
                {combinedText}
              </Text>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    height: 140,
    borderWidth: 0.5,
    borderColor: 'rgba(28, 28, 30, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(28, 28, 30, 0.1)',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 11,
    color: '#8e8e93',
  },
  playButton: {
    padding: 2,
  },
  streamWrapper: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 80,
  },
  tickerContainer: {
    width: '100%',
    height: 60,
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scrollingText: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verseText: {
    fontSize: 26,
    fontFamily: '"Amiri Quran", "Amiri", serif',
    textAlign: 'right',
    writingDirection: 'rtl',
    whiteSpace: 'nowrap',
    paddingHorizontal: 20,
  } as any,
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
