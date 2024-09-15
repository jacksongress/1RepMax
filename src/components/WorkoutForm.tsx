import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Check, Trash2, ChevronDown, ChevronUp, Search, BarChart2 } from "lucide-react";
import { addDocument, getExerciseHistory } from '../lib/firebase/firebaseUtils';
import { useAuth } from '../lib/hooks/useAuth';
import WorkoutSummary from './WorkoutSummary';
import { addWorkout } from '../lib/firebase/firebaseUtils';
import { addCustomExercise, getCustomExercises } from '../lib/firebase/firebaseUtils';
import { saveWorkoutTemplate, WorkoutTemplate } from '../lib/firebase/firebaseUtils';

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

type ExerciseHistory = {
  date: Date;
  sets: { weight: number; reps: number }[];
};

type WorkoutFormProps = {
  onWorkoutEnd: () => void;
  initialTemplate: WorkoutTemplate | null;
};

export default function WorkoutForm({ onWorkoutEnd, initialTemplate }: WorkoutFormProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredExercises, setFilteredExercises] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showSummary, setShowSummary] = useState(false);
  const { user } = useAuth();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  const [collapsedExercises, setCollapsedExercises] = useState<{[key: number]: boolean}>({});
  const [finalDuration, setFinalDuration] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [exerciseHistory, setExerciseHistory] = useState<{ [key: string]: ExerciseHistory[] }>({});
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);
  const [historyDisplayLimit, setHistoryDisplayLimit] = useState<{ [key: string]: number }>({});
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    if (initialTemplate) {
      setExercises(initialTemplate.exercises.map(name => ({ id: Date.now() + Math.random(), name, sets: [] })));
    }
  }, [initialTemplate]);

  useEffect(() => {
    setStartTime(Date.now());
    const intervalId = setInterval(() => {
      if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadCustomExercises = useCallback(async () => {
    if (user) {
      const exercises = await getCustomExercises(user.uid);
      setCustomExercises(exercises);
    }
  }, [user]);

  useEffect(() => {
    loadCustomExercises();
  }, [loadCustomExercises]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const defaultExercises = [
    "Squat", "Bench Press", "Deadlift", "Overhead Press", "Barbell Row", "Pull-up"
  ];

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setSelectedExercise(term);
    if (term.trim() === '') {
      setFilteredExercises([]);
    } else {
      const filtered = [...defaultExercises, ...customExercises].filter(
        exercise => exercise.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredExercises(filtered);
    }
  }, [customExercises]);

  const handleInputFocus = () => {
    setIsSearching(true);
    if (searchTerm.trim() === '') {
      setFilteredExercises([]);
    }
  };

  const handleExerciseSelect = (exercise: string) => {
    setSelectedExercise(exercise);
    setSearchTerm(exercise);
    setIsSearching(false);
  };

  const addExercise = async () => {
    console.log("Adding exercise:", selectedExercise); // Debug log
    if (selectedExercise.trim()) {
      setExercises(prev => [...prev, { id: Date.now(), name: selectedExercise, sets: [] }]);
      
      // Check if it's a custom exercise
      if (!defaultExercises.includes(selectedExercise) && !customExercises.includes(selectedExercise)) {
        setCustomExercises(prev => [...prev, selectedExercise]);
        if (user) {
          try {
            await addCustomExercise(user.uid, selectedExercise);
            console.log(`Custom exercise "${selectedExercise}" added to database`);
          } catch (error) {
            console.error("Error adding custom exercise to database:", error);
          }
        }
      }
      
      console.log("Exercise added:", selectedExercise); // Debug log
      setSearchTerm('');
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
        const finalDuration = elapsedTime;
        setFinalDuration(finalDuration);
        const workoutData = {
          exercises: exercises.map(exercise => ({
            name: exercise.name,
            sets: exercise.sets.map(set => ({
              weight: parseFloat(set.weight) || 0,
              reps: parseInt(set.reps) || 0,
            }))
          })),
          duration: finalDuration,
        };
        console.log("Attempting to save workout:", JSON.stringify(workoutData, null, 2));
        const workoutId = await addWorkout(user.uid, workoutData);
        console.log("Workout posted successfully with ID:", workoutId);
        setShowSummary(true);
        setStartTime(null); // Stop the timer

        if (!initialTemplate) {
          setShowSaveTemplateModal(true);
        } else {
          onWorkoutEnd();
        }
      } catch (error) {
        console.error("Error posting workout:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        // Show a more detailed error message to the user
        alert(`There was an error saving your workout. Error details: ${error}`);
      }
    } else {
      console.error("No user logged in");
      alert("You must be logged in to save a workout.");
    }
  };

  const handleSaveTemplate = async () => {
    if (user && templateName.trim()) {
      const template: WorkoutTemplate = {
        name: templateName,
        exercises: exercises.map(e => e.name)
      };
      await saveWorkoutTemplate(user.uid, template);
      setShowSaveTemplateModal(false);
      onWorkoutEnd();
    }
  };

  const toggleExerciseCollapse = (exerciseId: number) => {
    setCollapsedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const closeSummary = () => {
    setShowSummary(false);
    setExercises([]);
    setElapsedTime(0);
    onWorkoutEnd();
  };

  const deleteExercise = (exerciseId: number) => {
    setExercises(prevExercises => prevExercises.filter(exercise => exercise.id !== exerciseId));
  };

  const fetchExerciseHistory = async (exerciseName: string) => {
    if (user) {
      try {
        const history = await getExerciseHistory(user.uid, exerciseName);
        setExerciseHistory(prev => ({ ...prev, [exerciseName]: history }));
      } catch (error) {
        console.error("Error fetching exercise history:", error);
      }
    }
  };

  const toggleHistoryView = (exerciseName: string) => {
    if (showHistoryFor === exerciseName) {
      setShowHistoryFor(null);
    } else {
      setShowHistoryFor(exerciseName);
      if (!exerciseHistory[exerciseName]) {
        fetchExerciseHistory(exerciseName);
      }
      // Initialize display limit for this exercise
      setHistoryDisplayLimit(prev => ({ ...prev, [exerciseName]: 5 }));
    }
  };

  const loadMoreHistory = (exerciseName: string) => {
    setHistoryDisplayLimit(prev => ({
      ...prev,
      [exerciseName]: (prev[exerciseName] || 5) + 5
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl sm:text-2xl font-bold text-sky-600 mb-2 sm:mb-0">Workout Session</h2>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <span className="text-lg sm:text-xl font-semibold text-sky-600 flex-grow sm:flex-grow-0">{formatTime(elapsedTime)}</span>
          <Button onClick={handleEndWorkout} variant="destructive" className="w-full sm:w-auto">
            End Workout
          </Button>
        </div>
      </div>

      {/* Add Exercise section */}
      <Card className="bg-white shadow-md overflow-visible">
        <CardContent className="p-4">
          <div className="relative flex items-center" ref={searchRef}>
            <div className="flex-grow relative">
              <Input
                type="text"
                placeholder="Search or add exercise"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={handleInputFocus}
                className="w-full h-12 border border-sky-200 text-sm sm:text-base pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button 
              onClick={addExercise} 
              className="ml-2 bg-sky-500 text-white hover:bg-sky-600 h-12 w-12 flex items-center justify-center rounded-md"
              disabled={!selectedExercise.trim()}
            >
              <Plus className="h-6 w-6" />
            </Button>
            {isSearching && (
              <div className="absolute z-50 w-full left-0 mt-1 top-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {searchTerm.trim() === '' ? (
                  <div className="px-4 py-2 text-gray-500">
                    No matches. Add a custom exercise.
                  </div>
                ) : filteredExercises.length > 0 ? (
                  filteredExercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-sky-50 cursor-pointer"
                      onClick={() => handleExerciseSelect(exercise)}
                    >
                      {exercise}
                    </div>
                  ))
                ) : (
                  <div 
                    className="px-4 py-2 text-gray-500 cursor-pointer hover:bg-sky-50"
                    onClick={() => handleExerciseSelect(searchTerm)}
                  >
                    No matches. Click to add "{searchTerm}" as a new exercise.
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List of exercises */}
      {exercises.map(exercise => (
        <Card key={exercise.id} className="overflow-hidden">
          <CardHeader className="bg-sky-100 py-2 sm:py-3 px-3 sm:px-4 flex flex-row items-center justify-between">
            <div className="flex items-center">
              <CardTitle className="text-base sm:text-lg font-semibold text-sky-800 mr-2">{exercise.name}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleHistoryView(exercise.name)}
                className="p-1 bg-sky-600 text-white hover:bg-sky-700"
              >
                <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleExerciseCollapse(exercise.id)}
                className="p-1"
              >
                {collapsedExercises[exercise.id] ? <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteExercise(exercise.id)}
                className="p-1"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className={`p-3 sm:p-4 ${collapsedExercises[exercise.id] ? 'hidden' : ''}`}>
            {showHistoryFor === exercise.name && (
              <div className="mb-4 bg-gray-50 p-3 rounded-md">
                <h4 className="font-semibold mb-2">Exercise History</h4>
                {exerciseHistory[exercise.name] ? (
                  <>
                    {exerciseHistory[exercise.name]
                      .slice(0, historyDisplayLimit[exercise.name] || 5)
                      .map((entry, index) => (
                        <div key={index} className="mb-2">
                          <p className="text-sm font-medium">{entry.date.toLocaleDateString()}</p>
                          <ul className="list-disc list-inside pl-2">
                            {entry.sets.map((set, setIndex) => (
                              <li key={setIndex} className="text-sm">
                                {set.weight} lbs x {set.reps} reps
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    {exerciseHistory[exercise.name].length > (historyDisplayLimit[exercise.name] || 5) && (
                      <Button
                        onClick={() => loadMoreHistory(exercise.name)}
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                      >
                        Show More
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Loading history...</p>
                )}
              </div>
            )}
            <div className="space-y-3 sm:space-y-4">
              {exercise.sets.map((set, index) => (
                <div 
                  key={set.id} 
                  className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded ${set.completed ? 'bg-green-100' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-center w-8 sm:w-10">
                    <div className="text-base sm:text-lg font-bold text-sky-600">#{index + 1}</div>
                  </div>
                  <Input 
                    type="number" 
                    inputMode="numeric" 
                    pattern="[0-9]*"
                    placeholder="lbs" 
                    value={set.weight} 
                    onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                    className="w-16 sm:w-20 h-8 sm:h-9 text-base sm:text-base text-center font-semibold"
                  />
                  <Input 
                    type="number" 
                    inputMode="numeric" 
                    pattern="[0-9]*"
                    placeholder="reps" 
                    value={set.reps} 
                    onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                    className="w-16 sm:w-20 h-8 sm:h-9 text-base sm:text-base text-center font-semibold"
                  />
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 sm:w-9 sm:h-9 p-0"
                    onClick={() => toggleSetCompletion(exercise.id, set.id)}
                  >
                    <Check className={`h-4 w-4 sm:h-5 sm:w-5 ${set.completed ? 'text-green-500' : 'text-gray-300'}`} />
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 sm:w-9 sm:h-9 p-0"
                    onClick={() => deleteSet(exercise.id, set.id)}
                  >
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => addSet(exercise.id)} 
              variant="outline" 
              size="sm"
              className="mt-3 sm:mt-4 text-sky-600 border-sky-300 hover:bg-sky-50 w-full py-2 flex items-center justify-center text-sm sm:text-base"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Add Set
            </Button>
          </CardContent>
        </Card>
      ))}

      {showSummary && (
        <WorkoutSummary
          workoutNumber={exercises.length}
          duration={finalDuration}
          exercises={exercises}
          onClose={closeSummary}
        />
      )}

      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Save as Template</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-sky-500 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}