
import { getFollowedUsers } from '../firebase/following';
import { getFollowers } from '../firebase/followers';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    collection,
    doc,
    DocumentSnapshot,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    Timestamp,
    where
} from 'firebase/firestore';
import { FirebaseDB } from '../firebase/config';
import TweetCard from '../ui/components/TweetCard';
import { Avatar } from '../ui/components/Avatar';
import { BrandLogo } from '../ui/components/BrandLogo';

interface UserProfileData {
    uid: string;
    fullName: string;
    username: string;
    email: string;
    createdAt?: Timestamp;
}

interface TweetData {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Timestamp;
}

const TWEETS_PER_PAGE = 10;

const ProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [profileUser, setProfileUser] =
        useState<UserProfileData | null>(null);

    const [tweets, setTweets] = useState<TweetData[]>([]);
    const [followingCount, setFollowingCount] = useState(0);
    const [followersCount, setFollowersCount] = useState(0);
    const [tweetsCount, setTweetsCount] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingTweets, setIsLoadingTweets] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [pageIndex, setPageIndex] = useState(0);
    const [pageCursors, setPageCursors] = useState<
        Array<DocumentSnapshot | null>
    >([null]);
    const [hasNextPage, setHasNextPage] = useState(false);

    useEffect(() => {
        if (!id) {
            setErrorMessage('User ID is missing.');
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        const fetchProfile = async () => {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const userRef = doc(FirebaseDB, 'users', id);
                const userSnapshot = await getDoc(userRef);

                if (!userSnapshot.exists()) {
                    throw new Error('User profile not found.');
                }

                if (cancelled) return;

                setProfileUser(userSnapshot.data() as UserProfileData);


                const tweetsQuery = query(
                    collection(FirebaseDB, 'tweets'),
                    where('authorId', '==', id),
                );

                const [followingUsers, followerUsers, tweetsSnapshot] =
                    await Promise.all([
                        getFollowedUsers(id),
                        getFollowers(id),
                        getCountFromServer(tweetsQuery),
                    ]);

                if (cancelled) return;

                setFollowingCount(followingUsers.length);
                setFollowersCount(followerUsers.length);
                setTweetsCount(tweetsSnapshot.data().count);
            } catch (error) {
                if (cancelled) return;

                console.error('Error fetching profile:', error);

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load profile information.'
                );
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void fetchProfile();

        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        const fetchTweets = async () => {
            setIsLoadingTweets(true);

            try {
                const constraints = [
                    where('authorId', '==', id),
                    orderBy('createdAt', 'desc'),
                    limit(TWEETS_PER_PAGE + 1)
                ];

                const tweetsQuery = pageCursors[pageIndex]
                    ? query(
                        collection(FirebaseDB, 'tweets'),
                        ...constraints,
                        startAfter(pageCursors[pageIndex])
                    )
                    : query(
                        collection(FirebaseDB, 'tweets'),
                        ...constraints
                    );

                const snapshot = await getDocs(tweetsQuery);

                if (cancelled) return;

                setTweets(
                    snapshot.docs
                        .slice(0, TWEETS_PER_PAGE)
                        .map((tweetDoc) => ({
                            id: tweetDoc.id,
                            ...tweetDoc.data()
                        }) as TweetData)
                );

                setHasNextPage(snapshot.docs.length > TWEETS_PER_PAGE);
            } catch (error) {
                if (cancelled) return;

                console.error('Error fetching user tweets:', error);
                setTweets([]);
                setHasNextPage(false);
            } finally {
                if (!cancelled) {
                    setIsLoadingTweets(false);
                }
            }
        };

        void fetchTweets();

        return () => {
            cancelled = true;
        };
    }, [id, pageIndex, pageCursors]);

    const handleNextPage = () => {
        if (!hasNextPage || tweets.length === 0) return;

        const lastVisibleTweet = tweets[tweets.length - 1];

        if (pageIndex + 1 >= pageCursors.length) {
            const lastCursor = lastVisibleTweet.id;

            void getDoc(doc(FirebaseDB, 'tweets', lastCursor)).then(
                (lastTweetSnapshot) => {
                    if (!lastTweetSnapshot.exists()) return;

                    setPageCursors((previous) => [
                        ...previous,
                        lastTweetSnapshot
                    ]);
                    setPageIndex((previous) => previous + 1);
                }
            );

            return;
        }

        setPageIndex((previous) => previous + 1);
    };

    const handlePreviousPage = () => {
        if (pageIndex === 0) return;

        setPageIndex((previous) => previous - 1);
    };

    if (isLoading) {
        return (
            <div className="social-page loading-state" role="status">
                <div className="spinner-border text-primary" />
                <p className="mt-2 text-muted">Cargando perfil...</p>
            </div>
        );
    }

    if (errorMessage || !profileUser) {
        return (
            <div className="social-page">
                <div className="alert alert-danger" role="alert">
                    {errorMessage || 'Profile not available.'}
                </div>

                <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => navigate('/feed')}
                >
                    Volver al inicio
                </button>
            </div>
        );
    }

    return (
        <main className="social-page profile-page">
            <header className="page-heading"><span className="eyebrow">Personas que conectan</span><h1 className="mt-2">Perfil</h1></header>
            <section className="profile-card" aria-label={`Perfil de ${profileUser.fullName}`}>
                <div className="profile-cover"><BrandLogo variant="symbol" width={52} decorative /></div>
                <div className="profile-details">
                    <Avatar name={profileUser.fullName} size="lg" />
                    <h2 className="profile-name">{profileUser.fullName}</h2>
                    <p className="profile-handle">@{profileUser.username}</p>
                    <p className="profile-email">{profileUser.email}</p>
                    <div className="profile-stats">
                        <span><strong>{tweetsCount}</strong> publicaciones</span>
                        <Link to={`/profile/${encodeURIComponent(id!)}/following`}><strong>{followingCount}</strong> siguiendo</Link>
                        <Link to={`/profile/${encodeURIComponent(id!)}/followers`}><strong>{followersCount}</strong> seguidores</Link>
                    </div>
                </div>
            </section>
            <section aria-labelledby="profile-posts-title">
                <h2 id="profile-posts-title" className="mb-4">Publicaciones</h2>
                {isLoadingTweets ? (
                    <p className="loading-state" role="status">Cargando publicaciones...</p>
                ) : tweets.length === 0 ? (
                    <p className="empty-state">Este usuario todavía no tiene publicaciones para mostrar.</p>
                ) : <>
                    {tweets.map((tweet) => (
                        <TweetCard key={tweet.id} authorId={tweet.authorId} authorName={profileUser.fullName} username={profileUser.username} content={tweet.content} createdAt={tweet.createdAt} />
                    ))}
                    <nav className="pagination-bar" aria-label="Paginación de publicaciones del perfil">
                        <span>Página {pageIndex + 1}</span>
                        <div className="d-flex gap-2">
                            <button type="button" className="btn btn-outline-light btn-sm" onClick={handlePreviousPage} disabled={pageIndex === 0}>Anterior</button>
                            <button type="button" className="btn btn-outline-light btn-sm" onClick={handleNextPage} disabled={!hasNextPage}>Siguiente</button>
                        </div>
                    </nav>
                </>}
            </section>
            <Link to="/feed" className="back-link">← Volver al inicio</Link>
        </main>
    );
};

export default ProfilePage;
