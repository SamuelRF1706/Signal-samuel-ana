import { useState } from 'react';
import type { FormEvent } from 'react';
import { loginUserByCredentials } from '../firebase/providers';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleAuthButton } from '../ui/components/GoogleAuthButton';
import { BrandLogo } from '../ui/components/BrandLogo';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isSubmitting) return;

        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            const result = await loginUserByCredentials(email.trim(), password);

            if (result.ok === false) {
                setErrorMessage(result.errorMessage);
                return;
            }

            setPassword('');
            navigate('/feed', { replace: true });
        } catch {
            setErrorMessage('Ocurrió un error inesperado. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="auth-page">
            <div className="auth-inner">
                <div className="auth-inner">
                    <div className="auth-card">
                        <div className="auth-card-content">
                            <div className="auth-brand">
                                <BrandLogo variant="full" width={320} />
                            </div>
                            <h1 className="fw-bold text-center mb-4 fs-3">
                                Vuelve a conectar
                            </h1>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label
                                        htmlFor="login-email"
                                        className="form-label fw-semibold"
                                    >
                                        Correo electrónico
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
                                        Contraseña
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
                                
                                <button
                                    type="submit"
                                    className="btn btn-dark btn-lg w-100 fw-bold rounded-pill py-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
                                </button>
                            </form>

                            <div className="auth-separator">o continúa con</div>

                            <GoogleAuthButton buttonText="Iniciar sesión con Google" />

                            <p className="auth-footer">
                                ¿Aún no tienes cuenta?{' '}
                                <Link to="/register">Crear una cuenta</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LoginPage;
