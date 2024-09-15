import { useState } from 'react';
import WorkoutForm from './WorkoutForm';
import WorkoutHistory from './WorkoutHistory';
import SocialFeed from './SocialFeed';
import ProfileButton from './ProfileButton';
import StartWorkoutButton from './StartWorkoutButton';
import TemplateSelection from './TemplateSelection';
import { WorkoutTemplate } from '../lib/firebase/firebaseUtils';

export default function HomePage() {
  const [activeComponent, setActiveComponent] = useState<'home' | 'workout' | 'history' | 'social' | 'templateSelection'>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);

  const handleStartWorkout = () => {
    setActiveComponent('templateSelection');
  };

  const handleTemplateSelect = (template: WorkoutTemplate | null) => {
    setSelectedTemplate(template);
    setActiveComponent('workout');
  };

  const handleWorkoutEnd = () => {
    setActiveComponent('home');
    setSelectedTemplate(null);
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sky-600">1 Rep Max</h1>
          <ProfileButton />
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {activeComponent === 'home' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-center text-sky-800 mb-6">
                  Welcome to 1 Rep Max
                </h2>
                <div className="space-y-4">
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
              onBack={() => setActiveComponent('home')}  // Add this line
            />
          )}
          {activeComponent === 'workout' && (
            <WorkoutForm 
              onWorkoutEnd={handleWorkoutEnd} 
              initialTemplate={selectedTemplate}
            />
          )}
          {activeComponent === 'history' && (
            <WorkoutHistory onBack={() => setActiveComponent('home')} />
          )}
          {activeComponent === 'social' && (
            <SocialFeed onBack={() => setActiveComponent('home')} />
          )}
        </div>
      </main>
    </div>
  );
}