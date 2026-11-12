import React, { useEffect, useState } from 'react';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseDB, FirebaseAuth } from '../firebase/config'; 
import { useFeedContext } from '../context/FeedContext';
import { TweetCard } from '../ui/components/TweetCard';
import { getFeedAuthorIds } from '../firebase/feed';

export const FeedPage: React.FC = () => {
    const { state, handleNextPage, handlePreviousPage, handleRetry, handleFollowingChanged } = useFeedContext();
    
    const currentUserId = FirebaseAuth.currentUser?.uid || '';

    const [followingIds, setFollowingIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchFollowing = async () => {
            if (!currentUserId) return;
            try {
                const authorIds = await getFeedAuthorIds(currentUserId);
                const activeFollowing = authorIds.filter((id) => id !== currentUserId);
                setFollowingIds(activeFollowing);
            } catch (error) {
                console.error('Error fetching following list:', error);
            }
        };

        void fetchFollowing();
    }, [currentUserId, state.retryCount]);

    const handleToggleFollowFromCard = async (targetAuthorId: string, isCurrentlyFollowing: boolean) => {
        if (!currentUserId || currentUserId === targetAuthorId) return;

        try {
            const followingRef = doc(FirebaseDB, 'users', currentUserId, 'following', targetAuthorId);

            if (isCurrentlyFollowing) {
                await deleteDoc(followingRef);
            } else {
                await setDoc(followingRef, {
                    followedAt: serverTimestamp(),
                });
            }

            setFollowingIds((prev) =>
                isCurrentlyFollowing
                    ? prev.filter((id) => id !== targetAuthorId)
                    : [...prev, targetAuthorId]
            );

            handleFollowingChanged();
        } catch (error) {
            console.error('Error al actualizar el estado de seguimiento:', error);
        }
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <h2 className="text-light mb-0">Inicio</h2>
                        <span className="text-secondary small">Página {state.pageIndex + 1}</span>
                    </div>

                    {state.isRecommended && (
                        <div className="alert alert-info bg-info bg-opacity-10 border-info text-info mb-4" role="alert">
                            <strong>Publicaciones sugeridas:</strong> 
                        </div>
                    )}

                    {state.isLoading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    )}

                    {state.errorMessage && (
                        <div className="alert alert-danger" role="alert">
                            {state.errorMessage}
                            <button className="btn btn-sm btn-outline-light ms-3" onClick={handleRetry}>
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!state.isLoading && !state.errorMessage && (!state.page?.tweets || state.page.tweets.length === 0) && (
                        <div className="text-center py-5 text-secondary">
                            <p>No hay publicaciones en esta página.</p>
                        </div>
                    )}

                    {!state.isLoading && state.page?.tweets && (
                        <div className="feed-list">
                            {state.page.tweets.map((tweet: any) => (
                                <TweetCard
                                    key={tweet.id}
                                    id={tweet.id}
                                    authorId={tweet.authorId}
                                    authorName={tweet.authorName}
                                    username={tweet.username ?? ''}
                                    content={tweet.content}
                                    createdAt={tweet.createdAt}
                                    currentUserId={currentUserId}
                                    isFollowing={followingIds.includes(tweet.authorId)}
                                    onToggleFollow={handleToggleFollowFromCard}
                                />
                            ))}
                        </div>
                    )}

                    {/* Controles de paginación */}
                    <div className="d-flex justify-content-between align-items-center mt-4">
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={handlePreviousPage}
                            disabled={state.pageIndex === 0 || state.isLoading}
                        >
                            Anterior
                        </button>

                        <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={handleNextPage}
                            disabled={!state.page?.hasMore || state.isLoading}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedPage;