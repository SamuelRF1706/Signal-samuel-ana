import { Link } from 'react-router-dom';
import { BrandLogo } from '../ui/components/BrandLogo';
import { Icon } from '../ui/components/Icon';

const HomePage = () => (
    <main className="landing-page">
        <section className="landing-hero" aria-labelledby="landing-title">
            <div className="landing-copy">
                <span className="eyebrow">Ideas que encuentran personas</span>
                <h1 id="landing-title">Tu voz<br /><span>conecta.</span></h1>
                <p>Comparte lo que piensas. Descubre otras miradas. Conecta con personas que tienen algo que decir.</p>
                <div className="landing-actions">
                    <Link to="/register" className="btn btn-primary">Encuentra tu comunidad <Icon name="arrow" /></Link>
                    <Link to="/login" className="btn btn-outline-light">Ya tengo cuenta</Link>
                </div>
            </div>
            <div className="landing-brand">
                <BrandLogo variant="full" width={480} />
                <p>Un espacio para expresarte y descubrir nuevas conexiones.</p>
            </div>
        </section>
        <section className="landing-features" aria-label="Descubre Signal">
            <article className="landing-feature"><Icon name="write" /><h2>Una idea es un comienzo.</h2><p>Comparte pensamientos, preguntas y momentos en publicaciones de hasta 280 caracteres.</p></article>
            <article className="landing-feature"><Icon name="users" /><h2>Encuentra otras voces.</h2><p>Explora perfiles y sigue a las personas cuyas publicaciones te interesan.</p></article>
            <article className="landing-feature"><Icon name="spark" /><h2>Haz tuyo el inicio.</h2><p>Tus publicaciones y las de tu comunidad, junto a sugerencias para descubrir algo más.</p></article>
        </section>
    </main>
);

export default HomePage;
