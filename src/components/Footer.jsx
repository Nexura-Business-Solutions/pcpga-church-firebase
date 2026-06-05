import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSettings } from '../lib/store.js';

const solas = ['Sola Scriptura', 'Sola Gratia', 'Sola Fide', 'Solus Christus', 'Soli Deo Gloria'];

export default function Footer() {
    const [identity, setIdentity] = useState({
        name: 'Presbyterian Church',
        sub: 'of the Philippines',
        footerDesc:
            'Serving the Philippines since 1987 — proclaiming the Gospel, equipping believers, and planting confessional Presbyterian congregations across the nation.',
        social: {
            facebook: 'https://facebook.com',
            youtube: 'https://youtube.com',
            instagram: 'https://instagram.com',
            email: 'pcpgainfo@gmail.com',
        },
    });

    useEffect(() => {
        (async () => {
            const data = await getSettings('site-identity');
            if (data) setIdentity((prev) => ({ ...prev, ...data }));
        })();
    }, []);

    const ministry = [
        { name: 'About', href: '#message' },
        { name: 'Sermons', href: '#sermons' },
        { name: 'Find a Church', href: '/churches' },
        { name: 'Give Online', href: '/donation' },
    ];
    const resources = [
        { name: 'Westminster Standards', href: '/library' },
        { name: 'Book of Order', href: '/library' },
        { name: 'Digital Library', href: '/library' },
        { name: 'Admin Panel', href: '/admin' },
    ];
    const contact = [
        identity.address || '#42 Banaag Street, Brgy. Pineda, Pasig City',
        identity.social?.email || 'pcpgainfo@gmail.com',
        identity.phone || '(02) 935 4741',
    ];

    return (
        <footer className="foot" role="contentinfo">
            <div className="foot__top">
                <div>
                    <div className="foot__brand">
                        <img src="/logo.png" alt="" className="foot__logo" />
                        <div>
                            <div className="foot__name">{identity.name || 'Presbyterian Church'} {identity.sub ? identity.sub : ''}</div>
                            <div className="foot__sub">General Assembly · Est. 1987</div>
                        </div>
                    </div>
                    <p className="foot__desc">{identity.footerDesc}</p>
                </div>
                <div className="foot__cols">
                    <div>
                        <h5>Ministry</h5>
                        <ul>
                            {ministry.map((l) => (
                                <li key={l.name}>
                                    {l.href.startsWith('#') ? (
                                        <a href={l.href}>{l.name}</a>
                                    ) : (
                                        <Link to={l.href}>{l.name}</Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h5>Resources</h5>
                        <ul>
                            {resources.map((l) => (
                                <li key={l.name}>
                                    <Link to={l.href}>{l.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h5>Contact</h5>
                        <ul>
                            {contact.map((c, i) => <li key={i}>{c}</li>)}
                            <li style={{ marginTop: '1rem' }}>
                                {['facebook', 'youtube', 'instagram'].map((p) => (
                                    identity.social?.[p] && (
                                        <a
                                            key={p}
                                            href={identity.social[p]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ marginRight: '0.9rem', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase' }}
                                        >
                                            {p}
                                        </a>
                                    )
                                ))}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="foot__solas">
                {solas.map((s, i) => (
                    <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.9rem' }}>
                        {s}
                        {i < solas.length - 1 && <span className="dot">·</span>}
                    </span>
                ))}
            </div>

            <div className="foot__bottom">
                <span>© {new Date().getFullYear()} Presbyterian Church of the Philippines</span>
                <em>To the glory of God alone.</em>
            </div>
        </footer>
    );
}
