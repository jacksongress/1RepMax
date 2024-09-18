import { auth, db } from "./firebase";
// Remove the storage import
// import { storage } from "./firebase";
import {
  signOut,
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
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { runTransaction } from "firebase/firestore";

// Auth functions
export const logoutUser = () => signOut(auth);

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

// User document functions
export const createUserDocument = async (userId: string, additionalData?: { email?: string | null }) => {
  if (!userId) return;

  console.log("Attempting to create user document for:", userId);
  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email } = additionalData || {};
    const createdAt = new Date();

    try {
      await setDoc(userRef, {
        email,
        createdAt,
        ...additionalData
      });
      console.log("User document created successfully");
    } catch (error) {
      console.error("Error creating user document", error);
    }
  }

  return userRef;
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
    if (!userDoc.exists()) {
      throw new Error(`User document not found for userId: ${userId}`);
    }
    const userEmail = userDoc.data()?.email;
    console.log("User email:", userEmail);

    const workoutToAdd = {
      userId,
      userEmail,
      ...workoutData,
      timestamp: serverTimestamp(),
      date: new Date().toISOString(),
    };
    console.log("Workout data to add:", JSON.stringify(workoutToAdd, null, 2));

    const workoutRef = await addDoc(collection(db, 'workouts'), workoutToAdd);
    console.log("Workout added with ID:", workoutRef.id);

    return workoutRef.id;
  } catch (error) {
    console.error("Error adding workout:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
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

// Add these new functions
export const getFriends = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.data()?.friends || [];
  } catch (error) {
    console.error("Error getting friends:", error);
    throw error;
  }
};

export const addFriend = async (currentUserId: string, friendUserId: string) => {
  try {
    const userRef = doc(db, 'users', currentUserId);
    const friendRef = doc(db, 'users', friendUserId);

    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const friendDoc = await transaction.get(friendRef);

      if (!userDoc.exists() || !friendDoc.exists()) {
        throw new Error("User does not exist!");
      }

      transaction.update(userRef, {
        friends: arrayUnion(friendUserId)
      });
      transaction.update(friendRef, {
        friends: arrayUnion(currentUserId)
      });
    });

    console.log(`Friend connection established between ${currentUserId} and ${friendUserId}`);
  } catch (error) {
    console.error("Error adding friend:", error);
    throw error;
  }
};

export const removeFriend = async (userId: string, friendEmail: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      friends: arrayRemove(friendEmail)
    });
    console.log(`Friend ${friendEmail} removed successfully for user ${userId}`);
  } catch (error) {
    console.error("Error removing friend:", error);
    throw error;
  }
};

export const addCustomExercise = async (userId: string, exerciseName: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      customExercises: arrayUnion(exerciseName)
    });
    console.log(`Custom exercise ${exerciseName} added successfully for user ${userId}`);
  } catch (error) {
    console.error("Error adding custom exercise:", error);
    throw error;
  }
};

export const getCustomExercises = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.data()?.customExercises || [];
  } catch (error) {
    console.error("Error getting custom exercises:", error);
    throw error;
  }
};

// Add this new function
export const getExerciseHistory = async (userId: string, exerciseName: string) => {
  try {
    const workoutsQuery = query(
      collection(db, 'workouts'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(10) // Limit to last 10 workouts for performance
    );

    const workoutsSnapshot = await getDocs(workoutsQuery);
    let exerciseHistory = [];

    for (const doc of workoutsSnapshot.docs) {
      const workoutData = doc.data();
      const exerciseData = workoutData.exercises.find((e: { name: string }) => e.name === exerciseName);
      if (exerciseData) {
        exerciseHistory.push({
          date: workoutData.timestamp.toDate(),
          sets: exerciseData.sets
        });
      }
    }

    return exerciseHistory;
  } catch (error) {
    console.error("Error getting exercise history:", error);
    throw error;
  }
};

// Add these new types and functions

export type WorkoutTemplate = {
  id?: string;
  name: string;
  exercises: string[];
};

export const saveWorkoutTemplate = async (userId: string, template: WorkoutTemplate) => {
  try {
    const templateRef = await addDoc(collection(db, 'users', userId, 'templates'), template);
    console.log(`Template ${template.name} saved successfully with ID: ${templateRef.id}`);
    return templateRef.id;
  } catch (error) {
    console.error("Error saving workout template:", error);
    throw error;
  }
};

export const getWorkoutTemplates = async (userId: string) => {
  try {
    const templatesSnapshot = await getDocs(collection(db, 'users', userId, 'templates'));
    return templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WorkoutTemplate));
  } catch (error) {
    console.error("Error getting workout templates:", error);
    throw error;
  }
};

// Add this new function
export const deleteWorkoutTemplate = async (userId: string, templateId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'templates', templateId));
    console.log(`Template with ID ${templateId} deleted successfully for user ${userId}`);
  } catch (error) {
    console.error("Error deleting workout template:", error);
    throw error;
  }
};

export const saveWorkoutState = async (userId: string, workoutState: any | null) => {
  console.log('Saving workout state for user:', userId);
  console.log('Workout state to save:', workoutState);
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, { ongoingWorkout: workoutState });
    console.log('Workout state saved successfully');
  } catch (error) {
    console.error('Error saving workout state:', error);
  }
};

export const getWorkoutState = async (userId: string) => {
  console.log('Getting workout state for user:', userId);
  const userDoc = await getDoc(doc(db, 'users', userId));
  const workoutState = userDoc.data()?.ongoingWorkout || null;
  console.log('Retrieved workout state:', workoutState);
  return workoutState;
};

