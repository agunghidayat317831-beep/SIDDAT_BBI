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
import { PHRecord } from '../types';

const COLLECTION_NAME = 'ph_records';

export const addPHRecord = async (record: Omit<PHRecord, 'id' | 'userId'>) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...record,
    userId: auth.currentUser.uid,
  });
  return docRef.id;
};

export const updatePHRecord = async (id: string, record: Partial<PHRecord>) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, record);
};

export const subscribeToPHRecords = (callback: (records: PHRecord[]) => void) => {
  if (!auth.currentUser) return () => {};

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PHRecord[];
    callback(records);
  }, (error) => {
    console.error('Firestore Error:', error);
  });
};

export const deletePHRecord = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
