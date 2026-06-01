import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { Farmer } from '../types';
import { getTargetUserId, getClientUserRole } from './userService';

const COLLECTION_NAME = 'farmers';

export const addFarmer = async (farmer: Omit<Farmer, 'id' | 'userId'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...farmer,
      userId: getTargetUserId(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const updateFarmer = async (id: string, farmer: Partial<Farmer>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...farmer,
      userId: getTargetUserId(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
};

export const subscribeToFarmers = (callback: (farmers: Farmer[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME));

  return onSnapshot(q, (snapshot) => {
    const farmers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Farmer[];
    // Memory sort to bypass requirement of multi-field Firestore indexes
    farmers.sort((a, b) => b.createdAt - a.createdAt);
    callback(farmers);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
};

export const deleteFarmer = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
};

