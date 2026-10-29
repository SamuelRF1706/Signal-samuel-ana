import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { FirebaseDB } from './config';

export interface FollowedUser {
    id: string;
    fullName: string;
    username: string;
}

export const getFollowedUsers = async (
    userId: string,
): Promise<FollowedUser[]> => {
    const followingSnapshot = await getDocs(
        collection(FirebaseDB, 'users', userId, 'following'),
    );

    const profiles = await Promise.all(
        followingSnapshot.docs.map((following) =>
            getDoc(doc(FirebaseDB, 'users', following.id)),
        ),
    );

    const users: FollowedUser[] = [];

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