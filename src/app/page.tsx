'use client';

import { useAuth } from "../lib/hooks/useAuth";
import LandingPage from "../components/LandingPage";
import HomePage from "../components/HomePage";

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-sky-50">
      {user ? <HomePage /> : <LandingPage />}
    </main>
  );
}
