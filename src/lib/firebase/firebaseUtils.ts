import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  getDoc,
  setDoc,
  arrayRemove,
  query,
  where,
  orderBy,
  limit,
  QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Friend functions
export const addFriend = async (userId: string, friendEmail: string) => {
  console.log(`Attempting to add friend: ${friendEmail} for user: ${userId}`);
  await ensureUserDocument(userId);
  const userRef = doc(db, 'users', userId);
  
  try {
    // Get the friend's user document
    const friendQuery = query(collection(db, 'users'), where('email', '==', friendEmail));
    const friendSnapshot = await getDocs(friendQuery);
    
    if (friendSnapshot.empty) {
      throw new Error('Friend user not found');
    }
    
    const friendDoc = friendSnapshot.docs[0];
    const friendId = friendDoc.id;
    const friendRef = doc(db, 'users', friendId);

    // Update the current user's friends list
    await updateDoc(userRef, {
      friends: arrayUnion(friendEmail)
    });

    // Update the friend's friends list with the current user's email
    const currentUserDoc = await getDoc(userRef);
    const currentUserEmail = currentUserDoc.data()?.email;
    
    if (currentUserEmail) {
      await updateDoc(friendRef, {
        friends: arrayUnion(currentUserEmail)
      });
    }

    console.log(`Successfully added bidirectional friendship between ${userId} and ${friendId}`);
  } catch (error) {
    console.error("Error adding friend:", error);
    throw error;
  }
};

export const getFriends = async (userId: string) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.data()?.friends || [];
};

export const removeFriend = async (userId: string, friendEmail: string) => {
  const userRef = doc(db, 'users', userId);
  
  try {
    // Get the friend's user document
    const friendQuery = query(collection(db, 'users'), where('email', '==', friendEmail));
    const friendSnapshot = await getDocs(friendQuery);
    
    if (friendSnapshot.empty) {
      throw new Error('Friend user not found');
    }
    
    const friendDoc = friendSnapshot.docs[0];
    const friendId = friendDoc.id;
    const friendRef = doc(db, 'users', friendId);

    // Remove friend from current user's list
    await updateDoc(userRef, {
      friends: arrayRemove(friendEmail)
    });

    // Remove current user from friend's list
    const currentUserDoc = await getDoc(userRef);
    const currentUserEmail = currentUserDoc.data()?.email;
    
    if (currentUserEmail) {
      await updateDoc(friendRef, {
        friends: arrayRemove(currentUserEmail)
      });
    }

    console.log(`Successfully removed bidirectional friendship between ${userId} and ${friendId}`);
  } catch (error) {
    console.error("Error removing friend:", error);
    throw error;
  }
};

// User document functions
export const createUserDocument = async (user: any) => {
  if (!user) return;

  console.log("Attempting to create user document for:", user.uid);
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email } = user;
    try {
      await setDoc(userRef, {
        email,
        friends: [],
        createdAt: new Date(),
      });
      console.log("User document created successfully for:", user.uid);
    } catch (error) {
      console.error("Error creating user document:", error);
    }
  } else {
    console.log("User document already exists for:", user.uid);
  }
};

export const ensureUserDocument = async (userId: string) => {
  console.log("Ensuring user document exists for:", userId);
  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    try {
      await setDoc(userRef, {
        friends: [],
        createdAt: new Date(),
      });
      console.log("User document created successfully for:", userId);
    } catch (error) {
      console.error("Error creating user document:", error);
    }
  } else {
    console.log("User document already exists for:", userId);
  }
};

// Workout functions
export const addWorkout = async (userId: string, workoutData: any) => {
  try {
    console.log("Adding workout for user:", userId);
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userEmail = userDoc.data()?.email;
    console.log("User email:", userEmail);

    const workoutToAdd = {
      userId,
      userEmail,
      ...workoutData,
      timestamp: serverTimestamp(),
      date: new Date().toISOString(),
    };
    console.log("Workout data to add:", workoutToAdd);

    const workoutRef = await addDoc(collection(db, 'workouts'), workoutToAdd);
    console.log("Workout added with ID:", workoutRef.id);

    // Verify the workout was added
    const addedWorkout = await getDoc(workoutRef);
    console.log("Added workout data:", addedWorkout.data());

    return workoutRef.id;
  } catch (error) {
    console.error("Error adding workout:", error);
    throw error;
  }
};

export const getFriendsWorkouts = async (userId: string) => {
  try {
    console.log("Getting friends' workouts for user:", userId);
    const userDoc = await getDoc(doc(db, 'users', userId));
    const friends = userDoc.data()?.friends || [];
    friends.push(userId); // Include the user's own workouts
    console.log("Friends list (including user):", friends);

    // Fetch all workouts
    const workoutsQuery = query(
      collection(db, 'workouts'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const workoutsSnapshot = await getDocs(workoutsQuery);
    console.log("Total workouts fetched:", workoutsSnapshot.docs.length);

    let allWorkouts = [];

    for (const doc of workoutsSnapshot.docs) {
      const data = doc.data();
      console.log("Workout data:", data);
      
      // Check if the workout belongs to the user or their friends
      if (friends.includes(data.userId) || friends.includes(data.userEmail)) {
        allWorkouts.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(data.date),
        });
      }
    }

    console.log("Processed workouts:", allWorkouts);
    return allWorkouts;
  } catch (error) {
    console.error("Error getting friends' workouts: ", error);
    throw error;
  }
};

