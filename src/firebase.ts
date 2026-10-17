import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: client appears offline or connecting.');
    }
  }
}

testConnection();

// Fetch users directly from Firestore database
export async function getFirestoreUsers(): Promise<any[]> {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn('Firestore direct fetch note (falling back to API cache):', error);
    return [];
  }
}

// Fetch user files directly from Firestore database
export async function getFirestoreUserFiles(userId: string): Promise<any[]> {
  try {
    const filesCol = collection(db, 'files');
    const q = query(filesCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn('Firestore files fetch note (falling back to API cache):', error);
    return [];
  }
}
