import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    FileText,
    Users,
    Mic2,
    Library,
    GraduationCap,
    HandCoins,
    Globe,
    LogOut,
    ShieldCheck,
} from 'lucide-react';
import { logout, useAuth } from '../../lib/auth.js';
import { initStore } from '../../lib/store.js';

const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Website Content', href: '/admin/content', icon: FileText },
    { label: 'Sermons', href: '/admin/sermons', icon: Mic2 },
    { label: 'Library', href: '/admin/library', icon: Library },
    { label: 'Seminaries', href: '/admin/seminaries', icon: GraduationCap },
    { label: 'Donations', href: '/admin/donations', icon: HandCoins },
    { label: 'Donors', href: '/admin/donations/donors', icon: Users },
];

export default function AdminLayout({ children }) {
    const { user, isAdmin, isOwner, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        initStore();
    }, []);

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            navigate('/login');
        }
    }, [loading, user, isAdmin, navigate]);

    async function handleLogout() {
        try {
            await logout();
        } finally {
            navigate('/login');
        }
    }

    if (loading) {
        // Warm ivory (the admin light bg) — not black — so the first auth check
        // doesn't flash a dark screen.
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(42 76% 95%)' }}>
                <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!user || !isAdmin) return null;

    return (
        <div data-theme="light" className="min-h-screen bg-[hsl(var(--admin-bg))] text-[hsl(var(--admin-text))] flex selection:bg-accent/10">
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-[hsl(var(--admin-sidebar))] border-r border-[hsl(var(--admin-border))] flex flex-col z-50 transition-all duration-500 ease-[0.23,1,0.32,1] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 shadow-2xl lg:shadow-none'}`}>
                {/* Logo Section */}
                <div className="px-8 py-8">
                    <div className="flex items-center gap-3 mb-1">
                        <img src="/logo.png" alt="Logo" className="h-8 w-auto brightness-0 invert opacity-80" />
                        <h1 className="text-lg font-bold text-[hsl(var(--admin-sidebar-text))] tracking-tight font-display">PCP Admin</h1>
                    </div>
                    <p className="text-[hsl(var(--admin-sidebar-text))]/25 text-[10px] tracking-[0.2em] font-bold uppercase pl-11 font-display">Website Manager</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {(isOwner ? [...navItems, { label: 'Admins', href: '/admin/admins', icon: ShieldCheck }] : navItems).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`group flex items-center gap-3.5 px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-300 ${isActive
                                    ? 'bg-accent text-white shadow-xl shadow-accent/20 border border-white/10'
                                    : 'text-[hsl(var(--admin-sidebar-text))]/30 hover:text-[hsl(var(--admin-sidebar-text))]/60 hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`} />
                                <span className="tracking-wide uppercase font-display">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Section */}
                <div className="p-4 mt-auto">
                    <div className="bg-white/[0.03] rounded-3xl p-2 border border-white/5 space-y-1">
                        <Link
                            to="/"
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-bold tracking-widest uppercase text-[hsl(var(--admin-sidebar-text))]/30 hover:text-[hsl(var(--admin-sidebar-text))] hover:bg-white/5 transition-all"
                        >
                            <Globe className="w-4 h-4" /> Live Website
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-bold tracking-widest uppercase text-coral/40 hover:text-coral hover:bg-coral/5 transition-all"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-h-screen flex flex-col">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-[hsl(var(--admin-bg))]/80 backdrop-blur-xl border-b border-[hsl(var(--admin-border))] px-4 sm:px-8 h-20 flex items-center justify-between transition-colors duration-500">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden w-10 h-10 flex items-center justify-center bg-[hsl(var(--admin-text))]/5 rounded-xl text-[hsl(var(--admin-text))]/40 hover:text-[hsl(var(--admin-text))]"
                            aria-label="Open menu"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        </button>
                        <span className="lg:hidden text-sm font-bold text-[hsl(var(--admin-text))]/70 font-display">PCP Admin</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-4">
                        {user?.email && (
                            <div className="px-4 py-2 bg-[hsl(var(--admin-text))]/5 rounded-xl border border-[hsl(var(--admin-border))]">
                                <span className="text-[11px] font-bold text-[hsl(var(--admin-text))]/50 normal-case">Signed in as {user.email}</span>
                            </div>
                        )}
                    </div>

                    {/* Shimmer line at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                </header>

                {/* Render the routed page directly — the previous per-route
                    fade-out/fade-in (AnimatePresence mode="wait") flashed/"blinked"
                    on every navigation. */}
                <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
