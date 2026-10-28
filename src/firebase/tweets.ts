import {
    addDoc,
    collection,
    serverTimestamp,
} from 'firebase/firestore';
import { FirebaseAuth, FirebaseDB } from './config';

export const publishTweet = async (content: string): Promise<string> => {
    const user = FirebaseAuth.currentUser;

    if (!user) {
        throw new Error('Debes iniciar sesión para publicar.');
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
        throw new Error('El tweet no puede estar vacío.');
    }

    if (trimmedContent.length > 280) {
        throw new Error('El tweet no puede superar los 280 caracteres.');
    }

    const document = await addDoc(collection(FirebaseDB, 'tweets'), {
        authorId: user.uid,
        authorName: user.displayName || user.email || 'User',
        content: trimmedContent,
        createdAt: serverTimestamp(),
    });

    return document.id;
};
