import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// A single, featured "Editor's Corner" post — one image + caption that the admin
// pins to the homepage for a week. Unlike Recent Events (a growing album feed),
// only ONE post is ever live here, and it self-expires: the admin stamps
// `expiresAt` at post time, and once that passes the section renders nothing
// until a new post replaces it. The expiry is enforced client-side (no scheduled
// function needed) — the same gate the admin panel shows as "Expired".
export default function EditorsCorner({ post }) {
  const [enlarged, setEnlarged] = useState(false);

  // Re-check expiry on an interval so a page left open across the 1-week mark
  // clears itself instead of lingering until the next reload. `now` drives the
  // gate below; 60s granularity is plenty for a week-long window.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Esc closes the enlarged view.
  useEffect(() => {
    if (!enlarged) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setEnlarged(false); };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('lightbox-open');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('lightbox-open');
    };
  }, [enlarged]);

  const imageUrl = typeof post?.imageUrl === 'string' ? post.imageUrl.trim() : '';
  const expiresAt = Number(post?.expiresAt) || 0;

  // Nothing pinned, no image, or the week is up → the corner is empty (renders
  // nothing). It comes back the moment the admin posts something new.
  if (!imageUrl || !expiresAt || now >= expiresAt) return null;

  const caption = (post.caption || '').trim();
  const postedAt = Number(post.postedAt) || 0;
  const postedLabel = postedAt
    ? new Date(postedAt).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <section className="edcorner" id="editors-corner" aria-label="Editor's Corner">
      <div className="edcorner__inner">
        <div className="edcorner__head">
          <h3 className="edcorner__title">Editor&rsquo;s <em>corner.</em></h3>
          <span className="edcorner__kicker">
            <span className="live-dot" aria-hidden="true" />
            This week on the board
          </span>
        </div>

        <figure className="edcorner__card reveal">
          <button
            type="button"
            className="edcorner__frame"
            onClick={() => setEnlarged(true)}
            aria-label="Enlarge image"
          >
            <img src={imageUrl} alt={caption || "Editor's Corner"} loading="lazy" decoding="async" />
            <span className="edcorner__zoom" aria-hidden="true">⤢</span>
          </button>
          {(caption || postedLabel) && (
            <figcaption className="edcorner__body">
              {caption && <p className="edcorner__caption">{caption}</p>}
              {postedLabel && (
                <p className="edcorner__meta">
                  <span className="edcorner__seal" aria-hidden="true">✦</span>
                  Posted {postedLabel}
                </p>
              )}
            </figcaption>
          )}
        </figure>
      </div>

      <AnimatePresence>
        {enlarged && (
          <motion.div
            className="evcar__lightbox"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEnlarged(false)}
          >
            <button type="button" className="evcar__lightbox-close" aria-label="Close">×</button>
            <img src={imageUrl} alt={caption || "Editor's Corner"} onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
