import { BaseRouter } from "./routes/BaseRouter"
import Navbar from "./ui/components/NavBar"
import { useLocation } from 'react-router-dom';

const SignalApp = () => {
    const { pathname } = useLocation();
    const isPublicPage = ['/', '/login', '/register'].includes(pathname);
    return (
        <div data-bs-theme="dark" className="signal-app">
            <a href="#page-content" className="skip-link">Saltar al contenido</a>
            <Navbar />
            <div id="page-content" tabIndex={-1} className={isPublicPage ? 'public-content' : 'app-content'}>
                <BaseRouter />
            </div>
        </div>
    )
}

export default SignalApp
