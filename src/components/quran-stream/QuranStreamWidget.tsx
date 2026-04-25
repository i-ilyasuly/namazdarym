import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CirclePlay, CirclePause } from 'lucide-react';
import { useLocalStorage } from 'react-use';
import { fetchChapterVerses, VerseItem } from './quranApi';
import { ThemeContext } from '../../screens/TestScreen';

// Create a Web Audio API or standard HTML5 Audio element instance
const AUDIO_BASE = 'https://verses.quran.com/';

export default function QuranStreamWidget() {
  const { isDark } = useContext(ThemeContext);
  
  const [currentChapter, setCurrentChapter] = useLocalStorage<number>('quran_chapter', 1);
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number>(() => {
    try {
      const item = window.localStorage.getItem('quran_verse_index');
      return item ? JSON.parse(item) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        window.localStorage.setItem('quran_verse_index', JSON.stringify(currentVerseIndex));
      } catch {}
    }, 500);
    return () => clearTimeout(handler);
  }, [currentVerseIndex]);
  
  const [verses, setVerses] = useState<VerseItem[]>([]);
  const [verseWidths, setVerseWidths] = useState<Record<number, number>>({});
  const verseWidthsAccumRef = useRef<Record<number, number>>({});
  const verseWidthsRef = useRef<Record<number, number>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scrollOffset = useRef(0);
  const streamLineRef = useRef<View>(null);
  const dragStartOffsetRef = useRef(0);
  
  // Track if widths are fully loaded
  const [widthsLoaded, setWidthsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const versesRef = useRef<VerseItem[]>([]);
  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  const cumulativeWidthsRef = useRef<number[]>([]);
  useEffect(() => {
    if (!verses.length || !widthsLoaded) return;
    let sum = 0;
    const arr = new Array(verses.length).fill(0);
    for (let i = 0; i < verses.length; i++) {
       arr[i] = sum;
       sum += (verseWidthsRef.current[verses[i].id] || 0);
    }
    cumulativeWidthsRef.current = arr;
  }, [verseWidths, verses, widthsLoaded]);

  useEffect(() => {
    if (widthsLoaded) {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      opacityAnim.setValue(0);
    }
  }, [widthsLoaded, opacityAnim]);
  
  const isPlayingRef = useRef(isPlaying);
  const isDraggingRef = useRef(false);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const toArabicNumerals = (num: number | string) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, w => arabicDigits[Number(w)]);
  };

  // Initialize standard audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    if (!preloadRef.current) {
      preloadRef.current = new Audio();
      preloadRef.current.preload = 'auto';
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (preloadRef.current) {
        preloadRef.current = null;
      }
    };
  }, []);

  // Preload Next Audio File
  useEffect(() => {
    if (!verses || !verses.length || currentVerseIndex === undefined) return;
    const nextIndex = currentVerseIndex + 1;
    if (nextIndex < verses.length) {
      const nextVerse = verses[nextIndex];
      if (nextVerse && nextVerse.audio_url && preloadRef.current) {
        if (preloadRef.current.src !== nextVerse.audio_url) {
          preloadRef.current.src = nextVerse.audio_url;
          preloadRef.current.load();
        }
      }
    }
  }, [currentVerseIndex, verses]);

  // Fetch chapter verses
  useEffect(() => {
    if (!currentChapter) return;
    setIsLoading(true);
    setVerses([]);
    setVerseWidths({});
    verseWidthsAccumRef.current = {};
    setWidthsLoaded(false);
    fetchChapterVerses(currentChapter).then(data => {
      setVerses(data);
    });
  }, [currentChapter]);

  // Audio Ended handler -> Play next
  const handleAudioEnded = useCallback(() => {
    if (!verses || !verses.length || currentVerseIndex === undefined || currentVerseIndex === null) return;
    
    if (currentVerseIndex + 1 < verses.length) {
      setCurrentVerseIndex(currentVerseIndex + 1);
    } else {
      // Next Chapter
      const nextChapter = (currentChapter || 1) + 1;
      if (nextChapter > 114) {
        setCurrentChapter(1);
      } else {
        setCurrentChapter(nextChapter);
      }
      setCurrentVerseIndex(0);
    }
  }, [verses, currentVerseIndex, currentChapter, setCurrentVerseIndex, setCurrentChapter]);

  // Handle Event listeners to avoid stale closure
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('error', handleAudioEnded);
    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
      audio.removeEventListener('error', handleAudioEnded);
    };
  }, [handleAudioEnded]);

  // Load new audio when verse index changes
  useEffect(() => {
    if (!verses.length || currentVerseIndex === undefined) return;
    const currentVerse = verses[currentVerseIndex];
    if (currentVerse && currentVerse.audio_url && audioRef.current) {
      let targetUrl = currentVerse.audio_url;
      if (targetUrl.startsWith('//')) targetUrl = 'https:' + targetUrl;
      
      const currentSrc = audioRef.current.src || '';
      const isSameUrl = currentSrc === targetUrl || currentSrc.endsWith(targetUrl);
      
      const playAfterSeek = () => {
        if (seekPendingRef.current !== undefined && audioRef.current?.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
             audioRef.current.currentTime = seekPendingRef.current * audioRef.current.duration;
             seekPendingRef.current = undefined;
        }
        if (isPlayingRef.current && audioRef.current) {
          const p = audioRef.current.play();
          if (p !== undefined) {
             p.catch(e => {
                if (e.name !== 'AbortError') {
                   console.error("Playback failed", e);
                   setIsPlaying(false);
                }
             });
          }
        }
      };

      if (!isSameUrl) {
        audioRef.current.src = targetUrl;
        audioRef.current.onloadedmetadata = () => {
            playAfterSeek();
            if (audioRef.current) audioRef.current.onloadedmetadata = null;
        };
        audioRef.current.load();
      } else {
        playAfterSeek();
      }
    }
  }, [currentVerseIndex, verses]);

  // Handle Play / Pause change
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError') {
             console.error("Playback failed", e);
             setIsPlaying(false);
          }
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Check if all widths are loaded
  useEffect(() => {
    if (verses.length > 0 && Object.keys(verseWidths).length === verses.length) {
      setWidthsLoaded(true);
      setIsLoading(false);
    } else {
      setWidthsLoaded(false);
    }
  }, [verseWidths, verses]);

  const baseAudioTimeRef = useRef(0);
  const lastAudioTimeRef = useRef(0);
  const lastSyncTimeRef = useRef(0);
  const smoothedXRef = useRef(0);
  const seekPendingRef = useRef<number | undefined>(undefined);
  const currentVerseIndexRef = useRef(currentVerseIndex);
  const lastFrameTimeRef = useRef(performance.now());

  useEffect(() => {
    currentVerseIndexRef.current = currentVerseIndex;
  }, [currentVerseIndex]);

  // Audio sync interval
  useEffect(() => {
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;
      
      const now = performance.now();
      const actual = audio.currentTime;
      if (actual !== lastAudioTimeRef.current) {
        const predicted = baseAudioTimeRef.current + (now - lastSyncTimeRef.current) / 1000;
        const drift = Math.abs(actual - predicted);
        
        if (drift > 0.5) {
          baseAudioTimeRef.current = actual;
          lastSyncTimeRef.current = now;
        } else if (drift > 0.02) {
          baseAudioTimeRef.current += (actual - predicted) * 0.1;
        }
        lastAudioTimeRef.current = actual;
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Animation Loop Update
  useEffect(() => {
    let reqId: number;
    // Initialize refs on start
    lastSyncTimeRef.current = performance.now();
    if (audioRef.current) {
      baseAudioTimeRef.current = audioRef.current.currentTime;
      lastAudioTimeRef.current = audioRef.current.currentTime;
    }

    const loop = () => {
      reqId = requestAnimationFrame(loop);
      
      if (isDraggingRef.current) return;
      
      const now = performance.now();
      lastFrameTimeRef.current = now;

      if (!audioRef.current || !widthsLoaded) return;
      
      const audio = audioRef.current;

      if (seekPendingRef.current !== undefined && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        audio.currentTime = seekPendingRef.current * audio.duration;
        baseAudioTimeRef.current = audio.currentTime;
        lastAudioTimeRef.current = audio.currentTime;
        lastSyncTimeRef.current = performance.now();
        seekPendingRef.current = undefined;
      }
      
      let visualTime = baseAudioTimeRef.current;
      if (isPlayingRef.current && !audio.paused && !audio.seeking) {
        visualTime += (now - lastSyncTimeRef.current) / 1000;
      }
      
      if (audio.duration) {
        visualTime = Math.min(visualTime, audio.duration);
      }

      const baseOffset = cumulativeWidthsRef.current[currentVerseIndexRef.current] || 0;
      const currentVerseWidth = verseWidthsRef.current[versesRef.current[currentVerseIndexRef.current]?.id] || 0;
      const progress = (audio.duration && !isNaN(audio.duration)) ? (visualTime / audio.duration) : 0;
      const effectiveProgress = seekPendingRef.current !== undefined ? seekPendingRef.current : progress;
      
      const targetX = baseOffset + (effectiveProgress * currentVerseWidth);

      smoothedXRef.current = targetX;
      scrollOffset.current = targetX;

      let totalWidth = 0;
      if (versesRef.current.length > 0 && cumulativeWidthsRef.current.length > 0) {
         totalWidth = cumulativeWidthsRef.current[versesRef.current.length - 1] + 
                      (verseWidthsRef.current[versesRef.current[versesRef.current.length - 1].id] || 0);
      }
      const actualTranslate = targetX - totalWidth;

      const node: any = streamLineRef.current;
      const el: HTMLElement | undefined = node?._nativeTag ? node._nativeTag : (node as unknown as HTMLElement);
      if (el && el.style) {
         el.style.transform = `translate3d(${isNaN(actualTranslate) ? 0 : actualTranslate}px, 0, 0)`;
      }
    };
    
    reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, [widthsLoaded]);

  // Pan Responder for Dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        dragStartOffsetRef.current = scrollOffset.current;
        // Pause playback temporarily while dragging
        if (audioRef.current && isPlayingRef.current) {
          audioRef.current.pause();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const newTargetX = dragStartOffsetRef.current + gestureState.dx;
        scrollOffset.current = newTargetX;
        let totalWidth = 0;
        if (versesRef.current.length > 0 && cumulativeWidthsRef.current.length > 0) {
           totalWidth = cumulativeWidthsRef.current[versesRef.current.length - 1] + 
                        (verseWidthsRef.current[versesRef.current[versesRef.current.length - 1].id] || 0);
        }
        const actualTranslate = newTargetX - totalWidth;
        
        const node: any = streamLineRef.current;
        const el: HTMLElement | undefined = node?._nativeTag ? node._nativeTag : (node as unknown as HTMLElement);
        if (el && el.style) {
           el.style.transform = `translate3d(${isNaN(actualTranslate) ? 0 : actualTranslate}px, 0, 0)`;
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const isTap = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;
        if (isTap) {
          isDraggingRef.current = false;
          togglePlay();
          return;
        }

        const finalTargetX = dragStartOffsetRef.current + gestureState.dx;
        scrollOffset.current = finalTargetX;
        smoothedXRef.current = finalTargetX;
        
        let foundIndex = 0;
        let foundProgress = 0;
        
        let totalWidth = 0;
        if (versesRef.current.length > 0 && cumulativeWidthsRef.current.length > 0) {
           totalWidth = cumulativeWidthsRef.current[versesRef.current.length - 1] + 
                        (verseWidthsRef.current[versesRef.current[versesRef.current.length - 1].id] || 0);
        }

        for (let i = 0; i < versesRef.current.length; i++) {
          const w = verseWidthsRef.current[versesRef.current[i].id] || 0;
          const sum = cumulativeWidthsRef.current[i] || 0;
          if (finalTargetX <= sum + w) {
            foundIndex = i;
            let p = w > 0 ? (finalTargetX - sum) / w : 0;
            foundProgress = Math.max(0, Math.min(1, p));
            break;
          }
        }
        
        if (finalTargetX >= totalWidth && versesRef.current.length > 0) {
          foundIndex = versesRef.current.length - 1;
          foundProgress = 0.99;
        }
        if (finalTargetX < 0) {
          foundIndex = 0;
          foundProgress = 0;
        }

        seekPendingRef.current = foundProgress;
        setCurrentVerseIndex(foundIndex);
        isDraggingRef.current = false;
      }
    })
  ).current;

  // Toggle play action (can also be invoked from center button)
  const togglePlay = useCallback(() => setIsPlaying(p => !p), []);

  return (
    <View style={styles.container}>
      <View style={styles.streamWindow as any} {...panResponder.panHandlers}>
        {/* Always render verses so onLayout fires, just hide them with opacity if loading */}
        {verses.length === 0 && (
          <ActivityIndicator size="large" color={isDark ? '#e5e5ea' : '#1c1c1e'} style={{ position: 'absolute', alignSelf: 'center' }} />
        )}
        <Animated.View style={[{ opacity: opacityAnim }, StyleSheet.absoluteFill as any]} pointerEvents="box-none">
          <View ref={streamLineRef} style={styles.streamLine}>
            {verses.slice().reverse().map((verse) => (
              <View 
                key={verse.id} 
                onLayout={(e) => {
                  const w = e.nativeEvent.layout.width;
                  if (verseWidthsAccumRef.current[verse.id] === w) return;
                  verseWidthsAccumRef.current[verse.id] = w;
                  verseWidthsRef.current[verse.id] = w;
                  
                  if (Object.keys(verseWidthsAccumRef.current).length >= verses.length && verses.length > 0) {
                    setVerseWidths({ ...verseWidthsAccumRef.current });
                  }
                }}
                style={[styles.verseWrapper, { contain: 'layout paint' } as any]}
              >
                <Text style={[styles.verseText, { color: isDark ? '#fff' : '#1c1c1e' }]}>
                  {verse.text_uthmani} ﴿{toArabicNumerals(verse.number)}﴾
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Center overlay when paused */}
        {!isPlaying && widthsLoaded && (
          <View style={styles.centerPauseOverlay} pointerEvents="none">
            <View style={[styles.pauseIconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)' }]}>
               <CirclePlay size={48} color={isDark ? '#fff' : '#1c1c1e'} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    marginVertical: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  streamWindow: {
    height: 120,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    cursor: 'grab',
    touchAction: 'none' as 'none',
    transform: [{ translateZ: 0 }] as any,
    willChange: 'transform' as any,
  } as any,
  streamLine: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: '50%', 
    top: 0,
    bottom: 0,
    transform: [{ translateZ: 0 }] as any,
    willChange: 'transform' as any,
    backfaceVisibility: 'hidden' as any,
  } as any,
  verseWrapper: {
    paddingHorizontal: 12,
  },
  verseText: {
    fontFamily: '"Amiri Quran", "Amiri", serif', 
    fontSize: 32,
    lineHeight: 60, 
    writingDirection: 'rtl',
  },
  centerPauseOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseIconWrapper: {
    padding: 16,
    borderRadius: 40,
    backdropFilter: 'blur(4px)',
  } as any
});


