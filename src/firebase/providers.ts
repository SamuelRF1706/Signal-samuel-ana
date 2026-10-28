import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseAuth } from './config';

interface AuthSuccessResult {
    ok: true;
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

interface AuthErrorResult {
    ok: false;
    errorMessage: string;
}

type AuthResult = AuthSuccessResult | AuthErrorResult;

export const loginUserByCredentials = async (
    email: string,
    password: string,
): Promise<AuthResult> => {
    try {
        const { user } = await signInWithEmailAndPassword(
            FirebaseAuth,
            email,
            password,
        );

        return {
            ok: true,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
        };
    } catch (error: unknown) {
        let errorMessage = 'No fue posible iniciar sesión. Inténtalo de nuevo.';

        if (error instanceof FirebaseError) {
            switch (error.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-email':
                    errorMessage = 'El correo o la contraseña no son válidos.';
                    break;

                case 'auth/too-many-requests':
                    errorMessage = 'Demasiados intentos. Inténtalo más tarde.';
                    break;

                case 'auth/network-request-failed':
                    errorMessage = 'Revisa tu conexión a internet.';
                    break;
            }
        }

        return {
            ok: false,
            errorMessage,
        };
    }
};
