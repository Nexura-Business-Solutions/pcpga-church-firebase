import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FacebookEmbed from './FacebookEmbed.jsx';

// Resolve the single live post from the Editor's Corner doc. The doc is a
// library — { posts: [{id,title,caption,fbUrl,imageUrl}], liveId, postedAt,
// expiresAt } — with at most one featured (liveId). Falls back to the older
// single-doc shape so data written before the library change still renders.
// Returns null when nothing is featured.
function resolveLivePost(doc) {
  if (!doc || typeof doc !== 'object') return null;
  if (Array.isArray(doc.posts)) {
    if (!doc.liveId) return null;
    const p = doc.posts.find((x) => x && x.id === doc.liveId);
    if (!p) return null;
    return { title: p.title || '', caption: p.caption || '', fbUrl: p.fbUrl || '', imageUrl: p.imageUrl || '', postedAt: doc.postedAt, expiresAt: doc.expiresAt };
  }
  return { title: doc.title || '', caption: doc.caption || '', fbUrl: doc.fbUrl || '', imageUrl: doc.imageUrl || '', postedAt: doc.postedAt, expiresAt: doc.expiresAt };
}

// A single, featured "Editor's Corner" post — a Facebook post (embedded inline)
// plus a title + caption the admin pins to the homepage for a week. It
// self-expires: the admin stamps `expiresAt` when featuring, and once that
// passes the section renders nothing until a new post is featured. Expiry is
// enforced client-side (no scheduled function) — the same gate the admin panel
// shows as "Expired". Older image-based posts still render their uploaded image.
export default function EditorsCorner({ post }) {
  const [enlarged, setEnlarged] = useState(false);

  // Re-check expiry on an interval so a page left open across the 1-week mark
  // clears itself instead of lingering until the next reload.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Esc closes the enlarged view (legacy image posts only).
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

  const live = resolveLivePost(post);
  const fbUrl = typeof live?.fbUrl === 'string' ? live.fbUrl.trim() : '';
  const imageUrl = typeof live?.imageUrl === 'string' ? live.imageUrl.trim() : '';
  const expiresAt = Number(live?.expiresAt) || 0;

  // Nothing featured, no content, or the week is up → the corner is empty
  // (renders nothing). It comes back the moment the admin features a post.
  if ((!fbUrl && !imageUrl) || !expiresAt || now >= expiresAt) return null;

  const title = (live.title || '').trim();
  const caption = (live.caption || '').trim();
  const postedAt = Number(live.postedAt) || 0;
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
          {fbUrl ? (
            <div className="edcorner__embed">
              <FacebookEmbed url={fbUrl} />
            </div>
          ) : (
            <button
              type="button"
              className="edcorner__frame"
              onClick={() => setEnlarged(true)}
              aria-label="Enlarge image"
            >
              <img src={imageUrl} alt={title || caption || "Editor's Corner"} loading="lazy" decoding="async" />
              <span className="edcorner__zoom" aria-hidden="true">⤢</span>
            </button>
          )}
          {(title || caption || postedLabel) && (
            <figcaption className="edcorner__body">
              {title && <h4 className="edcorner__post-title">{title}</h4>}
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
        {enlarged && imageUrl && (
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
            <img src={imageUrl} alt={title || caption || "Editor's Corner"} onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
