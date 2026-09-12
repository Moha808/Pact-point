import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { auth, db, googleProvider } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface SignupData {
  fullName: string;
  businessName: string;
  email: string;
  username: string;
  phone: string;
  role: 'owner' | 'negotiator';
  password?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: UserRole;
  loading: boolean;
  registeredUsers: UserProfile[];
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (data: SignupData) => Promise<void>;
  loginWithGoogle: (role?: 'owner' | 'negotiator') => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Firebase Auth state listener
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        if (db) {
          try {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              setCurrentUser(userSnap.data() as UserProfile);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error retrieving Firestore user profile:', err);
          }
        }

        // Fallback user profile if doc not yet created
        const profile: UserProfile = {
          uid: fbUser.uid,
          fullName: fbUser.displayName || 'Business Executive',
          businessName: 'Enterprise Entity',
          email: fbUser.email || '',
          username: fbUser.email?.split('@')[0] || 'user',
          phone: '',
          role: 'owner',
          createdAt: new Date().toISOString(),
          status: 'active',
        };
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Realtime listener for all registered users (for counterparties and admin table)
  useEffect(() => {
    if (!db) return;

    try {
      const usersQuery = query(collection(db, 'users'));
      const unsub = onSnapshot(
        usersQuery,
        (snapshot) => {
          const users: UserProfile[] = [];
          snapshot.forEach((d) => {
            users.push({ uid: d.id, ...d.data() } as UserProfile);
          });
          setRegisteredUsers(users);
        },
        (err) => {
          console.warn('Firestore users listener notice:', err);
        }
      );

      return () => unsub();
    } catch (e) {
      console.warn('Could not establish real users listener:', e);
    }
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (db) {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists()) {
        setCurrentUser(snap.data() as UserProfile);
      }
    }
  };

  const signupWithEmail = async (data: SignupData) => {
    if (!auth || !data.password) throw new Error('Missing password or Auth');
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);

    const newProfile: UserProfile = {
      uid: cred.user.uid,
      fullName: data.fullName,
      businessName: data.businessName,
      email: data.email,
      username: data.username,
      phone: data.phone,
      role: data.role,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    if (db) {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    }
    setCurrentUser(newProfile);
  };

  const loginWithGoogle = async (role: 'owner' | 'negotiator' = 'owner') => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    if (db) {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const newProfile: UserProfile = {
          uid: fbUser.uid,
          fullName: fbUser.displayName || 'Google User',
          businessName: 'Business Partner',
          email: fbUser.email || '',
          username: fbUser.email?.split('@')[0] || 'user',
          phone: '',
          role: role,
          avatarUrl: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          status: 'active',
        };
        await setDoc(userRef, newProfile);
        setCurrentUser(newProfile);
        return;
      } else {
        setCurrentUser(snap.data() as UserProfile);
      }
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);

    if (db) {
      await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole: currentUser ? currentUser.role : 'observer',
        loading,
        registeredUsers,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
