import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Platform,
  Pressable
} from 'react-native';
import { X, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chapter, getMushafPageUrl } from '../../services/quranService';
import { useAppTheme } from '../../context/ThemeContext';
import { useUI } from '../../context/UIContext';

const MotionView = motion(View);

interface MushafReaderProps {
  initialPage: number;
  chapter: Chapter;
  onClose: () => void;
  onShowChapters: () => void;
}

export default function MushafReader({ initialPage, chapter, onClose, onShowChapters }: MushafReaderProps) {
  const { isDark } = useAppTheme();
  const { isTabBarVisible, setTabBarVisible } = useUI();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [[page, direction], setPageState] = useState([initialPage, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  const imageUrl = getMushafPageUrl(currentPage);

  const toggleControls = () => {
    setIsControlsVisible(prev => !prev);
  };

  const paginate = (newDirection: number) => {
    const nextPage = currentPage + newDirection;
    if (nextPage >= 1 && nextPage <= 604) {
      setPageState([nextPage, newDirection]);
      setCurrentPage(nextPage);
      setLoading(true);
      setError(false);
    }
  };

  // Fixed toggle for state consistency
  useEffect(() => {
    setTabBarVisible(isControlsVisible);
  }, [isControlsVisible]);

  // Reset tab bar when component unmounts
  useEffect(() => {
    return () => {
      setTabBarVisible(true);
    };
  }, []);

  const handleClose = () => {
    setTabBarVisible(true);
    onClose();
  };

  const handleImageError = () => {
    console.warn(`Failed to load Mushaf page ${currentPage}: ${imageUrl}`);
    setLoading(false);
    setError(true);
  };

  // Pre-load next and previous pages for smoother transitions
  useEffect(() => {
    const prefetchPages = async () => {
      if (currentPage > 1) {
        Image.prefetch(getMushafPageUrl(currentPage - 1));
      }
      if (currentPage < 604) {
        Image.prefetch(getMushafPageUrl(currentPage + 1));
      }
    };

    prefetchPages();
  }, [currentPage]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa' }]}>
      <AnimatePresence initial={false}>
        {isControlsVisible && (
          <MotionView
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
              ...StyleSheet.flatten(styles.header),
              backgroundColor: isDark ? '#2c2c2e' : '#fff',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
            }}
          >
            <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
              <X size={24} color={isDark ? '#fff' : '#1c1c1e'} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.surahName, { color: isDark ? '#fff' : '#1c1c1e' }]}>{chapter.name_simple}</Text>
              <Text style={[styles.pageIndicator, { color: isDark ? '#a1a1aa' : '#8e8e93' }]}>{currentPage} бет</Text>
            </View>

            <TouchableOpacity onPress={onShowChapters} style={styles.headerBtn}>
              <List size={24} color={isDark ? '#fff' : '#1c1c1e'} />
            </TouchableOpacity>
          </MotionView>
        )}
      </AnimatePresence>

      {/* Mushaf Page */}
      <Pressable 
        onPress={toggleControls}
        style={{ flex: 1, width: '100%' }}
      >
        <View style={styles.readerContainer}>
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          )}
          
          <AnimatePresence initial={false} custom={direction}>
            <MotionView
              key={currentPage}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1); // Swiped left -> Next page
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1); // Swiped right -> Prev page
                }
              }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
                cursor: 'grab'
              } as any}
            >
              <Image 
                source={{ uri: imageUrl }}
                style={styles.pageImage}
                resizeMode="contain"
                referrerPolicy="no-referrer"
                onLoad={() => {
                  setLoading(false);
                  setError(false);
                }}
                onError={handleImageError}
              />
            </MotionView>
          </AnimatePresence>

          {error && (
            <View style={[styles.errorContainer, { zIndex: 10 }]}>
              <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 8 }}>
                Бет жүктелмеді. Интернетті тексеріңіз.
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setError(false);
                  setLoading(true);
                }} 
                style={styles.retryBtn}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Қайта көру</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerBtn: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  surahName: {
    fontSize: 18,
    fontWeight: '800',
  },
  pageIndicator: {
    fontSize: 12,
    marginTop: 2,
  },
  readerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    zIndex: 5,
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  pageImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.85,
    maxWidth: 600,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
