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
import { Tpi } from '../types';
import { getTargetUserId, getClientUserRole } from './userService';

const COLLECTION_NAME = 'tpi';

export const addTpi = async (tpi: Omit<Tpi, 'id' | 'userId'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...tpi,
      userId: getTargetUserId(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const updateTpi = async (id: string, tpi: Partial<Tpi>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...tpi,
      userId: getTargetUserId(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
};

export const subscribeToTpi = (callback: (tpiList: Tpi[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME));

  return onSnapshot(q, (snapshot) => {
    const tpiList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Tpi[];
    // Memory sort to bypass requirement of multi-field Firestore indexes
    tpiList.sort((a, b) => b.createdAt - a.createdAt);
    callback(tpiList);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
};

export const deleteTpi = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
};

