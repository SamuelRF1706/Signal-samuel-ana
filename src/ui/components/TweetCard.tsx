import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Timestamp } from 'firebase/firestore';

export interface TweetCardProps {
    id?: string;
    authorId: string;
    authorName: string;
    username?: string;
    content: string;
    createdAt: Timestamp;
    currentUserId: string;
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

    const isOwnTweet = authorId === currentUserId;

    const handleFollowClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); 
        if (!onToggleFollow || isLoadingFollow) return;

        try {
            setIsLoadingFollow(true);
            await onToggleFollow(authorId, isFollowing);
        } catch (error) {
            console.error('Error toggling follow state:', error);
        } finally {
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
                        onClick={(e) => e.stopPropagation()}
                    >
                        {authorName}
                    </Link>

                    {username && (
                        <span className="text-secondary small">
                            @{username}
                        </span>
                    )}

                    {!isOwnTweet && (
                        <span
                            className={`badge ${
                                isFollowing ? 'bg-success bg-opacity-25 text-success' : 'bg-info bg-opacity-25 text-info'
                            }`}
                            style={{ fontSize: '0.75rem' }}
                        >
                            {isFollowing ? 'Siguiendo' : 'Sugerido'}
                        </span>
                    )}

                    <span className="text-secondary small ms-auto">
                        {formatDate(createdAt)}
                    </span>

                    {!isOwnTweet && onToggleFollow && (
                        <button
                            type="button"
                            className={`btn btn-sm ms-2 ${
                                isFollowing ? 'btn-outline-secondary text-light' : 'btn-primary'
                            }`}
                            onClick={handleFollowClick}
                            disabled={isLoadingFollow}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                            {isLoadingFollow
                                ? 'Procesando...'
                                : isFollowing
                                ? 'Siguiendo'
                                : 'Seguir'}
                        </button>
                    )}
                </div>

                <p className="mb-0 text-break text-light" style={{ whiteSpace: 'pre-wrap' }}>
                    {content}
                </p>
            </div>
        </article>
    );
};

export default TweetCard;