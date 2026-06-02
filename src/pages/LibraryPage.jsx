import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
    FileText,
    FileSpreadsheet,
    Image,
    Link as LinkIcon,
    Download,
} from 'lucide-react';
import { getLibraryResources } from '../lib/store.js';
import { safeExternalHref } from '../lib/url.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import ChatbotWidget from '../components/ChatbotWidget.jsx';

export default function LibraryPage() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    useEffect(() => {
        (async () => {
            const data = await getLibraryResources();
            setResources(data);
            setLoading(false);
        })();
    }, []);

    const categories = ['All', ...new Set(resources.map(r => r.category))];

    const filtered = resources.filter(r => {
        const matchesSearch = !search ||
            r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.description?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const getIcon = (type) => {
        switch (type?.toUpperCase()) {
            case 'PDF': return <FileText className="w-full h-full" />;
            case 'DOCX':
            case 'DOC': return <FileText className="w-full h-full" />;
            case 'XLSX':
            case 'XLS': return <FileSpreadsheet className="w-full h-full" />;
            case 'IMAGE': return <Image className="w-full h-full" />;
            default: return <LinkIcon className="w-full h-full" />;
        }
    };

    return (
        <>
            <Helmet>
                <title>Library | PCP</title>
                <meta name="description" content="Books, articles, and videos for the church community." />
            </Helmet>
            <Navbar />
            <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
                <header className="pt-32 pb-16 px-6">
                    <div className="max-w-[1200px] mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span
                                className="inline-block px-4 py-1.5 rounded-full text-[10px] tracking-[0.3em] uppercase font-bold mb-6"
                                style={{ background: 'var(--brass-soft)', color: 'var(--brass)', border: '1px solid rgba(184, 146, 63, 0.2)' }}
                            >
                                Knowledge Base
                            </span>
                            <h1
                                className="font-display tracking-tight mb-6"
                                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--ink)', lineHeight: 1.05 }}
                            >
                                Church <em style={{ color: 'var(--brass)' }}>Library.</em>
                            </h1>
                            <p
                                className="text-lg max-w-2xl mx-auto leading-relaxed"
                                style={{ color: 'var(--ink-soft)' }}
                            >
                                Access and download official documents, weekly bulletins, newsletters, and discipleship materials.
                            </p>
                        </motion.div>
                    </div>
                </header>

                <main className="max-w-[1200px] mx-auto px-6 pb-32">
                    {/* Search and Filters */}
                    <div
                        className="flex flex-col md:flex-row gap-6 mb-16 px-6 py-6 rounded-2xl"
                        style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}
                    >
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none" style={{ color: 'var(--ink-mute)' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Find a document or resource..."
                                className="w-full h-14 rounded-xl pl-12 pr-6 py-4 text-sm outline-none transition-all"
                                style={{ background: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)' }}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 py-1">
                            {categories.map((cat) => {
                                const active = categoryFilter === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className="px-5 min-h-[44px] rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap"
                                        style={
                                            active
                                                ? { background: 'var(--oxblood)', color: 'var(--paper)', border: '1px solid var(--oxblood)' }
                                                : { background: 'var(--paper)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }
                                        }
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: 'var(--paper-2)' }} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((item, i) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="rounded-2xl p-7 transition-all duration-300 flex flex-col justify-between"
                                        style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between mb-6">
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center p-3"
                                                    style={{ background: 'var(--brass-soft)', color: 'var(--brass)', border: '1px solid rgba(184, 146, 63, 0.2)' }}
                                                >
                                                    {getIcon(item.fileType)}
                                                </div>
                                                <span
                                                    className="px-3 py-1 rounded-md text-[9px] font-bold tracking-widest uppercase"
                                                    style={{ background: 'var(--paper-2)', color: 'var(--ink-soft)' }}
                                                >
                                                    {item.category}
                                                </span>
                                            </div>
                                            <h3
                                                className="text-xl font-bold mb-3 font-display leading-tight"
                                                style={{ color: 'var(--ink)' }}
                                            >
                                                {item.title}
                                            </h3>
                                            <p className="text-sm leading-relaxed mb-6 line-clamp-3" style={{ color: 'var(--ink-soft)' }}>
                                                {item.description || 'No description available for this resource.'}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-5" style={{ borderTop: '1px solid var(--line-soft)' }}>
                                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--ink-mute)' }}>
                                                {item.fileType} Asset
                                            </span>
                                            <a
                                                href={safeExternalHref(item.fileUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-transform hover:translate-x-1"
                                                style={{ color: 'var(--oxblood)' }}
                                            >
                                                Download
                                                <Download className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {!loading && filtered.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state__ornament">✚</div>
                            <h3 className="empty-state__title">No matching resources</h3>
                            <p className="empty-state__copy">
                                Try adjusting your search or category filter. Bulletins, newsletters, and discipleship materials will appear here as the office uploads them.
                            </p>
                            <button
                                onClick={() => { setSearch(''); setCategoryFilter('All'); }}
                                className="btn btn--link mt-6"
                            >
                                Reset filters
                            </button>
                        </div>
                    )}
                </main>

                {/* Bottom contact section */}
                <section className="py-20 px-6" style={{ background: 'var(--dark-bg)' }}>
                    <div className="max-w-[1200px] mx-auto text-center">
                        <h2 className="font-display tracking-tight mb-6" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--paper)' }}>
                            Can&apos;t find what you need?
                        </h2>
                        <p className="mb-10 max-w-lg mx-auto leading-relaxed" style={{ color: 'rgba(251, 244, 220, 0.7)' }}>
                            If you are looking for a specific document that isn&apos;t listed here, please contact the General Assembly office.
                        </p>
                        <a
                            href="mailto:info@pcphilippines.org"
                            className="btn btn--on-dark btn--primary"
                        >
                            Contact Secretariat
                        </a>
                    </div>
                </section>
            </div>
            <Footer />
            <ChatbotWidget />
        </>
    );
}
