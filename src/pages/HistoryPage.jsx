import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Landmark, Milestone, Users, MapPin, Mail, Globe, Phone } from 'lucide-react';
import { getSettings } from '../lib/store.js';
import { defaultHistory } from '../lib/seed-data.js';
import { Skeleton } from '../components/Skeleton.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import ChatbotWidget from '../components/ChatbotWidget.jsx';

export default function HistoryPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const saved = await getSettings('history');
            setData(saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : defaultHistory);
            setLoading(false);
        })();
    }, []);

    const h = data || defaultHistory;
    const ga = h.generalAssembly || {};

    return (
        <>
            <Helmet>
                <title>Our History — Presbyterian Church of the Philippines</title>
                <meta name="description" content="The history of the Presbyterian Church of the Philippines — from Korean Reformed mission work in 1977 to the General Assembly (GAPCP) organized in 1996." />
            </Helmet>
            <Navbar />
            <div className="min-h-screen bg-[#f8f7ff] selection:bg-accent/10">
                <main className="pt-28 pb-24 px-5 sm:px-8">
                    <div className="max-w-4xl mx-auto">

                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-14"
                        >
                            <span className="inline-flex items-center gap-2 text-accent text-[11px] font-bold uppercase tracking-[0.3em] mb-3">
                                <Landmark className="w-4 h-4" /> {h.kicker || 'Our Heritage'}
                            </span>
                            <h1 className="text-3xl lg:text-5xl font-bold text-church-dark font-display tracking-tight mb-4">
                                {h.title || 'Our History'}
                            </h1>
                            {h.intro && (
                                <p className="text-church-dark/60 max-w-2xl mx-auto leading-relaxed">{h.intro}</p>
                            )}
                        </motion.div>

                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}
                            </div>
                        ) : (
                            <>
                                {/* Narrative */}
                                {h.paragraphs?.length > 0 && (
                                    <section className="max-w-none mb-16">
                                        {h.paragraphs.map((p, i) => (
                                            <motion.p
                                                key={i}
                                                initial={{ opacity: 0, y: 12 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.05 }}
                                                className="text-church-dark/80 leading-relaxed mb-5 text-[15px] sm:text-base"
                                            >
                                                {p}
                                            </motion.p>
                                        ))}
                                    </section>
                                )}

                                {/* Timeline */}
                                {h.milestones?.length > 0 && (
                                    <section className="mb-20">
                                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-church-dark/70 mb-8">
                                            <Milestone className="w-4 h-4 text-accent" /> Milestones
                                        </h2>
                                        <ol className="relative border-l border-church-dark/15 ml-3">
                                            {h.milestones.map((m, i) => (
                                                <motion.li
                                                    key={i}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                                                    className="mb-8 ml-6"
                                                >
                                                    <span className="absolute -left-[7px] flex items-center justify-center w-3.5 h-3.5 rounded-full bg-accent ring-4 ring-[#f8f7ff]" />
                                                    <span className="inline-block text-accent text-[11px] font-bold uppercase tracking-[0.18em] mb-1">{m.date}</span>
                                                    <p className="text-church-dark/80 leading-relaxed text-[15px]">{m.text}</p>
                                                </motion.li>
                                            ))}
                                        </ol>
                                    </section>
                                )}

                                {/* General Assembly + Officers */}
                                {(ga.summary || ga.officers?.length > 0) && (
                                    <section className="mb-16 rounded-[2rem] border border-church-dark/10 bg-white/70 p-8 sm:p-10">
                                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-church-dark/70 mb-4">
                                            <Users className="w-4 h-4 text-accent" /> The General Assembly
                                        </h2>
                                        {ga.summary && (
                                            <p className="text-church-dark/80 leading-relaxed mb-8">{ga.summary}</p>
                                        )}
                                        {ga.officers?.length > 0 && (
                                            <>
                                                <p className="font-semibold text-church-dark/80 mb-4 text-sm uppercase tracking-[0.15em]">Current Officers</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {ga.officers.map((o, i) => (
                                                        <div key={i} className="flex items-center gap-4 rounded-2xl border border-church-dark/10 bg-white/60 px-5 py-4">
                                                            <span className="w-11 h-11 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center font-display font-bold">
                                                                {(o.name || '·').trim().charAt(0)}
                                                            </span>
                                                            <div>
                                                                <p className="font-bold text-church-dark leading-tight">{o.name}</p>
                                                                {o.role && <p className="text-church-dark/55 text-sm">{o.role}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </section>
                                )}

                                {/* Office / contact */}
                                {h.office && (h.office.address || h.office.email || h.office.website) && (
                                    <section className="rounded-[2rem] bg-church-dark text-white/90 p-8 sm:p-10">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent mb-4">General Assembly Office</p>
                                        <ul className="space-y-3 text-sm">
                                            {h.office.address && (
                                                <li className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-0.5 text-accent shrink-0" /> {h.office.address}</li>
                                            )}
                                            {h.office.tel && (
                                                <li className="flex items-start gap-3"><Phone className="w-4 h-4 mt-0.5 text-accent shrink-0" /> {h.office.tel}</li>
                                            )}
                                            {h.office.email && (
                                                <li className="flex items-start gap-3"><Mail className="w-4 h-4 mt-0.5 text-accent shrink-0" /> <a className="hover:underline" href={`mailto:${h.office.email}`}>{h.office.email}</a></li>
                                            )}
                                            {h.office.website && (
                                                <li className="flex items-start gap-3"><Globe className="w-4 h-4 mt-0.5 text-accent shrink-0" /> <a className="hover:underline" href={h.office.website} target="_blank" rel="noreferrer">{h.office.website.replace(/^https?:\/\//, '')}</a></li>
                                            )}
                                        </ul>
                                    </section>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
            <Footer />
            <ChatbotWidget />
        </>
    );
}
