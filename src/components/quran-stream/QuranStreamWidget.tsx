import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { CirclePlay, CirclePause, ChevronDown } from 'lucide-react';
import { useLocalStorage } from 'react-use';
import { fetchChapterVerses, VerseItem } from './quranApi';
import { ThemeContext } from '../../screens/TestScreen';

export default function QuranStreamWidget() {
  const { isDark } = useContext(ThemeContext);
  
  const [currentChapter, setCurrentChapter] = useLocalStorage<number>('quran_chapter', 1);
  const [verses, setVerses] = useState<VerseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const positionRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const contentHeightRef = useRef(0);
  const containerHeightRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch verses when chapter changes
  useEffect(() => {
    if (!currentChapter) return;
    setIsLoading(true);
    fetchChapterVerses(currentChapter).then(data => {
      setVerses(data);
      setIsLoading(false);
      // Reset scroll position on new chapter
      positionRef.current = 0;
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: 0, animated: false });
      }
    });
  }, [currentChapter]);

  const startScroll = () => {
    const scroll = () => {
      if (!isUserScrollingRef.current && isPlaying) {
        const maxScroll = contentHeightRef.current - containerHeightRef.current;
        
        if (positionRef.current < maxScroll) {
          positionRef.current += 0.5; // Smooth speed
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ y: positionRef.current, animated: false });
          }
        } else {
          // Reached the end, stop
          setIsPlaying(false);
          return;
        }
      }
      animFrameRef.current = requestAnimationFrame(scroll);
    };
    
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(scroll);
  };

  const stopScroll = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying && !isLoading) {
      startScroll();
    } else {
      stopScroll();
    }
    return () => stopScroll();
  }, [isPlaying, isLoading]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    
    // If it's a significant jump (user manual scroll)
    if (Math.abs(y - positionRef.current) > 5) {
      isUserScrollingRef.current = true;
      positionRef.current = y;

      if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
      userScrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1500); // Resume auto-scroll after 1.5s of inactivity
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1c1c1e' : '#fff' }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#1c1c1e' }]}>Quran Stream</Text>
          <Text style={styles.subtitle}>Chapter {currentChapter}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setIsPlaying(!isPlaying)}
          style={styles.playButton}
        >
          {isPlaying ? (
            <CirclePause size={32} color="#10b981" />
          ) : (
            <CirclePlay size={32} color="#10b981" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.scrollContainer}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={(_, h) => {
              contentHeightRef.current = h;
            }}
            onLayout={(e) => {
              containerHeightRef.current = e.nativeEvent.layout.height;
            }}
          >
            {verses.map((verse) => (
              <View key={verse.id} style={styles.verseItem}>
                <Text style={[styles.verseText, { color: isDark ? '#e5e5ea' : '#1c1c1e' }]}>
                  {verse.text_uthmani} <Text style={styles.verseNumber}>﴿{verse.number}﴾</Text>
                </Text>
              </View>
            ))}
          </ScrollView>
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
    height: 400,
    borderWidth: 0.5,
    borderColor: 'rgba(28, 28, 30, 0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(28, 28, 30, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
  },
  playButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  verseItem: {
    marginBottom: 24,
  },
  verseText: {
    fontFamily: '"Amiri Quran", "Amiri", serif',
    fontSize: 26,
    lineHeight: 48,
    textAlign: 'right',
  },
  verseNumber: {
    fontSize: 18,
    color: '#10b981',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});



