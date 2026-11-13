import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Timestamp } from 'firebase/firestore';
import { Avatar } from './Avatar';

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
        <article className="tweet-card">
            <header className="tweet-heading">
                <Avatar name={authorName} />
                <div className="tweet-author">
                    <Link to={`/profile/${authorId}`}>{authorName}</Link>
                    <div className="tweet-meta">
                        {username && <span>@{username}</span>}
                        <span>{formatDate(createdAt)}</span>
                    </div>
                </div>
                {canFollow && (
                    <button
                        type="button"
                        className={`btn follow-action ${isFollowing ? 'following-action' : 'btn-primary'}`}
                        onClick={handleFollowClick}
                        disabled={isLoadingFollow}
                        aria-label={`${isFollowing ? 'Dejar de seguir a' : 'Seguir a'} ${authorName}`}
                        title={isFollowing ? 'Dejar de seguir' : 'Seguir'}
                        aria-busy={isLoadingFollow}
                    >
                        {isLoadingFollow ? 'Procesando…' : isFollowing ? <><span className="following-label">Siguiendo</span><span className="follow-label">Dejar de seguir</span></> : 'Seguir'}
                    </button>
                )}
            </header>
            <p className="tweet-body">{content}</p>
            {followError && <p className="alert alert-danger tweet-error" role="alert">{followError}</p>}
        </article>
    );
};

export default TweetCard;
