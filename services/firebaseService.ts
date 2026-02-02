
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
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
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { User, Download, Note, TeamMember, Address, Collection, CollectionItem, WishlistItem, Order } from '../types';

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
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
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

  // --- DOWNLOADS (FILES) ---
  addDownload: async (userId: string, title: string, size: string, type: Download['type'] = 'other') => {
    const colRef = collection(db, `users/${userId}/downloads`);
    await addDoc(colRef, {
      title,
      size,
      type,
      createdAt: serverTimestamp()
    });
  },

  getDownloads: async (userId: string): Promise<Download[]> => {
    const colRef = collection(db, `users/${userId}/downloads`);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Download));
  },

  deleteDownload: async (userId: string, downloadId: string) => {
    await deleteDoc(doc(db, `users/${userId}/downloads/${downloadId}`));
  },

  // --- NOTES ---
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

  deleteNote: async (userId: string, noteId: string) => {
    await deleteDoc(doc(db, `users/${userId}/notes/${noteId}`));
  },

  // --- TEAM MEMBERS ---
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
  },

  deleteTeamMember: async (userId: string, memberId: string) => {
    await deleteDoc(doc(db, `users/${userId}/teamMembers/${memberId}`));
  },

  // --- ADDRESSES ---
  addAddress: async (userId: string, address: Omit<Address, 'id' | 'createdAt'>) => {
    const colRef = collection(db, `users/${userId}/addresses`);
    
    // If setting default, unset others first
    if (address.isDefault) {
      const q = query(colRef, where("isDefault", "==", true));
      const snaps = await getDocs(q);
      snaps.forEach(async (d) => {
        await updateDoc(doc(db, `users/${userId}/addresses/${d.id}`), { isDefault: false });
      });
    }

    await addDoc(colRef, {
      ...address,
      createdAt: serverTimestamp()
    });
  },

  getAddresses: async (userId: string): Promise<Address[]> => {
    const colRef = collection(db, `users/${userId}/addresses`);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
  },

  deleteAddress: async (userId: string, addressId: string) => {
    await deleteDoc(doc(db, `users/${userId}/addresses/${addressId}`));
  },

  // --- COLLECTIONS ---
  createCollection: async (userId: string, name: string, description?: string) => {
    const colRef = collection(db, `users/${userId}/collections`);
    await addDoc(colRef, {
      name,
      description,
      createdAt: serverTimestamp()
    });
  },

  getCollections: async (userId: string): Promise<Collection[]> => {
    const colRef = collection(db, `users/${userId}/collections`);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection));
  },

  deleteCollection: async (userId: string, collectionId: string) => {
    await deleteDoc(doc(db, `users/${userId}/collections/${collectionId}`));
  },

  addItemToCollection: async (userId: string, collectionId: string, productId: string, productSnapshot: any) => {
    const colRef = collection(db, `users/${userId}/collections/${collectionId}/items`);
    await addDoc(colRef, {
      productId,
      productSnapshot,
      addedAt: serverTimestamp()
    });
  },

  getCollectionItems: async (userId: string, collectionId: string): Promise<CollectionItem[]> => {
    const colRef = collection(db, `users/${userId}/collections/${collectionId}/items`);
    const q = query(colRef, orderBy('addedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CollectionItem));
  },

  removeItemFromCollection: async (userId: string, collectionId: string, itemId: string) => {
    await deleteDoc(doc(db, `users/${userId}/collections/${collectionId}/items/${itemId}`));
  },

  // --- WISHLIST ---
  addToWishlist: async (userId: string, productId: string, productSnapshot: any) => {
    const colRef = collection(db, `users/${userId}/wishlist`);
    // Check if exists
    const q = query(colRef, where("productId", "==", productId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return; // Already in wishlist

    await addDoc(colRef, {
      productId,
      productSnapshot,
      addedAt: serverTimestamp()
    });
  },

  getWishlist: async (userId: string): Promise<WishlistItem[]> => {
    const colRef = collection(db, `users/${userId}/wishlist`);
    const q = query(colRef, orderBy('addedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WishlistItem));
  },

  removeFromWishlist: async (userId: string, itemId: string) => {
    await deleteDoc(doc(db, `users/${userId}/wishlist/${itemId}`));
  },

  // --- ORDERS ---
  // Note: Creating orders usually happens on backend via Stripe webhook, 
  // but we provide read access here.
  getOrders: async (userId: string): Promise<Order[]> => {
    // For demo purposes, if the orders collection is empty, we return local storage mock
    // In a real app, this would query the 'users/{uid}/orders' subcollection
    
    // We can try to fetch from Firestore first
    const colRef = collection(db, `users/${userId}/orders`);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Fallback to localStorage for existing demo data
      try {
        const local = JSON.parse(localStorage.getItem('stitch_orders') || '[]');
        return local.filter((o: any) => o.user_id === userId).map((o: any) => ({
           id: o.id,
           orderNumber: o.id.slice(0,8).toUpperCase(),
           status: o.status,
           total: o.total,
           currency: 'USD',
           createdAt: o.created_at,
           items: o.items,
           customer_email: o.customer_email
        }));
      } catch { return []; }
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  }
};
