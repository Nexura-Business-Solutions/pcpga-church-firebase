import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeExternalHref } from '../lib/url.js';

const AUTOPLAY_MS = 9000;

function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Pull a YouTube id from watch / youtu.be / shorts / embed URLs → drives the
// in-place embed + thumbnail. The id charset ([\w-]) keeps the embed URL safe.
function youTubeId(url) {
    const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    return m ? m[1] : null;
}

// A direct, in-page-playable video: a known video extension or a Firebase
// Storage object (where admin-uploaded MP4s live).
function isDirectVideo(url) {
    const u = String(url || '');
    return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(u) || /firebasestorage\.googleapis\.com/i.test(u);
}

export default function VideoCarousel({ videos = [] }) {
    // Only entries with a source render (a row added but not yet given a video).
    const slides = videos.filter((v) => v && v.videoUrl);
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);   // hover / focus
    const [playing, setPlaying] = useState(false); // a slide is actively playing
    const timer = useRef(null);

    const count = slides.length;
    const reduce = prefersReducedMotion();

    const go = useCallback((next) => {
        setPlaying(false);
        setIndex(((next % count) + count) % count);
    }, [count]);

    // Auto-advance — paused on hover/focus, while a video plays, or reduced-motion.
    useEffect(() => {
        if (count <= 1 || paused || playing || reduce) return undefined;
        timer.current = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
        return () => clearInterval(timer.current);
    }, [count, paused, playing, reduce]);

    if (count === 0) return null;
    const v = slides[index % count];
    const yt = youTubeId(v.videoUrl);
    const directUrl = !yt && isDirectVideo(v.videoUrl) ? v.videoUrl : null;
    // Any other link (e.g. Facebook) opens out, gated to http(s) — never an
    // arbitrary/unsafe scheme.
    const externalUrl = !yt && !directUrl ? safeExternalHref(v.videoUrl) : null;
    const poster = v.posterUrl || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : null);
    const posterStyle = poster ? { backgroundImage: `url(${poster})` } : undefined;

    return (
        <div
            className="vidcar"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
        >
            <div className="vidcar__stage">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={v.id || index}
                        className="vidcar__slide"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {yt ? (
                            playing ? (
                                <iframe
                                    className="vidcar__media"
                                    src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`}
                                    title={v.title || 'Video greeting'}
                                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                    allowFullScreen
                                />
                            ) : (
                                <button
                                    type="button"
                                    className="vidcar__poster"
                                    style={posterStyle}
                                    onClick={() => setPlaying(true)}
                                    aria-label={`Play: ${v.title || 'video greeting'}`}
                                >
                                    <span className="vidcar__play" aria-hidden="true">▶</span>
                                </button>
                            )
                        ) : directUrl ? (
                            <video
                                className="vidcar__media"
                                src={directUrl}
                                poster={v.posterUrl || undefined}
                                controls
                                playsInline
                                preload="metadata"
                                onPlay={() => setPlaying(true)}
                                onEnded={() => setPlaying(false)}
                            />
                        ) : externalUrl ? (
                            <a
                                className="vidcar__poster"
                                href={externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={posterStyle}
                                aria-label={`Watch: ${v.title || 'video greeting'}`}
                            >
                                <span className="vidcar__play" aria-hidden="true">▶</span>
                            </a>
                        ) : null}
                    </motion.div>
                </AnimatePresence>

                {count > 1 && (
                    <>
                        <button type="button" className="vidcar__nav vidcar__nav--prev" onClick={() => go(index - 1)} aria-label="Previous video">‹</button>
                        <button type="button" className="vidcar__nav vidcar__nav--next" onClick={() => go(index + 1)} aria-label="Next video">›</button>
                    </>
                )}
            </div>

            {(v.title || v.caption) && (
                <div className="vidcar__caption">
                    {v.title && <h4 className="vidcar__title">{v.title}</h4>}
                    {v.caption && <p className="vidcar__text">{v.caption}</p>}
                </div>
            )}

            {count > 1 && (
                <div className="vidcar__dots" role="tablist" aria-label="Choose video">
                    {slides.map((s, i) => (
                        <button
                            key={s.id || i}
                            type="button"
                            role="tab"
                            aria-selected={i === index}
                            aria-label={`Video ${i + 1}`}
                            className={`vidcar__dot${i === index ? ' is-active' : ''}`}
                            onClick={() => { setPlaying(false); setIndex(i); }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
