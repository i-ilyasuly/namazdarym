import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
  login: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, nickname: string, gender: 'male' | 'female') => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: any) => Promise<void>;
  logPrayer: (prayerKey: string, status: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  login: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  logout: async () => {},
  updateProfileData: async () => {},
  logPrayer: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch user profile
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          setProfile(profileData);

          // Streak reset logic
          const lastStreakUpdate = profileData.lastStreakUpdate || '';
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastStreakUpdate && lastStreakUpdate !== yesterdayStr && lastStreakUpdate !== today) {
            // Missed at least one full day since last 5/5
            await setDoc(userDocRef, { streak: 0 }, { merge: true });
            setProfile(prev => ({ ...prev, streak: 0 }));
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if profile exists for Google user
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      const newProfile = {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        username: user.displayName || '',
        usernameLowercase: (user.displayName || '').toLowerCase(),
        gender: 'none',
        points: 0,
        streak: 0,
        lastStreakUpdate: '',
        createdAt: serverTimestamp(),
        isDark: false,
        colorMode: 'vibrant',
        isPrivate: false,
      };
      await setDoc(userDocRef, newProfile);
      setProfile(newProfile);
    }
  };

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUp = async (email: string, pass: string, nickname: string, gender: 'male' | 'female') => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;

    await updateProfile(user, { displayName: nickname });

    const newProfile = {
      email: user.email,
      displayName: nickname,
      username: nickname,
      usernameLowercase: nickname.toLowerCase(),
      gender: gender,
      points: 0,
      streak: 0,
      lastStreakUpdate: '',
      createdAt: serverTimestamp(),
      isDark: false,
      colorMode: 'vibrant',
      isPrivate: false,
    };

    await setDoc(doc(db, 'users', user.uid), newProfile);
    setProfile(newProfile);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfileData = async (data: any) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    // Use setDoc with merge to update partial data
    await setDoc(userDocRef, data, { merge: true });
    
    // Also update local state to reflect changes instantly
    setProfile((prev: any) => ({ ...prev, ...data }));
  };

  const logPrayer = async (prayerKey: string, status: string) => {
    if (!user || !profile) return;

    const today = new Date().toISOString().split('T')[0];
    const prayerDocRef = doc(db, 'users', user.uid, 'prayers', today);
    
    // 1. Update prayer log
    const prayerDoc = await getDoc(prayerDocRef);
    const prayerData = prayerDoc.exists() ? prayerDoc.data() : {
      fajr: 'none',
      dhuhr: 'none',
      asr: 'none',
      maghrib: 'none',
      isha: 'none',
      createdAt: serverTimestamp()
    };

    const oldStatus = prayerData[prayerKey] || 'none';
    const newPrayerData = {
      ...prayerData,
      [prayerKey]: status,
      updatedAt: serverTimestamp()
    };

    await setDoc(prayerDocRef, newPrayerData);

    // 2. Update points and streak
    const getPoints = (s: string) => {
      if (s === 'jamaat') return 15;
      if (s === 'on_time') return 10;
      if (s === 'late') return 5;
      return 0;
    };

    const pointsToRemove = getPoints(oldStatus);
    const pointsToAdd = getPoints(status);
    
    let newPoints = (profile.points || 0) - pointsToRemove + pointsToAdd;
    if (newPoints < 0) newPoints = 0;

    const updates: any = { points: newPoints };

    // Update points history for charts
    const pointsHistory = profile.pointsHistory || {};
    pointsHistory[today] = newPoints;
    updates.pointsHistory = pointsHistory;

    // Check streak - anything other than 'none' or 'qaza' is considered done
    const isDone = (s: string) => s && s !== 'none' && s !== 'qaza';
    const allDone = isDone(newPrayerData.fajr) && 
                    isDone(newPrayerData.dhuhr) && 
                    isDone(newPrayerData.asr) && 
                    isDone(newPrayerData.maghrib) && 
                    isDone(newPrayerData.isha);
    
    if (allDone) {
      const lastStreakUpdate = profile.lastStreakUpdate || '';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastStreakUpdate === yesterdayStr) {
        updates.streak = (profile.streak || 0) + 1;
        updates.lastStreakUpdate = today;
      } else if (lastStreakUpdate !== today) {
        updates.streak = 1;
        updates.lastStreakUpdate = today;
      }
    } else {
      // If was allDone but now one is undone, we might need to handle streak reversal
      // but typically streaks only update once per day upon completion.
      // If they un-check a prayer after completing the day, the streak stays for now (standard behavior).
    }

    await updateProfileData(updates);
  };

  return (
    <AuthContext.Provider value={{ user, loading, profile, login, signIn, signUp, logout, updateProfileData, logPrayer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
