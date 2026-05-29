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
import { Tpi } from '../types';

const COLLECTION_NAME = 'tpi';

export const addTpi = async (tpi: Omit<Tpi, 'id' | 'userId'>) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...tpi,
    userId: auth.currentUser.uid,
  });
  return docRef.id;
};

export const updateTpi = async (id: string, tpi: Partial<Tpi>) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, tpi);
};

export const subscribeToTpi = (callback: (tpiList: Tpi[]) => void) => {
  if (!auth.currentUser) return () => {};

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const tpiList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Tpi[];
    callback(tpiList);
  }, (error) => {
    console.error('Firestore Error:', error);
  });
};

export const deleteTpi = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
