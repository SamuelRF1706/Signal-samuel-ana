import React, { useReducer, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { FirebaseAuth, FirebaseDB } from '../firebase/config';
import { RegisterInput } from '../ui/components/RegisterInput';
import { GoogleAuthButton } from '../ui/components/GoogleAuthButton';
import { BrandLogo } from '../ui/components/BrandLogo';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

interface RegisterState {
    fullName: string;
    username: string;
    email: string;
    password: string;
}

type RegisterAction =
    | { type: 'SET_FIELD'; field: keyof RegisterState; value: string }
    | { type: 'RESET_FORM' };

const initialRegisterState: RegisterState = {
    fullName: '',
    username: '',
    email: '',
    password: ''
};

const registerReducer = (state: RegisterState, action: RegisterAction): RegisterState => {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value };
        case 'RESET_FORM':
            return initialRegisterState;
        default:
            return state;
    }
};

const RegisterPage: React.FC = () => {
    const [formState, dispatch] = useReducer(registerReducer, initialRegisterState);
    const { fullName, username, email, password } = formState;

    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleInputChange = (field: keyof RegisterState, value: string) => {
        dispatch({ type: 'SET_FIELD', field, value });
    };

    const handleRegister = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            const usersRef = collection(FirebaseDB, 'users');
            const usernameQuery = query(
                usersRef,
                where('username', '==', username.trim())
            );

            const usernameSnapshot = await getDocs(usernameQuery);

            if (!usernameSnapshot.empty) {
                throw new Error(
                    'This username is already taken. Please choose another one.'
                );
            }

            const userCredential = await createUserWithEmailAndPassword(
                FirebaseAuth,
                email.trim(),
                password
            );

            const user = userCredential.user;

            await setDoc(doc(FirebaseDB, 'users', user.uid), {
                uid: user.uid,
                fullName: fullName.trim(),
                username: username.trim(),
                email: email.trim(),
                followersCount: 0,
                followingCount: 0,
                createdAt: new Date().toISOString()
            });

            dispatch({ type: 'RESET_FORM' });

            void Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Welcome to Signal!',
                text: 'Your account has been created successfully.',
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true
            });

            navigate('/feed', { replace: true });

        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'An error occurred during registration.';

            setErrorMessage(message);

            void Swal.fire({
                icon: 'error',
                title: 'Registration failed',
                text: message,
                confirmButtonText: 'Try again',
                confirmButtonColor: '#212529'
            });

        } finally {
            setLoading(false);
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

                            <h1 className="card-title fw-black text-center mb-4 fs-3">
                                Tu comunidad empieza aquí
                            </h1>

                            {errorMessage && (
                                <div className="alert alert-danger py-2 small" role="alert">
                                    {errorMessage}
                                </div>
                            )}

                            <form onSubmit={handleRegister}>
                                <RegisterInput
                                    id="fullName"
                                    label="Nombre completo"
                                    type="text"
                                    placeholder="Tu nombre completo"
                                    value={fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                />

                                <RegisterInput
                                    id="username"
                                    label="Nombre de usuario"
                                    type="text"
                                    placeholder="nickname"
                                    value={username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    icon="@"
                                />

                                <RegisterInput
                                    id="email"
                                    label="Correo electrónico"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    helpText="Usa un correo al que tengas acceso."
                                />

                                <RegisterInput
                                    id="password"
                                    label="Contraseña"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    helpText="Elige una contraseña segura."
                                />

                                <button
                                    type="submit"
                                    className="btn btn-dark btn-lg w-100 fw-bold rounded-pill shadow-sm py-2 mt-3"
                                    disabled={loading}
                                >
                                    {loading ? 'Creando cuenta…' : 'Crear cuenta'}
                                </button>
                            </form>

                            {/* Separador e integración del botón de Google Auth */}
                            <div className="auth-separator">o continúa con</div>

                            <GoogleAuthButton buttonText="Registrarse con Google" />

                            <p className="auth-footer">
                                ¿Ya tienes cuenta?{' '}
                                <Link to="/login">Iniciar sesión</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RegisterPage;
