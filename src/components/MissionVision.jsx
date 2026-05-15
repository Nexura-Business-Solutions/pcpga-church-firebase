import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSettings } from '../lib/store.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

const DEFAULT = {
    motto: 'To glorify God and to enjoy Him forever.',
    vision:
        'Christ glorified through faithful Presbyterian and Reformed churches — united, growing in grace and truth, and advancing the gospel that transforms individuals, families, and society for the glory of God alone.',
    missionPoints: [
        { title: 'Go, Make Disciples', sub: 'Nurture believers to maturity through Word, Sacrament and prayer.' },
        { title: 'Advance the Mission', sub: 'Proclaim the Gospel of grace locally and globally, in mercy and justice.' },
        { title: 'Grow the Church', sub: 'Plant, strengthen and revitalize confessional Presbyterian congregations.' },
        { title: 'Develop Leaders', sub: 'Train faithful pastors, elders and deacons for worship, service and witness.' },
        { title: 'Uphold the Reformed Faith', sub: 'Preserve the confessional heritage and promote unity among Reformed bodies.' },
    ],
    coreCommitments: [
        { title: 'Christ-Centered Worship', sub: 'Exalting God through reverent and joyful worship rooted in Scripture.' },
        { title: 'Biblical Authority', sub: 'Affirming the Holy Scriptures as the final rule for faith and life.' },
        { title: 'Covenant Community', sub: 'Nurturing unity, accountability and mutual care within the Body of Christ.' },
        { title: 'Mission to the Nations', sub: 'Participating in God’s redemptive work in all the world.' },
        { title: 'Leadership by Servanthood', sub: 'Following the example of Christ, the Chief Shepherd.' },
    ],
    summary:
        'Grounded in the Reformed faith and Presbyterian order, we exist to glorify God, edify His Church, and extend His Kingdom through faithful discipleship, gospel mission and godly leadership.',
};

export default function MissionVision() {
    const [content, setContent] = useState(DEFAULT);

    useEffect(() => {
        (async () => {
            const data = await getSettings('mission-vision');
            if (data) {
                setContent((prev) => ({
                    motto: data.motto || prev.motto,
                    vision: data.vision || prev.vision,
                    missionPoints: data.missionPoints || prev.missionPoints,
                    coreCommitments: data.commitments || data.coreCommitments || prev.coreCommitments,
                    summary: data.summary || prev.summary,
                }));
            }
        })();
    }, []);

    return (
        <section className="mv" aria-label="Mission & Vision">
            <motion.div
                className="mv__motto"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                <span className="kicker" style={{ display: 'block' }}>Denominational Motto</span>
                <p className="mv__motto-text">
                    &ldquo;{stripMotto(content.motto)}&rdquo;
                </p>
                <div className="ornament">
                    <span className="line" /><span className="diamond">✦</span><span className="line" />
                </div>
            </motion.div>

            <div className="mv__block">
                <motion.div
                    className="mv__vision"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="kicker">Vision Statement</span>
                    <p className="mv__vision-text">{content.vision}</p>
                </motion.div>
            </div>

            <div className="pillars">
                <div className="section-head">
                    <span className="kicker">Our Calling</span>
                    <h2 className="display-h2">Five tasks,<br /><em>one Lord.</em></h2>
                    <p className="section-head__lede">
                        As a Reformed and Presbyterian denomination under the authority of Scripture and the Lordship of
                        Jesus Christ, we are called to:
                    </p>
                </div>
                <ol className="pillars__list">
                    {content.missionPoints.map((p, i) => (
                        <motion.li
                            key={p.title}
                            className="pillars__item"
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.06 }}
                        >
                            <span className="pillars__num">{ROMAN[i] || i + 1}</span>
                            <div>
                                <h4>{cleanTitle(p.title)}</h4>
                                <p>{p.sub}</p>
                            </div>
                        </motion.li>
                    ))}
                </ol>
            </div>

            <div className="mv__block">
                <div className="section-head" style={{ marginBottom: '2rem' }}>
                    <span className="kicker">Core Commitments</span>
                </div>
                <div className="mv__commitments">
                    {content.coreCommitments.map((c, i) => (
                        <motion.div
                            key={c.title}
                            className="mv__commit-item"
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55, delay: i * 0.05 }}
                        >
                            <h4>{c.title}</h4>
                            <p>{c.sub}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <motion.div
                className="mv__summary"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
            >
                <span className="kicker" style={{ display: 'block' }}>Summary Statement</span>
                <p className="mv__summary-text">&ldquo;{content.summary}&rdquo;</p>
                <div className="mv__summary-tag">Established in Grace · Moving in Faith · GAPCP</div>
            </motion.div>
        </section>
    );
}

function stripMotto(m) {
    return String(m || '').replace(/^["“]+|["”]+$/g, '').trim();
}

function cleanTitle(t) {
    // normalize legacy titles like "1. Go Make Disciples" → "Go, Make Disciples"
    return String(t || '').replace(/^\d+\.\s*/, '').trim();
}
