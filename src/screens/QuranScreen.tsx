import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Image } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { getChapters, Chapter, MUSHAF_TOTAL_PAGES, getMushafPageUrl } from '../services/quranService';
import SurahList from '../components/quran/SurahList';
import MushafReader from '../components/quran/MushafReader';
import { Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { TouchableOpacity, ActivityIndicator as RNActivityIndicator, Platform } from 'react-native';

export default function QuranScreen() {
  const { isDark } = useAppTheme();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'mushaf'>('list');
  
  // Download state
  const [downloadProgress, setDownloadProgress] = useState<{current: number, total: number} | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    const fetchChapters = async () => {
      setLoading(true);
      const data = await getChapters('kk');
      setChapters(data);
      setLoading(false);
    };

    fetchChapters();
    
    // Check if "downloaded" flag exists in local storage
    if (localStorage.getItem('quran_mushaf_downloaded') === 'true') {
      setIsDownloaded(true);
    }
  }, []);

  const handleDownloadAll = async () => {
    if (downloadProgress) return;
    
    console.log('Starting Quran download...');
    setDownloadProgress({ current: 0, total: MUSHAF_TOTAL_PAGES });
    
    try {
      const batchSize = 3;
      let errorCount = 0;

      for (let i = 1; i <= MUSHAF_TOTAL_PAGES; i += batchSize) {
        const batch = [];
        for (let j = i; j < i + batchSize && j <= MUSHAF_TOTAL_PAGES; j++) {
          const url = getMushafPageUrl(j);
          
          if (Platform.OS === 'web') {
            batch.push(new Promise((resolve) => {
              const img = new (window as any).Image();
              (img as any).referrerPolicy = 'no-referrer';
              img.onload = () => resolve(true);
              img.onerror = () => {
                errorCount++;
                resolve(false);
              };
              img.src = url;
            }));
          } else {
            batch.push(Image.prefetch(url).catch(() => {
              errorCount++;
              return false;
            }));
          }
        }
        
        await Promise.all(batch);
        const currentProgress = Math.min(i + batchSize - 1, MUSHAF_TOTAL_PAGES);
        setDownloadProgress({ current: currentProgress, total: MUSHAF_TOTAL_PAGES });
        
        await new Promise(r => setTimeout(r, 20));
      }

      if (errorCount > 10) {
        alert(`${errorCount} бет жүктелмей қалды. Интернетті тексеріп, қайта көріңіз.`);
      } else {
        setIsDownloaded(true);
        localStorage.setItem('quran_mushaf_downloaded', 'true');
        console.log('Quran download completed successfully');
      }
    } catch (e) {
      console.error('Download failed:', e);
      alert('Жүктеу кезінде қате шықты. Интернетті тексеріп, қайта көріңіз.');
    } finally {
      setDownloadProgress(null);
    }
  };

  const handleClearDownload = () => {
    setIsDownloaded(false);
    localStorage.removeItem('quran_mushaf_downloaded');
  };

  const handleSelectSurah = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setViewMode('mushaf');
  };

  const handleCloseMushaf = () => {
    setViewMode('list');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa' }]}>
      {viewMode === 'list' ? (
        <>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#1c1c1e' }]}>Құран</Text>
            
            {/* Download Status Card */}
            <TouchableOpacity 
              disabled={!!downloadProgress || isDownloaded}
              onPress={handleDownloadAll}
              style={[styles.downloadCard, { 
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                cursor: (!!downloadProgress || isDownloaded) ? 'default' : 'pointer'
              } as any]}
            >
              {downloadProgress ? (
                <View style={styles.downloadProgressContainer}>
                  <RNActivityIndicator size="small" color="#10b981" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.downloadText, { color: isDark ? '#fff' : '#1c1c1e' }]}>
                      Құран беттерін жүктеу...
                    </Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }]} />
                    </View>
                    <Text style={styles.progressSubtext}>
                      {downloadProgress.current} / {downloadProgress.total} бет
                    </Text>
                  </View>
                </View>
              ) : isDownloaded ? (
                <View style={[styles.downloadProgressContainer, { justifyContent: 'space-between' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={20} color="#10b981" />
                    <Text style={[styles.downloadText, { color: isDark ? '#fff' : '#1c1c1e' }]}>
                      Құран толық жүктелген
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleClearDownload}>
                    <Text style={{ color: '#8e8e93', fontSize: 12, textDecorationLine: 'underline' }}>Өшіру</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.downloadBtn}>
                  <View style={styles.downloadIconBadge}>
                    <Download size={18} color="#fff" />
                  </View>
                  <View>
                    <Text style={[styles.downloadText, { color: isDark ? '#fff' : '#1c1c1e' }]}>
                      Құранды толық жүктеп алу
                    </Text>
                    <Text style={styles.progressSubtext}>Интернетсіз оқу үшін (604 бет)</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <SurahList 
            chapters={chapters} 
            loading={loading} 
            onSelectSurah={handleSelectSurah} 
          />
        </>
      ) : (
        selectedChapter && (
          <MushafReader 
            chapter={selectedChapter}
            initialPage={selectedChapter.pages[0]}
            onClose={handleCloseMushaf}
            onShowChapters={() => setViewMode('list')}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  downloadCard: {
    marginTop: 12,
    marginHorizontal: 0,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  downloadIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    marginTop: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressSubtext: {
    fontSize: 11,
    color: '#8e8e93',
    marginTop: 4,
  },
});
