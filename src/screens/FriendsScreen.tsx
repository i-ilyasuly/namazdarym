import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView, ActivityIndicator, Image, RefreshControl, TextInput, Animated } from 'react-native';
import { Users, UserPlus, Flame, ChevronRight, Crown, Check, X, Search } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import FriendSearchModal from '../components/FriendSearchModal';
import FriendProfileModal from '../components/FriendProfileModal';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const fontFamily = Platform.OS === 'web' 
  ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
  : 'System';

const PRAYERS = ['Таң', 'Бесін', 'Екінті', 'Шам', 'Құптан'];

// Generate past 7 days for the chart
const getPastDays = () => {
  const days = ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн'];
  const today = new Date().getDay();
  const pastDays = [];
  for (let i = 6; i >= 0; i--) {
     let d = today - i;
     if (d < 0) d += 7;
     pastDays.push(days[d]);
  }
  return pastDays;
};

export default function FriendsScreen() {
  const { isDark, themeColors } = useAppTheme();
  const { user, profile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'list' | 'metrics'>('list');
  const [activePeriod, setActivePeriod] = useState<string>('week');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(searchPulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(searchPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const allChartUsers = [...friends];
  if (profile) {
    allChartUsers.push({
      id: user?.uid,
      name: profile.displayName || profile.username || 'Мен',
      color: isDark ? '#60a5fa' : themeColors[0],
      points: profile.points || 0,
      pointsHistory: profile.pointsHistory || {}
    });
  }

  // Fetch friendships
  useEffect(() => {
    if (!user) return;

    const friendshipsRef = collection(db, 'friendships');
    const q1 = query(friendshipsRef, where('user1', '==', user.uid));
    const q2 = query(friendshipsRef, where('user2', '==', user.uid));

    // Wait, Firestore doesn't support logical OR well. We can just use two snapshot listeners or query both.
    // Instead of two listeners, we can listen to user1 our id, and user2 our id.
    const unsub1 = onSnapshot(q1, (snap1) => {
      handleSnapshots(snap1, 'user2');
    });

    const unsub2 = onSnapshot(q2, (snap2) => {
      handleSnapshots(snap2, 'user1');
    });
    
    let localDocs: any = {};

    const handleSnapshots = async (snapshot: any, friendField: string) => {
      const docs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data(), friendId: d.data()[friendField] }));
      
      docs.forEach((d: any) => {
        localDocs[d.id] = d;
      });

      processFriendships(Object.values(localDocs));
    };

    const processFriendships = async (allFriendships: any[]) => {
      try {
        const friendIds = allFriendships.map(f => f.friendId);
        if (friendIds.length === 0) {
          setFriends([]);
          setRequests([]);
          setLoading(false);
          return;
        }

        const usersData: any = {};
        // Chunk ids if more than 10
        for (let i = 0; i < friendIds.length; i += 10) {
          const chunk = friendIds.slice(i, i + 10);
          const usersQ = query(collection(db, 'users'), where('__name__', 'in', chunk));
          const usersSnap = await getDocs(usersQ);
          usersSnap.forEach(d => {
             usersData[d.id] = d.data();
          });
        }

        const accepted: any[] = [];
        const pending: any[] = [];

        // Randomly assign a color to real friends
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

        for (const f of allFriendships) {
          const friendData = usersData[f.friendId];
          if (!friendData) continue;

          // Fetch friend's today prayers
          const today = new Date().toISOString().split('T')[0];
          const prayerDocRef = doc(db, 'users', f.friendId, 'prayers', today);
          const prayerDoc = await getDoc(prayerDocRef);
          const pData = prayerDoc.exists() ? prayerDoc.data() : {};

          const statusMap = (val: any) => (val && val !== 'none') ? val : 'none';

          const friendObj = {
            id: f.friendId,
            friendshipId: f.id,
            name: friendData.displayName || friendData.username,
            avatar: (friendData.displayName || friendData.username || '?')[0].toUpperCase(),
            streak: friendData.streak || 0,
            points: friendData.points || 0,
            prayers: [
              statusMap(pData.fajr),
              statusMap(pData.dhuhr),
              statusMap(pData.asr),
              statusMap(pData.maghrib),
              statusMap(pData.isha)
            ],
            color: colors[accepted.length % colors.length],
            pointsHistory: friendData.pointsHistory || {},
            ...friendData 
          };

          if (f.status === 'accepted') {
            accepted.push(friendObj);
          } else if (f.status === 'pending' && f.initiatorId !== user.uid) {
            // It's a request TO me
            pending.push(friendObj);
          }
        }

        setFriends(accepted);
        setRequests(pending);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    return () => {
      unsub1();
      unsub2();
    };
  }, [user, refreshKey]);

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await updateDoc(doc(db, 'friendships', friendshipId), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      // Actually delete or set rejected. We'll just delete for simplicity.
      await updateDoc(doc(db, 'friendships', friendshipId), {
        status: 'declined',
        updatedAt: serverTimestamp()
      });
      // To strictly remove from UI we update state manually for a fast update
      setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId));
    } catch (err) {
      console.error(err);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'jamaat': return '#10b981';
      case 'on_time': return '#3b82f6';
      case 'late': return '#ef4444';
      case 'qaza': return '#1c1c1e';
      default: return isDark ? '#2c2c2e' : '#e5e5ea';
    }
  };

  // Generate chart data based on selected period
  const getChartData = () => {
    let days: string[] = [];
    let count = 7;
    
    if (activePeriod === 'today') {
      days = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
    } else if (activePeriod === 'month') {
      count = 30;
      const t = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(t);
        d.setDate(d.getDate() - i);
        days.push(`${d.getDate()}.${d.getMonth()+1}`);
      }
    } else { // week
      days = getPastDays();
    }

    const rawData = days.map((day, index) => {
      const dataPoint: any = { day };
      
      allChartUsers.forEach(friend => {
        const history = friend.pointsHistory || {};
        
        // Find points for this specific date
        // We need to convert the chart 'day' label back to a date string YYYY-MM-DD
        // or just use the current points if no history exists for that day.
        
        let val = 0;
        const now = new Date();
        const d = new Date(now);
        
        if (activePeriod === 'month') {
          d.setDate(now.getDate() - (29 - index));
        } else if (activePeriod === 'week') {
          d.setDate(now.getDate() - (6 - index));
        }
        
        const dateStr = d.toISOString().split('T')[0];
        val = history[dateStr];
        
        // If no entry for this specific day, try to find the last known value before this day
        if (val === undefined) {
          const pastDates = Object.keys(history).sort();
          const earlierDates = pastDates.filter(dt => dt <= dateStr);
          if (earlierDates.length > 0) {
            val = history[earlierDates[earlierDates.length - 1]];
          } else {
            val = 0;
          }
        }
        
        dataPoint[friend.name] = val;
      });
      return dataPoint;
    });

    if (rawData.length > 15) {
      const step = Math.ceil(rawData.length / 10);
      return rawData.filter((_, i) => i % step === 0 || i === rawData.length - 1);
    }
    return rawData;
  };

  const chartData = getChartData();

  const renderPodium = () => {
    const top3 = [...friends].sort((a, b) => b.points - a.points).slice(0, 3);
    if (top3.length < 3) return null;

    const podiumOrder = [top3[1], top3[0], top3[2]];
    const positions = [2, 1, 3];
    const medals = ['#9ca3af', '#fbbf24', '#b45309'];

    return (
      <View style={styles.podiumContainer}>
        {podiumOrder.map((friend, index) => {
          const position = positions[index];
          const isFirst = position === 1;
          const color = medals[index];
          
          return (
            <TouchableOpacity 
              key={friend.id} 
              style={[styles.podiumItem, isFirst && styles.podiumItemFirst]}
              onPress={() => setSelectedFriend(friend)}
              activeOpacity={0.8}
            >
              <View style={[styles.podiumAvatarWrap]}>
                {isFirst && (
                  <View style={styles.crownContainer}>
                    <Crown color="#fbbf24" size={24} fill="#fbbf24" />
                  </View>
                )}
                <View style={[
                  styles.podiumAvatar, 
                  { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6', borderColor: color, borderWidth: 3 },
                  isFirst && { width: 72, height: 72, borderRadius: 36 }
                ]}>
                  <Text style={[
                    styles.podiumAvatarText, 
                    { color: isDark ? '#fff' : '#1c1c1e' },
                    isFirst && { fontSize: 22 }
                  ]}>{friend.avatar}</Text>
                </View>
                <View style={[styles.podiumBadge, { backgroundColor: color, borderColor: isDark ? '#000' : '#f8f9fa' }]}>
                  <Text style={styles.podiumBadgeText}>{position}</Text>
                </View>
              </View>
              <Text style={[styles.podiumName, { color: isDark ? '#fff' : '#1c1c1e' }]} numberOfLines={1}>
                {friend.name.split(' ')[0]}
              </Text>
              <View style={styles.podiumPointsWrap}>
                 <Text style={styles.podiumPoints}>{friend.points}</Text>
                 <Text style={styles.podiumPointsLabel}> ұпай</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderMetrics = () => {
    if (Platform.OS !== 'web') {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: isDark ? '#a1a1aa' : '#8e8e93', fontFamily }}>Метрика көрінісі тек браузерде қолжетімді.</Text>
        </View>
      );
    }
    
    return (
      <View style={{ marginTop: 16 }}>
        <View style={styles.periodContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScroll}>
            <View style={[styles.periodBackground, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6' }]}>
              {[
                { id: 'today', title: 'Бүгін' },
                { id: 'week', title: 'Апта' },
                { id: 'month', title: 'Ай' },
              ].map(p => (
                <TouchableOpacity 
                  key={p.id}
                  style={[styles.periodBtn, activePeriod === p.id && styles.periodBtnActive, activePeriod === p.id && isDark && { backgroundColor: '#3a3a3c' }]}
                  onPress={() => setActivePeriod(p.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodText, activePeriod === p.id && styles.periodTextActive, activePeriod === p.id && isDark && { color: '#fff' }]}>
                    {p.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={[styles.chartCard, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff', borderWidth: isDark ? 1 : 0, borderColor: '#3a3a3c' }]}>
          <Text style={[styles.chartTitle, { color: isDark ? '#fff' : '#1c1c1e' }]}>Ұпайлар прогресі ({activePeriod === 'today' ? 'Бүгін' : activePeriod === 'month' ? 'Ай' : '7 күн'})</Text>
          <View style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2c2c2e' : '#f1f1f6'} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#a1a1aa' : '#8e8e93', fontSize: 12, fontFamily }}
                  dy={10}
                  minTickGap={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#a1a1aa' : '#8e8e93', fontSize: 12, fontFamily }}
                  width={60}
                  domain={['dataMin - 5', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#2c2c2e' : '#ffffff', 
                    borderRadius: 12, 
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontFamily,
                  }} 
                  itemStyle={{ fontSize: 13, fontWeight: '600' }}
                  labelStyle={{ color: isDark ? '#a1a1aa' : '#8e8e93', marginBottom: 4 }}
                />
                {allChartUsers.map(friend => (
                  <Line 
                    key={friend.id}
                    type="monotone" 
                    dataKey={friend.name} 
                    stroke={friend.color} 
                    strokeWidth={3}
                    dot={{ fill: friend.color, strokeWidth: 2, r: 4, stroke: isDark ? '#1c1c1e' : '#ffffff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </RechartsLineChart>
            </ResponsiveContainer>
          </View>
        </View>

        <View style={styles.legendContainer}>
          {allChartUsers.map(friend => (
             <View key={friend.id} style={styles.legendItem}>
               <View style={[styles.legendDot, { backgroundColor: friend.color }]} />
               <Text style={[styles.legendText, { color: isDark ? '#fff' : '#1c1c1e' }]} numberOfLines={1}>
                 {friend.name.split(' ')[0]}
               </Text>
             </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#1c1c1e' }]}>Достар</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={[styles.searchBarInner, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff', borderColor: isDark ? '#3a3a3c' : '#e5e5ea', borderWidth: 1 }]}>
          <Animated.View style={{ transform: [{ scale: searchPulse }] }}>
            <Search color={isDark ? '#a1a1aa' : '#8e8e93'} size={20} />
          </Animated.View>
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#fff' : '#1c1c1e' }]}
            placeholder="Іздеу..."
            placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={isDark ? '#a1a1aa' : '#8e8e93'} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View style={[styles.segmentContainer, { backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea' }]}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'list' && [styles.segmentBtnActive, { backgroundColor: isDark ? '#3a3a3c' : '#ffffff' }]]} 
            onPress={() => setActiveTab('list')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'list' ? (isDark ? '#fff' : '#1c1c1e') : '#8e8e93' }]}>Достар</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'metrics' && [styles.segmentBtnActive, { backgroundColor: isDark ? '#3a3a3c' : '#ffffff' }]]} 
            onPress={() => setActiveTab('metrics')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'metrics' ? (isDark ? '#fff' : '#1c1c1e') : '#8e8e93' }]}>Метрика</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#10b981'} />}
      >
        
        {activeTab === 'list' ? (
          <>
            {requests.length > 0 && (
              <View style={styles.requestsContainer}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1c1c1e' }]}>Жаңа өтінімдер</Text>
                {requests.map((req) => (
                  <View key={req.id} style={[styles.requestCard, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }]}>
                    <View style={styles.requestInfo}>
                      <View style={[styles.avatar, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6', overflow: 'hidden' }]}>
                        {req.photoURL ? (
                          <Image source={{ uri: req.photoURL }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <Text style={[styles.avatarText, { color: isDark ? '#fff' : '#1c1c1e' }]}>{req.avatar}</Text>
                        )}
                      </View>
                      <View>
                         <Text style={[styles.requestName, { color: isDark ? '#fff' : '#1c1c1e' }]}>{req.name}</Text>
                         <Text style={styles.requestHandle}>@{req.username}</Text>
                      </View>
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6', marginRight: 8 }]}
                        onPress={() => handleDeclineRequest(req.friendshipId)}
                      >
                        <X color="#8e8e93" size={20} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                        onPress={() => handleAcceptRequest(req.friendshipId)}
                      >
                        <Check color="#fff" size={20} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {renderPodium()}
            
            <View style={styles.listContainer}>
              {friends.length === 0 && !loading && (
                <View style={styles.emptyState}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
                    <Users color="#3b82f6" size={32} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#1c1c1e' }]}>Достар тізімі бос</Text>
                  <Text style={styles.emptyDesc}>Достарыңызды қосып, бірге намаз оқуда жарысыңыз.</Text>
                </View>
              )}
              {[...friends].sort((a, b) => b.points - a.points).map((friend, idx) => (
                <TouchableOpacity 
                  key={friend.id} 
                  style={[styles.friendCard, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedFriend(friend)}
                >
              <Text style={[styles.rankNumber, { color: isDark ? '#48484a' : '#c7c7cc' }]}>{idx + 1}</Text>
              <View style={styles.friendInfo}>
                <View style={[styles.avatar, { backgroundColor: isDark ? '#2c2c2e' : '#f1f1f6', overflow: 'hidden' }]}>
                  {friend.photoURL ? (
                    <Image source={{ uri: friend.photoURL }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={[styles.avatarText, { color: isDark ? '#fff' : '#1c1c1e' }]}>{friend.avatar}</Text>
                  )}
                </View>
                
                <View style={styles.nameContainer}>
                  <Text style={[styles.friendName, { color: isDark ? '#fff' : '#1c1c1e' }]}>{friend.name}</Text>
                  <View style={styles.statsRow}>
                    <Flame color="#ef4444" size={14} />
                    <Text style={styles.streakText}>{friend.streak} күн</Text>
                    <View style={styles.dotSeparator} />
                    <Text style={styles.pointsText}>{friend.points} ұпай</Text>
                  </View>
                </View>
              </View>

              {/* Prayers Progress for Today */}
              <View style={styles.prayersContainer}>
                {friend.prayers.map((status, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.prayerDot, 
                      { backgroundColor: getStatusColor(status) },
                      status === 'none' && !isDark && { borderWidth: 1, borderColor: '#e5e5ea' }
                    ]} 
                  />
                ))}
              </View>
            </TouchableOpacity>
          ))}
            </View>
          </>
        ) : (
          renderMetrics()
        )}
      </ScrollView>
      
      <FriendSearchModal 
        visible={isSearchVisible} 
        onClose={() => setIsSearchVisible(false)} 
        onFriendSelect={(friend) => {
          setIsSearchVisible(false);
          setSelectedFriend(friend);
        }}
      />
      <FriendProfileModal visible={!!selectedFriend} friend={selectedFriend} onClose={() => setSelectedFriend(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily,
    letterSpacing: -0.5,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontWeight: '500',
    fontFamily,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
  },
  addBtn: {
    backgroundColor: '#3b82f6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    gap: 16,
  },
  podiumItem: {
    alignItems: 'center',
    width: 90,
  },
  podiumItemFirst: {
    marginBottom: 20,
    width: 100,
  },
  podiumAvatarWrap: {
    position: 'relative',
    marginBottom: 12,
    alignItems: 'center',
  },
  crownContainer: {
    position: 'absolute',
    top: -22,
    zIndex: 10,
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily,
  },
  podiumBadge: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  podiumBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    fontFamily,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily,
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumPointsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  podiumPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6',
    fontFamily,
  },
  podiumPointsLabel: {
    fontSize: 11,
    color: '#8e8e93',
    fontFamily,
  },
  listContainer: {
    gap: 12,
  },
  requestsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily,
    marginBottom: 12,
    marginLeft: 4,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily,
    marginBottom: 2,
  },
  requestHandle: {
    fontSize: 13,
    color: '#8e8e93',
    fontFamily,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#8e8e93',
    fontFamily,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  friendCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily,
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily,
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
    fontFamily,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    marginHorizontal: 4,
  },
  pointsText: {
    fontSize: 13,
    color: '#8e8e93',
    fontFamily,
    fontWeight: '500',
  },
  prayersContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 12,
  },
  prayerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily,
  },
  chartCard: {
    borderRadius: 20,
    padding: 16,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily,
    marginBottom: 16,
    marginLeft: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 8,
    justifyContent: 'center'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily,
    maxWidth: 80,
  },
  periodContainer: {
    marginBottom: 16,
  },
  periodScroll: {
    paddingHorizontal: 0,
  },
  periodBackground: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f6',
    borderRadius: 12,
    padding: 3,
    alignSelf: 'flex-start',
  },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily,
    color: '#8e8e93',
  },
  periodTextActive: {
    color: '#1c1c1e',
    fontWeight: '700',
  },
});
