import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();

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

                <div
                    className="collapse navbar-collapse"
                    id="navbarNav"
                >
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
                    </ul>

                    <ul className="navbar-nav ms-auto">
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
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;