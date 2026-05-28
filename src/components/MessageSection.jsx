import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSettings } from '../lib/store.js';

const DEFAULT = {
    title: 'We are a church built on the old foundation — Christ, the Scriptures, and the fellowship of the saints.',
    paragraphs: [
        "For over a century, the Gospel has travelled through these islands — from the seaside chapels of the Ilocos coast to the mountain parishes of the Cordillera, and into the neighborhoods of Metro Manila. Our congregations are ordinary and small; the God we worship is not. We gather weekly around the preached Word and the Lord's Table, believing that grace still reaches the ordinary sinner through ordinary means.",
        "Whether you are new to the faith, returning after many years away, or simply visiting for a season — you will find a seat here, a Bible opened, and a community that believes the Gospel is good news for you today.",
    ],
    signer: 'Office of the Moderator',
    role: 'General Assembly of the Presbyterian Church of the Philippines',
};

export default function MessageSection() {
    const [content, setContent] = useState(DEFAULT);

    useEffect(() => {
        (async () => {
            const data = await getSettings('core-principles');
            if (data) {
                setContent((prev) => ({
                    ...prev,
                    title: data.title || data.heading || prev.title,
                    paragraphs: data.paragraphs || data.messages?.map((m) => m.text) || prev.paragraphs,
                    signer: data.signer || data.moderator || prev.signer,
                    role: data.role || prev.role,
                }));
            }
        })();
    }, []);

    return (
        <section id="message" className="editorial" aria-label="A word of welcome">
            <div className="editorial__grid">
                <motion.aside
                    className="editorial__meta"
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <span className="kicker">A Word of Welcome</span>
                    <span className="bylabel">From the Moderator</span>
                </motion.aside>

                <motion.div
                    className="editorial__body"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="display-h2">{content.title}</h2>
                    {(content.paragraphs || []).map((p, i) => (
                        <p key={i} className={`editorial__para ${i === 0 ? 'has-drop-cap' : ''}`}>
                            {p}
                        </p>
                    ))}
                    <p className="signature">
                        <em>{content.signer}</em>
                        <span>{content.role}</span>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
