import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { FirebaseAuth, FirebaseDB } from '../firebase/config';
import { followUser, unfollowUser } from '../firebase/followingActions';
import { FeedProvider } from '../context/FeedContext';
import { useFeedContext } from '../context/useFeedContext';
import type { Tweet } from '../firebase/feed';
import TweetCard from '../ui/components/TweetCard';
import SuggestedUsers from '../ui/components/SuggestedUsers';
import { Avatar } from '../ui/components/Avatar';
import { Icon } from '../ui/components/Icon';

interface FeedContentProps {
    userId: string;
}

const FeedContent = ({ userId }: FeedContentProps) => {
    const location = useLocation();
    const {
        state: { page, pageIndex, isLoading, errorMessage, recommendations, isLoadingRecommendations, recommendationsError, authorIds },
        handleNextPage,
        handlePreviousPage,
        handleRetry,
        handleFollowingChanged,
        handleRecommendationsRetry,
    } = useFeedContext();
    const [followingIds, setFollowingIds] = useState<string[] | null>(null);
    const [followingError, setFollowingError] = useState(false);
    const [followingRetry, setFollowingRetry] = useState(0);

    useEffect(() => {
        let previousIds: string | null = null;
        return onSnapshot(
            collection(FirebaseDB, 'users', userId, 'following'),
            { includeMetadataChanges: true },
            (snapshot) => {
                if (snapshot.metadata.hasPendingWrites) return;
                const ids = snapshot.docs.map((document) => document.id).sort();
                const signature = JSON.stringify(ids);
                setFollowingIds(ids);
                setFollowingError(false);
                if (previousIds !== null && previousIds !== signature) {
                    handleFollowingChanged();
                }
                previousIds = signature;
            },
            (error) => {
                console.error('Error watching follow status:', error);
                setFollowingError(true);
                setFollowingIds(null);
            },
        );
    }, [userId, handleFollowingChanged, followingRetry]);

    const handleToggleFollow = async (authorId: string, isFollowing: boolean) => {
        if (FirebaseAuth.currentUser?.uid !== userId || authorId === userId) {
            throw new Error('No fue posible validar la sesión para esta acción.');
        }
        if (isFollowing) {
            await unfollowUser(userId, authorId);
        } else {
            await followUser(userId, authorId);
        }
    };

    const successMessage =
        location.state?.successMessage === 'Tweet publicado correctamente.'
            ? 'Tweet publicado correctamente.'
            : null;
    const visibleRecommendations = recommendations.filter(
        (tweet) => !followingIds?.includes(tweet.authorId),
    );

    const renderTweet = (tweet: Tweet) => {
        const authorBase = tweet.authorName.includes('@')
            ? tweet.authorName.split('@')[0] : tweet.authorName;
        return (
            <TweetCard
                key={tweet.id}
                authorId={tweet.authorId}
                authorName={authorBase}
                username={tweet.username || authorBase}
                content={tweet.content}
                createdAt={tweet.createdAt}
                currentUserId={userId}
                isFollowing={followingIds?.includes(tweet.authorId)}
                onToggleFollow={followingIds === null ? undefined : handleToggleFollow}
            />
        );
    };

    return (
        <main className="feed-layout">
            <div className="feed-main">
                <div>
                    <header className="feed-heading">
                        <div><span className="eyebrow">Tu comunidad, a tu ritmo</span><h1>Inicio</h1></div>
                        <a href="#people-to-follow" className="feed-tag">Personas para seguir</a>
                    </header>
                    <Link to="/publish" className="composer-entry" aria-label="Compartir una idea: crear publicación">
                        <Avatar name={FirebaseAuth.currentUser?.displayName || 'Tu voz'} />
                        <span className="composer-prompt">¿Qué te gustaría compartir?</span>
                        <span className="composer-button">Publicar</span>
                    </Link>
                    <div className="section-label"><Icon name="home" />Tu feed</div>

                    {successMessage && (
                        <div className="alert alert-success" role="status">
                            {successMessage}
                        </div>
                    )}

                    {followingError && (
                        <div className="alert alert-danger" role="alert">
                            No fue posible sincronizar el estado de seguimiento.
                            <button type="button" className="btn btn-outline-danger btn-sm ms-2" onClick={() => setFollowingRetry((count) => count + 1)}>
                                Reintentar
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <p role="status" className="loading-state">Cargando publicaciones...</p>
                    ) : errorMessage ? (
                        <div className="alert alert-danger" role="alert">
                            <p>{errorMessage}</p>
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={handleRetry}
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <>
                            {page?.tweets.length === 0 && (
                                <p className="empty-state">
                                    {pageIndex === 0
                                        ? 'Aún no hay publicaciones tuyas ni de las personas que sigues.'
                                        : 'No hay publicaciones en esta página. Puedes volver a la anterior.'}
                                </p>
                            )}

                            {page?.tweets.map(renderTweet)}
                        </>
                    )}

                    <nav
                        className="pagination-bar"
                        aria-label="Paginación del feed"
                    >
                        <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={handlePreviousPage}
                            disabled={isLoading || pageIndex === 0}
                        >
                            Anterior
                        </button>

                        <span aria-live="polite">
                            Página {pageIndex + 1}
                        </span>

                        <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={handleNextPage}
                            disabled={
                                isLoading ||
                                Boolean(errorMessage) ||
                                !page?.hasMore
                            }
                        >
                            Siguiente
                        </button>
                    </nav>

                    {authorIds && (
                        <section className="recommendations-section" aria-labelledby="recommended-tweets-title">
                            <div className="section-label"><Icon name="spark" />Más allá de tu comunidad</div>
                            <h2 id="recommended-tweets-title">Publicaciones sugeridas</h2>
                            <p className="text-muted">Descubre publicaciones de otras personas en Signal.</p>
                            {isLoadingRecommendations ? (
                                <p role="status" className="loading-state">Cargando publicaciones sugeridas...</p>
                            ) : recommendationsError ? (
                                <div className="alert alert-danger" role="alert">
                                    <p>{recommendationsError}</p>
                                    <button type="button" className="btn btn-outline-danger" onClick={handleRecommendationsRetry}>Reintentar</button>
                                </div>
                            ) : visibleRecommendations.length === 0 ? (
                                <p className="empty-state">No hay publicaciones sugeridas por ahora.</p>
                            ) : visibleRecommendations.map(renderTweet)}
                        </section>
                    )}
                </div>

            </div>
            <aside className="feed-aside" id="people-to-follow">
                    <SuggestedUsers
                        key={`${userId}:${JSON.stringify(followingIds)}`}
                        userId={userId}
                        onFollow={handleFollowingChanged}
                    />
                <p className="aside-brand-note"><strong>Signal · Tu voz conecta</strong>Un espacio para las ideas que merecen ser compartidas.</p>
            </aside>
        </main>
    );
};

const FeedPage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [sessionError, setSessionError] = useState(false);

    useEffect(() => {
        return onAuthStateChanged(
            FirebaseAuth,
            (currentUser) => {
                setUser(currentUser);
                setIsCheckingSession(false);
            },
            () => {
                setSessionError(true);
                setIsCheckingSession(false);
            },
        );
    }, []);

    if (isCheckingSession) {
        return (
            <p className="container py-4" role="status">
                Comprobando sesión...
            </p>
        );
    }

    if (sessionError) {
        return (
            <p className="container py-4" role="alert">
                No fue posible comprobar la sesión. Recarga la página.
            </p>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <FeedProvider key={user.uid} userId={user.uid}>
            <FeedContent userId={user.uid} />
        </FeedProvider>
    );
};

export default FeedPage;
