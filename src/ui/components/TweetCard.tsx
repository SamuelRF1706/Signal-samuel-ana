import React from 'react';
import { Link } from 'react-router-dom';
import type { Timestamp } from 'firebase/firestore';

export interface TweetCardProps {
    authorId: string;
    authorName: string;
    username?: string;
    content: string;
    createdAt: Timestamp;
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
}) => {
    return (
        <article className="card border-0 shadow-sm mb-3">
            <div className="card-body p-4">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <Link
                        to={`/profile/${authorId}`}
                        className="fw-bold text-decoration-none text-dark"
                    >
                        {authorName}
                    </Link>

                    {username && (
                        <span className="text-muted small">
                            @{username}
                        </span>
                    )}

                    <span className="text-muted small ms-auto">
                        {formatDate(createdAt)}
                    </span>
                </div>

                <p className="mb-0 text-break" style={{ whiteSpace: 'pre-wrap' }}>
                    {content}
                </p>
            </div>
        </article>
    );
};

export default TweetCard;