import React, { useReducer, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { FirebaseAuth, FirebaseDB } from '../firebase/config';
import { RegisterInput } from '../ui/components/RegisterInput';
import { useNavigate } from 'react-router-dom';
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
                createdAt: new Date()
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
        <section className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    <div className="card border border-light-subtle rounded-4 shadow-sm">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <i className="bi bi-twitter-x fs-1"></i>
                            </div>

                            <h2 className="card-title fw-black text-center mb-4 fs-3">
                                Create your account
                            </h2>

                            {errorMessage && (
                                <div className="alert alert-danger py-2 small" role="alert">
                                    {errorMessage}
                                </div>
                            )}

                            <form onSubmit={handleRegister}>
                                <RegisterInput
                                    id="fullName"
                                    label="Full Name"
                                    type="text"
                                    placeholder="Write your full name"
                                    value={fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                />

                                <RegisterInput
                                    id="username"
                                    label="Username"
                                    type="text"
                                    placeholder="nickname"
                                    value={username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    icon="@"
                                />

                                <RegisterInput
                                    id="email"
                                    label="Email address"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    helpText="We’ll never share your email with anyone else."
                                />

                                <RegisterInput
                                    id="password"
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    helpText="Must be 8-20 characters long."
                                />

                                <button
                                    type="submit"
                                    className="btn btn-dark btn-lg w-100 fw-bold rounded-pill shadow-sm py-2 mt-3"
                                    disabled={loading}
                                >
                                    {loading ? 'Signing Up...' : 'Sign Up'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RegisterPage;