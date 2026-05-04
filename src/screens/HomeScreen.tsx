import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  useWindowDimensions, 
  TouchableOpacity, 
  Text, 
  Modal, 
  TextInput, 
  Platform 
} from 'react-native';
import { Moon, Sun, Palette, Droplet, MapPin, Search, X, ChevronLeft } from 'lucide-react';
import NamazWidgetMain from '../components/namaz-block-main/NamazWidgetMain';
import { useAppTheme } from '../context/ThemeContext';

const SC = 0.7; // 30% scale reduction base
const s = (v: number) => v * SC;

function WeeklyCalendar() {
  const { isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  
  // Calculate widget width to match NamazWidgetMain consistency
  const maxContainerWidth = 600;
  const isMobile = width < 500;
  const screenPadding = isMobile ? 16 : 32;
  const unscaledWidgetWidth = Math.min(width - (screenPadding * 2), maxContainerWidth);
  const widgetWidth = unscaledWidgetWidth * SC;

  // Get current week days
  const today = new Date();
  const weekDays = [];
  const startOfWeek = new Date(today);
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
  startOfWeek.setDate(diff);

  const dayNames = ['Дүй', 'Сей', 'Сәр', 'Бей', 'Жұм', 'Сен', 'Жек'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push({
      date: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    });
  }

  const todayBorderColor = isDark ? '#fff' : '#1c1c1e';
  const dotColorForToday = isDark ? '#fff' : '#1c1c1e';

  return (
    <View style={[styles.weeklyCalendarContainer, { width: widgetWidth }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weeklyCalendarInner}>
        {weekDays.map((item, idx) => (
          <View key={idx} style={styles.weekDayItem}>
            <View style={[
              styles.weekDayDateFrame, 
              item.isToday && { borderColor: todayBorderColor, borderStyle: 'solid' }
            ]}>
              <Text style={[
                styles.weekDayDate, 
                { color: (isDark ? '#fff' : '#1c1c1e'), fontSize: s(24) },
                item.isToday && { color: todayBorderColor, fontWeight: '900' }
              ]}>
                {item.date}
              </Text>
            </View>
            <View style={[styles.calendarDot, { backgroundColor: item.isToday ? dotColorForToday : (isDark ? '#333' : '#e5e5ea') }]} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const { height } = useWindowDimensions();
  const { isDark, setIsDark, colorMode, setColorMode } = useAppTheme();

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isHijriActive, setIsHijriActive] = useState(false);
  const [gregorianParts, setGregorianParts] = useState({ day: '1', month: 'Мамыр', year: '2026' });
  const [hijriParts, setHijriParts] = useState({ day: '1', month: 'Мамыр', year: '1447' });

  useEffect(() => {
    try {
      const now = new Date();
      
      const gregFormatter = new Intl.DateTimeFormat('kk-KZ', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      const gregPartsRaw = gregFormatter.formatToParts(now);
      
      let gd = '1', gm = 'Мамыр', gy = '2026';
      gregPartsRaw.forEach(p => {
        if (p.type === 'day') gd = p.value;
        if (p.type === 'month') gm = p.value.charAt(0).toUpperCase() + p.value.slice(1);
        if (p.type === 'year') gy = p.value.replace(/\D/g, '');
      });
      setGregorianParts({ day: gd, month: gm, year: gy });

      const hijriFormatter = new Intl.DateTimeFormat('kk-KZ-u-ca-islamic-umalqura', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      const hijriPartsRaw = hijriFormatter.formatToParts(now);
      
      let hd = '1', hm = 'Мұхаррам', hy = '1447';
      hijriPartsRaw.forEach(p => {
        if (p.type === 'day') hd = p.value;
        if (p.type === 'month') hm = p.value.charAt(0).toUpperCase() + p.value.slice(1);
        if (p.type === 'year') hy = hy.replace(/\D/g, '');
      });
      
      setHijriParts({ day: hd, month: hm, year: hy });
    } catch (e) {
      setGregorianParts({ day: '1', month: 'Мамыр', year: '2026' });
      setHijriParts({ day: '13', month: 'Зұл-Қағда', year: '1447' });
    }
  }, []);

  const handleOpenSearch = () => setIsSearchVisible(true);
  const handleCloseSearch = () => setIsSearchVisible(false);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.dateCard} onPress={() => setIsHijriActive(!isHijriActive)} activeOpacity={0.7}>
          {isHijriActive ? (
            <>
              <View style={styles.dateMainRow}>
                <Text style={[styles.dayText, { color: isDark ? '#fff' : '#1c1c1e' }]}>{hijriParts.day}</Text>
                <Text style={[styles.monthText, { color: isDark ? '#fff' : '#1c1c1e' }]} numberOfLines={1}>
                  {hijriParts.month}
                </Text>
              </View>
              {hijriParts.year ? (
                <Text style={[styles.yearText, { color: isDark ? '#a1a1aa' : '#8e8e93' }]}>{hijriParts.year} жыл (Хижра)</Text>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.dateMainRow}>
                <Text style={[styles.dayText, { color: isDark ? '#fff' : '#1c1c1e' }]}>{gregorianParts.day}</Text>
                <Text style={[styles.monthText, { color: isDark ? '#fff' : '#1c1c1e' }]} numberOfLines={1}>
                  {gregorianParts.month}
                </Text>
              </View>
              {gregorianParts.year ? (
                <Text style={[styles.yearText, { color: isDark ? '#a1a1aa' : '#8e8e93' }]}>{gregorianParts.year} жыл</Text>
              ) : null}
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.locationBtn, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff', borderColor: isDark ? '#2c2c2e' : '#e5e5ea', borderWidth: 1 }]} onPress={handleOpenSearch}>
          <MapPin color={isDark ? '#fff' : '#1c1c1e'} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={[styles.mainContent, { height: height - 120 }]}>
        <View style={{ width: '100%', alignItems: 'center' }}>
          <WeeklyCalendar />
          <View style={{ height: s(10) }} />
          <NamazWidgetMain />
        </View>
      </View>

      <Modal
        visible={isSearchVisible}
        animationType="slide"
        onRequestClose={handleCloseSearch}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? '#000' : '#ffffff' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseSearch} style={styles.backBtn}>
              <ChevronLeft color={isDark ? '#fff' : '#1c1c1e'} size={28} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1c1c1e' }]}>Қаланы іздеу</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1c1c1e' : '#f1f1f6' }]}>
            <Search color={isDark ? '#a1a1aa' : '#8e8e93'} size={20} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#fff' : '#1c1c1e' }]}
              placeholder="Қала атауын жазыңыз..."
              placeholderTextColor={isDark ? '#a1a1aa' : '#8e8e93'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <X color={isDark ? '#a1a1aa' : '#8e8e93'} size={18} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.emptyStateContainer}>
            <MapPin color={isDark ? '#333' : '#e5e5ea'} size={64} strokeWidth={1} />
            <Text style={[styles.emptyStateText, { color: isDark ? '#a1a1aa' : '#8e8e93' }]}>Орындарды іздеу</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  dateCard: {
    flexDirection: 'column',
    gap: 4,
    flex: 1,
    paddingRight: 16,
    justifyContent: 'center',
  },
  dateMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  dayText: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  monthText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  locationBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: s(20),
  },
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 52,
    fontSize: 17,
    fontWeight: '500',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
  },
  clearBtn: {
    padding: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  weeklyCalendarContainer: {
    paddingVertical: 12,
  },
  weeklyCalendarInner: {
    paddingHorizontal: 8,
    gap: 16,
  },
  weekDayItem: {
    alignItems: 'center',
    gap: 6,
  },
  weekDayDateFrame: {
    width: s(44),
    height: s(44),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weekDayDate: {
    fontWeight: '800',
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  }
});
