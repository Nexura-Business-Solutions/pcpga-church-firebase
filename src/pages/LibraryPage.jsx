import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    FileText,
    FileSpreadsheet,
    Image,
    Link as LinkIcon,
    ArrowLeft,
    Download,
    FolderOpen
} from 'lucide-react';
import { getLibraryResources } from '../lib/store.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import ChatbotWidget from '../components/ChatbotWidget.jsx';

export default function LibraryPage() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchResources = async () => {
            const data = await getLibraryResources();
            setResources(data);
            setLoading(false);
        };
        fetchResources();
    }, []);

    if (!mounted) return <div className="min-h-screen bg-[#fcfcff]" />;

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
            <div className="min-h-screen bg-[#fcfcff]">
                {/* Header / Sub-Navbar */}
                <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
                    <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight font-display text-accent">
                            <span className="text-xl">✦</span>
                            <span className="text-[15px] text-church-dark">Digital Library</span>
                        </Link>
                        <Link
                            to="/"
                            className="text-[10px] font-bold tracking-[0.2em] uppercase text-church-gray hover:text-accent transition-colors flex items-center gap-2 bg-black/[0.03] px-4 py-2 rounded-xl"
                        >
                            <ArrowLeft className="w-3 h-3" /> Return Home
                        </Link>
                    </div>
                </nav>

                {/* Hero Section */}
                <header className="pt-40 pb-20 px-6">
                    <div className="max-w-[1200px] mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-block px-4 py-1.5 rounded-full text-[10px] tracking-[0.3em] uppercase font-bold mb-6 bg-accent/5 text-accent border border-accent/10">
                                Knowledge Base
                            </span>
                            <h1 className="text-5xl md:text-6xl font-bold text-church-dark font-display tracking-tight mb-6">
                                Church <span className="text-accent">Library</span>.
                            </h1>
                            <p className="text-church-gray text-lg max-w-2xl mx-auto leading-relaxed opacity-70">
                                Access and download official documents, weekly bulletins, newsletters, and discipleship materials.
                            </p>
                        </motion.div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-[1200px] mx-auto px-6 pb-32">
                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-6 mb-16 px-4 py-6 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-black/[0.03] shadow-sm">
                        {/* Search */}
                        <div className="flex-1 relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-church-gray/30 group-focus-within:text-accent transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Find a document or resource..."
                                className="w-full h-14 bg-black/[0.02] border border-black/[0.02] rounded-2xl pl-12 pr-6 py-4 text-sm text-church-dark placeholder:text-church-gray/30 focus:ring-4 focus:ring-accent/5 focus:border-accent/10 transition-all outline-none"
                            />
                        </div>

                        {/* Filter */}
                        <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar py-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap border ${categoryFilter === cat
                                        ? 'bg-church-dark text-white border-church-dark shadow-xl shadow-black/10'
                                        : 'bg-white text-church-gray border-black/[0.05] hover:border-accent/20 hover:bg-accent/5'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-64 bg-black/[0.02] rounded-[2.5rem] animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((item, i) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group bg-white rounded-[2.5rem] p-8 border border-black/[0.03] hover:border-accent/20 hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500 relative flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between mb-8">
                                                <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center p-3.5 shadow-inner border border-accent/5 group-hover:bg-accent group-hover:text-white group-hover:scale-110 transition-all duration-500">
                                                    {getIcon(item.fileType)}
                                                </div>
                                                <span className="px-3 py-1 bg-black/[0.03] rounded-lg text-[9px] font-bold tracking-widest uppercase text-church-gray/60">
                                                    {item.category}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-church-dark mb-3 font-display leading-tight group-hover:text-accent transition-colors">{item.title}</h3>
                                            <p className="text-church-gray text-xs leading-relaxed opacity-60 mb-8 line-clamp-3">
                                                {item.description || 'No description available for this resource.'}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-black/[0.02]">
                                            <span className="text-[10px] font-bold text-church-gray/40 tracking-[0.2em] uppercase">{item.fileType} Asset</span>
                                            <a
                                                href={item.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-widest hover:translate-x-1 transition-transform"
                                            >
                                                Download Now
                                                <Download className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filtered.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-40 bg-white rounded-[3rem] border border-dashed border-black/[0.08]"
                        >
                            <FolderOpen className="w-16 h-16 mx-auto mb-6 text-church-gray/20" />
                            <h3 className="text-2xl font-bold text-church-dark font-display mb-2">No Matching Resources</h3>
                            <p className="text-church-gray opacity-60 max-w-sm mx-auto mb-10">Try adjusting your search or category filters to find what you&apos;re looking for.</p>
                            <button onClick={() => { setSearch(''); setCategoryFilter('All'); }} className="text-accent font-bold text-xs tracking-widest uppercase border-b-2 border-accent/20 hover:border-accent transition-all pb-1">Reset Filters</button>
                        </motion.div>
                    )}
                </main>

                {/* Bottom Section */}
                <section className="bg-church-dark py-24 px-6 overflow-hidden relative">
                    <div className="max-w-[1200px] mx-auto text-center relative z-10">
                        <h2 className="text-4xl font-bold text-white font-display tracking-tight mb-8">Can&apos;t find what you need?</h2>
                        <p className="text-white/40 mb-12 max-w-lg mx-auto leading-relaxed">
                            If you are looking for a specific document that isn&apos;t listed here, please contact the General Assembly office.
                        </p>
                        <a href="mailto:info@pcphilippines.org" className="inline-flex h-14 px-10 items-center justify-center bg-accent text-white font-bold text-[11px] tracking-[0.2em] uppercase rounded-2xl shadow-2xl shadow-accent/20 hover:bg-accent/90 transition-all">
                            Contact Secretariat
                        </a>
                    </div>
                    {/* Background Decor */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
                        <div className="absolute top-0 right-[10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
                        <div className="absolute bottom-0 left-[10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
                    </div>
                </section>
            </div>
            <Footer />
            <ChatbotWidget />
        </>
    );
}
