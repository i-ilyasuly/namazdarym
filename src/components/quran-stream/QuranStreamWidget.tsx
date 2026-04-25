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
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Fetch when chapter changes
  useEffect(() => {
    if (!currentChapter) return;
    setIsLoading(true);
    fetchChapterVerses(currentChapter).then(data => {
      setVerses(data);
      setIsLoading(false);
      // Reset widths to force re-measure if content changes significantly
      setTextWidth(0); 
    });
  }, [currentChapter]);

  // Combined text: Sequence 1, 2, 3... but for LTR movement we reverse to have V1 as lead
  const combinedText = verses.map(v => `${v.text_uthmani} ﴿${v.number}﴾`).join('   ۞   ');

  // Animation Loop logic
  useEffect(() => {
    // Only start if we have all dimensions and are playing
    if (isLoading || verses.length === 0 || textWidth <= 0 || containerWidth <= 0 || !isPlaying) {
      translateX.stopAnimation();
      return;
    }

    const totalDistance = textWidth + containerWidth;
    const duration = totalDistance * 25; // 25ms per pixel (speed)

    const startTicker = () => {
      // Ensure we start from current container width (right edge)
      translateX.setValue(containerWidth);
      
      const animation = Animated.timing(translateX, {
        toValue: -textWidth,
        duration: (textWidth + containerWidth) * 25,
        easing: Easing.linear,
        useNativeDriver: true,
      });

      animationRef.current = animation;
      animation.start(({ finished }) => {
        if (finished && isPlaying) {
          startTicker();
        }
      });
    };

    startTicker();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      translateX.stopAnimation();
    };
  }, [combinedText, isPlaying, isLoading, textWidth, containerWidth]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1c1c1e' : '#f8f8fa' }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#1c1c1e' }]}>Quran Stream</Text>
          <Text style={{ fontSize: 11, color: '#8e8e93' }}>Surah {currentChapter}</Text>
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
                const w = e.nativeEvent.layout.width;
                if (w > 0 && w !== containerWidth) setContainerWidth(w);
            }}
          >
            {/* Hidden Measurement View */}
            <View 
              style={[styles.scrollingContent, { opacity: 0, position: 'absolute', top: -1000 }]}
              onLayout={e => { 
                const w = e.nativeEvent.layout.width;
                if (w > 0 && w !== textWidth) setTextWidth(w);
              }}
            >
              <Text style={[styles.verseText, { whiteSpace: 'nowrap' } as any]}>{combinedText}</Text>
            </View>

            {/* Visible Animated View */}
            <Animated.View 
              style={[
                styles.scrollingContent,
                { position: 'absolute', transform: [{ translateX }] }
              ]}
            >
              <Text style={[styles.verseText, { color: isDark ? '#e5e5ea' : '#333', whiteSpace: 'nowrap' } as any]}>
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
  playButton: {
    padding: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    // We set position absolute in the component inline styles
  },
  verseText: {
    fontSize: 26,
    fontFamily: '"Amiri Quran", "Amiri", serif',
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
