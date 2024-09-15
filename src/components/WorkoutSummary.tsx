import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WorkoutSummaryProps {
  workoutNumber: number;
  duration: number;
  exercises: Array<{ name: string; sets: any[] }>;
  onClose: () => void;
}

export default function WorkoutSummary({ workoutNumber, duration, exercises, onClose }: WorkoutSummaryProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-center text-sky-600">Great Job!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-lg text-center">You finished your workout #{workoutNumber}</p>
          <p className="text-center font-medium">Duration: {formatTime(duration)}</p>
          <div className="space-y-1">
            <p className="font-semibold">Exercises:</p>
            {exercises.map((exercise, index) => (
              <p key={index} className="pl-2">{exercise.sets.length} x {exercise.name}</p>
            ))}
          </div>
          <Button onClick={onClose} className="w-full bg-sky-500 hover:bg-sky-600 text-white mt-2">
            Close Summary
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}