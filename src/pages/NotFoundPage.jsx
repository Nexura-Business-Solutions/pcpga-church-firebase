import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function NotFoundPage() {
    return (
        <>
            <Helmet>
                <title>Page Not Found | PCP</title>
            </Helmet>
            <Navbar />
            <main className="not-found">
                <div className="not-found__inner">
                    <span className="not-found__mark">✚</span>
                    <p className="not-found__eyebrow">Page Not Found</p>
                    <h1 className="not-found__title">
                        The path here<br />
                        <em>has gone quiet.</em>
                    </h1>
                    <p className="not-found__copy">
                        We could not find the page you were looking for. It may have been moved, renamed,
                        or perhaps never existed. Return home and we will help you find your way.
                    </p>
                    <div className="not-found__actions">
                        <Link to="/" className="btn btn--primary">Return Home</Link>
                        <Link to="/churches" className="btn btn--ghost">Find a Church</Link>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
