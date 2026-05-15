import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSettings } from '../lib/store.js';

const DEFAULT_STATS = [
    { value: '144', label: 'Congregations' },
    { value: '128', label: 'Years of Ministry' },
    { value: '42K', label: 'Communicant Members' },
    { value: '6', label: 'Presbyteries' },
];

export default function StatsStrip() {
    const [stats, setStats] = useState(DEFAULT_STATS);

    useEffect(() => {
        (async () => {
            const data = await getSettings('invitation-stats');
            if (data?.stats?.length) setStats(data.stats);
        })();
    }, []);

    return (
        <motion.section
            className="stats"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8 }}
            aria-label="Denomination at a glance"
        >
            <div className="stats__grid">
                {stats.map((s, i) => (
                    <motion.div
                        key={`${s.label}-${i}`}
                        className="stats__item"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                    >
                        <div className="stats__value">{s.value}</div>
                        <div className="stats__label">{s.label}</div>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}
