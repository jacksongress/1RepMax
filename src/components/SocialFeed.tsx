import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { getFriendsWorkouts } from '../lib/firebase/firebaseUtils';
import { Button } from "@/components/ui/button";

interface Workout {
  id: string;
  userId: string;
  userEmail: string;
  timestamp: Date;
  exercises: Array<{
    name: string;
    sets: Array<{ weight: number; reps: number }>;
  }>;
}

interface SocialFeedProps {
  onBack: () => void;
}

export default function SocialFeed({ onBack }: SocialFeedProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (user) {
        setIsLoading(true);
        setError(null);
        try {
          console.log("Fetching workouts for user:", user.uid);
          const fetchedWorkouts = await getFriendsWorkouts(user.uid);
          console.log("Fetched workouts:", fetchedWorkouts);
          setWorkouts(fetchedWorkouts as Workout[]);
        } catch (error) {
          console.error("Error fetching workouts:", error);
          setError("Failed to fetch workouts. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchWorkouts();
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Social Feed</h2>
        <Button onClick={onBack} variant="outline">Back</Button>
      </div>
      {isLoading ? (
        <p>Loading workouts...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : workouts.length === 0 ? (
        <div>
          <p>No workouts found. This could be because:</p>
          <ul className="list-disc list-inside mt-2">
            <li>You haven&apos;t added any friends yet</li>
            <li>You and your friends haven&apos;t logged any workouts</li>
            <li>The system is still processing recent changes (please try again in a few minutes)</li>
          </ul>
        </div>
      ) : (
        workouts.map((workout) => (
          <div key={workout.id} className="bg-white p-4 rounded-lg shadow mb-4">
            <p className="font-semibold">
              {workout.userId === user?.uid ? 'You' : workout.userEmail} completed a workout
            </p>
            <p className="text-sm text-gray-500">
              {new Date(workout.timestamp).toLocaleString()}
            </p>
            <div className="mt-2">
              {workout.exercises?.map((exercise, index) => (
                <div key={index} className="ml-4">
                  <p className="font-medium">{exercise.name}</p>
                  {exercise.sets?.map((set, setIndex) => (
                    <p key={setIndex} className="text-sm">
                      Set {setIndex + 1}: {set.weight} lbs x {set.reps} reps
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}