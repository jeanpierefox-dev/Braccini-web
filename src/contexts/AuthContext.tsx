import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserRole = 'admin' | 'member' | 'guest';

// Mock user type that matches what we need from Firebase User
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  loginWithCredentials: (u: string, p: string) => Promise<void>;
  signOut: () => Promise<void>;
  promoteToAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Check for mock user in localStorage
    const mockUserStr = localStorage.getItem('mockUser');
    if (mockUserStr) {
      const mockUser = JSON.parse(mockUserStr);
      setUser(mockUser);
      setRole(mockUser.role);
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      // If we have a mock user in state, don't overwrite it with null from Firebase
      if (localStorage.getItem('mockUser')) {
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });

        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setRole(userSnap.data().role as UserRole);
          } else {
            await setDoc(userRef, {
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'member',
              createdAt: serverTimestamp()
            });
            setRole('member');
          }
        } catch (e) {
          console.warn("Firestore access denied, defaulting to member role");
          setRole('member');
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithCredentials = async (username: string, pass: string) => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      if (username === 'adm' && pass === '1234') {
        const mockAdmin = {
          uid: 'mock-admin-123',
          email: 'admin@voleyclub.com',
          displayName: 'Administrador Principal',
          photoURL: null,
          role: 'admin'
        };
        localStorage.setItem('mockUser', JSON.stringify(mockAdmin));
        setUser(mockAdmin);
        setRole('admin');
        
        // Try to create the user doc in firestore for consistency
        try {
          await setDoc(doc(db, 'users', mockAdmin.uid), {
            email: mockAdmin.email,
            name: mockAdmin.displayName,
            role: 'admin',
            createdAt: serverTimestamp()
          });
        } catch (e) {
          console.warn("Could not save mock user to Firestore:", e);
        }
      } else {
        const email = `${username.trim().toLowerCase()}@voleyclub.app`;
        await signInWithEmailAndPassword(auth, email, pass);
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert("Usuario o contraseña incorrectos.");
      } else {
        alert("Ocurrió un error al iniciar sesión.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('mockUser');
    setUser(null);
    setRole(null);
    await auth.signOut();
  };

  const promoteToAdmin = async () => {
    if (user) {
      if (user.uid === 'mock-admin-123') return;
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, { role: 'admin' }, { merge: true });
        setRole('admin');
        alert('Promovido a Administrador');
      } catch (e) {
        alert('Error al promover: permisos insuficientes');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, loginWithCredentials, signOut, promoteToAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
