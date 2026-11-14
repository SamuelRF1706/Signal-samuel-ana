import { UserIdentity } from '../ui/components/UserIdentity';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, Navigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { FirebaseAuth, FirebaseDB } from '../firebase/config';
import { followUser, unfollowUser } from '../firebase/followingActions';

export interface DirectoryUser {
    id: string;
    fullName: string;
    username?: string;
    email?: string;
}

type UsersState =
    | { status: 'loading' }
    | { status: 'unauthenticated' }
    | { status: 'error'; message: string }
    | { status: 'success'; users: DirectoryUser[]; followingIds: Set<string> };

const UsersPage = () => {
    const [state, setState] = useState<UsersState>({ status: 'loading' });
    const [retryCount, setRetryCount] = useState(0);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        let requestId = 0;

        const unsubscribe = onAuthStateChanged(
            FirebaseAuth,
            async (user) => {
                if (cancelled) return;
                const currentRequest = ++requestId;

                if (!user) {
                    setState({ status: 'unauthenticated' });
                    return;
                }

                setState({ status: 'loading' });

                try {
                    const usersSnapshot = await getDocs(collection(FirebaseDB, 'users'));
                    const usersList: DirectoryUser[] = [];

                    usersSnapshot.forEach((docSnap) => {
                        const data = docSnap.data();
                        if (docSnap.id !== user.uid) {
                            usersList.push({
                                id: docSnap.id,
                                fullName: data.fullName || data.name || 'Usuario',
                                username: data.username,
                                email: data.email,
                            });
                        }
                    });

                    const followingSnapshot = await getDocs(
                        collection(FirebaseDB, 'users', user.uid, 'following')
                    );
                    const followingSet = new Set<string>();
                    followingSnapshot.forEach((docSnap) => {
                        followingSet.add(docSnap.id);
                    });

                    if (!cancelled && currentRequest === requestId) {
                        setState({
                            status: 'success',
                            users: usersList,
                            followingIds: followingSet,
                        });
                    }
                } catch (error: unknown) {
                    console.error('Error al cargar los usuarios:', error);
                    if (!cancelled && currentRequest === requestId) {
                        setState({
                            status: 'error',
                            message: 'No fue posible cargar la lista de usuarios.',
                        });
                    }
                }
            },
            () => {
                if (!cancelled) {
                    ++requestId;
                    setState({ status: 'error', message: 'No fue posible comprobar la sesión.' });
                }
            }
        );

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [retryCount]);

    const handleToggleFollow = async (targetUserId: string) => {
        const currentUser = FirebaseAuth.currentUser;
        if (!currentUser || state.status !== 'success') return;

        setActionLoadingId(targetUserId);
        const isCurrentlyFollowing = state.followingIds.has(targetUserId);

        try {
            const newFollowingIds = new Set(state.followingIds);

            if (isCurrentlyFollowing) {
                await unfollowUser(currentUser.uid, targetUserId);
                newFollowingIds.delete(targetUserId);
            } else {
                await followUser(currentUser.uid, targetUserId);
                newFollowingIds.add(targetUserId);
            }

            setState({
                ...state,
                followingIds: newFollowingIds,
            });
        } catch (error) {
            console.error('Error al actualizar el estado de seguimiento:', error);
        } finally {
            setActionLoadingId(null);
        }
    };

    if (state.status === 'unauthenticated') {
        return <Navigate to="/login" replace />;
    }

    return (
        <main className="social-page">
            <div className="page-inner">
                <div className="page-inner">
                    <span className="eyebrow">Tu próxima conexión empieza aquí</span>
                    <h1 className="mt-2 mb-2">Explorar personas</h1>
                    <p className="text-secondary mb-4">Descubre y conecta con otros usuarios en la red social.</p>

                    {state.status === 'loading' && <p role="status" className="text-light">Cargando usuarios...</p>}

                    {state.status === 'error' && (
                        <div className="alert alert-danger" role="alert">
                            <p className="mb-2">{state.message}</p>
                            <button
                                type="button"
                                className="btn btn-outline-light btn-sm"
                                onClick={() => setRetryCount((c) => c + 1)}
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {state.status === 'success' && (
                        state.users.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-copy">
                                    <h2 className="h5 text-light mb-0">No hay más usuarios registrados</h2>
                                </div>
                            </div>
                        ) : (
                            <ul className="people-list people-surface">
                                {state.users.map((user) => {
                                    const isFollowing = state.followingIds.has(user.id);
                                    const isActionLoading = actionLoadingId === user.id;

                                    return (
                                        <li key={user.id} className="person-row">
                                            <div className="directory-person">
                                                <Link
                                                    to={`/profile/${encodeURIComponent(user.id)}`}
                                                    className="text-light text-decoration-none flex-grow-1 text-break"
                                                >
                                                    <UserIdentity name={user.fullName} username={user.username} detail={user.email} />
                                                </Link>

                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${isFollowing ? 'following-action' : 'btn-primary'
                                                        }`}
                                                    aria-label={`${isFollowing ? 'Dejar de seguir a' : 'Seguir a'} ${user.fullName}`}
                                                    title={isFollowing ? 'Dejar de seguir' : 'Seguir'}
                                                    onClick={() => handleToggleFollow(user.id)}
                                                    disabled={isActionLoading}
                                                    style={{ minWidth: '95px' }}
                                                >
                                                    {isActionLoading ? (
                                                        <span role="status">Procesando…</span>
                                                    ) : isFollowing ? (
                                                        <><span className="following-label">Siguiendo</span><span className="follow-label">Dejar de seguir</span></>
                                                    ) : (
                                                        'Seguir'
                                                    )}
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )
                    )}

                    <Link to="/feed" className="back-link">
                        ← Volver al inicio
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default UsersPage;