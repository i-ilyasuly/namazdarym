import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { Mail, Lock, User, UserCircle, Chrome, ArrowRight, CheckCircle2 } from 'lucide-react';

const { width } = Dimensions.get('window');
const s = (size: number) => (width / 390) * size;

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, signIn, signUp } = useAuth();
  const { isDark } = useAppTheme();

  const handleAuth = async () => {
    setError(null);
    if (!email || !password) {
      setError('Электрондық пошта мен құпия сөзді енгізіңіз');
      return;
    }

    if (mode === 'register') {
      if (!nickname) {
        setError('Никнеймді енгізіңіз');
        return;
      }
      if (!gender) {
        setError('Жынысыңызды таңдаңыз');
        return;
      }
      if (password !== confirmPassword) {
        setError('Құпия сөздер сәйкес келмейді');
        return;
      }
      if (password.length < 6) {
        setError('Құпия сөз кемінде 6 символдан тұруы тиіс');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, nickname, gender!);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('Пайдаланушы табылмады');
      else if (err.code === 'auth/wrong-password') setError('Құпия сөз қате');
      else if (err.code === 'auth/email-already-in-use') setError('Бұл пошта тіркелген');
      else setError('Қате орын алды. Қайта көріңіз');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await login();
    } catch (err) {
      setError('Google арқылы кіру кезінде қате орын алды');
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor = isDark ? '#121212' : '#ffffff';
  const cardBackground = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryText = isDark ? '#9ca3af' : '#666666';
  const inputBorder = isDark ? '#333333' : '#e0e0e0';
  const accentColor = isDark ? '#ffffff' : '#000000';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={[styles.brandTitle, { color: textColor }]}>NAMAZYM</Text>
            <Text style={[styles.brandSubtitle, { color: secondaryText }]}>
              Жалғастыру үшін жүйеге кіріңіз немесе тіркеліңіз
            </Text>
          </View>

          {/* Tab Selector */}
          <View style={[styles.segmentedControl, { backgroundColor: isDark ? '#262626' : '#f5f5f5' }]}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setMode('login')}
              style={[styles.segBtn, mode === 'login' && { backgroundColor: cardBackground, elevation: 1, shadowOpacity: 0.1 }]}
            >
              <Text style={[styles.segText, { color: mode === 'login' ? textColor : secondaryText }]}>Кіру</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setMode('register')}
              style={[styles.segBtn, mode === 'register' && { backgroundColor: cardBackground, elevation: 1, shadowOpacity: 0.1 }]}
            >
              <Text style={[styles.segText, { color: mode === 'register' ? textColor : secondaryText }]}>Тіркелу</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: cardBackground, borderColor: inputBorder }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>
              {mode === 'login' ? 'Қош келдіңіз' : 'Тіркелу'}
            </Text>

            <View style={styles.form}>
              {mode === 'register' && (
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: textColor }]}>Никнейм</Text>
                  <View style={[styles.inputWrapper, { borderColor: inputBorder }]}>
                    <User size={16} color={secondaryText} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.inputField, { color: textColor }]}
                      placeholder="Username"
                      placeholderTextColor={secondaryText}
                      value={nickname}
                      onChangeText={setNickname}
                    />
                  </View>
                </View>
              )}

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: textColor }]}>Электрондық пошта</Text>
                <View style={[styles.inputWrapper, { borderColor: inputBorder }]}>
                  <Mail size={16} color={secondaryText} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputField, { color: textColor }]}
                    placeholder="email@example.com"
                    placeholderTextColor={secondaryText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {mode === 'register' && (
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: textColor }]}>Жынысыңыз</Text>
                  <View style={styles.genderRow}>
                    <TouchableOpacity 
                      onPress={() => setGender('male')}
                      style={[
                        styles.genderOption, 
                        { borderColor: inputBorder },
                        gender === 'male' && { borderColor: textColor, backgroundColor: isDark ? '#333' : '#f9f9f9' }
                      ]}
                    >
                      <UserCircle color={gender === 'male' ? textColor : secondaryText} size={18} />
                      <Text style={[styles.genderOptionText, { color: gender === 'male' ? textColor : secondaryText }]}>Ер</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setGender('female')}
                      style={[
                        styles.genderOption, 
                        { borderColor: inputBorder },
                        gender === 'female' && { borderColor: textColor, backgroundColor: isDark ? '#333' : '#f9f9f9' }
                      ]}
                    >
                      <UserCircle color={gender === 'female' ? textColor : secondaryText} size={18} />
                      <Text style={[styles.genderOptionText, { color: gender === 'female' ? textColor : secondaryText }]}>Әйел</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.field}>
                <View style={styles.passwordHeader}>
                  <Text style={[styles.fieldLabel, { color: textColor }]}>Құпия сөз</Text>
                  {mode === 'login' && (
                    <TouchableOpacity>
                      <Text style={[styles.forgotLink, { color: secondaryText }]}>Ұмыттыңыз ба?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.inputWrapper, { borderColor: inputBorder }]}>
                  <Lock size={16} color={secondaryText} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputField, { color: textColor }]}
                    placeholder="••••••••"
                    placeholderTextColor={secondaryText}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              {mode === 'register' && (
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: textColor }]}>Құпия сөзді қайталаңыз</Text>
                  <View style={[styles.inputWrapper, { borderColor: inputBorder }]}>
                    <Lock size={16} color={secondaryText} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.inputField, { color: textColor }]}
                      placeholder="••••••••"
                      placeholderTextColor={secondaryText}
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>
              )}

              {error && <Text style={styles.errorMsg}>{error}</Text>}

              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.primaryBtn, { backgroundColor: accentColor }]} 
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={isDark ? '#ffffff' : '#1c1c1e'} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: isDark ? '#000' : '#fff' }]}>{mode === 'login' ? 'Кіру' : 'Тіркелу'}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.hLineWrapper}>
                <View style={[styles.hLine, { backgroundColor: inputBorder }]} />
                <Text style={[styles.hLineText, { color: secondaryText }]}>немесе</Text>
                <View style={[styles.hLine, { backgroundColor: inputBorder }]} />
              </View>

              <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.socialBtn, { borderColor: inputBorder }]} 
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                <Chrome size={18} color={textColor} />
                <Text style={[styles.socialBtnText, { color: textColor }]}>
                  Google арқылы
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(24),
    paddingTop: s(36),
    paddingBottom: s(30),
  },
  header: {
    alignItems: 'center',
    marginBottom: s(24),
  },
  brandTitle: {
    fontSize: s(24),
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: s(6),
    fontFamily: Platform.OS === 'web' ? 'Inter' : 'System',
  },
  brandSubtitle: {
    fontSize: s(13),
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Inter' : 'System',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: s(8),
    padding: s(3),
    marginBottom: s(16),
  },
  segBtn: {
    flex: 1,
    paddingVertical: s(8),
    borderRadius: s(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  segText: {
    fontSize: s(14),
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Inter' : 'System',
  },
  card: {
    borderRadius: s(14),
    padding: s(20),
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: s(18),
    fontWeight: '800',
    marginBottom: s(16),
  },
  form: {
    gap: s(14),
  },
  field: {
    gap: s(4),
  },
  fieldLabel: {
    fontSize: s(13),
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: s(44),
    borderWidth: 1,
    borderRadius: s(8),
    paddingHorizontal: s(10),
  },
  inputIcon: {
    marginRight: s(8),
  },
  inputField: {
    flex: 1,
    fontSize: s(14),
    fontWeight: '500',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: s(12),
    fontWeight: '600',
  },
  genderRow: {
    flexDirection: 'row',
    gap: s(10),
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: s(40),
    borderRadius: s(8),
    borderWidth: 1,
    gap: s(6),
  },
  genderOptionText: {
    fontSize: s(13),
    fontWeight: '700',
  },
  primaryBtn: {
    height: s(48),
    borderRadius: s(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(4),
  },
  primaryBtnText: {
    fontSize: s(15),
    fontWeight: '800',
  },
  hLineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: s(2),
  },
  hLine: {
    flex: 1,
    height: 1,
  },
  hLineText: {
    marginHorizontal: s(10),
    fontSize: s(11),
    fontWeight: '700',
  },
  socialBtn: {
    height: s(48),
    borderRadius: s(8),
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
  },
  socialBtnText: {
    fontSize: s(14),
    fontWeight: '700',
  },
  errorMsg: {
    color: '#ef4444',
    fontSize: s(12),
    fontWeight: '700',
    textAlign: 'center',
  },
});
