import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Timestamp } from 'firebase/firestore';

export interface TweetCardProps {
    authorId: string;
    authorName: string;
    username?: string;
    content: string;
    createdAt: Timestamp;
    currentUserId?: string;
    isFollowing?: boolean;
    onToggleFollow?: (authorId: string, isCurrentlyFollowing: boolean) => Promise<void> | void;
}

const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return '';
    return timestamp.toDate().toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

export const TweetCard: React.FC<TweetCardProps> = ({
    authorId,
    authorName,
    username,
    content,
    createdAt,
    currentUserId,
    isFollowing = false,
    onToggleFollow,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isLoadingFollow, setIsLoadingFollow] = useState(false);
    const [followError, setFollowError] = useState<string | null>(null);
    const pendingFollow = useRef(false);
    const canFollow = Boolean(currentUserId && authorId !== currentUserId && onToggleFollow);

    const handleFollowClick = async (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!canFollow || !onToggleFollow || pendingFollow.current) return;

        pendingFollow.current = true;
        setIsLoadingFollow(true);
        setFollowError(null);
        try {
            await onToggleFollow(authorId, isFollowing);
        } catch (error: unknown) {
            console.error('Error toggling follow state:', error);
            setFollowError('No fue posible actualizar el seguimiento. Inténtalo de nuevo.');
        } finally {
            pendingFollow.current = false;
            setIsLoadingFollow(false);
        }
    };

    return (
        <article
            className="card border border-secondary shadow-sm mb-3"
            style={{
                backgroundColor: isHovered ? '#3a3e43' : '#2f3235',
                transition: 'background-color 0.2s ease-in-out',
                cursor: 'pointer',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="card-body p-4">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <Link
                        to={`/profile/${authorId}`}
                        className="fw-bold text-decoration-none text-light"
                    >
                        {authorName}
                    </Link>

                    {username && (
                        <span className="text-secondary small">
                            @{username}
                        </span>
                    )}

                    {canFollow && (
                        <span className={`badge ${isFollowing ? 'bg-success bg-opacity-25 text-success' : 'bg-info bg-opacity-25 text-info'}`}>
                            {isFollowing ? 'Siguiendo' : 'Sugerido'}
                        </span>
                    )}

                    <span className="text-secondary small ms-auto">
                        {formatDate(createdAt)}
                    </span>

                    {canFollow && (
                        <button
                            type="button"
                            className={`btn btn-sm ms-2 ${isFollowing ? 'btn-outline-secondary text-light' : 'btn-primary'}`}
                            onClick={handleFollowClick}
                            disabled={isLoadingFollow}
                            aria-label={`${isFollowing ? 'Dejar de seguir a' : 'Seguir a'} ${authorName}`}
                            aria-busy={isLoadingFollow}
                        >
                            {isLoadingFollow ? 'Procesando...' : isFollowing ? 'Siguiendo' : 'Seguir'}
                        </button>
                    )}
                </div>

                <p className="mb-0 text-break text-light" style={{ whiteSpace: 'pre-wrap' }}>
                    {content}
                </p>
                {followError && <p className="alert alert-danger small mt-3 mb-0" role="alert">{followError}</p>}
            </div>
        </article>
    );
};

export default TweetCard;
