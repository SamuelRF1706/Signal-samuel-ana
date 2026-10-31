import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { followUser } from '../../firebase/following';
import { getSuggestedUsers } from '../../firebase/users';
import type { SuggestedUser } from '../../firebase/users';

interface SuggestedUsersProps {
    userId: string;
    onFollow: () => void;
}

const SuggestedUsers = ({ userId, onFollow }: SuggestedUsersProps) => {
    const [users, setUsers] = useState<SuggestedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [followError, setFollowError] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<string[]>([]);
    const [retryCount, setRetryCount] = useState(0);

    const pendingRequests = useRef(new Set<string>());

    useEffect(() => {
        let cancelled = false;

        const loadSuggestions = async () => {
            try {
                const suggestions = await getSuggestedUsers(userId);

                if (!cancelled) {
                    setUsers(suggestions);
                    setLoadError(false);
                }
            } catch (error: unknown) {
                console.error('Error al cargar sugerencias:', error);

                if (!cancelled) setLoadError(true);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        void loadSuggestions();

        return () => {
            cancelled = true;
        };
    }, [userId, retryCount]);

    const handleRetry = () => {
        setIsLoading(true);
        setLoadError(false);
        setRetryCount((current) => current + 1);
    };

    const handleFollow = async (targetUser: SuggestedUser) => {
        if (pendingRequests.current.has(targetUser.id)) return;

        pendingRequests.current.add(targetUser.id);
        setPendingIds((current) => [...current, targetUser.id]);
        setFollowError(null);

        try {
            await followUser(targetUser.id);
        } catch (error: unknown) {
            console.error('Error al seguir usuario:', error);

            setFollowError(
                `No fue posible seguir a ${targetUser.fullName}. Inténtalo de nuevo.`,
            );

            return;
        } finally {
            pendingRequests.current.delete(targetUser.id);

            setPendingIds((current) =>
                current.filter((id) => id !== targetUser.id),
            );
        }

        setUsers((current) =>
            current.filter((user) => user.id !== targetUser.id),
        );

        onFollow();
    };

    return (
        <section
            className="card border-0 shadow-sm"
            aria-labelledby="suggested-users-title"
        >
            <div className="card-body p-4">
                <h2 id="suggested-users-title" className="h5 fw-bold mb-3">
                    Personas para seguir
                </h2>

                {followError && (
                    <p className="alert alert-danger small" role="alert">
                        {followError}
                    </p>
                )}

                {isLoading ? (
                    <p className="text-muted mb-0" role="status">
                        Cargando sugerencias...
                    </p>
                ) : loadError ? (
                    <div role="alert">
                        <p className="text-muted">
                            No fue posible cargar las sugerencias.
                        </p>

                        <button
                            type="button"
                            className="btn btn-outline-light btn-sm"
                            onClick={handleRetry}
                        >
                            Reintentar
                        </button>
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-muted mb-0">
                        No hay sugerencias disponibles por ahora.
                    </p>
                ) : (
                    <ul className="list-group list-group-flush">
                        {users.map((user) => {
                            const isPending = pendingIds.includes(user.id);

                            return (
                                <li
                                    key={user.id}
                                    className="list-group-item px-0 py-3 d-flex align-items-center justify-content-between gap-3"
                                >
                                    <Link
                                        to={`/profile/${encodeURIComponent(user.id)}`}
                                        className="text-body text-decoration-none text-break"
                                    >
                                        <span className="d-block fw-semibold">
                                            {user.fullName}
                                        </span>

                                        {user.username && (
                                            <span className="text-muted small">
                                                @{user.username}
                                            </span>
                                        )}
                                    </Link>

                                    <button
                                        type="button"
                                        className="btn btn-light rounded-circle flex-shrink-0"
                                        aria-label={`Seguir a ${user.fullName}`}
                                        aria-busy={isPending}
                                        disabled={isPending}
                                        onClick={() => void handleFollow(user)}
                                    >
                                        {isPending ? '…' : '+'}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>
    );
};

export default SuggestedUsers;
