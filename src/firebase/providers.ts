import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseAuth } from "./config";

interface AuthResult {
  ok: boolean;
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthErrorResult {
  ok: boolean;
  errorMessage: string;
}

export const loginUserByCredentials = async (
  email: string,
  password: string,
): Promise<AuthResult | AuthErrorResult> => {
  try {
    const result = await signInWithEmailAndPassword(
      FirebaseAuth,
      email,
      password,
    );

    const user = result.user;

    const { uid, displayName, photoURL } = user;

    return {
      ok: true,
      uid,
      email,
      displayName,
      photoURL,
    };
  } catch (error: any) {
    return {
      ok: false,
      errorMessage: error.message
    };
  }
};
