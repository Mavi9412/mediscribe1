
"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

interface UserProfile {
  plan?: 'free' | 'pro';
  [key: string]: any;
}

interface AuthContextType {
  user: User | null | undefined;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error?: Error;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, authLoading, error] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const profileRef = doc(db, 'userProfiles', user.uid);
      const unsubscribe = onSnapshot(profileRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          setUserProfile({ plan: 'free' }); // Default fallback
        }
        setProfileLoading(false);
      });

      return () => unsubscribe();
    } else {
      setUserProfile(null);
      setProfileLoading(false);
    }
  }, [user]);
  
  const isLoading = authLoading || profileLoading;

  return (
    <AuthContext.Provider value={{ user, userProfile, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
