import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings } from '../lib/store.js';

const TYPE_KICKER = {
    info: 'Notice',
    event: 'Event',
    warning: 'Notice',
    urgent: 'Urgent',
};

export default function AnnouncementModal() {
    const [announcement, setAnnouncement] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        (async () => {
            const data = await getSettings('announcement');
            if (data && data.isActive) {
                const seenStr = localStorage.getItem('pcpga_seen_announcements');
                let seenList = [];
                try { seenList = seenStr ? JSON.parse(seenStr) : []; } catch {}

                const id = [data.title, data.message, data.mediaUrl, data.updatedAt].filter(Boolean).join('|');
                if (!seenList.includes(id)) {
                    setAnnouncement({ ...data, id });
                    setTimeout(() => setIsOpen(true), 1200);
                }
            }
        })();
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        if (!announcement?.id) return;
        const seenStr = localStorage.getItem('pcpga_seen_announcements');
        let seenList = [];
        try { seenList = seenStr ? JSON.parse(seenStr) : []; } catch {}
        seenList.push(announcement.id);
        if (seenList.length > 10) seenList.shift();
        localStorage.setItem('pcpga_seen_announcements', JSON.stringify(seenList));
    };

    if (!announcement) return null;

    const kicker = TYPE_KICKER[announcement.type] || 'Notice';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="announce" role="dialog" aria-modal="true">
                    <motion.div
                        className="announce__backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />
                    <motion.div
                        className="announce__card announcement-scroll"
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                    >
                        <div className="announce__header">
                            <span className="kicker on-dark">{kicker} · General Assembly</span>
                            <button className="announce__close" onClick={handleClose} aria-label="Close">×</button>
                        </div>

                        <h3 className="announce__title">
                            {announcement.title}
                        </h3>

                        {announcement.mediaUrl && (
                            <div className="announce__media">
                                {announcement.mediaType === 'video' ? (
                                    <video src={announcement.mediaUrl} controls playsInline preload="metadata" />
                                ) : (
                                    <img src={announcement.mediaUrl} alt={announcement.title || 'Announcement'} />
                                )}
                            </div>
                        )}

                        <p className="announce__body">{announcement.message}</p>

                        <div className="announce__actions">
                            {announcement.buttonText && announcement.buttonLink ? (
                                <a
                                    href={announcement.buttonLink}
                                    onClick={handleClose}
                                    className="btn btn--primary btn--on-dark"
                                >
                                    {announcement.buttonText}
                                </a>
                            ) : null}
                            <button onClick={handleClose} className="btn btn--ghost btn--on-dark">
                                Later
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
