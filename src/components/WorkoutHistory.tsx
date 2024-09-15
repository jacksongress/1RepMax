import { useState, useEffect } from 'react';
import { getDocuments, deleteDocument } from '../lib/firebase/firebaseUtils';
import { useAuth } from '../lib/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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

  const fetchWorkouts = async () => {
    if (user) {
      setIsLoading(true);
      try {
        const fetchedWorkouts = await getDocuments('workouts') as Workout[];
        setWorkouts(fetchedWorkouts.filter((workout) => workout.userId === user.uid));
      } catch (error) {
        console.error('Error fetching workouts:', error);
        setWorkouts([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [user]);

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
              <Button
                onClick={() => handleDeleteWorkout(workout.id)}
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <h3 className="text-xl font-semibold">{new Date(workout.date).toLocaleDateString()}</h3>
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
          ))
        )}
      </div>
    </div>
  );
}