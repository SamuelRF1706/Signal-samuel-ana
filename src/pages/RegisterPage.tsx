const RegisterPage = () => {
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

                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="mb-3">
                                    <label htmlFor="fullName" className="form-label fw-semibold small text-muted">
                                        Full Name
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-lg rounded-3" 
                                        id="fullName"
                                        placeholder="Write your full name"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="username" className="form-label fw-semibold small text-muted">
                                        Username
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0 text-muted rounded-start-3">@</span>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-lg border-start-0 rounded-end-3" 
                                            id="username"
                                            placeholder="nickname"
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label fw-semibold small text-muted">
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control form-control-lg rounded-3"
                                        id="email"
                                        placeholder="name@example.com"
                                    />
                                    <div className="form-text small text-muted">
                                        We’ll never share your email with anyone else.
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="password" className="form-label fw-semibold small text-muted">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control form-control-lg rounded-3"
                                        id="password"
                                        placeholder="••••••••"
                                        aria-describedby="passwordHelp"
                                    />
                                    <div id="passwordHelp" className="form-text small text-muted">
                                        Must be 8-20 characters long.
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-dark btn-lg w-100 fw-bold rounded-pill shadow-sm py-2"
                                >
                                    Sign Up
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
