import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSettings } from '../lib/store.js';

const navLinks = [
    { name: 'About', href: '#message' },
    { name: 'Sermons', href: '#sermons' },
    { name: 'History', href: '/history' },
    { name: 'Churches', href: '/churches' },
    { name: 'Seminaries', href: '/seminaries' },
    { name: 'Library', href: '/library' },
    { name: 'Give', href: '/donation' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [identity, setIdentity] = useState({ name: 'Presbyterian Church', sub: 'of the Philippines' });

    useEffect(() => {
        (async () => {
            const id = await getSettings('site-identity');
            if (id) setIdentity(id);
        })();

        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const handleNavClick = (e, href) => {
        setMobileOpen(false);
        if (href.startsWith('#')) {
            e.preventDefault();
            const el = document.querySelector(href);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
                <div className="nav__inner">
                    <Link to="/" className="nav__brand" onClick={() => setMobileOpen(false)}>
                        <img src="/logo.png" alt="" className="nav__logo" />
                        <div className="nav__brand-text">
                            <span className="nav__name">{identity.name || 'Presbyterian Church'}</span>
                            <span className="nav__sub">{identity.sub || 'of the Philippines'}</span>
                        </div>
                    </Link>

                    <nav className="nav__links">
                        {navLinks.map((l) => (
                            l.href.startsWith('#') ? (
                                <a
                                    key={l.name}
                                    href={l.href}
                                    onClick={(e) => handleNavClick(e, l.href)}
                                    className="nav__link"
                                >
                                    {l.name}
                                </a>
                            ) : (
                                <Link
                                    key={l.name}
                                    to={l.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="nav__link"
                                >
                                    {l.name}
                                </Link>
                            )
                        ))}
                        <div className="nav__actions">
                            <Link to="/churches" className="btn btn--small btn--primary">Find a Church</Link>
                        </div>
                    </nav>

                    <button
                        className="nav__burger"
                        aria-label="Toggle menu"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        <span /><span /><span />
                    </button>
                </div>
            </header>

            {mobileOpen && (
                <div className="mobile-menu">
                    {navLinks.map((l) => (
                        l.href.startsWith('#') ? (
                            <a
                                key={l.name}
                                href={l.href}
                                onClick={(e) => handleNavClick(e, l.href)}
                                className="mobile-menu__link"
                            >
                                {l.name}
                            </a>
                        ) : (
                            <Link
                                key={l.name}
                                to={l.href}
                                onClick={() => setMobileOpen(false)}
                                className="mobile-menu__link"
                            >
                                {l.name}
                            </Link>
                        )
                    ))}
                    <Link
                        to="/churches"
                        onClick={() => setMobileOpen(false)}
                        className="btn btn--primary"
                        style={{ marginTop: '2rem', alignSelf: 'flex-start' }}
                    >
                        Find a Church →
                    </Link>
                </div>
            )}
        </>
    );
}
