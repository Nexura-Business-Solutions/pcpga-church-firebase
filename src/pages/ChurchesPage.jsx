import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getChurches } from '../lib/store.js';
import { regions } from '../lib/seed-data.js';
import { Skeleton } from '../components/Skeleton.jsx';
import Footer from '../components/Footer.jsx';
import ChatbotWidget from '../components/ChatbotWidget.jsx';
import PhilippinesMap from '../components/PhilippinesMap.jsx';
import { PRESBYTERY_COLOR } from '../lib/presbyteryMap.js';

export default function ChurchesPage() {
    const [churches, setChurches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [regionFilter, setRegionFilter] = useState('');
    const [selected, setSelected] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [mode, setMode] = useState('explore'); // 'explore' (SVG presbytery map) or 'find' (Google-Maps finder)
    const [presbyteryFilter, setPresbyteryFilter] = useState('');
    const [footerNear, setFooterNear] = useState(false);
    const footerSentinelRef = useRef(null);

    useEffect(() => {
        const fetchChurches = async () => {
            const data = await getChurches();
            setChurches(data);
            setLoading(false);
        };
        fetchChurches();
    }, []);

    useEffect(() => {
        const onScroll = () => {
            const el = footerSentinelRef.current;
            if (!el) return;
            // Hide pill when the start-of-footer marker is within ~120px above the viewport bottom
            const rect = el.getBoundingClientRect();
            const buffer = 120;
            setFooterNear(rect.top <= window.innerHeight + buffer);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    const filtered = (churches || []).filter((c) => {
        if (!c) return false;
        const matchesSearch = !search ||
            (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.address || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.province || '').toLowerCase().includes(search.toLowerCase());
        const matchesRegion = !regionFilter || c.region === regionFilter;
        const matchesPresbytery = !presbyteryFilter || c.presbytery === presbyteryFilter;
        return matchesSearch && matchesRegion && matchesPresbytery;
    });

    return (
        <>
            <Helmet>
                <title>Churches | PCP</title>
                <meta name="description" content="Find Presbyterian churches across the Philippines." />
            </Helmet>
            {/* This page ships its own fixed "PCP Finder" header below, so we do
                NOT also render the global <Navbar/> — two fixed top-0 bars would
                overlap and the global nav's pre-scroll white links are invisible
                on the white sub-nav. */}
            <div className="min-h-screen bg-[#f8f7ff] selection:bg-accent/10">
                {/* Header / Sub-Navbar */}
                <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
                    <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-3">
                        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight font-display text-accent shrink-0">
                            <span className="text-xl">✦</span>
                            <span className="text-[15px] text-church-dark hidden sm:inline">PCP Finder</span>
                        </Link>
                        <div className="flex p-1 bg-black/[0.04] rounded-full">
                            <button
                                onClick={() => setMode('explore')}
                                className={`px-3 sm:px-5 min-h-[40px] rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${mode === 'explore' ? 'bg-accent text-white shadow' : 'text-church-gray hover:text-accent'}`}
                            >
                                Explore Map
                            </button>
                            <button
                                onClick={() => setMode('find')}
                                className={`px-3 sm:px-5 min-h-[40px] rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${mode === 'find' ? 'bg-accent text-white shadow' : 'text-church-gray hover:text-accent'}`}
                            >
                                Find a Church
                            </button>
                        </div>
                        <Link
                            to="/"
                            className="text-[11px] font-bold tracking-widest uppercase text-church-gray hover:text-accent transition-colors items-center gap-2 bg-black/[0.03] px-5 min-h-[44px] rounded-xl hidden md:flex shrink-0"
                        >
                            ← Home
                        </Link>
                    </div>
                </nav>

                {mode === 'explore' && (
                    <div className="pt-16 min-h-screen flex flex-col items-center px-5 pb-16">
                        <div className="max-w-2xl text-center pt-8 lg:pt-12 pb-6">
                            <p className="text-[10px] lg:text-[11px] font-bold tracking-[0.3em] uppercase text-accent mb-3">Across the Archipelago</p>
                            <h1 className="text-2xl lg:text-4xl font-bold text-church-dark font-display tracking-tight mb-3">Our Churches by Presbytery</h1>
                            <p className="text-[13px] lg:text-sm text-church-gray leading-relaxed">
                                Pindutin ang isang lugar sa mapa — o isang presbytery sa ibaba — para makita ang mga simbahan doon. O kaya{' '}
                                <button onClick={() => { setPresbyteryFilter(''); setMode('find'); }} className="text-accent font-bold underline underline-offset-2">maghanap ng simbahan malapit sa&apos;yo →</button>
                            </p>
                        </div>
                        <div className="w-full max-w-[520px]">
                            <PhilippinesMap onSelect={(name) => { setPresbyteryFilter(name); setSearch(''); setRegionFilter(''); setMode('find'); }} />
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-2xl">
                            {Object.keys(PRESBYTERY_COLOR).map((name) => (
                                <button
                                    key={name}
                                    onClick={() => { setPresbyteryFilter(name); setSearch(''); setRegionFilter(''); setMode('find'); }}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/[0.06] bg-white text-[11px] text-church-dark hover:bg-church-dark hover:text-white transition-colors"
                                >
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PRESBYTERY_COLOR[name] }} />
                                    {name.replace('NCR Presbytery - ', 'NCR ').replace(' Presbytery', '')}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {mode === 'find' && (
                <div className="pt-16 flex flex-col lg:flex-row h-auto lg:h-[100dvh] lg:overflow-hidden relative">
                    {/* ── SEARCH & RESULTS SIDEBAR ── */}
                    <aside className={`w-full lg:w-[420px] xl:w-[480px] bg-white border-b lg:border-r border-black/[0.04] flex flex-col shadow-2xl shadow-black/[0.02] z-10 ${viewMode === 'map' ? 'hidden lg:flex' : 'flex'}`}>
                        {/* Header Group */}
                        <div className="p-5 lg:p-8 border-b border-black/[0.03]">
                            <h1 className="text-xl lg:text-2xl font-bold text-church-dark font-display tracking-tight mb-2 h-auto">Find a Church</h1>
                            <p className="text-[11px] lg:text-[13px] text-church-gray mb-6 lg:mb-8">Locate a Presbyterian congregation near you.</p>

                            {/* Search Bar */}
                            <div className="relative group mb-4 lg:mb-6">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-church-gray/30 group-focus-within:text-accent transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                </div>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search city or province..."
                                    className="w-full bg-black/[0.02] border-none rounded-xl lg:rounded-2xl pl-11 pr-5 py-3 lg:py-4 text-sm text-church-dark placeholder:text-church-gray/30 focus:ring-2 focus:ring-accent/10 transition-all outline-none"
                                />
                            </div>

                            {/* Region Chips */}
                            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
                                <button
                                    onClick={() => setRegionFilter('')}
                                    className={`px-4 min-h-[44px] lg:min-h-0 lg:py-2 rounded-xl text-[10px] lg:text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap ${regionFilter === '' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-black/[0.03] text-church-gray hover:bg-black/[0.06]'
                                        }`}
                                >
                                    All Regions
                                </button>
                                {regions.map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setRegionFilter(r)}
                                        className={`px-4 min-h-[44px] lg:min-h-0 lg:py-2 rounded-xl text-[10px] lg:text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap ${regionFilter === r ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-black/[0.03] text-church-gray hover:bg-black/[0.06]'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Results List */}
                        <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-church-light/30 lg:max-h-none">
                            <div className="mb-4 px-2 flex items-center justify-between gap-2">
                                <h3 className="text-[10px] font-bold text-church-gray/50 tracking-[0.2em] uppercase">
                                    {loading ? 'Scanning MAP...' : `${filtered.length} Congregations Found`}
                                </h3>
                                {presbyteryFilter && (
                                    <button
                                        onClick={() => setPresbyteryFilter('')}
                                        className="text-[9px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-full hover:bg-accent/20 whitespace-nowrap shrink-0"
                                    >
                                        {presbyteryFilter.replace('NCR Presbytery - ', 'NCR ').replace(' Presbytery', '')} ✕
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3 lg:space-y-4">
                                {loading ? (
                                    [...Array(4)].map((_, i) => (
                                        <div key={i} className="bg-white rounded-[1.5rem] lg:rounded-[1.8rem] p-5 lg:p-6 border border-black/[0.03]">
                                            <div className="flex justify-between mb-3">
                                                <Skeleton className="w-24 h-4" />
                                                <Skeleton className="w-7 h-7 lg:w-8 lg:h-8 rounded-full" />
                                            </div>
                                            <Skeleton className="w-3/4 h-5 lg:h-6 mb-2" />
                                            <Skeleton className="w-1/2 h-3 mb-4" />
                                            <Skeleton className="w-20 h-3" />
                                        </div>
                                    ))
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {filtered.map((church, i) => (
                                            <motion.div
                                                key={church.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => {
                                                    setSelected(church);
                                                    if (window.innerWidth < 1024) setViewMode('map');
                                                }}
                                                className={`group p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[1.8rem] border transition-all duration-300 cursor-pointer ${selected?.id === church.id
                                                    ? 'bg-white border-accent shadow-xl shadow-accent/5 ring-4 ring-accent/5'
                                                    : 'bg-white border-black/[0.03] hover:border-accent/40 hover:shadow-lg'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-2 lg:mb-3">
                                                    <span className={`px-2 py-0.5 lg:px-2.5 lg:py-1 text-[8px] lg:text-[9px] font-bold tracking-widest uppercase rounded-md lg:rounded-lg ${church.region === 'NCR' ? 'bg-accent/10 text-accent' : 'bg-black/5 text-church-gray'
                                                        }`}>
                                                        {church.region}{church.province ? ` · ${church.province}` : ''}
                                                    </span>
                                                    <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center transition-all ${selected?.id === church.id ? 'bg-accent text-white' : 'bg-black/[0.03] text-church-gray/40'
                                                        }`}>
                                                        <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
                                                    </div>
                                                </div>
                                                <h3 className="text-base lg:text-lg font-bold text-church-dark mb-1 font-display group-hover:text-accent transition-colors leading-tight">
                                                    {church.name}
                                                </h3>
                                                <p className="text-church-gray text-[11px] lg:text-xs mb-3 lg:mb-4 line-clamp-1 opacity-60">{church.address}</p>

                                                {church.serviceTime && (
                                                    <div className="flex items-center gap-4 text-[9px] lg:text-[10px] font-bold text-church-gray/40">
                                                        <div className="flex items-center gap-1.5 uppercase tracking-widest">
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                            {church.serviceTime}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}

                                {!loading && filtered.length === 0 && (
                                    <div className="empty-state">
                                        <div className="empty-state__ornament">✚</div>
                                        <h3 className="empty-state__title">No churches match</h3>
                                        <p className="empty-state__copy">
                                            Try a different region or clear your filter — over a hundred congregations are gathered here.
                                        </p>
                                        <button onClick={() => { setSearch(''); setRegionFilter(''); }} className="btn btn--link mt-6">
                                            Clear filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* ── INTERACTIVE MAP AREA ── */}
                    <main className={`flex-1 relative bg-church-light/20 min-h-0 h-[100dvh] lg:h-auto ${viewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selected?.id || 'default'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full relative"
                            >
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }}
                                    src={selected
                                        ? `https://maps.google.com/maps?q=${encodeURIComponent(selected.address + ' ' + selected.name)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
                                        : `https://maps.google.com/maps?q=Presbyterian%20Church%20Philippines&t=&z=6&ie=UTF8&iwloc=&output=embed`
                                    }
                                    allowFullScreen
                                ></iframe>

                                {/* Floating Card Info (Desktop/Mobile Bottom Sheet) */}
                                <AnimatePresence>
                                    {selected && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                                            className="fixed lg:absolute bottom-0 lg:bottom-10 left-0 lg:left-1/2 lg:-translate-x-1/2 w-full lg:max-w-sm px-0 lg:px-4 z-[70] lg:z-10"
                                        >
                                            <div className="bg-white lg:bg-white/90 lg:backdrop-blur-xl p-6 lg:p-8 rounded-t-[2.5rem] lg:rounded-[2.5rem] border-t lg:border border-black/[0.05] shadow-2xl">
                                                {/* Bottom Sheet Handle (Mobile) */}
                                                <div className="w-12 h-1 bg-black/[0.08] rounded-full mx-auto mb-6 lg:hidden" />

                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex-1">
                                                        <p className="text-[9px] lg:text-[10px] font-bold tracking-[0.3em] uppercase text-accent mb-2">{selected.region} MISSION</p>
                                                        <h4 className="text-xl lg:text-2xl font-bold text-church-dark font-display leading-tight">{selected.name}</h4>
                                                    </div>
                                                    <button onClick={() => setSelected(null)} className="p-2 bg-black/[0.04] rounded-full text-church-gray/40 ml-4 lg:ml-0">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                    </button>
                                                </div>

                                                {(selected.pastor || selected.serviceTime || selected.address) && (
                                                    <div className="grid grid-cols-1 gap-3 lg:gap-4 mb-8">
                                                        {selected.address && (
                                                            <div className="flex items-center gap-4 p-4 bg-black/[0.03] rounded-2xl">
                                                                <div className="text-lg lg:text-xl">📍</div>
                                                                <div>
                                                                    <p className="text-[9px] uppercase tracking-widest text-church-gray font-bold mb-0.5 opacity-50">Address</p>
                                                                    <p className="text-xs lg:text-[13px] font-bold text-church-dark">{selected.address}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selected.pastor && (
                                                            <div className="flex items-center gap-4 p-4 bg-black/[0.03] rounded-2xl">
                                                                <div className="text-lg lg:text-xl">👤</div>
                                                                <div>
                                                                    <p className="text-[9px] uppercase tracking-widest text-church-gray font-bold mb-0.5 opacity-50">Pastor</p>
                                                                    <p className="text-xs lg:text-[13px] font-bold text-church-dark">{selected.pastor}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selected.serviceTime && (
                                                            <div className="flex items-center gap-4 p-4 bg-black/[0.03] rounded-2xl">
                                                                <div className="text-lg lg:text-xl">🕐</div>
                                                                <div>
                                                                    <p className="text-[9px] uppercase tracking-widest text-church-gray font-bold mb-0.5 opacity-50">Sunday Service</p>
                                                                    <p className="text-xs lg:text-[13px] font-bold text-church-dark">{selected.serviceTime}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex gap-3">
                                                    <a
                                                        href={selected.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.name} ${selected.address || ''}`.trim())}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 h-12 lg:h-14 bg-church-dark text-white font-bold text-[10px] lg:text-xs tracking-widest uppercase flex items-center justify-center rounded-2xl hover:bg-black shadow-lg shadow-black/10 transition-all"
                                                    >
                                                        Open in Maps
                                                    </a>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${selected.name}: ${selected.address}`);
                                                            alert('Copied to clipboard!');
                                                        }}
                                                        className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-black/[0.05] text-church-dark rounded-2xl hover:bg-black/[0.08]"
                                                    >
                                                        <svg className="w-4 h-4 lg:w-4.5 lg:h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </AnimatePresence>
                    </main>

                    {/* Mobile View Toggle Switch (Glassmorphic Segmented Control) */}
                    <div
                        aria-hidden={footerNear}
                        className={`lg:hidden fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[80] w-auto transition-all duration-300 ${footerNear ? 'opacity-0 translate-y-24 pointer-events-none' : 'opacity-100 translate-y-0'}`}
                    >
                        <div className="flex p-1.5 bg-black/40 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 px-6 min-h-[44px] rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${viewMode === 'list' ? 'bg-white text-church-dark shadow-lg' : 'text-white/60 hover:text-white'}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`flex items-center gap-2 px-6 min-h-[44px] rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${viewMode === 'map' ? 'bg-white text-church-dark shadow-lg' : 'text-white/60 hover:text-white'}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                Map
                            </button>
                        </div>
                    </div>
                </div>
                )}
            </div>
            <div ref={footerSentinelRef} aria-hidden="true" className="lg:hidden h-px" />
            <Footer />
            <ChatbotWidget />
        </>
    );
}
