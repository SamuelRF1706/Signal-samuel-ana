import { UserIdentity } from '../ui/components/UserIdentity';
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
        <main className="social-page">
            <div className="page-inner">
                <div className="page-inner">
                    <h1 className="h3 fw-bold mb-2 text-light">Seguidores</h1>

                    <p className="text-muted mb-4">
                        {id ? 'Las personas que siguen a este perfil.' : 'Las personas que te siguen en Signal.'}
                    </p>

                    {state.status === 'loading' && (
                        <p role="status" className='text-light'>Cargando seguidores...</p>
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
                            <div className="empty-state">
                                <div className="empty-state-copy">
                                    <h2 className="h5 text-light">
                                        No hay seguidores para mostrar
                                    </h2>

                                    <p className="text-muted mb-0">
                                        Las personas que sigan a este perfil aparecerán aquí.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <ul
                                className="people-list people-surface"
                                aria-label="Personas que te siguen"
                            >
                                {state.users.map((user) => (
                                    <li
                                        key={user.id}
                                        className="person-row"
                                    >
                                        <Link
                                            to={`/profile/${encodeURIComponent(user.id)}`}
                                            className="d-flex align-items-center justify-content-between gap-3 text-light text-decoration-none"
                                        >
                                            <UserIdentity name={user.fullName} username={user.username} />

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
                        className="back-link"
                    >
                        ← Volver al inicio
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default FollowersPage;
