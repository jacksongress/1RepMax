import { useState, useEffect } from 'react';
import WorkoutForm from './WorkoutForm';
import WorkoutHistory from './WorkoutHistory';
import SocialFeed from './SocialFeed';
import ProfileButton from './ProfileButton';
import StartWorkoutButton from './StartWorkoutButton';
import TemplateSelection from './TemplateSelection';
import { WorkoutTemplate, getWorkoutState, saveWorkoutState } from '../lib/firebase/firebaseUtils'; // Add saveWorkoutState here
import { useAuth } from '../lib/hooks/useAuth';
import ResumeWorkoutPrompt from './ResumeWorkoutPrompt'; // New component we'll create

export default function HomePage() {
  const [activeComponent, setActiveComponent] = useState<'home' | 'workout' | 'history' | 'social' | 'templateSelection' | 'resumePrompt'>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [ongoingWorkout, setOngoingWorkout] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkOngoingWorkout = async () => {
      console.log('Checking for ongoing workout, user:', user);
      if (user) {
        console.log('User ID:', user.uid);
        const savedWorkout = await getWorkoutState(user.uid);
        console.log('Retrieved ongoing workout:', savedWorkout);
        if (savedWorkout) {
          setOngoingWorkout(savedWorkout);
          setActiveComponent('resumePrompt');
        }
      } else {
        console.log('No user logged in');
      }
    };

    checkOngoingWorkout();
  }, [user]);

  useEffect(() => {
    console.log('User state changed:', user);
  }, [user]);

  const handleStartWorkout = () => {
    setActiveComponent('templateSelection');
  };

  const handleTemplateSelect = (template: WorkoutTemplate | null) => {
    setSelectedTemplate(template);
    setActiveComponent('workout');
  };

  const handleWorkoutEnd = async () => {
    setActiveComponent('home');
    setSelectedTemplate(null);
    if (user && ongoingWorkout) {
      try {
        await saveWorkoutState(user.uid, null);
        console.log('Workout state cleared successfully');
      } catch (error) {
        console.error('Error clearing workout state:', error);
        // You might want to show an alert to the user here
      }
    }
    setOngoingWorkout(null);
  };

  const handleResumeWorkout = () => {
    setActiveComponent('workout');
  };

  return (
    <div className={`h-screen bg-sky-50 flex flex-col ${activeComponent === 'home' ? 'overflow-hidden' : ''}`}>
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-sky-600">1 Rep Max</h1>
          <ProfileButton />
        </div>
      </header>
      <main className={`flex-grow flex items-start justify-center p-4 ${activeComponent === 'home' ? 'overflow-hidden' : 'overflow-auto'}`}>
        <div className={`w-full max-w-md ${activeComponent === 'home' ? 'mt-8 sm:mt-12' : ''}`}>
          {activeComponent === 'home' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-center text-sky-800 mb-4">
                  Welcome to 1 Rep Max
                </h2>
                <div className="space-y-3">
                  <StartWorkoutButton onStart={handleStartWorkout} />
                  <button
                    onClick={() => setActiveComponent('history')}
                    className="w-full border border-sky-500 text-sky-600 hover:bg-sky-50 font-semibold py-2 px-4 rounded transition duration-150 ease-in-out"
                  >
                    Workout History
                  </button>
                  <button
                    onClick={() => setActiveComponent('social')}
                    className="w-full border border-sky-500 text-sky-600 hover:bg-sky-50 font-semibold py-2 px-4 rounded transition duration-150 ease-in-out"
                  >
                    Social Feed
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeComponent === 'templateSelection' && (
            <TemplateSelection 
              onTemplateSelect={handleTemplateSelect} 
              onBack={() => setActiveComponent('home')}
            />
          )}
          {activeComponent === 'workout' && (
            <WorkoutForm 
              onWorkoutEnd={handleWorkoutEnd} 
              initialTemplate={selectedTemplate}
              initialWorkout={ongoingWorkout}
            />
          )}
          {activeComponent === 'history' && (
            <WorkoutHistory onBack={() => setActiveComponent('home')} />
          )}
          {activeComponent === 'social' && (
            <SocialFeed onBack={() => setActiveComponent('home')} />
          )}
          {activeComponent === 'resumePrompt' && (
            <ResumeWorkoutPrompt
              onResume={handleResumeWorkout}
              onEnd={handleWorkoutEnd}
              workout={ongoingWorkout}
            />
          )}
        </div>
      </main>
    </div>
  );
}