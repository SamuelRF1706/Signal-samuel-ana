import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseAuth, FirebaseDB } from '../../firebase/config';

interface UserData {
    fullName?: string;
    username?: string;
}

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isUserDataLoading, setIsUserDataLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(FirebaseAuth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                setIsUserDataLoading(true);
                try {
                    const userDocRef = doc(FirebaseDB, 'users', currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        setUserData(userDocSnap.data() as UserData);
                    }
                } catch (error) {
                    console.error("Error fetching user data for Navbar:", error);
                } finally {
                    setIsUserDataLoading(false);
                }
            } else {
                setUserData(null);
                setIsUserDataLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(FirebaseAuth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const displayName = isUserDataLoading
        ? 'Cargando...'
        : userData?.fullName || userData?.username || user?.email || 'Profile';

    return (
        <nav className="navbar navbar-expand-md bg-body-tertiary">
            <div className="container-fluid">
                <span
                    className="navbar-brand fw-bold"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    SIGNAL
                </span>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon" />
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <button
                                type="button"
                                className="nav-link"
                                onClick={() => navigate('/')}
                            >
                                Home
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                type="button"
                                className="nav-link"
                                onClick={() => navigate('/feed')}
                            >
                                Feed
                            </button>
                        </li>

                        {user && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/following" className="nav-link">
                                        Siguiendo
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/users" className="nav-link">
                                        Usuarios
                                    </NavLink>
                                </li>
                            </>
                        )}
                    </ul>

                    <ul className="navbar-nav ms-auto align-items-center">
                        {user ? (
                            <>
                                <li className="nav-item me-2">
                                    <button
                                        type="button"
                                        className="nav-link fw-semibold text-primary"
                                        onClick={() => navigate(`/profile/${user.uid}`)}
                                    >
                                        <i className="bi bi-person-circle me-1"></i>
                                        {displayName}
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                        onClick={handleLogout}
                                    >
                                        Log Out
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <button
                                        type="button"
                                        className="nav-link"
                                        onClick={() => navigate('/login')}
                                    >
                                        Log In
                                    </button>
                                </li>

                                <li className="nav-item">
                                    <button
                                        type="button"
                                        className="nav-link"
                                        onClick={() => navigate('/register')}
                                    >
                                        Register
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;