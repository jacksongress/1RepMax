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

export const addFriend = async (userId: string, friendEmail: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      friends: arrayUnion(friendEmail)
    });
    console.log(`Friend ${friendEmail} added successfully for user ${userId}`);
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

