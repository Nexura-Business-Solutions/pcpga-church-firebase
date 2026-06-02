import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings } from '../lib/store.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const DEFAULT_COMMITTEES = [
    { name: 'Executive Committee', description: 'Coordinates general execution of matters entrusted by the body, prepares GA meetings, and represents the denomination.', details: ['To execute all the matters entrusted by the body.', 'To prepare all matters for GA Meeting.', 'To represent the denomination.'], officers: [{ name: 'Rev. Edgar P. Adra', role: 'Moderator' }, { name: 'Rev. Orlando M. Tabotabo', role: 'Vice Moderator' }, { name: 'Rev. Nelson M. Dangan', role: 'General Secretary' }, { name: 'Rev. Victorino G. Dagaman', role: 'Treasurer' }, { name: 'Rev. Roberto G. Fabia', role: 'Recording Clerk' }, { name: 'Rev. Arturo Dumayag', role: 'Internal Auditor' }] },
    { name: 'Mission Committee', description: 'Leads programs for home and foreign missions, monitors ongoing mission works, and raises funds for mission.', details: ['To make programs for home and foreign mission.', 'To monitor ongoing mission works.', 'To raise funds for mission.'], officers: [{ name: 'Rev. Marcelo Ramirez', role: 'Chairman' }, { name: 'Rev. Elimar Eleazar', role: 'Vice Chairman' }, { name: 'Rev. Nelson Carillo', role: 'Secretary' }, { name: 'Rev. Tony Sandrino', role: 'Treasurer' }, { name: 'Rev. Noel Carino', role: 'Member' }, { name: 'Rev. Henrieto Pacaldo', role: 'Member' }] },
    { name: 'Theological Education', description: 'Sets standards for theological training institutions, recommends curricula, and manages scholarship programs.', details: ['To set standards for theological institutions.', 'To recommend curriculum for training.', 'To set-up scholarship program.'], officers: [{ name: 'Rev. Francis Banaga', role: 'Chairman' }, { name: 'Rev. Joval Kisinamal', role: 'Vice Chairman' }, { name: 'Rev. Elizardo Hortel', role: 'Secretary' }, { name: 'Rev. Benjamin Remedios', role: 'Member' }, { name: 'Rev. Ian Mariano', role: 'Member' }, { name: 'Rev. Arturo Dumayag', role: 'Member' }, { name: 'Rev. Nelson Dangan', role: 'Member' }, { name: 'Rev. Laurence Gatawa', role: 'Member' }] },
    { name: 'Christian Education', description: 'Develops curricula for Sunday Schools, formulates policies for CE, and organizes educational seminars.', details: ['To formulate policies for CE.', 'To develop curriculum for Sunday School.', 'To organize seminars and workshops.'], officers: [{ name: 'Rev. Ignacio Asuncion', role: 'Chairman' }, { name: 'Reynaldo Dizon', role: 'Vice Chairman' }, { name: 'Rev. Robin Abano', role: 'Secretary' }, { name: 'Rev. Nelson Dangan', role: 'Member' }, { name: 'Rev. Orlando Tabotabo', role: 'Member' }, { name: 'Rev. Daniel Balittoc', role: 'Member' }, { name: 'Rev. Heherson Abad', role: 'Member' }, { name: 'Rev. Ariel Gonesto', role: 'Member' }, { name: 'Rev. Ramonito Villaver', role: 'Member' }] },
    { name: 'Diaconal & Welfare', description: 'Manages disaster relief, raises funds for welfare projects, and supports families of deceased ministers.', details: ['To formulate policies for relief.', 'To raise fund for relief works.', 'To help families of deceased Ministers.'], officers: [{ name: 'Rev. Danilo Yandan', role: 'Chairman' }, { name: 'Rev. Luvimin Zacal', role: 'Vice Chairman' }, { name: 'Rev. Lito Carillo', role: 'Secretary' }, { name: 'Rev. Willie Dindin', role: 'Treasurer' }, { name: 'Rev. Antonio Sandrino', role: 'Member' }, { name: 'Rev. Nelson Dangan', role: 'Member' }, { name: 'Elder Pablito Daradal', role: 'Member' }, { name: 'Rev. Manuel Maca', role: 'Member' }, { name: 'Rev. Gilbert Balasa', role: 'Member' }, { name: 'Rev. Omar Estrabella', role: 'Member' }, { name: 'Rev. Menard Dino', role: 'Member' }] },
    { name: 'Church Auxiliaries', description: 'Coordinates fellowships for Youth, Men, and Women organizations, and manages national church camps.', details: ['To supervise Youth, Men, and Women orgs.', 'To co-ordinate national camps.'], officers: [{ name: 'Rev. Augusto Guzman', role: 'Chairman' }, { name: 'Rev. Ricky Equit', role: 'Vice Chairman' }, { name: 'Rev. Christopher Guevarra', role: 'Secretary' }, { name: 'Rev. Eli Eleazar', role: 'Member' }, { name: 'Rev. Youngjoon Shin', role: 'Member' }, { name: 'Rev. Mariano Bituin', role: 'Member' }, { name: 'Rev. Ernesto Norio', role: 'Member' }, { name: 'Rev. Nelson Dangan', role: 'Member' }] },
    { name: 'Publication Committee', description: 'Oversees official Assembly publications, manages GA materials, and maintains the church website.', details: ['To oversee and publish GA materials.', 'Manage and maintain the official website.'], officers: [{ name: 'Rev. Virgilio Delas Armas', role: 'Chairman' }, { name: 'Alexander Landeza', role: 'Vice Chairman' }, { name: 'Rev. Cyril Rubianes', role: 'Secretary' }, { name: 'Rev. Joselito Malicdem', role: 'Treasurer' }, { name: 'Rev. Marcus Luben', role: 'Member' }, { name: 'Rev. Teofilo Rufon', role: 'Member' }, { name: 'Rev. Robin Abano', role: 'Member' }, { name: 'Elder Nonito Odjinar', role: 'Member' }] },
    { name: 'Finance Committee', description: 'Formulates annual budgets, monitors church income and expenditures, and recommends financial policies.', details: ['To formulate an annual budget.', 'To monitor income and expenditures.', 'To recommend financial policies.'], officers: [{ name: 'Elder Leonardo Canto', role: 'Chairman' }, { name: 'Rev. Manny Hipolito', role: 'Vice Chairman' }, { name: 'Rev. Benjamin M. Remedios', role: 'Secretary' }, { name: 'Rev. Victorino Dagaman', role: 'Treasurer' }, { name: 'Rev. Joselito Malicdem', role: 'Member' }, { name: 'Rev. Jeremiah Diawa', role: 'Member' }, { name: 'Rev. Ronald Capil', role: 'Member' }, { name: 'Rev. Valeriano Geloca', role: 'Member' }, { name: 'Elder Joshua Llona Jr', role: 'Member' }] },
    { name: 'Judicial Court', description: 'Handles all judicial matters and appeals within the denomination and reports to the General Assembly.', details: ['To handle all judicial matters.', 'To make a report to next GA meeting.'] },
];

export default function Committees() {
    const [committees, setCommittees] = useState(DEFAULT_COMMITTEES);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        (async () => {
            const data = await getSettings('standing-committees');
            if (Array.isArray(data) && data.length > 0) setCommittees(data);
        })();
    }, []);

    return (
        <section id="committees" className="committees" aria-label="Standing committees">
            <div className="section-head">
                <span className="kicker">Governance</span>
                <h2 className="display-h2">Standing<br /><em>committees.</em></h2>
                <p className="section-head__lede">
                    Nine committees carry out the ministries and administrative work of the General Assembly between sessions. Select a committee to view its standing rules and officers.
                </p>
            </div>

            <ul className="committees__list">
                {committees.map((c, i) => (
                    <motion.li
                        key={c.name}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04, duration: 0.55 }}
                    >
                        <button className="committees__card" onClick={() => setSelected(c)}>
                            <span className="committees__num">{ROMAN[i] || i + 1}</span>
                            <h4>{c.name}</h4>
                            <p>{c.description}</p>
                            <span className="committees__cta">View rules →</span>
                        </button>
                    </motion.li>
                ))}
            </ul>

            <AnimatePresence>
                {selected && (
                    <motion.div className="pcp-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="pcp-modal__backdrop" onClick={() => setSelected(null)} />
                        <motion.div
                            className="pcp-modal__card custom-scrollbar"
                            initial={{ opacity: 0, y: 18, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 18, scale: 0.96 }}
                        >
                            <button className="pcp-modal__close" onClick={() => setSelected(null)} aria-label="Close">×</button>
                            <div className="pcp-modal__eyebrow">Standing Rules & Duties</div>
                            <h3 className="pcp-modal__title">{selected.name}</h3>
                            <div className="pcp-modal__body">
                                <p>{selected.description}</p>

                                {selected.details?.length > 0 && (
                                    <>
                                        <div className="pcp-modal__section-title">Key Duties</div>
                                        <ul className="pcp-modal__list">
                                            {selected.details.map((d, idx) => <li key={idx}>{d}</li>)}
                                        </ul>
                                    </>
                                )}

                                {selected.officers?.length > 0 && (
                                    <>
                                        <div className="pcp-modal__section-title">Commissioned Officers</div>
                                        <div className="pcp-modal__officers">
                                            {selected.officers.map((off, idx) => (
                                                <div key={idx} className="pcp-modal__officer">
                                                    <div className="pcp-modal__officer-photo">
                                                        {off.photo ? (
                                                            <img src={off.photo} alt={off.name} />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)' }}>·</div>
                                                        )}
                                                    </div>
                                                    <div className="pcp-modal__officer-name">{off.name}</div>
                                                    {off.role && <div className="pcp-modal__officer-role">{off.role}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="pcp-modal__footer">
                                <button className="btn btn--ghost btn--small" onClick={() => setSelected(null)}>Close</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
