import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHeroContent } from '../lib/store.js';

export default function Hero() {
    const [content, setContent] = useState({
        heading: 'Welcome Home.',
        subtitle:
            'A communion of Reformed congregations gathered around Scripture, Sacrament and the historic Presbyterian faith.',
        ctaText: 'Find a Church',
        serviceTimes: 'Sunday Worship · 9:00 AM & 11:00 AM',
    });

    useEffect(() => {
        (async () => {
            const data = await getHeroContent();
            if (data) setContent((prev) => ({ ...prev, ...data }));
        })();
    }, []);

    return (
        <section id="hero" className="hero hero--editorial hero--fullbleed hero--simple" aria-label="Welcome">
            <div className="hero-ed__bg" aria-hidden="true">
                <img src={content.heroImage || '/pcp-hero.jpg'} alt="" />
                <div className="hero-ed__bg-veil" />
            </div>

            <div className="hero-ed hero-ed--fullbleed">
                <span className="hero-simple__kicker">Presbyterian Church of the Philippines</span>

                <h1 className="hero-ed__title hero-simple__title">
                    {content.heading}
                </h1>

                <p className="hero-simple__lede">{content.subtitle}</p>

                <div className="hero-ed__actions">
                    <Link to="/churches" className="btn btn--primary">
                        {content.ctaText || 'Find a Church'}
                    </Link>
                    <a href="#sermons" className="btn btn--link-light" onClick={scrollToSermons}>
                        Watch Sermon →
                    </a>
                </div>

                {content.serviceTimes && (
                    <p className="hero-simple__times">{content.serviceTimes}</p>
                )}
            </div>
        </section>
    );
}

function scrollToSermons(e) {
    e.preventDefault();
    document.querySelector('#sermons')?.scrollIntoView({ behavior: 'smooth' });
}
