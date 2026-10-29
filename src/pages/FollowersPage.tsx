import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, Navigate, useParams } from 'react-router-dom';
import { FirebaseAuth } from '../firebase/config';
import { getFollowers } from '../firebase/followers';
import type { FollowerUser } from '../firebase/followers';

type FollowersState =
    | { status: 'loading' }
    | { status: 'unauthenticated' }
    | { status: 'error'; message: string }
    | { status: 'success'; users: FollowerUser[] };

const FollowersPage = () => {
    const { id } = useParams<{ id: string }>();
    const [state, setState] = useState<FollowersState>({
        status: 'loading',
    });
    const [retryCount, setRetryCount] = useState(0);

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
                    const users = await getFollowers(id ?? user.uid);

                    if (!cancelled && currentRequest === requestId) {
                        setState({ status: 'success', users });
                    }
                } catch (error: unknown) {
                    console.error('Error al cargar los seguidores:', error);

                    if (!cancelled && currentRequest === requestId) {
                        setState({
                            status: 'error',
                            message: 'No fue posible cargar los seguidores.',
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
        <main className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <h1 className="h3 fw-bold mb-2">Seguidores</h1>

                    <p className="text-muted mb-4">
                        Las personas que te siguen en Signal.
                    </p>

                    {state.status === 'loading' && (
                        <p role="status">Cargando seguidores...</p>
                    )}

                    {state.status === 'error' && (
                        <div className="alert alert-danger" role="alert">
                            <p>{state.message}</p>

                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={handleRetry}
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {state.status === 'success' && (
                        state.users.length === 0 ? (
                            <div className="card border-0 shadow-sm">
                                <div className="card-body p-4 text-center">
                                    <h2 className="h5">
                                        Aún no tienes seguidores
                                    </h2>

                                    <p className="text-muted mb-0">
                                        Cuando alguien te siga, aparecerá aquí.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <ul
                                className="list-group shadow-sm"
                                aria-label="Personas que te siguen"
                            >
                                {state.users.map((user) => (
                                    <li
                                        key={user.id}
                                        className="list-group-item p-3"
                                    >
                                        <Link
                                            to={`/profile/${encodeURIComponent(user.id)}`}
                                            className="d-flex align-items-center justify-content-between gap-3 text-dark text-decoration-none"
                                        >
                                            <div className="text-break">
                                                <h2 className="h6 fw-bold mb-1">
                                                    {user.fullName}
                                                </h2>

                                                {user.username && (
                                                    <p className="text-muted small mb-0">
                                                        @{user.username}
                                                    </p>
                                                )}
                                            </div>

                                            <span className="small text-nowrap">
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
                        className="btn btn-outline-dark mt-4"
                    >
                        Volver al feed
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default FollowersPage;
