import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Search, BookOpen } from 'lucide-react';
import { Chapter } from '../../services/quranService';
import { useAppTheme } from '../../context/ThemeContext';

interface SurahListProps {
  chapters: Chapter[];
  loading: boolean;
  onSelectSurah: (chapter: Chapter) => void;
}

export default function SurahList({ chapters, loading, onSelectSurah }: SurahListProps) {
  const { isDark } = useAppTheme();
  const [search, setSearch] = React.useState('');

  const filteredChapters = chapters.filter(c => 
    c.name_simple.toLowerCase().includes(search.toLowerCase()) ||
    c.translated_name.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toString().includes(search)
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Chapter }) => (
    <TouchableOpacity 
      style={[styles.item, { backgroundColor: isDark ? '#2c2c2e' : '#fff' }]}
      onPress={() => onSelectSurah(item)}
    >
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{item.id}</Text>
      </View>
      
      <View style={styles.info}>
        <Text style={[styles.name, { color: isDark ? '#fff' : '#1c1c1e' }]}>{item.name_simple}</Text>
        <Text style={[styles.translation, { color: isDark ? '#a1a1aa' : '#8e8e93' }]}>{item.translated_name.name}</Text>
      </View>

      <View style={styles.rightInfo}>
        <Text style={[styles.arabicName, { color: isDark ? '#10b981' : '#10b981' }]}>{item.name_arabic}</Text>
        <Text style={[styles.versesCount, { color: isDark ? '#71717a' : '#a1a1aa' }]}>{item.verses_count} аят</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#2c2c2e' : '#fff' }]}>
        <Search size={20} color={isDark ? '#a1a1aa' : '#8e8e93'} />
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#fff' : '#1c1c1e' }]}
          placeholder="Сүрені іздеу..."
          placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      
      <FlatList
        data={filteredChapters}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  translation: {
    fontSize: 13,
    marginTop: 2,
  },
  rightInfo: {
    alignItems: 'flex-end',
  },
  arabicName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System', // Arabic fonts usually look okay on system
  },
  versesCount: {
    fontSize: 11,
    marginTop: 4,
  },
});
