import {
    collection,
    documentId,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
} from 'firebase/firestore';
import type {
    DocumentData,
    Query,
    QueryDocumentSnapshot,
    QuerySnapshot,
} from 'firebase/firestore';
import { FirebaseDB } from './config';

export interface SuggestedUser {
    id: string;
    fullName: string;
    username: string;
}

const SUGGESTIONS_LIMIT = 5;
const CANDIDATES_PAGE_SIZE = 20;

export const getSuggestedUsers = async (
    userId: string,
): Promise<SuggestedUser[]> => {
    const followingSnapshot = await getDocs(
        collection(FirebaseDB, 'users', userId, 'following'),
    );

    const excludedIds = new Set([
        userId,
        ...followingSnapshot.docs.map((following) => following.id),
    ]);

    const suggestions: SuggestedUser[] = [];
    let cursor: QueryDocumentSnapshot<DocumentData> | null = null;

    while (suggestions.length < SUGGESTIONS_LIMIT) {
        const usersQuery: Query<DocumentData> = query(
            collection(FirebaseDB, 'users'),
            orderBy(documentId()),
            ...(cursor ? [startAfter(cursor)] : []),
            limit(CANDIDATES_PAGE_SIZE),
        );

        const snapshot: QuerySnapshot<DocumentData> = await getDocs(usersQuery);

        for (const profile of snapshot.docs) {
            if (excludedIds.has(profile.id)) continue;

            const data = profile.data();

            suggestions.push({
                id: profile.id,
                fullName:
                    typeof data.fullName === 'string' && data.fullName.trim()
                        ? data.fullName
                        : 'Usuario sin nombre',
                username:
                    typeof data.username === 'string' ? data.username : '',
            });

            if (suggestions.length === SUGGESTIONS_LIMIT) break;
        }

        if (snapshot.size < CANDIDATES_PAGE_SIZE) break;

        cursor = snapshot.docs[snapshot.docs.length - 1];
    }

    return suggestions;
};
