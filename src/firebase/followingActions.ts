import { doc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FirebaseDB } from './config';

export const followUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
    const followingRef = doc(FirebaseDB, 'users', currentUserId, 'following', targetUserId);
    await setDoc(followingRef, {
        followedAt: serverTimestamp(),
    });
};

export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
    const followingRef = doc(FirebaseDB, 'users', currentUserId, 'following', targetUserId);
    await deleteDoc(followingRef);
};