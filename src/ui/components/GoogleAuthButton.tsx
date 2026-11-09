import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../../firebase/providers';

interface GoogleAuthButtonProps {
    buttonText?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
    buttonText = 'Continuar con Google',
}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleGoogleAuth = async () => {
        setLoading(true);
        setErrorMessage(null);

        const result = await signInWithGoogle();

        if (result.ok) {
            navigate('/feed');
        } else {
            setErrorMessage(result.errorMessage);
        }

        setLoading(false);
    };

    return (
        <div className="w-100">
            {errorMessage && (
                <div className="alert alert-danger py-2 small text-center" role="alert">
                    {errorMessage}
                </div>
            )}
            <button
                type="button"
                onClick={handleGoogleAuth}
                className="btn btn-outline-light w-100 py-2 d-flex align-items-center justify-content-center gap-2 rounded-pill shadow-sm fw-semibold"
                disabled={loading}
            >
                <i className="bi bi-google fs-5"></i>
                {loading ? 'Conectando...' : buttonText}
            </button>
        </div>
    );
};