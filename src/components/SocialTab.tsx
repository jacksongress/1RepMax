import { useState, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { getFriendsWorkouts, getFriends } from '../lib/firebase/firebaseUtils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SocialTabProps {
  onBack: () => void;
}

type Workout = {
  id: string;
  userId: string;
  exercises: Array<{
    name: string;
    sets: Array<{
      weight: number;
      reps: number;
      completed: boolean;
    }>;
  }>;
  duration: number;
  timestamp: Date;
};

export default function SocialTab({ onBack }: SocialTabProps) {
  const [friends, setFriends] = useState<string[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadFriendsAndWorkouts = async () => {
      if (user) {
        const friendList = await getFriends(user.uid);
        setFriends(friendList);
        const friendsWorkouts = await getFriendsWorkouts(user.uid);
        setWorkouts(friendsWorkouts as Workout[]);
      }
    };
    loadFriendsAndWorkouts();
  }, [user]);

  return (
    <div className="min-h-screen bg-sky-50 p-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold text-sky-600">Social Feed</CardTitle>
          <Button onClick={onBack} variant="outline">Back</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workouts.map((workout) => (
              <Card key={workout.id} className="mb-4">
                <CardContent>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="font-semibold">
                      {workout.userId === user?.uid ? 'You' : friends.find(f => f === workout.userId) || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(workout.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {workout.exercises.map((exercise, index) => (
                    <div key={index} className="mb-2">
                      <p className="font-medium">{exercise.name}</p>
                      {exercise.sets.map((set, setIndex) => (
                        <p key={setIndex} className="text-sm">
                          Set {setIndex + 1}: {set.weight} lbs x {set.reps} reps
                        </p>
                      ))}
                    </div>
                  ))}
                  <p className="text-sm text-gray-600">Duration: {workout.duration} seconds</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}