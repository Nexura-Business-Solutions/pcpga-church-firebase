import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getLibraryResources } from '../lib/store.js';

const DEFAULT_DOCS = [
    { category: 'Constitution', title: 'Book of Church Order', description: 'Government, discipline and worship of the Presbyterian Church of the Philippines.' },
    { category: 'Standards', title: 'Westminster Confession', description: 'The confessional standard of Presbyterian and Reformed churches since 1647.' },
    { category: 'Vision', title: 'Strategic Directions 2030', description: 'Plans adopted by the General Assembly for the next five years of ministry.' },
];

export default function Resources() {
    const [docs, setDocs] = useState(DEFAULT_DOCS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await getLibraryResources();
                if (Array.isArray(data) && data.length > 0) {
                    const filtered = data.filter((d) =>
                        d.category === 'Constitution' ||
                        d.category === 'Vision' ||
                        (d.title && /book|westminster|standard|strateg/i.test(d.title))
                    );
                    setDocs((filtered.length >= 3 ? filtered : data).slice(0, 3));
                }
            } catch (e) {
                console.error('Failed to fetch resources:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <section className="resources" aria-label="Official governance documents">
            <div className="section-head section-head--on-dark">
                <span className="kicker on-dark">Official Governance</span>
                <h2 className="display-h2 on-dark">Vision &amp;<br /><em>constitutions.</em></h2>
                <p className="section-head__lede on-dark">
                    Foundational documents that define our heritage, discipline and direction.
                </p>
            </div>

            <div className="resources__grid">
                {docs.filter(Boolean).map((d, i) => (
                    <motion.article
                        key={d.id || d.title || i}
                        className="resources__card"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, duration: 0.7 }}
                    >
                        <span className="resources__cat">{d.category || 'Document'}</span>
                        <h4>{d.title}</h4>
                        <p>{d.description}</p>
                        <a
                            href={d.file_url && d.file_url !== '#' ? d.file_url : '/library'}
                            target={d.file_url && d.file_url !== '#' ? '_blank' : undefined}
                            rel={d.file_url && d.file_url !== '#' ? 'noopener noreferrer' : undefined}
                            className="resources__cta"
                        >
                            <span>{d.file_url && d.file_url !== '#' ? 'Download PDF' : 'Open in Library'}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </a>
                    </motion.article>
                ))}
                {loading && docs.length === 0 && (
                    <p style={{ color: 'rgba(245,240,230,0.6)', gridColumn: '1 / -1', textAlign: 'center' }}>
                        Loading…
                    </p>
                )}
            </div>
        </section>
    );
}
