import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc,
  updateDoc,
  deleteField
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { LogisticsEntry } from '../types';
import { getTargetUserId, getClientUserRole } from './userService';

const COLLECTION_NAME = 'logistics';

const cleanAddData = (data: any) => {
  const cleaned: any = {};
  for (const key in data) {
    if (data[key] !== undefined) {
      cleaned[key] = data[key];
    }
  }
  return cleaned;
};

const cleanUpdateData = (data: any) => {
  const cleaned: any = {};
  for (const key in data) {
    if (data[key] === undefined) {
      cleaned[key] = deleteField();
    } else {
      cleaned[key] = data[key];
    }
  }
  return cleaned;
};

export const addLogisticsEntry = async (entry: Omit<LogisticsEntry, 'id' | 'userId'>) => {
  try {
    const dataToSend = cleanAddData({
      ...entry,
      userId: getTargetUserId(),
    });
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSend);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const updateLogisticsEntry = async (id: string, entry: Omit<LogisticsEntry, 'id' | 'userId'>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const dataToUpdate = cleanUpdateData({
      ...entry,
      userId: getTargetUserId(),
    });
    await updateDoc(docRef, dataToUpdate);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
};

export const subscribeToLogistics = (callback: (entries: LogisticsEntry[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME));

  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LogisticsEntry[];
    // Memory sort to bypass requirement of multi-field Firestore indexes
    entries.sort((a, b) => b.createdAt - a.createdAt);
    callback(entries);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
};

export const deleteLogisticsEntry = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
};

