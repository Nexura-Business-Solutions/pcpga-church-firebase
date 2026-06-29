import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FacebookEmbed from './FacebookEmbed.jsx';

// Recent events feed. Each post is now a Facebook post embedded inline — the
// admin pastes a public FB post link and the actual post (photos + text)
// renders right here on the site (see FacebookEmbed), so the images show
// without any clicking and the embed itself links through to the real post.
// Older posts that still carry uploaded `photos` keep rendering as the original
// album grid below, so nothing already published is lost.

const MAX_TILES = 4; // legacy photo-album posts only

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
    // A post shows if it has a Facebook link OR (legacy) at least one photo.
    const valid = posts
        .filter((p) => p && ((typeof p.fbUrl === 'string' && p.fbUrl.trim() !== '') || Array.isArray(p.photos)))
        .map((p) => ({
            ...p,
            fbUrl: typeof p.fbUrl === 'string' ? p.fbUrl.trim() : '',
            photos: Array.isArray(p.photos) ? p.photos.filter((u) => typeof u === 'string' && u.trim() !== '') : [],
        }))
        .filter((p) => p.fbUrl !== '' || p.photos.length > 0);

    // lightbox: { photos: string[], index: number } | null (legacy albums)
    const [lightbox, setLightbox] = useState(null);
    const step = (dir) => setLightbox((lb) => stepLightbox(lb, dir));

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
                        <p>Updates from recent gatherings will be posted here as the presbyteries and congregations meet.</p>
                    </div>
                ) : (
                    <div className="recent__feed">
                        {valid.map((post) => (
                            <article className="recent__post reveal" key={post.id}>
                                {post.caption && <p className="recent__caption">{post.caption}</p>}
                                {post.fbUrl ? (
                                    <FacebookEmbed url={post.fbUrl} />
                                ) : (
                                    <PhotoGrid
                                        photos={post.photos}
                                        onOpen={(i) => setLightbox({ photos: post.photos, index: i })}
                                    />
                                )}
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
