import { useState } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { UserPlus, Users, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { addFriend, getFriends, removeFriend } from '../lib/firebase/firebaseUtils';

export default function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [friends, setFriends] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleShowFriends = async () => {
    if (user) {
      const friendList = await getFriends(user.uid);
      setFriends(friendList);
    }
    setShowFriends(true);
  };

  const handleAddFriend = async () => {
    if (user && newFriendEmail) {
      try {
        await addFriend(user.uid, newFriendEmail);
        setFriends([...friends, newFriendEmail]);
        setNewFriendEmail('');
        setMessage(`Friend ${newFriendEmail} added successfully!`);
      } catch (error) {
        console.error("Error adding friend:", error);
        setMessage(`Failed to add friend: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      setMessage("Please enter a valid email address");
    }
  };

  const handleRemoveFriend = async (friendEmail: string) => {
    if (user) {
      try {
        await removeFriend(user.uid, friendEmail);
        setFriends(friends.filter(email => email !== friendEmail));
        setMessage(`Friend ${friendEmail} removed successfully!`);
      } catch (error) {
        console.error("Error removing friend:", error);
        setMessage(`Failed to remove friend: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="rounded-full p-2 text-sky-600 hover:bg-sky-100"
      >
        Profile
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10">
          <div className="py-1">
            <p className="px-4 py-2 text-sm text-gray-700">{user?.email}</p>
            <Button
              onClick={handleShowFriends}
              variant="outline"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-sky-50"
            >
              <Users className="inline-block mr-2 h-4 w-4" />
              Friends
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-sky-50"
            >
              Sign out
            </Button>
          </div>
        </div>
      )}
      {showFriends && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-4 rounded-lg shadow-md w-80">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Friends</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFriends(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {message && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-2 mb-4" role="alert">
                <p>{message}</p>
              </div>
            )}
            <div className="mb-4">
              <Input
                placeholder="Friend's email"
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                className="mb-2 w-full" // Added w-full class here
              />
              <Button onClick={handleAddFriend} className="w-full">Add Friend</Button>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {friends.map((friend, index) => (
                <div key={index} className="flex justify-between items-center mb-2">
                  <span>{friend}</span>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleRemoveFriend(friend)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}