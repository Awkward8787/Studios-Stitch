
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
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import { User, Folder, FileDoc, Note, TeamMember } from '../types';

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
export const db = getFirestore(app);

export const firebaseService = {
  // --- AUTH ---
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
      await sendEmailVerification(result.user);
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
    if (!firebaseUser.emailVerified) return null;

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      role: 'user' 
    };
  },

  // --- FIRESTORE: FOLDERS ---
  createFolder: async (userId: string, name: string) => {
    const colRef = collection(db, `users/${userId}/folders`);
    await addDoc(colRef, {
      name,
      createdAt: serverTimestamp()
    });
  },

  getFolders: async (userId: string): Promise<Folder[]> => {
    const colRef = collection(db, `users/${userId}/folders`);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
  },

  // --- FIRESTORE: FILES ---
  createFile: async (userId: string, name: string, size: string, folderId?: string) => {
    const colRef = collection(db, `users/${userId}/files`);
    await addDoc(colRef, {
      name,
      size,
      folderId: folderId || null,
      createdAt: serverTimestamp()
    });
  },

  getFiles: async (userId: string, folderId?: string): Promise<FileDoc[]> => {
    const colRef = collection(db, `users/${userId}/files`);
    let q = query(colRef, orderBy('createdAt', 'desc'));
    
    // We filter in memory for simplicity if complex index is needed, 
    // but here we can try basic filtering.
    // Note: 'orderBy' and 'where' sometimes require composite indexes in Firestore.
    // We will fetch all and filter in app to avoid index setup block.
    
    const snapshot = await getDocs(q);
    const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FileDoc));
    
    if (folderId) {
      return files.filter(f => f.folderId === folderId);
    }
    return files.filter(f => !f.folderId); // Root files
  },

  // --- FIRESTORE: NOTES ---
  createNote: async (userId: string, title: string, content: string) => {
    const colRef = collection(db, `users/${userId}/notes`);
    await addDoc(colRef, {
      title,
      content,
      createdAt: serverTimestamp()
    });
  },

  getNotes: async (userId: string): Promise<Note[]> => {
    const colRef = collection(db, `users/${userId}/notes`);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
  },

  // --- FIRESTORE: TEAM ---
  addTeamMember: async (userId: string, name: string, role: string) => {
    const colRef = collection(db, `users/${userId}/teamMembers`);
    await addDoc(colRef, {
      name,
      role,
      createdAt: serverTimestamp()
    });
  },

  getTeamMembers: async (userId: string): Promise<TeamMember[]> => {
    const colRef = collection(db, `users/${userId}/teamMembers`);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
  }
};
