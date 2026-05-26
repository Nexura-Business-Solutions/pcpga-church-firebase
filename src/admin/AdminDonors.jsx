import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listDonors } from '../lib/firestore.js';
import AdminLayout from '../components/admin/AdminLayout.jsx';

function toDateLabel(value) {
    if (!value) return '—';
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Force Sync: Stewardship Reporting v1.0.1
export default function AdminDonors() {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('total'); // 'total' | 'name' | 'count'

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await listDonors();
                if (Array.isArray(data)) setDonors(data);
            } catch (error) {
                console.error('Failed to fetch donors:', error);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filteredDonors = useMemo(() => {
        const term = searchTerm.toLowerCase();
        const list = donors.filter((d) => {
            const name = (d.name || d.donor_name || d.donorName || '').toLowerCase();
            const email = (d.email || d.donor_email || d.donorEmail || '').toLowerCase();
            return name.includes(term) || email.includes(term);
        });

        const getTotal = (d) => Number(d.totalDonated || d.total_donated || d.total || 0);
        const getCount = (d) => Number(d.donationCount || d.donation_count || d.count || 0);
        const getName = (d) => (d.name || d.donor_name || d.donorName || '').toLowerCase();

        return [...list].sort((a, b) => {
            if (sortKey === 'name') return getName(a).localeCompare(getName(b));
            if (sortKey === 'count') return getCount(b) - getCount(a);
            return getTotal(b) - getTotal(a);
        });
    }, [donors, searchTerm, sortKey]);

    const aggregateTotal = donors.reduce(
        (sum, d) => sum + Number(d.totalDonated || d.total_donated || d.total || 0),
        0,
    );

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto selection:bg-teal/10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-16 px-2">
                    <div>
                        <h1 className="text-4xl font-bold text-[hsl(var(--admin-text))] tracking-tighter font-display mb-3">Donor Database</h1>
                        <p className="text-[hsl(var(--admin-text-dim))] text-[11px] font-bold tracking-[0.3em] uppercase">Historical Stewardship Records</p>
                    </div>
                    <div className="flex items-center gap-6 no-print">
                        <button
                            onClick={() => window.print()}
                            className="h-14 px-8 bg-[hsl(var(--admin-text))] text-[hsl(var(--admin-bg))] text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:shadow-2xl hover:shadow-black/20 transition-all flex items-center gap-3"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                            Print Report
                        </button>
                        <div className="bg-[hsl(var(--admin-surface))] border border-[hsl(var(--admin-border))] px-6 py-3 rounded-2xl">
                            <p className="text-[10px] text-[hsl(var(--admin-text-dim))] font-bold uppercase tracking-widest mb-1 opacity-40">Aggregate Total</p>
                            <p className="text-xl font-bold text-teal font-display">₱{aggregateTotal.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[hsl(var(--admin-surface))] rounded-[2.5rem] border border-[hsl(var(--admin-border))] shadow-2xl overflow-hidden relative">
                    <div className="p-5 sm:p-8 border-b border-[hsl(var(--admin-border))] flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[hsl(var(--admin-text-dim))]/30">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-14 pl-14 pr-6 bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-text))]/20 rounded-2xl text-xs font-bold outline-none focus:border-teal/40 transition-all font-display placeholder:text-[hsl(var(--admin-text-dim))]/20"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-2 py-2 bg-[hsl(var(--admin-text))]/5 rounded-xl border border-[hsl(var(--admin-border))]">
                                <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--admin-text-dim))]/40">Sort</span>
                                {[
                                    { id: 'total', label: 'Total' },
                                    { id: 'count', label: 'Count' },
                                    { id: 'name', label: 'Name' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSortKey(opt.id)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${sortKey === opt.id ? 'bg-teal text-white' : 'text-[hsl(var(--admin-text-dim))]/40 hover:text-[hsl(var(--admin-text))]'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-teal/5 rounded-xl border border-teal/10">
                                <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-teal">{donors.length} Donors</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile: stacked cards (a 5-column table is unreadable on phones) */}
                    <div className="md:hidden">
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="p-5 border-b border-[hsl(var(--admin-border))] animate-pulse"><div className="h-4 bg-[hsl(var(--admin-text))]/5 rounded-lg w-2/3" /></div>
                            ))
                        ) : filteredDonors.length > 0 ? (
                            filteredDonors.map((d) => {
                                const name = d.name || d.donor_name || d.donorName || 'Anonymous';
                                const email = d.email || d.donor_email || d.donorEmail;
                                const count = Number(d.donationCount || d.donation_count || d.count || 0);
                                const total = Number(d.totalDonated || d.total_donated || d.total || 0);
                                const lastAt = d.lastDonationAt || d.last_donation_at || d.lastGiftAt || d.updatedAt || d.createdAt;
                                return (
                                    <div key={d.id} className="p-5 border-b border-[hsl(var(--admin-border))]">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-[10px] ${name === 'Anonymous' ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20' : 'bg-teal/10 text-teal border border-teal/20'}`}>{name?.[0]?.toUpperCase() || '?'}</div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-[hsl(var(--admin-text))] tracking-tight truncate">{name}</p>
                                                <p className="text-[11px] text-[hsl(var(--admin-text-dim))] font-bold truncate">{email || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border bg-[hsl(var(--admin-text))]/5 border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-dim))]">{count} gifts</span>
                                            <span className="text-sm font-bold text-teal font-display">₱{total.toLocaleString()}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-[hsl(var(--admin-text-dim))] opacity-40 tracking-widest uppercase mt-2">Last gift · {toDateLabel(lastAt)}</p>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-24 text-center text-xs font-bold uppercase tracking-[0.4em] opacity-20">No donor records found</div>
                        )}
                    </div>

                    <div className="overflow-x-auto custom-scrollbar hidden md:block">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-text))]/2">
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40">Donor</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40">Email</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40">Donations</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40">Total Given</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40 text-right">Last Gift</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="border-b border-[hsl(var(--admin-border))] animate-pulse">
                                                <td colSpan={5} className="px-8 py-8"><div className="h-4 bg-[hsl(var(--admin-text))]/5 rounded-lg w-full" /></td>
                                            </tr>
                                        ))
                                    ) : filteredDonors.length > 0 ? (
                                        filteredDonors.map((d, i) => {
                                            const name = d.name || d.donor_name || d.donorName || 'Anonymous';
                                            const email = d.email || d.donor_email || d.donorEmail;
                                            const count = Number(d.donationCount || d.donation_count || d.count || 0);
                                            const total = Number(d.totalDonated || d.total_donated || d.total || 0);
                                            const lastAt = d.lastDonationAt || d.last_donation_at || d.lastGiftAt || d.updatedAt || d.createdAt;
                                            return (
                                                <motion.tr
                                                    key={d.id}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="border-b border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--admin-text))]/2 transition-colors duration-300 group"
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] ${name === 'Anonymous' ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20' : 'bg-teal/10 text-teal border border-teal/20'}`}>
                                                                {name?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <p className="text-sm font-bold text-[hsl(var(--admin-text))] tracking-tight">{name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-[11px] text-[hsl(var(--admin-text-dim))] font-bold tracking-widest">{email || '—'}</p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border bg-[hsl(var(--admin-text))]/5 border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-dim))]">
                                                            {count} gifts
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-sm font-bold text-teal font-display">₱{total.toLocaleString()}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <p className="text-[10px] font-bold text-[hsl(var(--admin-text-dim))] opacity-40 tracking-widest uppercase">
                                                            {toDateLabel(lastAt)}
                                                        </p>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-20">
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                    <p className="text-xs font-bold uppercase tracking-[0.4em]">No donor records found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
