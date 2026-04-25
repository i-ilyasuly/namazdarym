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

  // Animation values
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
      // Reset animation state for new content
      translateXAnim.setValue(0);
      textWidthRef.current = 0; // Force re-measure
    });
  }, [currentChapter]);

  // Combine verses: Arabic reads right-to-left
  const combinedText = verses.map(v => `${v.text_uthmani} ﴿${v.number}﴾`).join('   ۞   ');

  // Animation logic
  useEffect(() => {
    if (isLoading || verses.length === 0) return;

    const startTicker = () => {
      if (!isPlaying) {
        translateXAnim.stopAnimation();
        return;
      }

      // We wait for layouts to be measured. If not measured yet, retry shortly.
      if (textWidthRef.current === 0 || containerWidthRef.current === 0) {
        setTimeout(startTicker, 100);
        return;
      }

      const totalDistance = textWidthRef.current + containerWidthRef.current;
      
      // Start from the right edge of the container
      translateXAnim.setValue(containerWidthRef.current);
      
      animationRef.current = Animated.timing(translateXAnim, {
        toValue: -textWidthRef.current, // Exit through the left edge
        duration: totalDistance * 25, // 25ms per pixel
        easing: Easing.linear,
        useNativeDriver: true,
      });

      animationRef.current.start(({ finished }) => {
        if (finished && isPlaying) {
          startTicker();
        }
      });
    };

    startTicker();

    return () => {
      if (animationRef.current) animationRef.current.stop();
    };
  }, [combinedText, isPlaying, isLoading]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1c1c1e' : '#f8f8fa' }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#1c1c1e' }]}>Quran Stream</Text>
          <Text style={styles.subtitle}>Surah {currentChapter}</Text>
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
            onLayout={e => { 
                containerWidthRef.current = e.nativeEvent.layout.width;
            }}
          >
            <Animated.View 
              style={[
                styles.scrollingContent,
                { transform: [{ translateX: translateXAnim }] }
              ]}
              onLayout={e => { 
                textWidthRef.current = e.nativeEvent.layout.width;
              }}
            >
              <Text style={[styles.verseText, { color: isDark ? '#e5e5ea' : '#333' }]}>
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
    height: 80,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  scrollingContent: {
    position: 'absolute',
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
