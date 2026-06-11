import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Church,
    Mic2,
    Landmark,
    HandCoins,
    Sparkles,
    ExternalLink,
    GraduationCap,
} from 'lucide-react';
import { getChurches, getSermons, getSettings } from '../lib/store.js';
import { listDonors } from '../lib/firestore.js';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import GuidedTour from '../components/admin/GuidedTour.jsx';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ churches: 0, sermons: 0, presbyteries: 0, donors: 0 });
    const [loading, setLoading] = useState(true);
    const [isTourActive, setIsTourActive] = useState(false);

    const tourSteps = [
        { selector: '#tour-stats', title: 'At a glance', message: 'A quick count of the churches, presbyteries, sermons, and donors on your site.' },
        { selector: '#tour-master', title: 'Website Content', message: 'Edit everything on the public site — the homepage, the church directory, giving, events and more.' },
        { selector: '#tour-media', title: 'Sermons', message: 'Add and organize sermon recordings for the online library.' },
        { selector: '#tour-tasks', title: 'Quick actions', message: 'Shortcuts to the things you update most often.' },
    ];

    useEffect(() => {
        const fetchStats = async () => {
            const [churches, sermons, presbyteries, donors] = await Promise.all([
                getChurches(),
                getSermons(),
                getSettings('presbyteries').catch(() => []),
                listDonors().catch(() => []),
            ]);
            setStats({
                churches: churches.length,
                sermons: sermons.length,
                presbyteries: Array.isArray(presbyteries) ? presbyteries.length : 0,
                donors: Array.isArray(donors) ? donors.length : 0,
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    const cards = [
        { id: 'tour-master', label: 'Churches', value: stats.churches, icon: Church, accent: 'hsl(var(--accent))', link: '/admin/content', desc: 'In the church directory' },
        { id: 'tour-presbyteries', label: 'Presbyteries', value: stats.presbyteries, icon: Landmark, accent: 'hsl(var(--coral))', link: '/admin/content', desc: 'Across the Philippines' },
        { id: 'tour-media', label: 'Sermons', value: stats.sermons, icon: Mic2, accent: 'hsl(var(--violet))', link: '/admin/sermons', desc: 'In the sermon archive' },
        { id: 'tour-donors', label: 'Donors', value: stats.donors, icon: HandCoins, accent: 'hsl(var(--teal))', link: '/admin/donations/donors', desc: 'In the donor database' },
    ];

    return (
        <AdminLayout>
            <div className="max-w-[1200px] mx-auto">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2">
                    <div>
                        <h1 className="text-5xl font-bold text-[hsl(var(--admin-text))] tracking-tight font-display mb-3">Dashboard</h1>
                        <p className="text-[hsl(var(--admin-text-dim))] text-sm">Manage your church website from here.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsTourActive(true)}
                            className="px-6 py-3 bg-[hsl(var(--admin-surface))] border border-[hsl(var(--admin-border))] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent/5 transition-all shadow-sm flex items-center gap-2"
                        >
                            <Sparkles className="w-3 h-3" /> Take a tour
                        </button>
                        <a
                            href="/"
                            target="_blank"
                            rel="noreferrer"
                            className="px-6 py-3 bg-[hsl(var(--admin-surface))] border border-[hsl(var(--admin-border))] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--admin-text-dim))] hover:text-accent transition-all shadow-sm flex items-center gap-2"
                        >
                            <ExternalLink className="w-3 h-3" /> View live site
                        </a>
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

                {/* Quick actions */}
                <div className="mt-20">
                    <div id="tour-tasks" className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-8 h-[1px] bg-[hsl(var(--admin-border))]" />
                        <h2 className="text-lg font-bold text-[hsl(var(--admin-text))] tracking-tight font-display">Quick actions</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <Link to="/admin/content" className="p-8 bg-[hsl(var(--admin-surface))] rounded-[2rem] border border-[hsl(var(--admin-border))] hover:border-accent/20 hover:shadow-md transition-all group shadow-sm">
                            <div className="text-accent text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                                <Church className="w-3.5 h-3.5" /> Church directory
                            </div>
                            <p className="text-[hsl(var(--admin-text-dim))] text-[12px] leading-relaxed">Add or edit churches in Website Content → Regional.</p>
                        </Link>
                        <Link to="/admin/sermons" className="p-8 bg-[hsl(var(--admin-surface))] rounded-[2rem] border border-[hsl(var(--admin-border))] hover:border-violet/20 hover:shadow-md transition-all group shadow-sm">
                            <div className="text-violet text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                                <Mic2 className="w-3.5 h-3.5" /> Add a sermon
                            </div>
                            <p className="text-[hsl(var(--admin-text-dim))] text-[12px] leading-relaxed">Upload a new sermon recording to the archive.</p>
                        </Link>
                        <Link to="/admin/seminaries" className="p-8 bg-[hsl(var(--admin-surface))] rounded-[2rem] border border-[hsl(var(--admin-border))] hover:border-accent/20 hover:shadow-md transition-all group shadow-sm">
                            <div className="text-accent text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                                <GraduationCap className="w-3.5 h-3.5" /> Seminaries
                            </div>
                            <p className="text-[hsl(var(--admin-text-dim))] text-[12px] leading-relaxed">Manage the theological schools listing.</p>
                        </Link>
                        <Link to="/admin/donations/donors" className="p-8 bg-[hsl(var(--admin-surface))] rounded-[2rem] border border-[hsl(var(--admin-border))] hover:border-teal/20 hover:shadow-md transition-all group shadow-sm">
                            <div className="text-teal text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                                <HandCoins className="w-3.5 h-3.5" /> Donors
                            </div>
                            <p className="text-[hsl(var(--admin-text-dim))] text-[12px] leading-relaxed">View the donor database and giving records.</p>
                        </Link>
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
