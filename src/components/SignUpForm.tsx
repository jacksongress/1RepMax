import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase/firebase';
import { createUserDocument } from '../lib/firebase/firebaseUtils';
import { User } from 'firebase/auth';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await createUserDocument(user.uid, { email: user.email || undefined });
    } catch (error: any) {
      console.error('Detailed error:', error);
      if (error.code === 'auth/email-already-in-use') {
        // If the email is already in use, try to sign in instead
        try {
          await signInWithEmailAndPassword(auth, email, password);
          console.log('Signed in with existing account');
        } catch (signInError) {
          setError('This email is already in use. If this is your account, please sign in.');
        }
      } else {
        setError(`Error: ${error.message}`);
      }
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <button type="submit" className="w-full bg-sky-500 text-white py-2 rounded-md hover:bg-sky-600">Sign Up</button>
    </form>
  );
}