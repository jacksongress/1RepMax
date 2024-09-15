import { useState, useEffect } from 'react';
import { User, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { createUserDocument } from '../firebase/firebaseUtils';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    console.log("useAuth effect running");
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("Auth state changed", user ? user.uid : "No user");
      setUser(user);
      if (user) {
        await createUserDocument(user.uid, { email: user.email || undefined });
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = () => firebaseSignOut(auth);

  return { user, signOut };
}