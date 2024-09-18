import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addWorkout, saveWorkoutState } from '../lib/firebase/firebaseUtils';
import { useAuth } from '../lib/hooks/useAuth';

interface ResumeWorkoutPromptProps {
  onResume: () => void;
  onEnd: () => void;
  workout: any;
}

export default function ResumeWorkoutPrompt({ onResume, onEnd, workout }: ResumeWorkoutPromptProps) {
  const { user } = useAuth();

  const handleEndWorkout = async () => {
    if (user && workout) {
      try {
        const workoutData = {
          exercises: workout.exercises.map((exercise: any) => ({
            name: exercise.name,
            sets: exercise.sets.map((set: any) => ({
              weight: parseFloat(set.weight) || 0,
              reps: parseInt(set.reps) || 0,
            }))
          })),
          duration: workout.elapsedTime,
        };
        await addWorkout(user.uid, workoutData);
        await saveWorkoutState(user.uid, null);
        onEnd();
      } catch (error) {
        console.error('Error ending workout:', error);
        alert('There was an error ending your workout. Please try again.');
      }
    } else {
      onEnd();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center text-sky-600">Ongoing Workout Detected</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center">You have an unfinished workout. Would you like to resume or end it?</p>
        <div className="flex justify-center space-x-4">
          <Button onClick={onResume} className="bg-sky-500 hover:bg-sky-600 text-white">
            Resume Workout
          </Button>
          <Button onClick={handleEndWorkout} variant="outline" className="border-sky-500 text-sky-600 hover:bg-sky-50">
            End Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}