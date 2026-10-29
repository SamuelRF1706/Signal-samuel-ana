import {
    collectionGroup,
    getDoc,
    getDocs,
} from 'firebase/firestore';
import { FirebaseDB } from './config';

export interface FollowerUser {
    id: string;
    fullName: string;
    username: string;
}

export const getFollowers = async (
    userId: string,
): Promise<FollowerUser[]> => {
    const followingSnapshot = await getDocs(
        collectionGroup(FirebaseDB, 'following'),
    );

    const followerRefs = new Map(
        followingSnapshot.docs
            .filter((following) => following.id === userId)
            .flatMap((following) => {
                const userRef = following.ref.parent.parent;

                if (!userRef || userRef.parent.path !== 'users') {
                    return [];
                }

                return [[userRef.id, userRef] as const];
            }),
    );

    const profiles = await Promise.all(
        [...followerRefs.values()].map((userRef) => getDoc(userRef)),
    );

    const users: FollowerUser[] = [];

    for (const profile of profiles) {
        if (!profile.exists()) continue;

        const data = profile.data();

        users.push({
            id: profile.id,
            fullName:
                typeof data.fullName === 'string' && data.fullName.trim()
                    ? data.fullName
                    : 'Usuario sin nombre',
            username:
                typeof data.username === 'string' ? data.username : '',
        });
    }

    return users.sort((first, second) =>
        first.fullName.localeCompare(second.fullName, 'es'),
    );
};
