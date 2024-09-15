import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Check, Trash2 } from "lucide-react";
import { addDocument } from '../lib/firebase/firebaseUtils';
import { useAuth } from '../lib/hooks/useAuth';
import WorkoutSummary from './WorkoutSummary';
import { addWorkout } from '../lib/firebase/firebaseUtils';

type Set = {
  id: number;
  weight: string;
  reps: string;
  completed: boolean;
};

type Exercise = {
  id: number;
  name: string;
  sets: Set[];
};

export default function WorkoutForm({ onWorkoutEnd }: { onWorkoutEnd: () => void }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const { user } = useAuth();
  const [time, setTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [customExercises, setCustomExercises] = useState<string[]>([]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExerciseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedExercise(e.target.value);
    if (e.target.value !== 'other') {
      setNewExerciseName('');
    }
  };

  const addExercise = () => {
    let exerciseName = selectedExercise === 'other' ? newExerciseName : selectedExercise;
    if (exerciseName.trim()) {
      setExercises([...exercises, { id: Date.now(), name: exerciseName, sets: [] }]);
      if (selectedExercise === 'other' && !customExercises.includes(newExerciseName)) {
        setCustomExercises([...customExercises, newExerciseName]);
      }
      setNewExerciseName('');
      setSelectedExercise('');
    }
  };

  const addSet = (exerciseId: number) => {
    setExercises(exercises.map(exercise => 
      exercise.id === exerciseId 
        ? { ...exercise, sets: [...exercise.sets, { id: Date.now(), weight: '', reps: '', completed: false }] }
        : exercise
    ));
  };

  const updateSet = (exerciseId: number, setId: number, field: 'weight' | 'reps', value: string) => {
    setExercises(exercises.map(exercise => 
      exercise.id === exerciseId 
        ? { ...exercise, sets: exercise.sets.map(set => 
            set.id === setId ? { ...set, [field]: value } : set
          )}
        : exercise
    ));
  };

  const toggleSetCompletion = (exerciseId: number, setId: number) => {
    setExercises(exercises.map(exercise => 
      exercise.id === exerciseId 
        ? { ...exercise, sets: exercise.sets.map(set => 
            set.id === setId ? { ...set, completed: !set.completed } : set
          )}
        : exercise
    ));
  };

  const deleteSet = (exerciseId: number, setId: number) => {
    setExercises(exercises.map(exercise => 
      exercise.id === exerciseId 
        ? { ...exercise, sets: exercise.sets.filter(set => set.id !== setId) }
        : exercise
    ));
  };

  const handleEndWorkout = async () => {
    if (user) {
      try {
        const workoutData = {
          exercises: exercises.map(exercise => ({
            name: exercise.name,
            sets: exercise.sets.map(set => ({
              weight: parseFloat(set.weight) || 0,
              reps: parseInt(set.reps) || 0,
            }))
          })),
          duration: time,
        };
        console.log("Attempting to save workout:", workoutData);
        const workoutId = await addWorkout(user.uid, workoutData);
        console.log("Workout posted successfully with ID:", workoutId);
        setShowSummary(true);
      } catch (error) {
        console.error("Error posting workout:", error);
      }
    }
  };

  // Remove or comment out this function
  // const endWorkout = async () => { ... };

  // Update the onClick handler for the "End Workout" button
  <Button onClick={handleEndWorkout} variant="destructive">
    End Workout
  </Button>

  const closeSummary = () => {
    setShowSummary(false);
    setExercises([]);
    setTime(0);
    onWorkoutEnd();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex justify-between items-center bg-white rounded-lg shadow-md p-4">
        <h2 className="text-2xl font-bold text-sky-600">Workout Session</h2>
        <div className="flex items-center gap-4">
          <span className="text-xl font-semibold text-sky-600">{formatTime(time)}</span>
          <Button onClick={handleEndWorkout} variant="destructive">
            End Workout
          </Button>
        </div>
      </div>

      {/* Move the Add Exercise section here */}
      <Card className="bg-white shadow-md overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <select
            value={selectedExercise}
            onChange={handleExerciseSelect}
            className="w-full bg-white text-sky-900 h-12 border border-sky-200 rounded-md px-3"
          >
            <option value="">Select an exercise</option>
            <option value="Squat">Squat</option>
            <option value="Bench Press">Bench Press</option>
            <option value="Deadlift">Deadlift</option>
            <option value="Overhead Press">Overhead Press</option>
            <option value="Barbell Row">Barbell Row</option>
            <option value="Pull-up">Pull-up</option>
            {customExercises.map((exercise) => (
              <option key={exercise} value={exercise}>{exercise}</option>
            ))}
            <option value="other">Other</option>
          </select>
          {selectedExercise === 'other' && (
            <Input 
              type="text" 
              placeholder="Enter custom exercise name" 
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              className="w-full h-12 border border-sky-200"
            />
          )}
          <Button 
            onClick={addExercise} 
            className="w-full bg-sky-500 text-white hover:bg-sky-600 h-12"
            disabled={!selectedExercise || (selectedExercise === 'other' && !newExerciseName.trim())}
          >
            Add Exercise
          </Button>
        </CardContent>
      </Card>

      {/* List of exercises */}
      {exercises.map(exercise => (
        <Card key={exercise.id} className="overflow-hidden">
          <CardHeader className="bg-sky-100 py-3 px-4">
            <CardTitle className="text-lg font-semibold text-sky-800">{exercise.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {exercise.sets.map((set, index) => (
                <div 
                  key={set.id} 
                  className={`flex items-center gap-4 p-3 rounded ${set.completed ? 'bg-green-100' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-center w-10">
                    <div className="text-lg font-bold text-sky-600">#{index + 1}</div>
                  </div>
                  <Input 
                    type="text" 
                    placeholder="lbs" 
                    value={set.weight} 
                    onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                    className="w-20 h-9 text-sm text-center font-semibold"
                  />
                  <Input 
                    type="text" 
                    placeholder="reps" 
                    value={set.reps} 
                    onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                    className="w-20 h-9 text-sm text-center font-semibold"
                  />
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-9 h-9 p-0"
                    onClick={() => toggleSetCompletion(exercise.id, set.id)}
                  >
                    <Check className={`h-5 w-5 ${set.completed ? 'text-green-500' : 'text-gray-300'}`} />
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-9 h-9 p-0"
                    onClick={() => deleteSet(exercise.id, set.id)}
                  >
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => addSet(exercise.id)} 
              variant="outline" 
              size="sm"
              className="mt-4 text-sky-600 border-sky-300 hover:bg-sky-50 w-full py-2 flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Set
            </Button>
          </CardContent>
        </Card>
      ))}

      {showSummary && (
        <WorkoutSummary
          workoutNumber={exercises.length}
          duration={time}
          exercises={exercises}
          onClose={closeSummary}
        />
      )}
    </div>
  );
}