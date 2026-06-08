import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings } from '../lib/store.js';
import { safeExternalHref } from '../lib/url.js';

const TYPE_KICKER = {
    info: 'Notice',
    event: 'Event',
    warning: 'Notice',
    urgent: 'Urgent',
};

const SEEN_KEY = 'pcpga_seen_announcements';

function readSeenList() {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        localStorage.removeItem(SEEN_KEY);
        return [];
    }
}

export default function AnnouncementModal({ previewData = null, open = false, onRequestClose } = {}) {
    // Admin "Preview Popup" mode: render the supplied draft directly, skip the
    // Firestore fetch + once-per-visitor "seen" suppression, and let the parent
    // control open/close. Homepage mode (no props) keeps the original behavior.
    const isPreview = previewData != null;

    const [loaded, setLoaded] = useState(null);        // homepage-fetched announcement
    const [openState, setOpenState] = useState(false);  // homepage open state

    useEffect(() => {
        if (isPreview) return undefined;
        let cancelled = false;
        (async () => {
            const data = await getSettings('announcement');
            if (cancelled || !data || !data.isActive) return;
            const seenList = readSeenList();
            const id = [data.title, data.message, data.mediaUrl, data.updatedAt].filter(Boolean).join('|');
            if (seenList.includes(id)) return;
            setLoaded({ ...data, id });
            setTimeout(() => { if (!cancelled) setOpenState(true); }, 1200);
        })();
        return () => { cancelled = true; };
    }, [isPreview]);

    const announcement = isPreview ? { ...previewData, id: 'preview' } : loaded;
    const isOpen = isPreview ? open : openState;

    const handleClose = useCallback(() => {
        if (isPreview) {
            onRequestClose?.();
            return;
        }
        setOpenState(false);
        if (loaded?.id) {
            const seenList = readSeenList();
            seenList.push(loaded.id);
            if (seenList.length > 10) seenList.shift();
            localStorage.setItem(SEEN_KEY, JSON.stringify(seenList));
        }
    }, [isPreview, onRequestClose, loaded]);

    // Esc-to-close + lock background scroll while the popup is open, so the page
    // behind the card can't scroll/rubber-band and make dismissal feel "stuck".
    // The real scroller is <html> (body uses overflow-x:clip), so we lock via a
    // body class + `html:has(body.announce-open)` rule, matching the nav/modal.
    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', onKey);
        document.body.classList.add('announce-open');
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.classList.remove('announce-open');
        };
    }, [isOpen, handleClose]);

    if (!announcement) return null;

    const kicker = TYPE_KICKER[announcement.type] || 'Notice';
    // Gate the admin-editable CTA link to http(s) only — blocks javascript:/data:
    // URI stored-XSS. An unsafe/empty link falls back to the plain Close button.
    const safeLink = safeExternalHref(announcement.buttonLink);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="announce" role="dialog" aria-modal="true" aria-label={announcement.title || 'Announcement'}>
                    <motion.div
                        className="announce__backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />
                    <motion.div
                        className="announce__card"
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                    >
                        {/* Pinned to the card corner — sits OUTSIDE the scroll region so it
                            never scrolls out of reach on tall portrait posters. */}
                        <button className="announce__close" onClick={handleClose} aria-label="Close announcement">×</button>

                        <div className="announce__scroll announcement-scroll">
                            <div className="announce__header">
                                <span className="kicker on-dark">{kicker} · General Assembly</span>
                            </div>

                            {announcement.title && (
                                <h3 className="announce__title">{announcement.title}</h3>
                            )}

                            {announcement.mediaUrl && (
                                <div className="announce__media">
                                    {announcement.mediaType === 'video' ? (
                                        <video src={announcement.mediaUrl} controls playsInline preload="metadata" />
                                    ) : (
                                        <img src={announcement.mediaUrl} alt={announcement.title || 'Announcement'} />
                                    )}
                                </div>
                            )}

                            {announcement.message && (
                                <p className="announce__body">{announcement.message}</p>
                            )}

                            <div className="announce__actions">
                                {(announcement.buttonText && safeLink) ? (
                                    <>
                                        <a
                                            href={safeLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={handleClose}
                                            className="btn btn--primary btn--on-dark"
                                        >
                                            {announcement.buttonText}
                                        </a>
                                        <button onClick={handleClose} className="btn btn--ghost btn--on-dark">
                                            Later
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={handleClose} className="btn btn--ghost btn--on-dark announce__close-btn">
                                        Close
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
