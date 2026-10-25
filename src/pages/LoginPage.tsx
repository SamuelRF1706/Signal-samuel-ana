import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { loginUserByCredentials } from '../firebase/providers';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isSubmitting) return;

        setErrorMessage(null);
        setSuccessMessage(null);
        setIsSubmitting(true);

        try {
            const result = await loginUserByCredentials(email.trim(), password);

            if (result.ok === false) {
                setErrorMessage(result.errorMessage);
                return;
            }

            setPassword('');
            setSuccessMessage('Sesión iniciada correctamente.');
        } catch {
            setErrorMessage('Ocurrió un error inesperado. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    <div className="card border border-light-subtle rounded-4 shadow-sm">
                        <div className="card-body p-5">
                            <h1 className="fw-bold text-center mb-4 fs-3">
                                Log in to Signal
                            </h1>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label
                                        htmlFor="login-email"
                                        className="form-label fw-semibold"
                                    >
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        id="login-email"
                                        name="email"
                                        className="form-control form-control-lg rounded-3"
                                        placeholder="name@example.com"
                                        autoComplete="username"
                                        required
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label
                                        htmlFor="login-password"
                                        className="form-label fw-semibold"
                                    >
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="login-password"
                                        name="password"
                                        className="form-control form-control-lg rounded-3"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {errorMessage && (
                                    <div className="alert alert-danger" role="alert">
                                        {errorMessage}
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="alert alert-success" role="status">
                                        {successMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-dark btn-lg w-100 fw-bold rounded-pill py-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Logging in...' : 'Log In'}
                                </button>
                            </form>

                            <p className="text-center text-muted mt-4 mb-0">
                                Don't have an account?{' '}
                                <Link to="/register">Register</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LoginPage;