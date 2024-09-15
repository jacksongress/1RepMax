import { useState } from 'react';
import SignUpForm from "./SignUpForm";
import SignInForm from "./SignInForm";

export default function LandingPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-400 to-sky-200">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-center text-sky-700 mb-6">Welcome to 1 Rep Max</h1>
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setIsSignUp(false)}
              className={`px-4 py-2 ${!isSignUp ? 'bg-sky-500 text-white' : 'bg-gray-200'} rounded-l-md`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`px-4 py-2 ${isSignUp ? 'bg-sky-500 text-white' : 'bg-gray-200'} rounded-r-md`}
            >
              Sign Up
            </button>
          </div>
          {isSignUp ? <SignUpForm /> : <SignInForm />}
        </div>
      </div>
    </div>
  );
}