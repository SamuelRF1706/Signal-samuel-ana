const HomePage = () => {
    return (
        <section className="py-5">
            <h1 className="display-1 fw-bold text-center">Signal</h1>
            <p className="lead text-center mb-5">
                La plataforma de mensajería segura y privada
            </p>
            <div className="container">
                <div className="row align-items-start">
                    <div className="col-md-5">
                        <span className="text-muted">Nuestra historia</span>
                        <h2 className="display-5 fw-bold">Sobre nosotros</h2>
                    </div>

                    <div className="col-md-6 offset-md-1">
                        <p className="lead">
                            Creemos que todas las personas tienen una voz
                            que merece ser escuchada. Nuestra plataforma
                            conecta a las personas a través de conversaciones,
                            ideas y novedades en tiempo real, creando un
                            espacio donde cada opinión puede marcar la diferencia.
                        </p>

                        <p className="lead">
                            Conecta con personas que comparten tus intereses,
                            descubre nuevas perspectivas y mantente informado
                            sobre lo que te importa. Comparte tus pensamientos,
                            sigue las últimas tendencias y participa en
                            conversaciones que te interesan.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomePage;
