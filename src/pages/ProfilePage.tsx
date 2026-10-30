
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
            <div className="container py-5 text-center" role="status">
                <div className="spinner-border text-primary" />
                <p className="mt-2 text-muted">Loading profile...</p>
            </div>
        );
    }

    if (errorMessage || !profileUser) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger" role="alert">
                    {errorMessage || 'Profile not available.'}
                </div>

                <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => navigate('/feed')}
                >
                    Back to Feed
                </button>
            </div>
        );
    }

    return (
        <main className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-lg-8">
                    <section className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-4">
                            <h1 className="h3 fw-bold mb-1">
                                {profileUser.fullName}
                            </h1>

                            <p className="text-muted mb-2">
                                @{profileUser.username}
                            </p>

                            <p className="mb-0">
                                <span className="text-muted me-2">
                                    Email:
                                </span>
                                {profileUser.email}
                            </p>

                            <hr />

                            <div className="row text-center g-3">
                                <div className="col-4">
                                    <div className="p-3 rounded bg-light h-100">
                                        <div className="fs-4 fw-bold">
                                            {tweetsCount}
                                        </div>
                                        <div className="text-muted small">
                                            Tweets
                                        </div>
                                    </div>
                                </div>

                                <div className="col-4">
                                    <Link
                                        to={`/profile/${encodeURIComponent(id!)}/following`}
                                        className="d-block p-3 rounded bg-light h-100 text-decoration-none text-dark"
                                    >
                                        <div className="fs-4 fw-bold">
                                            {followingCount}
                                        </div>

                                        <div className="text-muted small">
                                            Siguiendo
                                        </div>
                                    </Link>
                                </div>
                                <div className="col-4">
                                    <Link
                                        to={`/profile/${encodeURIComponent(id!)}/followers`}
                                        className="d-block p-3 rounded bg-light h-100 text-decoration-none text-dark"
                                    >
                                        <div className="fs-4 fw-bold">
                                            {followersCount}
                                        </div>

                                        <div className="text-muted small">
                                            Seguidores
                                        </div>
                                    </Link>
                                </div>
                            </div>

                            <div className="text-end mt-4">
                                <button
                                    type="button"
                                    className="btn btn-outline-dark btn-sm px-4"
                                    onClick={() => navigate('/feed')}
                                >
                                    Back to Feed
                                </button>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="h4 fw-bold mb-3">
                            Publicaciones
                        </h2>

                        {isLoadingTweets ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" />
                                <p className="text-muted mt-2">
                                    Loading tweets...
                                </p>
                            </div>
                        ) : tweets.length === 0 ? (
                            <div className="alert alert-light border">
                                This user has not published any tweets yet.
                            </div>
                        ) : (
                            <>
                                <div className="d-flex flex-column gap-3">
                                    {tweets.map((tweet) => (
                                        <TweetCard
                                            key={tweet.id}
                                            authorId={tweet.authorId}
                                            authorName={profileUser.fullName}
                                            username={profileUser.username}
                                            content={tweet.content}
                                            createdAt={tweet.createdAt}
                                        />
                                    ))}
                                </div>

                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <span className="text-muted small">
                                        Página {pageIndex + 1}
                                    </span>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-dark btn-sm"
                                            onClick={handlePreviousPage}
                                            disabled={pageIndex === 0}
                                        >
                                            Anterior
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-outline-dark btn-sm"
                                            onClick={handleNextPage}
                                            disabled={!hasNextPage}
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
};

export default ProfilePage;
