import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, signIn, signOut as firebaseSignOut, onAuthStateChanged } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import BackgroundBlobs from '@/components/layout/BackgroundBlobs';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const sessionStart = localStorage.getItem('session_start');
        const now = Date.now();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        
        if (sessionStart && (now - parseInt(sessionStart, 10) > SEVEN_DAYS_MS)) {
          // Session expired
          await firebaseSignOut(auth);
          setUser(null);
          localStorage.removeItem('session_start');
        } else {
          // Update or set if missing (for existing sessions)
          if (!sessionStart) {
            localStorage.setItem('session_start', now.toString());
          }
          setUser(currentUser);
        }
      } else {
        setUser(null);
        localStorage.removeItem('session_start');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signIn();
    } catch (error: any) {
      toast.error('Authentication failed', {
        description: error.message || 'Something went wrong while trying to log in.'
      });
    }
  };

  const logout = async () => {
    await firebaseSignOut();
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center text-white">
        <div className="w-8 h-8 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[100dvh] bg-black overflow-hidden selection:bg-primary/30 relative items-center justify-center">
        <BackgroundBlobs />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 text-center glass p-10 rounded-3xl max-w-md mx-auto"
        >
          <h1 className="text-4xl font-bold text-white mb-2">BeBetterVY</h1>
          <p className="text-muted-foreground mb-8">Your private digital sanctuary.</p>
          <Button onClick={login} className="bg-primary text-primary-foreground w-full">
            Sign In to Continue
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
