import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Platform, ActivityIndicator, Image } from 'react-native';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, limit, setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const fontFamily = Platform.OS === 'web' 
  ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
  : 'System';

export default function FriendSearchModal({ visible, onClose, onFriendSelect }: { visible: boolean; onClose: () => void, onFriendSelect?: (friend: any) => void }) {
  const { isDark } = useAppTheme();
  const { user, profile } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setResults([]);
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const cleanSearch = searchQuery.toLowerCase().trim();
        const cleanSearchWithoutAt = cleanSearch.startsWith('@') ? cleanSearch.substring(1) : cleanSearch;
        
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef, 
          where('usernameLowercase', '>=', cleanSearchWithoutAt),
          where('usernameLowercase', '<=', cleanSearchWithoutAt + '\uf8ff'),
          limit(10)
        );
        
        const snapshot = await getDocs(q);
        const usersList: any[] = [];
        
        // Also fetch existing friendships to see if already friends
        if (user && !snapshot.empty) {
          const userIds = snapshot.docs.map(d => d.id).filter(id => id !== user.uid);
          
          let myFriendships: any = {};
          
          if (userIds.length > 0) {
            const fQ1 = query(collection(db, 'friendships'), where('user1', '==', user.uid));
            const fQ2 = query(collection(db, 'friendships'), where('user2', '==', user.uid));
            
            const [snap1, snap2] = await Promise.all([getDocs(fQ1), getDocs(fQ2)]);
            
            snap1.forEach(d => { myFriendships[d.data().user2] = { id: d.id, ...d.data() }; });
            snap2.forEach(d => { myFriendships[d.data().user1] = { id: d.id, ...d.data() }; });
          }
          
          snapshot.forEach((doc) => {
            if (doc.id !== user.uid) {
              const friendship = myFriendships[doc.id];
              usersList.push({ 
                 id: doc.id, 
                 ...doc.data(),
                 friendshipId: friendship ? friendship.id : null,
                 friendshipStatus: friendship ? friendship.status : null 
              });
            }
          });
        }
        
        setResults(usersList);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, user]);

  const handleRequest = async (friendId: string) => {
    if (!user) return;
    setRequested(prev => [...prev, friendId]);
    
    try {
      const friendshipId = [user.uid, friendId].sort().join('_');
      const friendshipRef = doc(db, 'friendships', friendshipId);
      
      const friendshipDoc = await getDoc(friendshipRef);
      if (!friendshipDoc.exists()) {
        await setDoc(friendshipRef, {
          user1: user.uid,
          user2: friendId,
          status: 'pending',
          initiatorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Request error:', err);
      // Revert request if failed
      setRequested(prev => prev.filter(id => id !== friendId));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1c1c1e' : '#f1f1f6' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#1c1c1e' }]}>Дос қосу</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color={isDark ? '#fff' : '#1c1c1e'} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }]}>
            <Search color="#8e8e93" size={20} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#fff' : '#1c1c1e' }]}
              placeholder="Қолданушы аты (ник)..."
              placeholderTextColor="#8e8e93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoFocus={Platform.OS !== 'web'}
            />
          </View>
        </View>

        <View style={styles.resultsContainer}>
          {loading ? (
            <View style={{ paddingTop: 20 }}>
              <ActivityIndicator color={isDark ? '#ffffff' : '#1c1c1e'} />
            </View>
          ) : searchQuery.length > 2 ? (
            results.length > 0 ? (
              results.map(u => (
                <View key={u.id} style={[styles.resultCard, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }]}>
                  <View style={styles.userInfo}>
                    <TouchableOpacity 
                      style={[styles.avatar, { backgroundColor: isDark ? '#3a3a3c' : '#f1f1f6', overflow: 'hidden' }]}
                      onPress={() => onFriendSelect && onFriendSelect({
                        id: u.id,
                        name: u.displayName || u.username,
                        avatar: (u.displayName || u.username || '?')[0].toUpperCase(),
                        photoURL: u.photoURL,
                        prayers: ['none', 'none', 'none', 'none', 'none'],
                        friendshipId: u.friendshipId,
                        isPrivate: u.isPrivate
                      })}
                    >
                      {u.photoURL ? (
                        <Image source={{ uri: u.photoURL }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <Text style={[styles.avatarText, { color: isDark ? '#fff' : '#1c1c1e' }]}>{(u.displayName || u.username || '?')[0].toUpperCase()}</Text>
                      )}
                    </TouchableOpacity>
                    <View>
                      <Text style={[styles.userName, { color: isDark ? '#fff' : '#1c1c1e' }]}>{u.displayName || u.username}</Text>
                      <Text style={styles.userHandle}>@{u.username}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[styles.addBtn, (requested.includes(u.id) || u.friendshipId) && styles.requestedBtn]}
                    onPress={() => {
                      if (!u.friendshipId && !requested.includes(u.id)) handleRequest(u.id);
                    }}
                    disabled={requested.includes(u.id) || !!u.friendshipId}
                  >
                    {(requested.includes(u.id) || !!u.friendshipId) ? (
                      <Check color="#fff" size={18} />
                    ) : (
                      <UserPlus color="#fff" size={18} />
                    )}
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Ешкім табылмады</Text>
              </View>
            )
          ) : (
             <View style={styles.emptyState}>
               <Search color="#8e8e93" size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
               <Text style={styles.emptyText}>Досыңызды табу үшін оның нигін жазыңыз</Text>
             </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: { fontSize: 20, fontWeight: '700', fontFamily },
  closeBtn: { padding: 4 },
  searchContainer: { padding: 16 },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily,
    height: '100%',
    outlineStyle: 'none',
  } as any,
  resultsContainer: { paddingHorizontal: 16 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '600', fontFamily },
  userName: { fontSize: 16, fontWeight: '600', fontFamily, marginBottom: 2 },
  userHandle: { fontSize: 13, color: '#8e8e93', fontFamily },
  addBtn: {
    backgroundColor: '#3b82f6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestedBtn: { backgroundColor: '#10b981' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#8e8e93', fontSize: 15, fontFamily, lineHeight: 22 },
});
