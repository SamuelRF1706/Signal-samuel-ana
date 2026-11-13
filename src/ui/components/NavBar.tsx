import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseAuth, FirebaseDB } from '../../firebase/config';
import { BrandLogo } from './BrandLogo';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

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

    const { pathname } = useLocation();
    const isPublicPage = ['/', '/login', '/register'].includes(pathname);

    const displayName = isUserDataLoading
        ? 'Cargando...'
        : userData?.fullName || userData?.username || user?.email || 'Profile';

    if (isPublicPage) {
        return (
            <header className="public-header">
                <Link to="/" aria-label="Signal, inicio"><BrandLogo variant="horizontal" width={180} className="public-logo" decorative /></Link>
                <nav aria-label="Navegación pública">
                    {user ? <Link to="/feed" className="btn btn-primary">Ir a mi inicio <Icon name="arrow" /></Link> : <>
                        <Link to="/login">Iniciar sesión</Link>
                        <Link to="/register" className="btn btn-primary">Crear cuenta</Link>
                    </>}
                </nav>
            </header>
        );
    }

    const profilePath = user ? `/profile/${user.uid}` : '/login';
    const navClass = ({ isActive }: { isActive: boolean }) => `social-nav-link${isActive ? ' active' : ''}`;
    return (
        <aside className="social-sidebar" aria-label="Navegación de Signal">
            <Link to="/feed" className="sidebar-brand" aria-label="Signal, inicio">
                <BrandLogo variant="horizontal" width={195} className="brand-wide" decorative />
                <BrandLogo variant="symbol" width={42} className="brand-compact" decorative />
                <span className="mobile-brand-name">Signal</span>
            </Link>
            <nav className="nav-destinations" aria-label="Navegación principal">
                <NavLink to="/feed" className={navClass} aria-label="Inicio" title="Inicio"><Icon name="home" /><span className="nav-label">Inicio</span></NavLink>
                <NavLink to="/users" className={navClass} aria-label="Explorar usuarios" title="Explorar usuarios"><Icon name="users" /><span className="nav-label">Explorar</span></NavLink>
                <NavLink to="/following" className={({ isActive }) => `${navClass({ isActive })} nav-following`} aria-label="Siguiendo" title="Siguiendo"><Icon name="following" /><span className="nav-label">Siguiendo</span></NavLink>
                <NavLink to={profilePath} end className={({ isActive }) => `${navClass({ isActive })} nav-profile`} aria-label="Mi perfil" title="Mi perfil"><Icon name="profile" /><span className="nav-label">Mi perfil</span></NavLink>
                <NavLink to="/publish" className={({ isActive }) => `${navClass({ isActive })} publish-nav`} aria-label="Publicar" title="Publicar"><Icon name="plus" /><span className="nav-label">Publicar</span></NavLink>
            </nav>
            <div className="sidebar-account">
                {user ? <>
                    <Link to={profilePath} className="account-profile" aria-label={`Mi perfil: ${displayName}`}>
                        <Avatar name={displayName} size="sm" />
                        <span className="account-copy"><strong>{displayName}</strong><small>{userData?.username ? `@${userData.username}` : 'Tu cuenta Signal'}</small></span>
                    </Link>
                    <button type="button" className="logout-button" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout" /><span className="logout-label">Cerrar sesión</span></button>
                </> : <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>}
            </div>
        </aside>
    );
};

export default Navbar;
