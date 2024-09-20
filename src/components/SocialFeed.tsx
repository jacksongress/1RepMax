import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { getFriendsWorkouts } from '../lib/firebase/firebaseUtils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import BackButton from './BackButton';

type Workout = {
  id: string;
  userId: string;
  userEmail: string;
  exercises: Array<{
    name: string;
    sets: Array<{
      weight: number;
      reps: number;
    }>;
  }>;
  duration: number;
  timestamp: Date;
};

export default function SocialFeed({ onBack }: { onBack: () => void }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [collapsedWorkouts, setCollapsedWorkouts] = useState<{[key: string]: boolean}>({});

  const fetchWorkouts = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedWorkouts = await getFriendsWorkouts(user.uid);
        setWorkouts(fetchedWorkouts as Workout[]);
        // Initialize all workouts as collapsed
        const initialCollapsedState = fetchedWorkouts.reduce((acc, workout) => {
          acc[workout.id] = true;
          return acc;
        }, {} as {[key: string]: boolean});
        setCollapsedWorkouts(initialCollapsedState);
      } catch (error) {
        console.error("Error fetching workouts:", error);
        setError("Failed to fetch workouts. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const toggleWorkoutCollapse = (workoutId: string) => {
    setCollapsedWorkouts(prev => ({
      ...prev,
      [workoutId]: !prev[workoutId]
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4 sm:p-6 pb-20"> {/* Added pb-20 for extra bottom padding */}
      <div className="flex items-center justify-between mb-4">
        <BackButton onBack={onBack} />
        <h2 className="text-2xl font-bold text-sky-600">Social Feed</h2>
      </div>
      {workouts.map((workout) => (
        <Card key={workout.id} className="overflow-hidden">
          <CardHeader className="bg-sky-100 py-2 sm:py-3 px-3 sm:px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-semibold text-sky-800">
              {workout.userEmail}&apos;s Workout
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleWorkoutCollapse(workout.id)}
              className="p-1"
            >
              {collapsedWorkouts[workout.id] ? <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </CardHeader>
          <CardContent className={`p-3 sm:p-4 ${collapsedWorkouts[workout.id] ? 'hidden' : ''}`}>
            <p className="text-sm sm:text-base">Duration: {formatTime(workout.duration)}</p>
            <p className="text-sm sm:text-base">Date: {new Date(workout.timestamp).toLocaleString()}</p>
            <div className="mt-2">
              <h3 className="font-semibold text-sm sm:text-base">Exercises:</h3>
              <ul className="list-disc list-inside text-sm sm:text-base">
                {workout.exercises.map((exercise, index) => (
                  <li key={index}>
                    {exercise.name}: {exercise.sets.length} sets
                    <ul className="list-disc list-inside ml-4 text-xs sm:text-sm">
                      {exercise.sets.map((set, setIndex) => (
                        <li key={setIndex}>
                          Set {setIndex + 1}: {set.weight} lbs x {set.reps} reps
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}