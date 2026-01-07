import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

/**
 * Hook custom per centralizzare la logica di autenticazione
 * Riduce la duplicazione del codice in tutti i componenti
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cleanup function per unsubscribe
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Auth error:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getUserRole = useCallback(async (uid) => {
    if (!uid) return null;
    
    try {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      
      if (snap.exists()) {
        return snap.data().role || null;
      }
      return null;
    } catch (err) {
      console.error('Error getting user role:', err);
      if (err?.message && err.message.toLowerCase().includes('offline')) {
        return null;
      }
      return null;
    }
  }, []);

  const updateUserProfile = useCallback(async (uid, data) => {
    if (!uid) throw new Error('User ID required');
    
    try {
      await setDoc(
        doc(db, "users", uid),
        {
          ...data,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  }, []);

  const createUserProfile = useCallback(async (uid, profileData) => {
    if (!uid) throw new Error('User ID required');
    
    try {
      await setDoc(
        doc(db, "users", uid),
        {
          ...profileData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error creating user profile:', err);
      throw err;
    }
  }, []);

  return {
    user,
    loading,
    error,
    getUserRole,
    updateUserProfile,
    createUserProfile,
    isAuthenticated: !!user,
    uid: user?.uid || null,
    email: user?.email || null,
  };
}
