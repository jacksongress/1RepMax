"use client";

import { useAuth } from '../lib/hooks/useAuth';
import { Button } from "@/components/ui/button";

export default function SignInWithGoogle() {
  const { signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    console.log("Sign in button clicked");
    try {
      console.log("Attempting to sign in with Google");
      await signInWithGoogle();
      console.log("Sign in function completed");
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      className="flex items-center justify-center bg-white text-gray-700 font-semibold py-2 px-4 rounded-full border border-gray-300 hover:bg-gray-100 transition duration-300 ease-in-out w-full sm:w-auto"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-6 h-6 mr-2" />
      <span className="text-gray-700">Sign in with Google</span>
    </Button>
  );
}
