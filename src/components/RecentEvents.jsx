import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Facebook-style album feed. Each post = a caption + up to 10 photos. The grid
// shows at most the first 4 tiles (with a "+N" overlay on the 4th when there are
// more); the lightbox then pages through every photo in that post.
const MAX_TILES = 4;

// Advance the open album's index by `dir`, wrapping around. No-op when closed.
function stepLightbox(lb, dir) {
    if (!lb) return lb;
    const n = lb.photos.length;
    return { ...lb, index: ((lb.index + dir) % n + n) % n };
}

function PhotoGrid({ photos, onOpen }) {
    const tiles = photos.slice(0, MAX_TILES);
    const extra = photos.length - MAX_TILES;
    const layout = Math.min(photos.length, MAX_TILES); // 1..4 → grid modifier
    return (
        <div className={`recent__grid recent__grid--${layout}`}>
            {tiles.map((url, i) => {
                const isLastTile = i === MAX_TILES - 1 && extra > 0;
                return (
                    <button
                        key={url || i}
                        type="button"
                        className="recent__tile"
                        onClick={() => onOpen(i)}
                        aria-label={`Open photo ${i + 1} of ${photos.length}`}
                    >
                        <img src={url} alt="" loading="lazy" decoding="async" />
                        {isLastTile && (
                            <span className="recent__more" aria-hidden="true">+{extra + 1}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export default function RecentEvents({ posts = [] }) {
    // Drop posts with no usable photo so the feed never paints a broken tile.
    const valid = posts
        .filter((p) => p && Array.isArray(p.photos))
        .map((p) => ({ ...p, photos: p.photos.filter((u) => typeof u === 'string' && u.trim() !== '') }))
        .filter((p) => p.photos.length > 0);

    // lightbox: { photos: string[], index: number } | null
    const [lightbox, setLightbox] = useState(null);

    // Page within the open album (wraps around). setLightbox is stable and
    // stepLightbox is module-level, so neither needs to be an effect dependency.
    const step = (dir) => setLightbox((lb) => stepLightbox(lb, dir));

    // Keyboard: arrows page within the open album, Esc closes.
    useEffect(() => {
        if (!lightbox) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setLightbox(null);
            else if (e.key === 'ArrowRight') setLightbox((lb) => stepLightbox(lb, 1));
            else if (e.key === 'ArrowLeft') setLightbox((lb) => stepLightbox(lb, -1));
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightbox]);

    // Lock page scroll while a photo is enlarged — same body-class pattern as
    // EventsCarousel (the real scroller is <html>; body uses overflow-x:clip).
    useEffect(() => {
        if (!lightbox) return undefined;
        document.body.classList.add('lightbox-open');
        return () => document.body.classList.remove('lightbox-open');
    }, [lightbox]);

    return (
        <section className="recent" id="recent-events" aria-label="Recent events">
            <div className="recent__inner">
                <div className="recent__head">
                    <h3 className="recent__title">Recent <em>events.</em></h3>
                    <span className="recent__kicker">From around the communion</span>
                </div>

                {valid.length === 0 ? (
                    <div className="recent__empty reveal">
                        <p>Photos from recent gatherings will be posted here as the presbyteries and congregations meet.</p>
                    </div>
                ) : (
                    <div className="recent__feed">
                        {valid.map((post) => (
                            <article className="recent__post reveal" key={post.id}>
                                {post.caption && <p className="recent__caption">{post.caption}</p>}
                                <PhotoGrid
                                    photos={post.photos}
                                    onOpen={(i) => setLightbox({ photos: post.photos, index: i })}
                                />
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        className="evcar__lightbox"
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                    >
                        <button type="button" className="evcar__lightbox-close" aria-label="Close">×</button>
                        {lightbox.photos.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className="recent__lightbox-nav recent__lightbox-nav--prev"
                                    onClick={(e) => { e.stopPropagation(); step(-1); }}
                                    aria-label="Previous photo"
                                >‹</button>
                                <button
                                    type="button"
                                    className="recent__lightbox-nav recent__lightbox-nav--next"
                                    onClick={(e) => { e.stopPropagation(); step(1); }}
                                    aria-label="Next photo"
                                >›</button>
                            </>
                        )}
                        <img
                            src={lightbox.photos[lightbox.index]}
                            alt=""
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
