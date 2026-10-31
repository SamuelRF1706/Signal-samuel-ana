import React, { useState } from 'react';
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
    const [isHovered, setIsHovered] = useState(false);

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

                    <span className="text-secondary small ms-auto">
                        {formatDate(createdAt)}
                    </span>
                </div>

                <p className="mb-0 text-break text-light" style={{ whiteSpace: 'pre-wrap' }}>
                    {content}
                </p>
            </div>
        </article>
    );
};

export default TweetCard;