import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FileText,
    Church,
    Mic2,
    Diamond,
    Sparkles,
    ExternalLink,
    GraduationCap,
} from 'lucide-react';
import { getChurches, getSermons } from '../lib/store.js';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import GuidedTour from '../components/admin/GuidedTour.jsx';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ churches: 0, sermons: 0 });
    const [loading, setLoading] = useState(true);
    const [isTourActive, setIsTourActive] = useState(false);

    const tourSteps = [
        { selector: '#tour-stats', title: 'System Stats', message: 'This identifies the current growth of your network and media archive.' },
        { selector: '#tour-master', title: 'Unified Narrative Manager', message: 'Click here to manage everything from church vision to the Standing Committees.' },
        { selector: '#tour-registry', title: 'Church Network', message: 'Manage your branch locations, pastors, and map locations here.' },
        { selector: '#tour-media', title: 'Media Archive', message: 'Upload and organize your sermon recordings for the online library.' },
        { selector: '#tour-tasks', title: 'Operational Tasks', message: 'Quick access links to perform common updates across the system.' },
    ];

    useEffect(() => {
        const fetchStats = async () => {
            const [churches, sermons] = await Promise.all([
                getChurches(),
                getSermons(),
            ]);
            setStats({
                churches: churches.length,
                sermons: sermons.length,
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    const cards = [
        { id: 'tour-master', label: 'Site Content', value: 'Master', icon: FileText, accent: 'hsl(var(--coral))', link: '/admin/content', desc: 'Unified Narrative Manager' },
        { id: 'tour-registry', label: 'Church Network', value: stats.churches, icon: Church, accent: 'hsl(var(--accent))', link: '/admin/churches', desc: 'Congregation Registry' },
        { id: 'tour-media', label: 'Media Archive', value: stats.sermons, icon: Mic2, accent: 'hsl(var(--violet))', link: '/admin/sermons', desc: 'Sermon Catalog' },
        { id: 'tour-donors', label: 'Donor Records', value: 'Database', icon: Diamond, accent: 'hsl(var(--teal))', link: '/admin/donations/donors', desc: 'Historical Stewardship' },
    ];

    return (
        <AdminLayout>
            <div className="max-w-[1200px] mx-auto">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2">
                    <div>
                        <h1 className="text-5xl font-bold text-[hsl(var(--admin-text))] tracking-tighter font-display mb-3">Console</h1>
                        <p className="text-[hsl(var(--admin-text-dim))] text-[11px] font-bold tracking-[0.3em] uppercase">Control Center & System Analytics</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsTourActive(true)}
                            className="px-6 py-3 bg-[hsl(var(--admin-surface))] border border-[hsl(var(--admin-border))] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent/5 transition-all shadow-sm flex items-center gap-2"
                        >
                            <Sparkles className="w-3 h-3" /> Guided Tour
                        </button>
                        <div className="flex items-center gap-6 px-6 py-3 bg-[hsl(var(--admin-surface))] rounded-2xl border border-[hsl(var(--admin-border))] shadow-2xl transition-colors duration-500">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-widest mb-1">Server Heartbeat</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-teal animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                                    <span className="text-[hsl(var(--admin-text))] text-[11px] font-bold uppercase opacity-60">System Healthy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metric Grid */}
                <div id="tour-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="h-56 bg-[hsl(var(--admin-surface))] rounded-[2.5rem] border border-[hsl(var(--admin-border))] shimmer opacity-20" />
                        ))
                    ) : (
                        cards.map((card, i) => (
                            <motion.div
                                key={card.label}
                                id={card.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                            >
                                <Link
                                    to={card.link}
                                    className="group block relative h-full bg-[hsl(var(--admin-surface))] rounded-[2.5rem] p-8 border border-[hsl(var(--admin-border))] hover:border-accent/20 hover:shadow-xl transition-all duration-500 overflow-hidden"
                                >
                                    {/* Background Glow */}
                                    <div
                                        className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                                        style={{ background: card.accent }}
                                    />

                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 text-2xl shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3"
                                        style={{ background: `${card.accent}15`, border: `1px solid ${card.accent}30`, color: card.accent }}
                                    >
                                        <card.icon className="w-7 h-7" />
                                    </div>

                                    <h3 className="text-[hsl(var(--admin-text-dim))] text-[10px] font-bold tracking-[0.25em] uppercase mb-1.5">{card.label}</h3>
                                    <p className="text-[hsl(var(--admin-text))] text-4xl font-bold tracking-tighter font-display mb-6">{card.value}</p>

                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-accent/20 group-hover:bg-accent/40 transition-colors" />
                                        <p className="text-[hsl(var(--admin-text-dim))] text-[10px] font-bold group-hover:text-accent transition-colors uppercase tracking-[0.15em]">{card.desc}</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Secondary Sections */}
                <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2">
                        <div id="tour-tasks" className="flex items-center gap-3 mb-8 px-2">
                            <div className="w-8 h-[1px] bg-[hsl(var(--admin-border))]" />
                            <h2 className="text-lg font-bold text-[hsl(var(--admin-text))] tracking-tight font-display">Operational Tasks</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <Link to="/admin/churches" className="p-8 bg-[hsl(var(--admin-surface))] rounded-[2rem] border border-[hsl(var(--admin-border))] hover:border-accent/10 transition-all group shadow-sm hover:shadow-md">
                                <div className="text-accent text-xs font-bold tracking-widest uppercase mb-3 opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Registry
                                </div>
                                <p className="text-[hsl(var(--admin-text-dim))] text-[11px] leading-relaxed">Update branch network database</p>
                            </Link>
                            <Link to="/admin/sermons" className="p-8 bg-[hsl(var(--admin-surface))] rounded-[2rem] border border-[hsl(var(--admin-border))] hover:border-violet/10 transition-all group shadow-sm hover:shadow-md">
                                <div className="text-violet text-xs font-bold tracking-widest uppercase mb-3 opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Media
                                </div>
                                <p className="text-[hsl(var(--admin-text-dim))] text-[11px] leading-relaxed">Archive new spiritual messages</p>
                            </Link>
                            <Link to="/admin/seminaries" className="p-8 bg-[hsl(var(--admin-surface))] rounded-[2rem] border border-[hsl(var(--admin-border))] hover:border-accent/10 transition-all group shadow-sm hover:shadow-md">
                                <div className="text-accent text-xs font-bold tracking-widest uppercase mb-3 opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                    <GraduationCap className="w-3 h-3" /> Seminaries
                                </div>
                                <p className="text-[hsl(var(--admin-text-dim))] text-[11px] leading-relaxed">Theological schools</p>
                            </Link>
                            <a href="/" target="_blank" rel="noreferrer" className="p-8 bg-[hsl(var(--admin-surface))] rounded-[2rem] border border-[hsl(var(--admin-border))] hover:border-coral/10 transition-all group shadow-sm hover:shadow-md">
                                <div className="text-coral text-xs font-bold tracking-widest uppercase mb-3 opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                    <ExternalLink className="w-3 h-3" /> Live View
                                </div>
                                <p className="text-[hsl(var(--admin-text-dim))] text-[11px] leading-relaxed">Inspect frontend deployment</p>
                            </a>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="w-8 h-[1px] bg-[hsl(var(--admin-border))]" />
                            <h2 className="text-lg font-bold text-[hsl(var(--admin-text))] tracking-tight font-display">Telemetry</h2>
                        </div>

                        <div className="bg-[hsl(var(--admin-surface))] rounded-[2rem] p-10 border border-[hsl(var(--admin-border))] border-dashed relative overflow-hidden group shadow-sm">
                            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative space-y-8">
                                <div className="flex gap-5">
                                    <div className="w-1.5 h-10 bg-accent/30 rounded-full" />
                                    <div>
                                        <p className="text-[hsl(var(--admin-text))] text-[13px] font-bold">Encrypted Link</p>
                                        <p className="text-[hsl(var(--admin-text-dim))] text-[10px] uppercase font-bold mt-1.5 tracking-widest leading-none">Connection Secure</p>
                                    </div>
                                </div>
                                <div className="flex gap-5 opacity-40">
                                    <div className="w-1.5 h-10 bg-accent/10 rounded-full" />
                                    <div>
                                        <p className="text-[hsl(var(--admin-text))] text-[13px] font-bold">Load Balancer</p>
                                        <p className="text-[hsl(var(--admin-text-dim))] text-[10px] uppercase font-bold mt-1.5 tracking-widest leading-none">Traffic Stable</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <GuidedTour
                    isActive={isTourActive}
                    steps={tourSteps}
                    onComplete={() => setIsTourActive(false)}
                />
            </div>
        </AdminLayout>
    );
}
