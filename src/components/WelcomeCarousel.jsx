import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AUTOPLAY_MS = 8000;

function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Initials for the monogram fallback (drops honorifics): "Rev. Edgar P. Adra" -> "EA".
function initials(name) {
    return String(name || '')
        .replace(/^(Rev\.?|Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Elder)\s+/i, '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || '✦';
}

// Rotating "A Word of Welcome" — one slide per officer (photo/monogram + message +
// signature). Only officers that still carry a `message` are shown, so removing a
// message in the editor simply drops that slide instead of leaving a blank.
export default function WelcomeCarousel({ officers = [] }) {
    const slides = (Array.isArray(officers) ? officers : []).filter((o) => o && o.message && String(o.message).trim());
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const timer = useRef(null);

    const count = slides.length;
    const reduce = prefersReducedMotion();

    const go = useCallback((next) => {
        if (count === 0) return;
        setIndex(((next % count) + count) % count);
    }, [count]);

    // Autoplay — pauses on hover/focus or reduced-motion.
    useEffect(() => {
        if (count <= 1 || paused || reduce) return undefined;
        timer.current = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
        return () => clearInterval(timer.current);
    }, [count, paused, reduce]);

    // Keyboard arrows navigate between officers.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight') go(index + 1);
            else if (e.key === 'ArrowLeft') go(index - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [go, index]);

    if (count === 0) return null;
    const safeIndex = Math.min(index, count - 1);
    const o = slides[safeIndex];

    return (
        <div
            className="welcar"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={o.id || safeIndex}
                    className="welcar__slide"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="welcar__portrait">
                        {o.photo
                            ? <img src={o.photo} alt={o.name} />
                            : <span className="welcar__monogram" aria-hidden="true">{initials(o.name)}</span>}
                    </div>
                    <div className="welcar__text">
                        {o.greeting && <h3 className="editorial__title welcar__greeting">{o.greeting}</h3>}
                        <p className="editorial__para has-drop-cap">{o.message}</p>
                        <div className="signature">
                            <em>{o.name}</em>
                            <span>{o.role}</span>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {count > 1 && (
                <div className="welcar__controls">
                    <button type="button" className="welcar__nav" onClick={() => go(safeIndex - 1)} aria-label="Previous officer">‹</button>
                    <div className="welcar__dots" role="tablist" aria-label="Choose officer">
                        {slides.map((s, i) => (
                            <button
                                key={s.id || i}
                                type="button"
                                role="tab"
                                aria-selected={i === safeIndex}
                                aria-label={s.name || `Officer ${i + 1}`}
                                className={`welcar__dot${i === safeIndex ? ' is-active' : ''}`}
                                onClick={() => setIndex(i)}
                            />
                        ))}
                    </div>
                    <button type="button" className="welcar__nav" onClick={() => go(safeIndex + 1)} aria-label="Next officer">›</button>
                </div>
            )}
        </div>
    );
}
