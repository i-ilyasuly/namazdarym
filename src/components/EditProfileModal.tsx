import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { X, User, UserCircle } from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const fontFamily = Platform.OS === 'web' 
  ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif'
  : 'System';

export default function EditProfileModal({ visible, onClose, forceUsername = false }: { visible: boolean; onClose: () => void, forceUsername?: boolean }) {
  const { isDark } = useAppTheme();
  const { user, profile, updateProfileData } = useAuth();
  
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'none'>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && profile) {
      setUsername(profile.username || '');
      setDisplayName(profile.displayName || '');
      setGender(profile.gender || 'none');
      setError('');
    }
  }, [visible, profile]);

  const handleSave = async () => {
    const cleanUser = username.trim().toLowerCase();
    
    if (!cleanUser) {
      setError('Никті енгізу міндетті');
      return;
    }

    if (gender === 'none') {
      setError('Жынысты таңдау міндетті');
      return;
    }
    
    // basic validation
    if (!/^[a-z0-9_.]+$/.test(cleanUser)) {
      setError('Ник тек латын әріптерін, сандарды, _ және . таңбаларын қабылдайды');
      return;
    }
    
    if (cleanUser.length < 3) {
      setError('Ник кемінде 3 таңбадан тұруы керек');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if username is already taken by someone else
      if (cleanUser !== profile?.usernameLowercase) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('usernameLowercase', '==', cleanUser));
        const querySnapshot = await getDocs(q);
        
        const isTakenByOthers = !querySnapshot.empty && querySnapshot.docs.some(doc => doc.id !== user?.uid);
        
        if (isTakenByOthers) {
          setError('Бұл ник бос емес');
          setLoading(false);
          return;
        }
      }

      const updates: any = {
        username: username.trim(),
        usernameLowercase: cleanUser,
        displayName: displayName.trim() || username.trim(),
      };

      if (!profile?.gender || profile.gender === 'none') {
        updates.gender = gender;
      }

      await updateProfileData(updates);
      
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Қате пайда болды');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => {
      if (!forceUsername) onClose();
    }}>
      <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1c1c1e' : '#f1f1f6' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#1c1c1e' }]}>Профильді өңдеу</Text>
          {!forceUsername && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={isDark ? '#fff' : '#1c1c1e'} size={24} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.formContainer}>
          {forceUsername && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>Жалғастыру үшін міндетті түрде өзіңізге ник (username) және жынысыңызды таңдаңыз.</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? '#a1a1aa' : '#8e8e93' }]}>Аты-жөніңіз</Text>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }]}>
              <TextInput
                style={[styles.input, { color: isDark ? '#fff' : '#1c1c1e' }]}
                placeholder="Мысалы: Мақсат"
                placeholderTextColor="#8e8e93"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? '#a1a1aa' : '#8e8e93' }]}>Ник (Username)</Text>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }]}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={[styles.input, { color: isDark ? '#fff' : '#1c1c1e' }]}
                placeholder="maksat_123"
                placeholderTextColor="#8e8e93"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text style={styles.helperText}>Достарыңыз сізді осы ник арқылы таба алады</Text>
          </View>

          {(!profile?.gender || profile.gender === 'none') && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#a1a1aa' : '#8e8e93' }]}>Жынысыңыз</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity 
                  onPress={() => setGender('male')}
                  style={[
                    styles.genderBtn, 
                    { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' },
                    gender === 'male' && { borderColor: '#3b82f6', borderWidth: 2 }
                  ]}
                >
                  <UserCircle color={gender === 'male' ? '#3b82f6' : '#8e8e93'} size={24} />
                  <Text style={[styles.genderText, { color: gender === 'male' ? '#3b82f6' : (isDark ? '#fff' : '#1c1c1e') }]}>Ер</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setGender('female')}
                  style={[
                    styles.genderBtn, 
                    { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' },
                    gender === 'female' && { borderColor: '#ec4899', borderWidth: 2 }
                  ]}
                >
                  <UserCircle color={gender === 'female' ? '#ec4899' : '#8e8e93'} size={24} />
                  <Text style={[styles.genderText, { color: gender === 'female' ? '#ec4899' : (isDark ? '#fff' : '#1c1c1e') }]}>Әйел</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.saveBtn, { opacity: loading ? 0.7 : 1 }]} 
            onPress={handleSave} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={isDark ? '#ffffff' : '#1c1c1e'} /> : <Text style={styles.saveBtnText}>Сақтау</Text>}
          </TouchableOpacity>
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
  formContainer: { padding: 20 },
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)'
  },
  warningText: {
    color: '#d97706',
    fontFamily,
    fontSize: 14,
    lineHeight: 20
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', fontFamily, marginBottom: 8, textTransform: 'uppercase' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  atSymbol: {
    fontSize: 16,
    color: '#8e8e93',
    fontFamily,
    marginRight: 4,
    fontWeight: '600'
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily,
    height: '100%',
    outlineStyle: 'none',
  } as any,
  helperText: {
    fontSize: 12,
    color: '#8e8e93',
    fontFamily,
    marginTop: 8,
    marginLeft: 4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily,
  },
  errorText: {
    color: '#ef4444',
    fontFamily,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center'
  },
  saveBtn: {
    backgroundColor: '#10b981',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily,
  }
});
