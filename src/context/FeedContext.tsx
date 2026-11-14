import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getFeedAuthorIds, getFeedPage, FEED_PAGE_SIZE } from '../firebase/feed';
import type { FeedCursor, FeedPageResult, Tweet } from '../firebase/feed';
import { getRecommendedTweets } from '../firebase/tweets';
import { FeedContext } from './useFeedContext';
import type { FeedState } from './useFeedContext';

type FeedAction =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; page: FeedPageResult; authorIds: string[] }
    | { type: 'FETCH_ERROR'; message: string }
    | { type: 'NEXT_PAGE'; cursor: FeedCursor }
    | { type: 'PREVIOUS_PAGE' }
    | { type: 'RETRY_OR_RESET'; resetPagination: boolean }
    | { type: 'RECOMMENDATIONS_START' }
    | { type: 'RECOMMENDATIONS_SUCCESS'; tweets: Tweet[] }
    | { type: 'RECOMMENDATIONS_ERROR' };

const initialFeedState: FeedState = {
    page: null,
    authorIds: null,
    cursors: [null],
    pageIndex: 0,
    isLoading: true,
    errorMessage: null,
    retryCount: 0,
    recommendations: [],
    isLoadingRecommendations: true,
    recommendationsError: null,
};

const feedReducer = (state: FeedState, action: FeedAction): FeedState => {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, isLoading: true, errorMessage: null };
        case 'FETCH_SUCCESS':
            return {
                ...state,
                isLoading: false,
                page: action.page,
                authorIds: JSON.stringify(state.authorIds) === JSON.stringify(action.authorIds)
                    ? state.authorIds : action.authorIds,
                errorMessage: null,
            };
        case 'FETCH_ERROR':
            return { ...state, isLoading: false, errorMessage: action.message };
        case 'NEXT_PAGE':
            return {
                ...state,
                isLoading: true,
                errorMessage: null,
                cursors: [...state.cursors.slice(0, state.pageIndex + 1), action.cursor],
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
        case 'RECOMMENDATIONS_START':
            return { ...state, isLoadingRecommendations: true, recommendationsError: null };
        case 'RECOMMENDATIONS_SUCCESS':
            return { ...state, recommendations: action.tweets, isLoadingRecommendations: false, recommendationsError: null };
        case 'RECOMMENDATIONS_ERROR':
            return { ...state, recommendations: [], isLoadingRecommendations: false, recommendationsError: 'No fue posible cargar las publicaciones sugeridas.' };
    }
};

interface FeedProviderProps {
    userId: string;
    children: ReactNode;
}

export const FeedProvider = ({ userId, children }: FeedProviderProps) => {
    const [state, dispatch] = useReducer(feedReducer, initialFeedState);
    const [recommendationsRetry, setRecommendationsRetry] = useState(0);
    const paginationPending = useRef(true);
    const currentCursor = state.cursors[state.pageIndex] ?? null;

    useEffect(() => {
        let cancelled = false;
        const loadFeed = async () => {
            paginationPending.current = true;
            dispatch({ type: 'FETCH_START' });
            try {
                const authorIds = await getFeedAuthorIds(userId);
                const page = await getFeedPage(authorIds, currentCursor);
                if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', page, authorIds });
            } catch (error: unknown) {
                console.error('Error loading feed:', error);
                if (!cancelled) dispatch({ type: 'FETCH_ERROR', message: 'No fue posible cargar las publicaciones.' });
            } finally {
                if (!cancelled) paginationPending.current = false;
            }
        };
        void loadFeed();
        return () => { cancelled = true; };
    }, [userId, currentCursor, state.retryCount]);

    const authorIds = state.authorIds;
    useEffect(() => {
        if (!authorIds) return;
        let cancelled = false;
        const loadRecommendations = async () => {
            dispatch({ type: 'RECOMMENDATIONS_START' });
            try {
                const candidates = await getRecommendedTweets(25);
                const tweets = candidates
                    .filter((tweet) => !authorIds.includes(tweet.authorId))
                    .slice(0, FEED_PAGE_SIZE);
                if (!cancelled) dispatch({ type: 'RECOMMENDATIONS_SUCCESS', tweets });
            } catch (error: unknown) {
                console.error('Error loading recommendations:', error);
                if (!cancelled) dispatch({ type: 'RECOMMENDATIONS_ERROR' });
            }
        };
        void loadRecommendations();
        return () => { cancelled = true; };
    }, [authorIds, recommendationsRetry]);

    const handleNextPage = useCallback(() => {
        if (paginationPending.current || state.isLoading || state.errorMessage || !state.page?.hasMore || !state.page.nextCursor) return;
        paginationPending.current = true;
        dispatch({ type: 'NEXT_PAGE', cursor: state.page.nextCursor });
    }, [state.isLoading, state.errorMessage, state.page]);

    const handlePreviousPage = useCallback(() => {
        if (paginationPending.current || state.isLoading || state.pageIndex === 0) return;
        paginationPending.current = true;
        dispatch({ type: 'PREVIOUS_PAGE' });
    }, [state.isLoading, state.pageIndex]);

    const handleRetry = useCallback(() => {
        if (paginationPending.current) return;
        paginationPending.current = true;
        dispatch({ type: 'RETRY_OR_RESET', resetPagination: false });
    }, []);

    const handleFollowingChanged = useCallback(() => {
        paginationPending.current = true;
        dispatch({ type: 'RETRY_OR_RESET', resetPagination: true });
    }, []);

    const handleRecommendationsRetry = useCallback(() => {
        setRecommendationsRetry((count) => count + 1);
    }, []);

    return (
        <FeedContext.Provider value={{ state, handleNextPage, handlePreviousPage, handleRetry, handleFollowingChanged, handleRecommendationsRetry }}>
            {children}
        </FeedContext.Provider>
    );
};
