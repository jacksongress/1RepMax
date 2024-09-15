import React, { useState, useEffect, useCallback } from 'react';
import { getDocuments, deleteDocument } from '../lib/firebase/firebaseUtils';
import { useAuth } from '../lib/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface Workout {
  id: string;
  userId: string;
  date: string;
  exercises: { name: string; sets: { reps: number; weight: number }[] }[];
}

interface WorkoutHistoryProps {
  onBack: () => void;
}

export default function WorkoutHistory({ onBack }: WorkoutHistoryProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [collapsedWorkouts, setCollapsedWorkouts] = useState<{[key: string]: boolean}>({});

  const fetchWorkouts = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      try {
        const fetchedWorkouts = await getDocuments('workouts') as Workout[];
        const userWorkouts = fetchedWorkouts
          .filter((workout) => workout.userId === user.uid)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date, newest first
        setWorkouts(userWorkouts);
        
        // Initialize all workouts as collapsed except the most recent one
        const initialCollapsedState = userWorkouts.reduce((acc, workout, index) => {
          acc[workout.id] = index !== 0; // Only the first workout (index 0) is uncollapsed
          return acc;
        }, {} as {[key: string]: boolean});
        setCollapsedWorkouts(initialCollapsedState);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        setWorkouts([]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleDeleteWorkout = async (workoutId: string) => {
    if (confirm("Are you sure you want to delete this workout? This action cannot be undone.")) {
      try {
        await deleteDocument('workouts', workoutId);
        setWorkouts(workouts.filter(workout => workout.id !== workoutId));
      } catch (error) {
        console.error('Error deleting workout:', error);
        alert('Failed to delete workout. Please try again.');
      }
    }
  };

  const toggleWorkoutCollapse = (workoutId: string) => {
    setCollapsedWorkouts(prev => ({
      ...prev,
      [workoutId]: !prev[workoutId]
    }));
  };

  if (isLoading) {
    return <div className="text-center">Loading workouts...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Workout History</h2>
          <Button
            onClick={onBack}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out"
          >
            Back to Home
          </Button>
        </div>
        {workouts.length === 0 ? (
          <div className="text-center">No workouts found. Start your first workout!</div>
        ) : (
          workouts.map((workout) => (
            <div key={workout.id} className="mb-4 p-4 bg-gray-50 rounded shadow relative">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{new Date(workout.date).toLocaleDateString()}</h3>
                <div className="flex items-center">
                  <Button
                    onClick={() => toggleWorkoutCollapse(workout.id)}
                    variant="outline"
                    size="sm"
                    className="mr-2"
                  >
                    {collapsedWorkouts[workout.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => handleDeleteWorkout(workout.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {!collapsedWorkouts[workout.id] && (
                <div className="mt-2">
                  {workout.exercises?.map((exercise, index) => (
                    <div key={index} className="mt-2">
                      <h4 className="font-medium">{exercise.name}</h4>
                      {exercise.sets.map((set, setIndex) => (
                        <p key={setIndex}>
                          Set {setIndex + 1}: {set.reps} reps @ {set.weight} lbs
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}