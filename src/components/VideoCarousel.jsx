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
    const [paused, setPaused] = useState(false);       // hover / focus
    const [userPaused, setUserPaused] = useState(false); // explicit pause toggle
    const [playing, setPlaying] = useState(false);     // user tapped a poster (wants sound)
    const [inView, setInView] = useState(false);       // section scrolled on-screen
    const [muted, setMuted] = useState(true);          // autoplay must start muted (browser policy)
    const timer = useRef(null);
    const rootRef = useRef(null);
    const videoRef = useRef(null);

    const count = slides.length;
    const reduce = prefersReducedMotion();

    // Leaving a slide always re-arms muted: browsers tie the unmute gesture to
    // the current element, so a fresh slide must start muted to autoplay.
    const go = useCallback((next) => {
        setPlaying(false);
        setMuted(true);
        setIndex(((next % count) + count) % count);
    }, [count]);

    // Is the carousel on-screen? Drives scroll-triggered autoplay. Plays the
    // current slide when ≥50% visible; pauses/stops it when scrolled away. When
    // IntersectionObserver is unavailable we leave it off (poster / tap-to-play)
    // rather than autoplaying off-screen.
    useEffect(() => {
        const el = rootRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return undefined;
        const io = new IntersectionObserver(
            (entries) => setInView(!!entries[0]?.isIntersecting),
            { threshold: 0.5 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    const v = count ? slides[index % count] : null;
    const yt = v ? youTubeId(v.videoUrl) : null;
    const directUrl = v && !yt && isDirectVideo(v.videoUrl) ? v.videoUrl : null;
    // The current slide carries an actually-playable video (vs. a bare external
    // link or poster-only row). Drives autoplay + auto-advance gating.
    const hasVideo = !!yt || !!directUrl;
    // Autoplay the current slide while it's the active, on-screen video — but
    // never under reduced-motion (those users get the poster + tap-to-play).
    const autoplay = inView && hasVideo && !reduce;

    // Callback ref driving the <video>. It fires when the node mounts/unmounts
    // AND, because its deps include autoplay/muted, React re-invokes it (old→null,
    // new→node) whenever those change — so one mechanism covers both a fresh slide
    // mount and a scroll-in/out or unmute on the mounted element. This matters
    // under AnimatePresence mode="wait": the new <video> mounts ~0.4s after the
    // slide change, so an index-keyed effect would run against the stale element.
    // Muted autoplay is the only kind browsers allow without a click → set .muted
    // before play(); a rejected play() leaves the native controls in place.
    const attachVideo = useCallback((el) => {
        videoRef.current = el;
        if (!el) return;
        if (autoplay) {
            el.muted = muted;
            const p = el.play();
            if (p && typeof p.catch === 'function') p.catch(() => { /* blocked — controls remain */ });
        } else {
            el.pause();
        }
    }, [autoplay, muted]);

    // Auto-advance — paused on hover/focus, an explicit pause, reduced-motion,
    // or while a video plays in view. Poster-only / external-link slides still
    // cycle; in-view videos hold until they finish (direct) or are navigated
    // (YouTube has no end signal). setMuted in the async tick is lint-safe.
    useEffect(() => {
        if (count <= 1 || paused || userPaused || reduce) return undefined;
        if (autoplay || playing) return undefined;
        timer.current = setInterval(() => {
            setMuted(true);
            setIndex((i) => (i + 1) % count);
        }, AUTOPLAY_MS);
        return () => clearInterval(timer.current);
    }, [count, paused, userPaused, reduce, autoplay, playing]);

    if (count === 0 || !v) return null;
    // Show the live player when the slide is on-screen (scroll autoplay) or the
    // user explicitly tapped the poster; otherwise show the thumbnail preview.
    const showYtPlayer = !!yt && (autoplay || playing);
    const ytMute = muted ? 1 : 0;
    const externalUrl = !yt && !directUrl ? safeExternalHref(v.videoUrl) : null;
    const poster = v.posterUrl || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : null);
    const posterStyle = poster ? { backgroundImage: `url(${poster})` } : undefined;
    const showUnmute = autoplay && muted; // a video is autoplaying silently

    return (
        <div
            ref={rootRef}
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
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduce ? 0 : 0.4 }}
                    >
                        {yt ? (
                            showYtPlayer ? (
                                <iframe
                                    className="vidcar__media"
                                    src={`https://www.youtube.com/embed/${yt}?autoplay=1&mute=${ytMute}&rel=0&playsinline=1`}
                                    title={v.title || 'Video greeting'}
                                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                    allowFullScreen
                                />
                            ) : (
                                <button
                                    type="button"
                                    className="vidcar__poster"
                                    style={posterStyle}
                                    onClick={() => { setMuted(false); setPlaying(true); }}
                                    aria-label={`Play: ${v.title || 'video greeting'}`}
                                >
                                    <span className="vidcar__play" aria-hidden="true">▶</span>
                                </button>
                            )
                        ) : directUrl ? (
                            <video
                                ref={attachVideo}
                                className="vidcar__media"
                                src={directUrl}
                                poster={v.posterUrl || undefined}
                                controls
                                muted={muted}
                                playsInline
                                loop={count === 1}
                                preload="metadata"
                                onPlay={() => setPlaying(true)}
                                onEnded={() => { if (count > 1) go(index + 1); }}
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

                        {showUnmute && (
                            <button
                                type="button"
                                className="vidcar__unmute"
                                onClick={() => {
                                    setMuted(false);
                                    const el = videoRef.current;
                                    if (el) el.muted = false;
                                }}
                                aria-label="Unmute video"
                            >
                                🔇 <span>Tap for sound</span>
                            </button>
                        )}
                    </motion.div>
                </AnimatePresence>

                {count > 1 && (
                    <>
                        <button
                            type="button"
                            className="vidcar__playpause"
                            onClick={() => setUserPaused((p) => !p)}
                            aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'}
                            aria-pressed={userPaused}
                        >
                            {userPaused ? '▶' : '❚❚'}
                        </button>
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
                            onClick={() => { setPlaying(false); setMuted(true); setIndex(i); }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
