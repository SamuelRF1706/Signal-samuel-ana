import { createContext, useContext } from 'react';
import type { FeedCursor, FeedPageResult, Tweet } from '../firebase/feed';

export interface FeedState {
    page: FeedPageResult | null;
    authorIds: string[] | null;
    cursors: FeedCursor[];
    pageIndex: number;
    isLoading: boolean;
    errorMessage: string | null;
    retryCount: number;
    recommendations: Tweet[];
    isLoadingRecommendations: boolean;
    recommendationsError: string | null;
}

interface FeedContextType {
    state: FeedState;
    handleNextPage: () => void;
    handlePreviousPage: () => void;
    handleRetry: () => void;
    handleFollowingChanged: () => void;
    handleRecommendationsRetry: () => void;
}

export const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const useFeedContext = (): FeedContextType => {
    const context = useContext(FeedContext);
    if (!context) {
        throw new Error('useFeedContext must be used within a FeedProvider');
    }
    return context;
};
