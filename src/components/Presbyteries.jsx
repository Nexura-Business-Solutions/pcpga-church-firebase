import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings } from '../lib/store.js';

const REGION_ORDER = ['Luzon', 'NCR', 'Visayas', 'Mindanao'];

export default function Presbyteries() {
    const [presbyteries, setPresbyteries] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const data = await getSettings('presbyteries');
            if (Array.isArray(data)) setPresbyteries(data);
            setLoading(false);
        })();
    }, []);

    const grouped = presbyteries.reduce((acc, item) => {
        const region = item.region || 'Other';
        (acc[region] = acc[region] || []).push(item);
        return acc;
    }, {});
    const regions = Object.keys(grouped).sort((a, b) => {
        const ai = REGION_ORDER.indexOf(a);
        const bi = REGION_ORDER.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    if (loading && !presbyteries.length) {
        return (
            <section className="presbyteries" aria-label="Presbyteries">
                <div className="section-head section-head--split">
                    <div>
                        <span className="kicker">Across the Archipelago</span>
                        <h2 className="display-h2">{presbyteries.length || 'Many'} presbyteries.<br /><em>One communion.</em></h2>
                    </div>
                    <p className="section-head__lede">Loading…</p>
                </div>
            </section>
        );
    }

    return (
        <section className="presbyteries" aria-label="Presbyteries">
            <div className="section-head section-head--split">
                <div>
                    <span className="kicker">Across the Archipelago</span>
                    <h2 className="display-h2">{presbyteries.length} presbyteries.<br /><em>One communion.</em></h2>
                </div>
                <p className="section-head__lede">
                    From the Cordilleras to Mindanao, our congregations gather weekly to hear the Word preached and the
                    Sacraments rightly administered.
                </p>
            </div>

            {regions.map((region, ri) => (
                <div key={region} className="presbyteries__region">
                    <div className="presbyteries__region-head">
                        <span className="num">{String(ri + 1).padStart(2, '0')}</span>
                        <h3>{region}</h3>
                        <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-mute)', fontWeight: 600 }}>
                            {grouped[region].length} {grouped[region].length === 1 ? 'Presbytery' : 'Presbyteries'}
                        </span>
                        <span className="rule" />
                    </div>

                    <div className="presbyteries__grid">
                        {grouped[region].map((item, i) => (
                            <motion.button
                                key={item.id || item.name}
                                className="presbyteries__card"
                                onClick={() => setSelected(item)}
                                initial={{ opacity: 0, y: 14 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.04, duration: 0.5 }}
                            >
                                <span className="presbyteries__num">{String(i + 1).padStart(2, '0')}</span>
                                <h4>{item.name}</h4>
                                {item.seat && <p className="presbyteries__seat">Seat · {item.seat}</p>}
                                {item.description && !item.seat && (
                                    <p className="presbyteries__seat" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.description}
                                    </p>
                                )}
                                <p className="presbyteries__count">
                                    {item.churches?.length
                                        ? `${item.churches.length} ${item.churches.length === 1 ? 'church' : 'churches'}`
                                        : item.congregations
                                            ? `${item.congregations} congregations`
                                            : `${item.officers?.length || 0} officers`}
                                </p>
                                <span className="presbyteries__arrow">→</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            ))}

            <AnimatePresence>
                {selected && (
                    <motion.div className="pcp-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="pcp-modal__backdrop" onClick={() => setSelected(null)} />
                        <motion.div
                            className="pcp-modal__card custom-scrollbar"
                            initial={{ opacity: 0, y: 18, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 18, scale: 0.96 }}
                        >
                            <button className="pcp-modal__close" onClick={() => setSelected(null)} aria-label="Close">×</button>
                            <div className="pcp-modal__eyebrow">Presbytery · {selected.region || 'Regional'}</div>
                            <h3 className="pcp-modal__title">{selected.name}</h3>
                            <div className="pcp-modal__body">
                                {selected.description && <p>{selected.description}</p>}

                                {selected.officers?.length > 0 ? (
                                    <>
                                        <div className="pcp-modal__section-title">Commissioned Officers</div>
                                        <div className="pcp-modal__officers">
                                            {selected.officers.map((off, idx) => {
                                                const name = typeof off === 'string' ? off : off.name;
                                                const role = typeof off === 'string' ? '' : off.role;
                                                const photo = typeof off === 'string' ? '' : (off.photo || '');
                                                return (
                                                    <div key={idx} className="pcp-modal__officer">
                                                        <div className="pcp-modal__officer-photo">
                                                            {photo ? (
                                                                <img src={photo} alt={name} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)' }}>·</div>
                                                            )}
                                                        </div>
                                                        <div className="pcp-modal__officer-name">{name}</div>
                                                        {role && <div className="pcp-modal__officer-role">{role}</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (!selected.churches?.length && (
                                    <p style={{ fontStyle: 'italic', color: 'var(--ink-mute)' }}>
                                        No commissioned elder listed for this period.
                                    </p>
                                ))}

                                {selected.churches?.length > 0 && (
                                    <>
                                        <div className="pcp-modal__section-title" style={{ marginTop: '2rem' }}>
                                            Member Churches ({selected.churches.length})
                                        </div>
                                        <div className="pcp-modal__churches">
                                            {selected.churches.map((ch, idx) => (
                                                <article key={idx} className="pcp-modal__church">
                                                    <h4 className="pcp-modal__church-name">{ch.name}</h4>
                                                    {ch.address && <p className="pcp-modal__church-line"><strong>Address:</strong> {ch.address}</p>}
                                                    {ch.minister && <p className="pcp-modal__church-line"><strong>Minister:</strong> {ch.minister}</p>}
                                                    {ch.associatePastors?.length > 0 && (
                                                        <p className="pcp-modal__church-line"><strong>Associate Pastors:</strong> {ch.associatePastors.join(', ')}</p>
                                                    )}
                                                    {ch.worshipTime && <p className="pcp-modal__church-line"><strong>Worship:</strong> {ch.worshipTime}</p>}
                                                    {ch.contact && <p className="pcp-modal__church-line"><strong>Contact:</strong> {ch.contact}</p>}
                                                    {ch.email && (
                                                        <p className="pcp-modal__church-line">
                                                            <strong>Email:</strong>{' '}
                                                            <a href={`mailto:${encodeURIComponent(ch.email)}`}>{ch.email}</a>
                                                        </p>
                                                    )}
                                                    {ch.elders?.length > 0 && (
                                                        <p className="pcp-modal__church-line"><strong>Elders:</strong> {ch.elders.join(', ')}</p>
                                                    )}
                                                </article>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {selected.website && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <a href={selected.website} target="_blank" rel="noopener noreferrer" className="btn btn--link">
                                            Visit official website →
                                        </a>
                                    </div>
                                )}
                            </div>
                            <div className="pcp-modal__footer">
                                <button className="btn btn--ghost btn--small" onClick={() => setSelected(null)}>Close</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
