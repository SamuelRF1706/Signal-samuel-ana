import { FirebaseError } from 'firebase/app';
import { 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseAuth, FirebaseDB } from './config';

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

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
        const result = await signInWithPopup(FirebaseAuth, googleProvider);
        const user = result.user;

        // Check if the user document already exists in Firestore
        const userRef = doc(FirebaseDB, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const baseUsername = user.email ? user.email.split('@')[0] : 'user';

            await setDoc(userRef, {
                uid: user.uid,
                fullName: user.displayName || 'Google User',
                username: baseUsername,
                email: user.email,
                followersCount: 0,
                followingCount: 0,
                createdAt: new Date().toISOString(),
            });
        }

        return {
            ok: true,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
        };
    } catch (error: unknown) {
        let errorMessage = 'No fue posible iniciar sesión con Google.';

        if (error instanceof FirebaseError) {
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Se cerró la ventana de inicio de sesión.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Revisa tu conexión a internet.';
            }
        }

        return {
            ok: false,
            errorMessage,
        };
    }
};