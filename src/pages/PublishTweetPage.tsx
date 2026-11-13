import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FirebaseAuth } from '../firebase/config';
import { publishTweet } from '../firebase/tweets';
import { Avatar } from '../ui/components/Avatar';
import { Icon } from '../ui/components/Icon';

const PublishTweetPage = () => {
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [sessionError, setSessionError] = useState(false);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        return onAuthStateChanged(
            FirebaseAuth,
            (currentUser) => {
                setUser(currentUser);
                setIsCheckingSession(false);
            },
            () => {
                setSessionError(true);
                setIsCheckingSession(false);
            },
        );
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isSubmitting) return;

        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            await publishTweet(content);

            navigate('/feed', {
                replace: true,
                state: {
                    successMessage: 'Tweet publicado correctamente.',
                },
            });
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'No fue posible publicar. Inténtalo de nuevo.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCheckingSession) {
        return (
            <p className="container py-4" role="status">
                Comprobando sesión...
            </p>
        );
    }

    if (sessionError) {
        return (
            <p className="container py-4" role="alert">
                No fue posible comprobar la sesión. Recarga la página.
            </p>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <main className="social-page publish-page">
            <div className="page-inner">
                <div className="page-inner">
                    <header className="page-heading"><span className="eyebrow">Tu voz tiene un lugar aquí</span><h1 className="mt-2">Comparte una idea</h1><p>Una idea, una pregunta o algo que vale la pena contar.</p></header>

                    <form onSubmit={handleSubmit} className="publish-surface">
                        <div className="publish-author"><Avatar name={user.displayName || user.email || 'Tu voz'} /><span>Publicando en Signal</span></div>
                        <div className="mb-3">
                            <label
                                htmlFor="tweet-content"
                                className="form-label"
                            >
                                ¿Qué está pasando?
                            </label>

                            <textarea
                                id="tweet-content"
                                name="content"
                                className="form-control"
                                rows={7}
                                maxLength={280}
                                required
                                value={content}
                                onChange={(event) =>
                                    setContent(event.target.value)
                                }
                                disabled={isSubmitting}
                                aria-describedby="tweet-counter"
                            />

                            <p
                                id="tweet-counter"
                                className="publish-counter"
                            >
                                {content.length}/280
                            </p>
                        </div>

                        {errorMessage && (
                            <div className="alert alert-danger" role="alert">
                                {errorMessage}
                            </div>
                        )}

                        <div className="publish-actions">
                            <Link
                                to="/feed"
                                className="btn btn-outline-dark"
                            >
                                Volver al inicio
                            </Link>

                            <button
                                type="submit"
                                className="btn btn-dark"
                                disabled={
                                    isSubmitting ||
                                    content.trim().length === 0
                                }
                            >
                                <Icon name="write" /> {isSubmitting ? 'Publicando...' : 'Publicar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default PublishTweetPage;
