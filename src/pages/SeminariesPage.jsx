import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { GraduationCap, MapPin, ExternalLink, BookOpen, Users, CalendarClock, ArrowLeft } from 'lucide-react';
import { getSettings } from '../lib/store.js';
import { safeExternalHref } from '../lib/url.js';
import { Skeleton } from '../components/Skeleton.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

function Section({ title, icon: Icon, children }) {
    return (
        <div className="mb-10">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-church-dark/70 mb-4">
                {Icon && <Icon className="w-4 h-4 text-accent" />} {title}
            </h3>
            {children}
        </div>
    );
}

function SeminaryDetail({ seminary, onBack }) {
    const s = seminary;
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="max-w-3xl mx-auto">
            <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-accent mb-6 hover:underline">
                <ArrowLeft className="w-4 h-4" /> All Seminaries
            </button>
            <span className="inline-block px-3 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                {s.type === 'college' ? 'College' : 'Seminary'}
            </span>
            <h1 className="text-3xl lg:text-4xl font-bold text-church-dark font-display tracking-tight mb-2">{s.name}</h1>
            {s.tagline && <p className="text-church-dark/60 text-lg mb-4">{s.tagline}</p>}
            {s.location && (
                <p className="flex items-start gap-2 text-church-dark/70 text-sm mb-6">
                    <MapPin className="w-4 h-4 mt-0.5 text-accent shrink-0" /> {s.location}
                </p>
            )}
            {s.about && <p className="text-church-dark/80 leading-relaxed mb-10">{s.about}</p>}
            {s.vision && (
                <Section title="Vision"><p className="text-church-dark/80 italic leading-relaxed">{s.vision}</p></Section>
            )}
            {s.mission?.length > 0 && (
                <Section title="Mission">
                    <ul className="list-disc list-inside space-y-1 text-church-dark/80">
                        {s.mission.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                </Section>
            )}
            {s.statementOfFaith?.length > 0 && (
                <Section title="Statement of Faith">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {s.statementOfFaith.map((x, i) => (
                            <div key={i} className="rounded-2xl border border-church-dark/10 bg-white/60 px-5 py-4">
                                <p className="font-bold text-church-dark">{x.title}</p>
                                {x.subtitle && <p className="text-church-dark/60 text-sm">{x.subtitle}</p>}
                            </div>
                        ))}
                    </div>
                </Section>
            )}
            {s.programs?.length > 0 && (
                <Section title="Academic Programs" icon={BookOpen}>
                    <div className="space-y-4">
                        {s.programs.map((p, i) => (
                            <div key={i} className="rounded-2xl border border-church-dark/10 bg-white/60 p-5">
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                                    <p className="font-bold text-church-dark">{p.name}</p>
                                    {p.duration && <span className="text-xs text-accent font-semibold">{p.duration}</span>}
                                    {p.units && <span className="text-xs text-church-dark/50">{p.units}</span>}
                                </div>
                                {p.description && <p className="text-church-dark/70 text-sm mb-2">{p.description}</p>}
                                {p.highlights?.length > 0 && (
                                    <ul className="list-disc list-inside text-church-dark/70 text-sm space-y-0.5">
                                        {p.highlights.map((h, j) => <li key={j}>{h}</li>)}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}
            {(s.admissions?.whoMayApply?.length > 0 || s.admissions?.requirements?.length > 0) && (
                <Section title="Admissions">
                    {s.admissions?.whoMayApply?.length > 0 && (
                        <>
                            <p className="font-semibold text-church-dark/80 mb-2">Who may apply</p>
                            <ul className="list-disc list-inside text-church-dark/80 mb-4 space-y-0.5">
                                {s.admissions.whoMayApply.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </>
                    )}
                    {s.admissions?.requirements?.length > 0 && (
                        <>
                            <p className="font-semibold text-church-dark/80 mb-2">Requirements</p>
                            <ul className="list-disc list-inside text-church-dark/80 space-y-0.5">
                                {s.admissions.requirements.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </>
                    )}
                </Section>
            )}
            {(s.schedule?.day || s.schedule?.time || s.schedule?.mode || s.schedule?.load) && (
                <Section title="Class Schedule" icon={CalendarClock}>
                    <ul className="text-church-dark/80 space-y-1">
                        {s.schedule.day && <li><b>Day:</b> {s.schedule.day}</li>}
                        {s.schedule.time && <li><b>Time:</b> {s.schedule.time}</li>}
                        {s.schedule.mode && <li><b>Mode:</b> {s.schedule.mode}</li>}
                        {s.schedule.load && <li><b>Load:</b> {s.schedule.load}</li>}
                    </ul>
                </Section>
            )}
            {(s.officers?.length > 0 || s.faculty?.length > 0) && (
                <Section title="People" icon={Users}>
                    {s.officers?.length > 0 && (
                        <div className="mb-4">
                            <p className="font-semibold text-church-dark/80 mb-2">Administration</p>
                            <ul className="text-church-dark/80 space-y-0.5">
                                {s.officers.map((o, i) => <li key={i}>{o.name}{o.role ? ` — ${o.role}` : ''}</li>)}
                            </ul>
                        </div>
                    )}
                    {s.faculty?.length > 0 && (
                        <div>
                            <p className="font-semibold text-church-dark/80 mb-2">Faculty</p>
                            <ul className="text-church-dark/80 space-y-0.5">
                                {s.faculty.map((f, i) => <li key={i}>{f}</li>)}
                            </ul>
                        </div>
                    )}
                </Section>
            )}
            {safeExternalHref(s.website) && (
                <a href={safeExternalHref(s.website)} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-white font-semibold hover:shadow-lg hover:shadow-accent/30 transition-all">
                    Visit Website <ExternalLink className="w-4 h-4" />
                </a>
            )}
        </motion.div>
    );
}

export default function SeminariesPage() {
    const [seminaries, setSeminaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        (async () => {
            const data = await getSettings('seminaries');
            if (Array.isArray(data)) {
                setSeminaries(data);
            } else {
                setError(true);
            }
            setLoading(false);
        })();
    }, []);

    return (
        <>
            <Helmet>
                <title>Seminaries — Presbyterian Church of the Philippines</title>
                <meta name="description" content="Reformed, Christ-centered theological education at the seminaries of the Presbyterian Church of the Philippines." />
            </Helmet>
            <Navbar />
            <div className="min-h-screen bg-[#faf7f0] selection:bg-accent/10">
                <main className="pt-28 pb-24 px-5 sm:px-8">
                    <div className="max-w-5xl mx-auto">
                        <AnimatePresence mode="wait">
                            {selected ? (
                                <SeminaryDetail key="detail" seminary={selected} onBack={() => setSelected(null)} />
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <div className="text-center mb-12">
                                        <span className="inline-flex items-center gap-2 text-accent text-[11px] font-bold uppercase tracking-[0.3em] mb-3">
                                            <GraduationCap className="w-4 h-4" /> Theological Education
                                        </span>
                                        <h1 className="text-3xl lg:text-4xl font-bold text-church-dark font-display tracking-tight mb-2">Our Seminaries</h1>
                                        <p className="text-church-dark/60 max-w-xl mx-auto">Reformed, Christ-centered training for pastors, missionaries, and church leaders.</p>
                                    </div>
                                    {loading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48 rounded-3xl" />)}
                                        </div>
                                    ) : error ? (
                                        <p className="text-center text-church-dark/50 py-24">We couldn&apos;t load the seminaries right now. Please try again later.</p>
                                    ) : seminaries.length === 0 ? (
                                        <p className="text-center text-church-dark/50 py-24">No seminaries listed yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {seminaries.map((s) => (
                                                <button key={s.id} onClick={() => setSelected(s)}
                                                    className="text-left rounded-3xl border border-church-dark/10 bg-white/70 p-7 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-0.5 transition-all group flex flex-col">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center">
                                                            <GraduationCap className="w-5 h-5 text-accent" />
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-lg bg-church-dark/5 text-church-dark/60 text-[9px] font-bold uppercase tracking-[0.2em]">
                                                            {s.type === 'college' ? 'College' : 'Seminary'}
                                                        </span>
                                                    </div>
                                                    <h2 className="text-xl font-bold text-church-dark font-display group-hover:text-accent transition-colors mb-1">{s.name}</h2>
                                                    {s.tagline && <p className="text-church-dark/60 text-sm mb-3">{s.tagline}</p>}
                                                    {s.about && <p className="text-church-dark/55 text-[13px] leading-relaxed line-clamp-3 mb-4">{s.about}</p>}
                                                    <div className="mt-auto pt-2 flex items-center justify-between gap-3">
                                                        <span className="flex items-start gap-1.5 text-church-dark/50 text-xs min-w-0">
                                                            {s.location && <><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span className="truncate">{s.location}</span></>}
                                                            {!s.location && s.programs?.length > 0 && <span>{s.programs.length} program{s.programs.length === 1 ? '' : 's'} offered</span>}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-wider shrink-0 group-hover:gap-2.5 transition-all">
                                                            View details <span aria-hidden="true">→</span>
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
            <Footer />
        </>
    );
}
