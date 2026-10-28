import {
    collection,
    documentId,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    Timestamp,
    where,
} from 'firebase/firestore';
import type {
    DocumentData,
    QueryConstraint,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import { FirebaseDB } from './config';

export const FEED_PAGE_SIZE = 10;

export type FeedCursor =
    QueryDocumentSnapshot<DocumentData> | null;

export interface Tweet {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Timestamp;
}

export interface FeedPageResult {
    tweets: Tweet[];
    nextCursor: FeedCursor;
    hasMore: boolean;
}

const parseTweet = (
    document: QueryDocumentSnapshot<DocumentData>,
): Tweet => {
    const data = document.data();

    if (
        typeof data.authorId !== 'string' ||
        typeof data.authorName !== 'string' ||
        typeof data.content !== 'string' ||
        !(data.createdAt instanceof Timestamp)
    ) {
        throw new Error(`El tweet ${document.id} tiene datos inválidos.`);
    }

    return {
        id: document.id,
        authorId: data.authorId,
        authorName: data.authorName,
        content: data.content,
        createdAt: data.createdAt,
    };
};

export const getFeedAuthorIds = async (
    userId: string,
): Promise<string[]> => {
    const followingSnapshot = await getDocs(
        collection(FirebaseDB, 'users', userId, 'following'),
    );

    return [
        ...new Set([
            userId,
            ...followingSnapshot.docs.map((document) => document.id),
        ]),
    ];
};

export const getFeedPage = async (
    authorIds: string[],
    cursor: FeedCursor = null,
): Promise<FeedPageResult> => {
    const snapshots = await Promise.all(
        authorIds.map((authorId) => {
            const constraints: QueryConstraint[] = [
                where('authorId', '==', authorId),
                orderBy('createdAt', 'desc'),
                orderBy(documentId(), 'desc'),
            ];

            if (cursor) {
                constraints.push(startAfter(cursor));
            }

            return getDocs(
                query(
                    collection(FirebaseDB, 'tweets'),
                    ...constraints,
                    limit(FEED_PAGE_SIZE + 1),
                ),
            );
        }),
    );

    const candidates = snapshots.flatMap((snapshot) =>
        snapshot.docs.map((document) => ({
            document,
            tweet: parseTweet(document),
        })),
    );

    candidates.sort((first, second) => {
        const firstDate = first.tweet.createdAt;
        const secondDate = second.tweet.createdAt;

        const dateDifference =
            secondDate.seconds - firstDate.seconds ||
            secondDate.nanoseconds - firstDate.nanoseconds;

        if (dateDifference !== 0) {
            return dateDifference;
        }

        if (first.tweet.id === second.tweet.id) {
            return 0;
        }

        return first.tweet.id < second.tweet.id ? 1 : -1;
    });

    const visibleTweets = candidates.slice(0, FEED_PAGE_SIZE);

    return {
        tweets: visibleTweets.map(({ tweet }) => tweet),
        nextCursor: visibleTweets.at(-1)?.document ?? null,
        hasMore: candidates.length > FEED_PAGE_SIZE,
    };
};