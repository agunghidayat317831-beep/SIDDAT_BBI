import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Farmer } from '../types';

const COLLECTION_NAME = 'farmers';

export const addFarmer = async (farmer: Omit<Farmer, 'id' | 'userId'>) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...farmer,
    userId: auth.currentUser.uid,
  });
  return docRef.id;
};

export const updateFarmer = async (id: string, farmer: Partial<Farmer>) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, farmer);
};

export const subscribeToFarmers = (callback: (farmers: Farmer[]) => void) => {
  if (!auth.currentUser) return () => {};

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const farmers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Farmer[];
    callback(farmers);
  }, (error) => {
    console.error('Firestore Error:', error);
  });
};

export const deleteFarmer = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
