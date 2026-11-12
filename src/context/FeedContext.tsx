import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { FirebaseDB } from '../firebase/config';
import { getFeedAuthorIds, getFeedPage } from '../firebase/feed';
import type { FeedCursor, FeedPageResult } from '../firebase/feed';

interface FeedState {
    page: FeedPageResult | null;
    cursors: FeedCursor[];
    pageIndex: number;
    isLoading: boolean;
    errorMessage: string | null;
    isRecommended: boolean;
    retryCount: number;
}

type FeedAction =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: { page: FeedPageResult; isRecommended: boolean } }
    | { type: 'FETCH_ERROR'; payload: string }
    | { type: 'NEXT_PAGE'; payload: FeedCursor }
    | { type: 'PREVIOUS_PAGE' }
    | { type: 'RETRY_OR_RESET'; resetPagination?: boolean };

const initialFeedState: FeedState = {
    page: null,
    cursors: [null],
    pageIndex: 0,
    isLoading: true,
    errorMessage: null,
    isRecommended: false,
    retryCount: 0,
};

const feedReducer = (state: FeedState, action: FeedAction): FeedState => {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, isLoading: true, errorMessage: null };

        case 'FETCH_SUCCESS':
            return {
                ...state,
                isLoading: false,
                page: action.payload.page,
                isRecommended: action.payload.isRecommended,
                errorMessage: null,
            };

        case 'FETCH_ERROR':
            return {
                ...state,
                isLoading: false,
                errorMessage: action.payload,
            };

        case 'NEXT_PAGE':
            return {
                ...state,
                isLoading: true,
                errorMessage: null,
                cursors: [...state.cursors.slice(0, state.pageIndex + 1), action.payload],
                pageIndex: state.pageIndex + 1,
            };

        case 'PREVIOUS_PAGE':
            return {
                ...state,
                isLoading: true,
                errorMessage: null,
                pageIndex: Math.max(0, state.pageIndex - 1),
            };

        case 'RETRY_OR_RESET':
            return {
                ...state,
                isLoading: true,
                errorMessage: null,
                cursors: action.resetPagination ? [null] : state.cursors,
                pageIndex: action.resetPagination ? 0 : state.pageIndex,
                retryCount: state.retryCount + 1,
            };

        default:
            return state;
    }
};

interface FeedContextType {
    state: FeedState;
    handleNextPage: () => void;
    handlePreviousPage: () => void;
    handleRetry: () => void;
    handleFollowingChanged: () => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

interface FeedProviderProps {
    userId: string;
    children: React.ReactNode;
}

export const FeedProvider: React.FC<FeedProviderProps> = ({ userId, children }) => {
    const [state, dispatch] = useReducer(feedReducer, initialFeedState);
    const currentCursor = state.cursors[state.pageIndex] ?? null;

    useEffect(() => {
        let cancelled = false;

        const loadFeed = async () => {
            dispatch({ type: 'FETCH_START' });

            try {
                const authorIds = await getFeedAuthorIds(userId);
                
                const followingIds = authorIds.filter((id: string) => id !== userId);

                if (followingIds.length < 3) {
                    const tweetsRef = collection(FirebaseDB, 'tweets');
                    const q = query(tweetsRef, orderBy('createdAt', 'desc'), limit(25));
                    const querySnapshot = await getDocs(q);

                    const recommendedTweets = querySnapshot.docs
                        .map((doc) => ({
                            id: doc.id,
                            ...(doc.data() as any),
                        }))
                        .filter(
                            (tweet) =>
                                tweet.authorId !== userId &&
                                !followingIds.includes(tweet.authorId),
                        )
                        .slice(0, 15);

                    if (!cancelled) {
                        dispatch({
                            type: 'FETCH_SUCCESS',
                            payload: {
                                page: {
                                    tweets: recommendedTweets,
                                    hasMore: false,
                                    nextCursor: null,
                                },
                                isRecommended: true,
                            },
                        });
                    }
                } else {
                    const result = await getFeedPage(authorIds, currentCursor);
                    if (!cancelled) {
                        dispatch({
                            type: 'FETCH_SUCCESS',
                            payload: {
                                page: result,
                                isRecommended: false,
                            },
                        });
                    }
                }
            } catch (error: unknown) {
                console.error('Error loading feed:', error);
                if (!cancelled) {
                    dispatch({
                        type: 'FETCH_ERROR',
                        payload: 'No fue posible cargar las publicaciones.',
                    });
                }
            }
        };

        void loadFeed();

        return () => {
            cancelled = true;
        };
    }, [userId, currentCursor, state.retryCount]);

    const handleNextPage = useCallback(() => {
        if (state.isLoading || !state.page?.hasMore || !state.page.nextCursor) return;
        dispatch({ type: 'NEXT_PAGE', payload: state.page.nextCursor });
    }, [state.isLoading, state.page]);

    const handlePreviousPage = useCallback(() => {
        if (state.isLoading || state.pageIndex === 0) return;
        dispatch({ type: 'PREVIOUS_PAGE' });
    }, [state.isLoading, state.pageIndex]);

    const handleRetry = useCallback(() => {
        dispatch({ type: 'RETRY_OR_RESET', resetPagination: false });
    }, []);

    const handleFollowingChanged = useCallback(() => {
        dispatch({ type: 'RETRY_OR_RESET', resetPagination: true });
    }, []);

    return (
        <FeedContext.Provider
            value={{
                state,
                handleNextPage,
                handlePreviousPage,
                handleRetry,
                handleFollowingChanged,
            }}
        >
            {children}
        </FeedContext.Provider>
    );
};

export const useFeedContext = (): FeedContextType => {
    const context = useContext(FeedContext);
    if (!context) {
        throw new Error('useFeedContext must be used within a FeedProvider');
    }
    return context;
};