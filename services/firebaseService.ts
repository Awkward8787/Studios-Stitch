
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  onAuthStateChanged,
  sendEmailVerification
} from "firebase/auth";
import { User } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCy6hNqq3_fbVC1xJYv52kFhqbCP5jNElg",
  authDomain: "studios-stitch.firebaseapp.com",
  projectId: "studios-stitch",
  storageBucket: "studios-stitch.firebasestorage.app",
  messagingSenderId: "1039802177813",
  appId: "1:1039802177813:web:93920af5905158929cb11c",
  measurementId: "G-GCSR6NK1Z1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const firebaseService = {
  signIn: async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (!result.user.emailVerified) {
        await signOut(auth);
        throw new Error('EMAIL_NOT_VERIFIED');
      }

      return result.user;
    } catch (error: any) {
      if (error.message === 'EMAIL_NOT_VERIFIED') throw error;
      
      if (
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/user-not-found'
      ) {
        throw new Error('Email or password is incorrect');
      }
      throw error;
    }
  },

  signUp: async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      await sendEmailVerification(result.user);
      
      // Sign out immediately so they aren't logged in automatically
      await signOut(auth);

      return result.user;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('User already exists. Please sign in');
      }
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  mapUser: (firebaseUser: FirebaseUser | null): User | null => {
    if (!firebaseUser) return null;
    
    // Strict enforcement: Do not map user if email is not verified
    // This ensures the global app state remains null for unverified users
    if (!firebaseUser.emailVerified) return null;

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      role: 'user' // Default role for now as we aren't fetching profiles
    };
  }
};
