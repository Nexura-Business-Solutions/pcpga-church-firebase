import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSermons } from '../lib/store.js';

function getYouTubeId(url) {
    if (!url) return null;
    const re = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const m = url.match(re);
    return m && m[2].length === 11 ? m[2] : null;
}

export default function SermonHighlight() {
    const [sermons, setSermons] = useState([]);
    const [active, setActive] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const all = await getSermons();
            if (Array.isArray(all)) setSermons(all.slice(0, 4));
            setLoading(false);
        })();
    }, []);

    const selectSermon = (i) => {
        setActive(i);
        setPlaying(false);
    };

    if (loading) {
        return (
            <section id="sermons" className="sermon" aria-label="Latest sermons">
                <div className="section-head section-head--split">
                    <div>
                        <span className="kicker">Messages</span>
                        <h2 className="display-h2">Latest<br /><em>sermons.</em></h2>
                    </div>
                </div>
                <div className="sermon__grid">
                    <div className="sermon__media" style={{ background: 'var(--paper-3)' }} />
                    <div>
                        <div style={{ height: 180, background: 'var(--paper-2)', marginBottom: 16 }} />
                        <div style={{ height: 100, background: 'var(--paper-2)' }} />
                    </div>
                </div>
            </section>
        );
    }

    const current = sermons[active];
    const thumb = current?.thumbnail || (getYouTubeId(current?.videoUrl) && `https://img.youtube.com/vi/${getYouTubeId(current.videoUrl)}/maxresdefault.jpg`);
    const ytId = getYouTubeId(current?.videoUrl);

    return (
        <section id="sermons" className="sermon" aria-label="Latest sermons">
            <div className="section-head section-head--split">
                <div>
                    <span className="kicker">Messages</span>
                    <h2 className="display-h2">Latest<br /><em>sermons.</em></h2>
                </div>
                <p className="section-head__lede">
                    Weekly exposition of the Word, archived here for reflection, family devotion, and ongoing discipleship.
                </p>
            </div>

            {sermons.length === 0 ? (
                <p style={{ maxWidth: 'var(--max)', margin: '0 auto', textAlign: 'center', color: 'var(--ink-mute)', fontStyle: 'italic' }}>
                    No sermons posted yet. Check back after this Lord&rsquo;s Day.
                </p>
            ) : (
                <div className="sermon__grid">
                    <motion.div
                        className="sermon__media"
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        {playing && ytId ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                                title={current?.title || ''}
                                style={{ border: 0 }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <>
                                {thumb && <img src={thumb} alt={current?.title || 'Sermon'} />}
                                <button className="sermon__play" aria-label="Play sermon" onClick={() => setPlaying(true)}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                </button>
                            </>
                        )}
                    </motion.div>

                    <div className="sermon__text">
                        <span className="kicker">
                            Latest Sermon{current?.date ? ` · ${current.date}` : ''}
                        </span>
                        <h3 className="display-h3">
                            {splitTitle(current?.title).primary}
                            {splitTitle(current?.title).secondary && <><br /><em>{splitTitle(current?.title).secondary}</em></>}
                        </h3>
                        <p className="sermon__ref">
                            {current?.reference || current?.scripture || 'Romans 8:1–11'}
                            {current?.duration ? ` · ${current.duration}` : ''}
                        </p>
                        <p className="sermon__blurb">
                            {current?.description || 'Listen to the latest exposition from the pulpit — the preached Word shaping the life of the congregation this Lord’s Day.'}
                        </p>

                        <div className="sermon__list">
                            {sermons.map((s, i) => (
                                <button
                                    key={s.id || i}
                                    className={`sermon__row ${active === i ? 'is-active' : ''}`}
                                    onClick={() => selectSermon(i)}
                                >
                                    <span className="date">{formatShortDate(s.date) || `No. ${i + 1}`}</span>
                                    <span className="title">{s.title || 'Untitled'}</span>
                                    <span className="ref">{s.reference || s.scripture || s.speaker || ''}</span>
                                </button>
                            ))}
                        </div>

                        <a href="/library" className="btn btn--link">Sermon archive →</a>
                    </div>
                </div>
            )}
        </section>
    );
}

function splitTitle(raw) {
    const t = String(raw || 'No Condemnation for Those in Christ').trim();
    const idx = t.lastIndexOf(' for ');
    if (idx > 0 && t.length - idx < 40) {
        return { primary: t.slice(0, idx), secondary: t.slice(idx + 1) };
    }
    const words = t.split(/\s+/);
    if (words.length > 4) {
        const mid = Math.ceil(words.length / 2);
        return { primary: words.slice(0, mid).join(' '), secondary: words.slice(mid).join(' ') };
    }
    return { primary: t, secondary: '' };
}

function formatShortDate(d) {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d).slice(0, 10);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}
