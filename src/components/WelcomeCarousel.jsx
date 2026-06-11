import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AUTOPLAY_MS = 8000;   // dwell on a short message before advancing
const READ_TOP_MS = 1500;   // let the reader see the top before auto-scrolling
const READ_END_MS = 2000;   // hold at the bottom before advancing
const SCROLL_PX_PER_S = 34;  // gentle, readable auto-scroll pace

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
// message in the editor simply drops that slide instead of leaving a blank. A long
// message lives in its own bounded scroll box that auto-scrolls top→bottom at a
// readable pace; the slide advances once it has finished (short ones just dwell).
export default function WelcomeCarousel({ officers = [] }) {
    const slides = (Array.isArray(officers) ? officers : []).filter((o) => o && o.message && String(o.message).trim());
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    // A photo URL that 404s falls back to the monogram instead of an empty frame.
    const [brokenPhotos, setBrokenPhotos] = useState({});
    const msgRef = useRef(null);

    const count = slides.length;
    const reduce = prefersReducedMotion();

    const go = useCallback((next) => {
        if (count === 0) return;
        setIndex(((next % count) + count) % count);
    }, [count]);

    // Per-slide auto behaviour: read the top, smooth-scroll a long message to the
    // bottom at a constant pace, hold, then advance (multi-slide) or loop back to
    // the top (single officer, so one long message keeps re-reading). Short
    // messages just dwell. Paused on hover/focus and under reduced-motion. The
    // message box is a fresh node per slide (keyed), so it starts at the top; we
    // measure inside the timeout, by which point it has mounted (READ_TOP_MS is
    // comfortably longer than the 0.5s slide-exit animation above).
    useEffect(() => {
        if (count === 0 || paused || reduce) return undefined;

        let cancelled = false;
        let raf = 0;
        const timers = [];

        // count>1 → next officer; count===1 → rewind to the top and read again.
        const onCycleEnd = () => {
            if (cancelled) return;
            if (count > 1) { setIndex((i) => (i + 1) % count); return; }
            const el = msgRef.current;
            if (el) el.scrollTop = 0;
            runCycle();
        };

        function runCycle() {
            timers.push(setTimeout(() => {
                if (cancelled) return;
                const el = msgRef.current;
                if (!el) { timers.push(setTimeout(onCycleEnd, AUTOPLAY_MS)); return; }
                const overflow = el.scrollHeight - el.clientHeight;
                if (overflow <= 4) { timers.push(setTimeout(onCycleEnd, AUTOPLAY_MS)); return; } // short → dwell
                const duration = Math.min(Math.max((overflow / SCROLL_PX_PER_S) * 1000, 4000), 26000);
                const start = el.scrollTop;
                const remaining = (el.scrollHeight - el.clientHeight) - start;
                const t0 = performance.now();
                const step = (now) => {
                    if (cancelled) return;
                    const t = Math.min((now - t0) / duration, 1);
                    el.scrollTop = start + remaining * t;
                    if (t < 1) raf = requestAnimationFrame(step);
                    else timers.push(setTimeout(onCycleEnd, READ_END_MS));
                };
                raf = requestAnimationFrame(step);
            }, READ_TOP_MS));
        }
        runCycle();

        return () => {
            cancelled = true;
            if (raf) cancelAnimationFrame(raf);
            timers.forEach(clearTimeout);
        };
    }, [index, paused, reduce, count]);

    // Keyboard arrows navigate between officers — but not while the reader is
    // focused inside the message box (there the arrows belong to it).
    useEffect(() => {
        const onKey = (e) => {
            if (msgRef.current && msgRef.current.contains(document.activeElement)) return;
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
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                    transition={{ duration: reduce ? 0 : 0.5 }}
                >
                    <div className="welcar__portrait">
                        {o.photo && !brokenPhotos[o.photo]
                            ? <img src={o.photo} alt={o.name} loading="lazy" decoding="async" onError={() => setBrokenPhotos((m) => ({ ...m, [o.photo]: true }))} />
                            : <span className="welcar__monogram" aria-hidden="true">{initials(o.name)}</span>}
                    </div>
                    <div className="welcar__text">
                        {o.greeting && <h3 className="editorial__title welcar__greeting">{o.greeting}</h3>}
                        <div className="welcar__msg" ref={msgRef} tabIndex={0} role="region" aria-label="Welcome message">
                            <p className="editorial__para has-drop-cap">{o.message}</p>
                        </div>
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
