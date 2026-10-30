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
        <main className="container py-5 text-light">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <h1 className="h3 fw-bold mb-2 text-light">Explorar Usuarios</h1>
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
                            <div className="card bg-dark border border-secondary shadow-sm">
                                <div className="card-body p-4 text-center">
                                    <h2 className="h5 text-light mb-0">No hay más usuarios registrados</h2>
                                </div>
                            </div>
                        ) : (
                            <ul className="list-group shadow-sm border border-secondary rounded overflow-hidden">
                                {state.users.map((user) => {
                                    const isFollowing = state.followingIds.has(user.id);
                                    const isActionLoading = actionLoadingId === user.id;

                                    return (
                                        <li key={user.id} className="list-group-item bg-dark border-secondary p-3">
                                            <div className="d-flex align-items-center justify-content-between gap-3">
                                                <Link
                                                    to={`/profile/${encodeURIComponent(user.id)}`}
                                                    className="text-light text-decoration-none flex-grow-1 text-break"
                                                >
                                                    <h2 className="h6 fw-bold mb-1 text-light">{user.fullName}</h2>
                                                    {user.username && <p className="text-secondary small mb-1">@{user.username}</p>}
                                                    {user.email && <p className="text-secondary small mb-0">{user.email}</p>}
                                                </Link>

                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${isFollowing ? 'btn-outline-secondary text-light' : 'btn-dark text-light'
                                                        }`}
                                                    onClick={() => handleToggleFollow(user.id)}
                                                    disabled={isActionLoading}
                                                    style={{ minWidth: '95px' }}
                                                >
                                                    {isActionLoading ? (
                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                                    ) : isFollowing ? (
                                                        'Siguiendo'
                                                    ) : (
                                                        '+ Seguir'
                                                    )}
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )
                    )}

                    <Link to="/feed" className="btn btn-outline-light mt-4">
                        Volver al feed
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default UsersPage;