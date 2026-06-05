import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AUTOPLAY_MS = 6000;

function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function EventsCarousel({ events = [] }) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [lightbox, setLightbox] = useState(false);
    const timer = useRef(null);

    const count = events.length;
    const reduce = prefersReducedMotion();

    const go = useCallback((next) => {
        setIndex(((next % count) + count) % count);
    }, [count]);

    // Autoplay — pauses on hover/focus, when a slide is enlarged, or reduced-motion.
    useEffect(() => {
        if (count <= 1 || paused || lightbox || reduce) return undefined;
        timer.current = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
        return () => clearInterval(timer.current);
    }, [count, paused, lightbox, reduce]);

    // Keyboard: arrows navigate, Esc closes the lightbox.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') setLightbox(false);
            else if (e.key === 'ArrowRight') go(index + 1);
            else if (e.key === 'ArrowLeft') go(index - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [go, index]);

    if (count === 0) return null;
    const ev = events[index];

    return (
        <div
            className="evcar"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
        >
            <div className="evcar__stage">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={ev.id || index}
                        className="evcar__slide"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Blurred fill so portrait & landscape posters both show uncropped */}
                        <div
                            className="evcar__fill"
                            style={{ backgroundImage: `url(${ev.imageUrl})` }}
                            aria-hidden="true"
                        />
                        <button
                            type="button"
                            className="evcar__imgbtn"
                            onClick={() => setLightbox(true)}
                            aria-label={`Enlarge: ${ev.title || 'event poster'}`}
                        >
                            <img className="evcar__img" src={ev.imageUrl} alt={ev.title || 'Upcoming event'} loading="lazy" decoding="async" />
                        </button>

                    </motion.div>
                </AnimatePresence>

                {count > 1 && (
                    <>
                        <button type="button" className="evcar__nav evcar__nav--prev" onClick={() => go(index - 1)} aria-label="Previous event">‹</button>
                        <button type="button" className="evcar__nav evcar__nav--next" onClick={() => go(index + 1)} aria-label="Next event">›</button>
                    </>
                )}
            </div>

            {(ev.date || ev.title || ev.venue) && (
                <div className="evcar__caption">
                    {ev.date && <span className="evcar__date">{ev.date}</span>}
                    {ev.title && <h4 className="evcar__title">{ev.title}</h4>}
                    {ev.venue && <p className="evcar__venue">{ev.venue}</p>}
                </div>
            )}

            {count > 1 && (
                <div className="evcar__dots" role="tablist" aria-label="Choose event">
                    {events.map((e, i) => (
                        <button
                            key={e.id || i}
                            type="button"
                            role="tab"
                            aria-selected={i === index}
                            aria-label={`Event ${i + 1}`}
                            className={`evcar__dot${i === index ? ' is-active' : ''}`}
                            onClick={() => setIndex(i)}
                        />
                    ))}
                </div>
            )}

            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        className="evcar__lightbox"
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(false)}
                    >
                        <button type="button" className="evcar__lightbox-close" aria-label="Close">×</button>
                        <img src={ev.imageUrl} alt={ev.title || 'Upcoming event'} onClick={(e) => e.stopPropagation()} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
