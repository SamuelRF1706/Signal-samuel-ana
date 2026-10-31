import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { FirebaseAuth } from '../firebase/config';
import { getFeedAuthorIds, getFeedPage } from '../firebase/feed';
import TweetCard from '../ui/components/TweetCard';
import SuggestedUsers from '../ui/components/SuggestedUsers';

import type { FeedCursor, FeedPageResult } from '../firebase/feed';

interface FeedContentProps {
    userId: string;
}

const FeedContent = ({ userId }: FeedContentProps) => {
    const location = useLocation();

    const successMessage =
        location.state?.successMessage === 'Tweet publicado correctamente.'
            ? 'Tweet publicado correctamente.'
            : null;

    const [page, setPage] = useState<FeedPageResult | null>(null);
    const [cursors, setCursors] = useState<FeedCursor[]>([null]);
    const [pageIndex, setPageIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const cursor = cursors[pageIndex] ?? null;

    useEffect(() => {
        let cancelled = false;

        const loadPage = async () => {
            try {
                const authorIds = await getFeedAuthorIds(userId);
                const result = await getFeedPage(authorIds, cursor);

                if (!cancelled) {
                    setPage(result);
                    setErrorMessage(null);
                }
            } catch (error: unknown) {
                console.error('Error al cargar el feed:', error);

                if (!cancelled) {
                    setErrorMessage(
                        'No fue posible cargar las publicaciones.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadPage();

        return () => {
            cancelled = true;
        };
    }, [userId, cursor, retryCount]);

    const handleNextPage = () => {
        if (isLoading || !page?.hasMore || !page.nextCursor) {
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        setCursors((current) => [
            ...current.slice(0, pageIndex + 1),
            page.nextCursor,
        ]);
        setPageIndex((current) => current + 1);
    };

    const handlePreviousPage = () => {
        if (isLoading || pageIndex === 0) {
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        setPageIndex((current) => current - 1);
    };

    const handleRetry = () => {
        setIsLoading(true);
        setErrorMessage(null);
        setRetryCount((current) => current + 1);
    };


    const handleFollowingChanged = () => {
        setIsLoading(true);
        setErrorMessage(null);
        setCursors([null]);
        setPageIndex(0);
        setRetryCount((current) => current + 1);
    };

    return (
        <main className="container py-4">
            <div className="row justify-content-center g-4">
                <div className="col-12 col-lg-7">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <h1 className="h3 fw-bold mb-0">Inicio</h1>

                        <Link to="/publish" className="btn btn-dark">
                            Tweet
                        </Link>
                    </div>

                    {successMessage && (
                        <div className="alert alert-success" role="status">
                            {successMessage}
                        </div>
                    )}

                    {isLoading ? (
                        <p role="status">Cargando publicaciones...</p>
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
                                <p className="text-muted">
                                    No hay publicaciones en esta página.
                                </p>
                            )}

                            {page?.tweets.map((tweet: any) => {
                                const authorBase = tweet.authorName.includes('@')
                                    ? tweet.authorName.split('@')[0]
                                    : tweet.authorName;

                                const handleUsername = tweet.username || authorBase;

                                return (
                                    <TweetCard
                                        key={tweet.id}
                                        authorId={tweet.authorId}
                                        authorName={authorBase}
                                        username={handleUsername}
                                        content={tweet.content}
                                        createdAt={tweet.createdAt}
                                    />
                                );
                            })}
                        </>
                    )}

                    <nav
                        className="d-flex align-items-center justify-content-between mt-4"
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
                </div>
                <aside className="col-12 col-lg-4">
                    <SuggestedUsers
                        key={userId}
                        userId={userId}
                        onFollow={handleFollowingChanged}
                    />
                </aside>
            </div>
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

    return <FeedContent key={user.uid} userId={user.uid} />;
};

export default FeedPage;
