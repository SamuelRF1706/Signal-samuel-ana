
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, Navigate, useParams } from 'react-router-dom';
import { FirebaseAuth } from '../firebase/config';
import { getFollowedUsers } from '../firebase/following';
import type { FollowedUser } from '../firebase/following';

type FollowingState =
    | { status: 'loading' }
    | { status: 'unauthenticated' }
    | { status: 'error'; message: string }
    | { status: 'success'; users: FollowedUser[] };

const FollowingPage = () => {
    const { id } = useParams<{ id: string }>();
    const [state, setState] = useState<FollowingState>({
        status: 'loading',
    });
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let cancelled = false;
        let requestId = 0;

        const unsubscribe = onAuthStateChanged(
            FirebaseAuth,
            async (user) => {
                const currentRequest = ++requestId;

                if (!user) {
                    setState({ status: 'unauthenticated' });
                    return;
                }

                setState({ status: 'loading' });

                try {
                    const users = await getFollowedUsers(id ?? user.uid);

                    if (!cancelled && currentRequest === requestId) {
                        setState({ status: 'success', users });
                    }
                } catch (error: unknown) {
                    console.error('Error al cargar los seguidos:', error);

                    if (!cancelled && currentRequest === requestId) {
                        setState({
                            status: 'error',
                            message: 'No fue posible cargar los usuarios seguidos.',
                        });
                    }
                }
            },
            () => {
                if (!cancelled) {
                    ++requestId;
                    setState({
                        status: 'error',
                        message: 'No fue posible comprobar la sesión.',
                    });
                }
            },
        );

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [id, retryCount]);

    const handleRetry = () => {
        setState({ status: 'loading' });
        setRetryCount((current) => current + 1);
    };

    if (state.status === 'unauthenticated') {
        return <Navigate to="/login" replace />;
    }

    return (
        <main className="container py-5 text-light">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <h1 className="h3 fw-bold mb-2 text-light">Usuarios seguidos</h1>

                    <p className="text-secondary mb-4">
                        Las personas que sigues en Signal.
                    </p>

                    {state.status === 'loading' && (
                        <p role="status" className="text-light">Cargando usuarios seguidos...</p>
                    )}

                    {state.status === 'error' && (
                        <div className="alert alert-danger" role="alert">
                            <p className="mb-2">{state.message}</p>

                            <button
                                type="button"
                                className="btn btn-outline-light btn-sm"
                                onClick={handleRetry}
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {state.status === 'success' && (
                        state.users.length === 0 ? (
                            <div className="card bg-dark border border-secondary shadow-sm">
                                <div className="card-body p-4 text-center">
                                    <h2 className="h5 text-light">
                                        Aún no sigues a ningún usuario
                                    </h2>

                                    <p className="text-secondary mb-0">
                                        Cuando sigas a alguien, aparecerá aquí.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <ul
                                className="list-group shadow-sm border border-secondary rounded overflow-hidden"
                                aria-label="Usuarios que sigues"
                            >
                                {state.users.map((user) => (
                                    <li
                                        key={user.id}
                                        className="list-group-item bg-dark border-secondary p-3"
                                    >
                                        <Link
                                            to={`/profile/${encodeURIComponent(user.id)}`}
                                            className="d-flex align-items-center justify-content-between gap-3 text-light text-decoration-none"
                                        >
                                            <div className="text-break">
                                                <h2 className="h6 fw-bold mb-1 text-light">
                                                    {user.fullName}
                                                </h2>

                                                {user.username && (
                                                    <p className="text-secondary small mb-0">
                                                        @{user.username}
                                                    </p>
                                                )}
                                            </div>

                                            <span className="small text-secondary text-nowrap">
                                                Ver perfil →
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )
                    )}

                    <Link
                        to="/feed"
                        className="btn btn-outline-light mt-4"
                    >
                        Volver al feed
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default FollowingPage;
