import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getSettings } from '../lib/store.js';

const DEFAULT = {
    visitTitle: 'You belong here.',
    visitSubtitle:
        'No matter where you are on your journey, there is a seat at our table. Come worship with us this Lord’s Day.',
    serviceTimes: [
        { label: 'Sundays', value: '9:00 & 11:00 AM' },
        { label: 'Wednesdays', value: '7:00 PM' },
        { label: 'Location', value: 'Metro Manila' },
    ],
};

export default function Invitation() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
    const [content, setContent] = useState(DEFAULT);

    useEffect(() => {
        (async () => {
            const data = await getSettings('invitation-stats');
            if (data) setContent((prev) => ({ ...prev, ...data }));
        })();
    }, []);

    const { primary, secondary } = splitInvitationTitle(content.visitTitle);

    return (
        <section ref={ref} id="visit" className="invitation" aria-label="You are invited">
            <motion.div className="invitation__media" style={{ y: bgY }}>
                <img src={content.image || '/pcp-hero.jpg'} alt="" />
                <div className="invitation__veil" />
            </motion.div>

            <motion.div
                className="invitation__content"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
            >
                <span className="kicker on-dark">You&rsquo;re Invited</span>
                <h2 className="display-h1 on-dark">
                    {primary}{secondary && <><br /><em>{secondary}</em></>}
                </h2>
                <p className="invitation__lede">{content.visitSubtitle}</p>

                <div className="invitation__actions">
                    <Link to="/churches" className="btn btn--primary btn--on-dark">Find a Church Near You</Link>
                    <a href="#donate" className="btn btn--ghost btn--on-dark">Partner with Us</a>
                </div>

                <div className="invitation__strip">
                    {(content.serviceTimes || DEFAULT.serviceTimes).map((t, i) => (
                        <div key={i}>
                            <span className="label">{t.label}</span>
                            <span className="value">{t.value}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}

function splitInvitationTitle(raw) {
    const t = String(raw || '').trim().replace(/\.$/, '');
    const words = t.split(/\s+/);
    if (words.length <= 2) return { primary: t + '.', secondary: '' };
    const mid = Math.max(1, words.length - 1);
    return { primary: words.slice(0, mid).join(' '), secondary: words[mid] + '.' };
}
