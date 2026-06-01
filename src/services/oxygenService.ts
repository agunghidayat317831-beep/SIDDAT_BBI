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
import { OxygenRecord } from '../types';
import { getTargetUserId, getClientUserRole } from './userService';

const COLLECTION_NAME = 'oxygen_records';

export const addOxygenRecord = async (record: Omit<OxygenRecord, 'id' | 'userId'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...record,
      userId: getTargetUserId(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const updateOxygenRecord = async (id: string, record: Partial<OxygenRecord>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...record,
      userId: getTargetUserId(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
};

export const subscribeToOxygenRecords = (callback: (records: OxygenRecord[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME));

  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as OxygenRecord[];
    // Memory sort to bypass requirement of multi-field Firestore indexes
    records.sort((a, b) => b.createdAt - a.createdAt);
    callback(records);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
};

export const deleteOxygenRecord = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
};

