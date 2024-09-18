import { useState, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { getFriendsWorkouts, getFriends, addFriend, removeFriend } from '../lib/firebase/firebaseUtils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2 } from 'lucide-react';

interface SocialTabProps {
  onBack: () => void;
}

type Workout = {
  id: string;
  userId: string;
  userEmail: string;
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
  const [newFriendEmail, setNewFriendEmail] = useState('');
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

  const handleAddFriend = async () => {
    if (user && newFriendEmail) {
      try {
        await addFriend(user.uid, newFriendEmail.toLowerCase());
        const updatedFriends = await getFriends(user.uid);
        setFriends(updatedFriends);
        setNewFriendEmail('');
        alert("Friend added successfully!");
      } catch (error) {
        console.error("Error adding friend:", error);
        if (error instanceof Error) {
          alert(`Failed to add friend: ${error.message}`);
        } else {
          alert("Failed to add friend. Please try again.");
        }
      }
    }
  };

  const handleRemoveFriend = async (friendEmail: string) => {
    if (user) {
      try {
        await removeFriend(user.uid, friendEmail.toLowerCase());
        const updatedFriends = await getFriends(user.uid);
        setFriends(updatedFriends);
        alert("Friend removed successfully!");
      } catch (error) {
        console.error("Error removing friend:", error);
        if (error instanceof Error) {
          alert(`Failed to remove friend: ${error.message}`);
        } else {
          alert("Failed to remove friend. Please try again.");
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 p-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold text-sky-600">Social Feed</CardTitle>
          <Button onClick={onBack} variant="outline">Back</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Add Friend</h3>
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="Friend's email"
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
              />
              <Button onClick={handleAddFriend}>Add</Button>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Friends</h3>
            {friends.map((friend, index) => (
              <div key={index} className="flex justify-between items-center mb-1">
                <span>{friend.toLowerCase()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFriend(friend)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {workouts.map((workout) => (
              <Card key={workout.id} className="mb-4">
                <CardContent>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="font-semibold">
                      {workout.userEmail === user?.email ? 'You' : workout.userEmail}
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