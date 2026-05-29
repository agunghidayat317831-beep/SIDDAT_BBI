import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { LogisticsEntry } from '../types';

const COLLECTION_NAME = 'logistics';

export const addLogisticsEntry = async (entry: Omit<LogisticsEntry, 'id' | 'userId'>) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...entry,
    userId: auth.currentUser.uid,
  });
  return docRef.id;
};

export const updateLogisticsEntry = async (id: string, entry: Omit<LogisticsEntry, 'id' | 'userId'>) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...entry,
    userId: auth.currentUser.uid,
  });
};

export const subscribeToLogistics = (callback: (entries: LogisticsEntry[]) => void) => {
  if (!auth.currentUser) return () => {};

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LogisticsEntry[];
    callback(entries);
  }, (error) => {
    console.error('Firestore Error:', error);
  });
};

export const deleteLogisticsEntry = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
