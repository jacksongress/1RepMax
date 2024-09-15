import { useState, useEffect } from 'react';
import { User, signInWithRedirect, GoogleAuthProvider, signOut as firebaseSignOut, getRedirectResult } from "firebase/auth";
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

    // Check for redirect result
    getRedirectResult(auth).then(async (result) => {
      console.log("Redirect result received", result ? "User found" : "No user");
      if (result?.user) {
        setUser(result.user);
        await createUserDocument(result.user.uid, { email: result.user.email || undefined });
      }
    }).catch((error) => {
      console.error("Error with redirect sign-in:", error);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    console.log("signInWithGoogle function called");
    const provider = new GoogleAuthProvider();
    try {
      console.log("Attempting signInWithRedirect");
      await signInWithRedirect(auth, provider);
      console.log("signInWithRedirect completed");
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signOut = () => firebaseSignOut(auth);

  return { user, signInWithGoogle, signOut };
}