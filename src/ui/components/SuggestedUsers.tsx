import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { followUser } from '../../firebase/following';
import { getSuggestedUsers } from '../../firebase/users';
import { UserIdentity } from './UserIdentity';
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
            className="suggested-panel"
            aria-labelledby="suggested-users-title"
        >
            <div>
                <span className="eyebrow">Amplía tu círculo</span>
                <h2 id="suggested-users-title">
                    Personas para seguir
                </h2>
                <p className="panel-description">Encuentra tu próxima conexión.</p>

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
                    <ul className="people-list">
                        {users.map((user) => {
                            const isPending = pendingIds.includes(user.id);

                            return (
                                <li
                                    key={user.id}
                                    className="person-row"
                                >
                                    <Link
                                        to={`/profile/${encodeURIComponent(user.id)}`}
                                        className="text-body text-decoration-none text-break"
                                    >
                                        <UserIdentity name={user.fullName} username={user.username} />
                                    </Link>

                                    <button
                                        type="button"
                                        className="btn btn-outline-light btn-sm"
                                        aria-label={`Seguir a ${user.fullName}`}
                                        aria-busy={isPending}
                                        disabled={isPending}
                                        onClick={() => void handleFollow(user)}
                                    >
                                        {isPending ? 'Siguiendo…' : 'Seguir'}
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
