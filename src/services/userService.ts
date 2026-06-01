import { doc, setDoc } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';

let targetUserId: string | null = null;
let userRole: 'admin' | 'guest' | null = null;

export const setClientUserRole = async (role: 'admin' | 'guest') => {
  userRole = role;
  if (role === 'admin' && auth.currentUser) {
    try {
      // Set the admin role in firestore so security rules recognize this session as isAdmin()
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, {
        role: 'admin',
        email: 'admin@siddatbbi.com',
        updatedAt: Date.now()
      });
      console.log('Admin role synced successfully with Firestore');
    } catch (err) {
      console.error('Error syncing admin role with Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}`);
    }
  }
};

export const getClientUserRole = (): 'admin' | 'guest' => {
  if (!userRole) {
    const saved = localStorage.getItem('siddat_login_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        userRole = parsed.role;
      } catch {}
    }
  }
  return userRole || 'guest';
};

export const getTargetUserId = (): string => {
  if (getClientUserRole() === 'admin') {
    return targetUserId || 'agunghidayat317831_uid'; // Default fallback for agunghidayat317831@gmail.com
  }
  return auth.currentUser?.uid || 'guest_bbi_user';
};

export const setDiscoveredTargetUserId = (uid: string) => {
  if (getClientUserRole() === 'admin' && uid && auth.currentUser && uid !== auth.currentUser.uid) {
    targetUserId = uid;
  }
};
