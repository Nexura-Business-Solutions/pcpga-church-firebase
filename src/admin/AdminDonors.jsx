import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listDonors, listDonations } from '../lib/firestore.js';
import { generateDonorReportPdf } from '../lib/donorReportPdf.js';
import AdminLayout from '../components/admin/AdminLayout.jsx';

// Normalize any timestamp shape (Firestore Timestamp, ISO string, millis) → JS Date | null
function toJsDate(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function toDateLabel(value) {
    const d = toJsDate(value);
    if (!d) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Local YYYY-MM-DD (avoids the UTC day-shift that toISOString causes at PH+8)
function localDateStr(dt) {
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

// A donation counts as "given" unless it was explicitly never paid.
const UNPAID = new Set(['pending', 'failed', 'cancelled', 'canceled', 'expired', 'voided', 'refunded', 'unpaid']);
const isReceived = (d) => !UNPAID.has(String(d.status || '').toLowerCase());

const PRESETS = [
    { id: 'all', label: 'All time' },
    { id: 'month', label: 'This month' },
    { id: '30d', label: 'Last 30d' },
    { id: 'year', label: 'This year' },
];

// Force Sync: Stewardship Reporting v1.1.0
export default function AdminDonors() {
    const [donors, setDonors] = useState([]);
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('total'); // 'total' | 'name' | 'count'
    const [preset, setPreset] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const [donorRows, donationRows] = await Promise.all([listDonors(), listDonations()]);
                if (!active) return;
                if (Array.isArray(donorRows)) setDonors(donorRows);
                if (Array.isArray(donationRows)) setDonations(donationRows);
            } catch (error) {
                console.error('Failed to fetch donor data:', error);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    const rangeActive = Boolean(startDate || endDate);

    function applyPreset(p) {
        const today = new Date();
        if (p === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (p === 'month') {
            setStartDate(localDateStr(new Date(today.getFullYear(), today.getMonth(), 1)));
            setEndDate(localDateStr(today));
        } else if (p === '30d') {
            const s = new Date(today);
            s.setDate(s.getDate() - 29);
            setStartDate(localDateStr(s));
            setEndDate(localDateStr(today));
        } else if (p === 'year') {
            setStartDate(localDateStr(new Date(today.getFullYear(), 0, 1)));
            setEndDate(localDateStr(today));
        }
        setPreset(p);
    }

    // Normalized rows. Lifetime aggregates when no range; re-computed from donations within range.
    const baseRows = useMemo(() => {
        if (!rangeActive) {
            return donors.map((d) => ({
                key: d.id || (d.email || d.donor_email || d.donorName || Math.random()),
                name: d.name || d.donor_name || d.donorName || 'Anonymous',
                email: d.email || d.donor_email || d.donorEmail || '',
                count: Number(d.donationCount || d.donation_count || d.count || 0),
                total: Number(d.totalDonated || d.total_donated || d.total || 0),
                lastAt: d.lastDonationAt || d.last_donation_at || d.lastGiftAt || d.updatedAt || d.createdAt || null,
            }));
        }

        const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;
        const byDonor = new Map();

        for (const dn of donations) {
            if (!isReceived(dn)) continue;
            const when = toJsDate(dn.created_at ?? dn.createdAt ?? dn.date ?? dn.donatedAt);
            if (!when) continue;
            if (start && when < start) continue;
            if (end && when > end) continue;

            const email = (dn.donor_email || dn.donorEmail || '').toLowerCase();
            const name = dn.donor_name || dn.donorName || dn.name || 'Anonymous';
            const key = email || name.toLowerCase();
            const row = byDonor.get(key) || { key, name, email, count: 0, total: 0, lastAt: null };
            row.count += 1;
            row.total += Number(dn.amount || 0);
            if (!row.email && email) row.email = email;
            if (!row.lastAt || when > toJsDate(row.lastAt)) row.lastAt = when;
            byDonor.set(key, row);
        }

        return [...byDonor.values()];
    }, [donors, donations, rangeActive, startDate, endDate]);

    const filteredDonors = useMemo(() => {
        const term = searchTerm.toLowerCase();
        const list = baseRows.filter(
            (d) => d.name.toLowerCase().includes(term) || (d.email || '').toLowerCase().includes(term),
        );
        return [...list].sort((a, b) => {
            if (sortKey === 'name') return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            if (sortKey === 'count') return b.count - a.count;
            return b.total - a.total;
        });
    }, [baseRows, searchTerm, sortKey]);

    const displayedTotal = filteredDonors.reduce((sum, d) => sum + d.total, 0);
    const displayedGifts = filteredDonors.reduce((sum, d) => sum + d.count, 0);
    const rangeLabel = rangeActive
        ? `${startDate ? toDateLabel(startDate) : '—'} → ${endDate ? toDateLabel(endDate) : 'now'}`
        : 'All time';
    const generatedLabel = new Date().toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });

    function downloadReport() {
        generateDonorReportPdf({
            donors: filteredDonors.map((d) => ({
                name: d.name,
                email: d.email,
                count: d.count,
                total: d.total,
                lastGiftLabel: toDateLabel(d.lastAt),
            })),
            rangeLabel,
            generatedLabel,
        });
    }

    const inputCls =
        'h-12 px-4 bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-xl text-[11px] font-bold text-[hsl(var(--admin-text))] outline-none focus:border-teal/40 transition-all';

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto selection:bg-teal/10">
                {/* Print-only stewardship report (screen UI is hidden via .screen-only in print) */}
                <div className="print-only print-report">
                    <div className="pr-letterhead">
                        <p className="pr-title">Presbyterian Church of the Philippines</p>
                        <p className="pr-sub">Donor Giving Report</p>
                    </div>
                    <div className="pr-meta">
                        <span>Period: <b>{rangeLabel}</b></span>
                        <span>Donors: <b>{filteredDonors.length}</b></span>
                        <span>Gifts: <b>{displayedGifts}</b></span>
                        <span>Total: <b>₱{displayedTotal.toLocaleString()}</b></span>
                        <span>Generated: <b>{generatedLabel}</b></span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Donor</th>
                                <th>Email</th>
                                <th className="num">Gifts</th>
                                <th className="num">{rangeActive ? 'Given in Range' : 'Total Given'}</th>
                                <th className="num">Last Gift</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDonors.map((d, i) => (
                                <tr key={d.key}>
                                    <td>{i + 1}</td>
                                    <td>{d.name}</td>
                                    <td>{d.email || '—'}</td>
                                    <td className="num">{d.count}</td>
                                    <td className="num">₱{d.total.toLocaleString()}</td>
                                    <td className="num">{toDateLabel(d.lastAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3}>TOTAL</td>
                                <td className="num">{displayedGifts}</td>
                                <td className="num">₱{displayedTotal.toLocaleString()}</td>
                                <td className="num" />
                            </tr>
                        </tfoot>
                    </table>
                    <p className="pr-footer">Presbyterian Church of the Philippines · Stewardship Records · Confidential</p>
                </div>

                <div className="screen-only flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-16 px-2">
                    <div>
                        <h1 className="text-4xl font-bold text-[hsl(var(--admin-text))] tracking-tighter font-display mb-3">Donor Database</h1>
                        <p className="text-[hsl(var(--admin-text-dim))] text-[11px] font-bold tracking-[0.3em] uppercase">Historical Stewardship Records</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 no-print">
                        <button
                            onClick={downloadReport}
                            className="h-14 px-8 bg-[hsl(var(--admin-text))] text-[hsl(var(--admin-bg))] text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:shadow-2xl hover:shadow-black/20 transition-all flex items-center gap-3"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Download PDF
                        </button>
                        <div className="bg-[hsl(var(--admin-surface))] border border-[hsl(var(--admin-border))] px-6 py-3 rounded-2xl">
                            <p className="text-[10px] text-[hsl(var(--admin-text-dim))] font-bold uppercase tracking-widest mb-1 opacity-40">{rangeActive ? 'Total in range' : 'Aggregate Total'}</p>
                            <p className="text-xl font-bold text-teal font-display">₱{displayedTotal.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="screen-only bg-[hsl(var(--admin-surface))] rounded-[2.5rem] border border-[hsl(var(--admin-border))] shadow-2xl overflow-hidden relative">
                    <div className="p-5 sm:p-8 border-b border-[hsl(var(--admin-border))] flex flex-col gap-5">
                        {/* Search */}
                        <div className="relative w-full md:max-w-md">
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

                        {/* Date range */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex flex-wrap items-center gap-1 p-2 bg-[hsl(var(--admin-text))]/5 rounded-xl border border-[hsl(var(--admin-border))]">
                                <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--admin-text-dim))]/40">Range</span>
                                {PRESETS.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => applyPreset(p.id)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${preset === p.id ? 'bg-teal text-white' : 'text-[hsl(var(--admin-text-dim))]/40 hover:text-[hsl(var(--admin-text))]'}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    max={endDate || undefined}
                                    onChange={(e) => { setStartDate(e.target.value); setPreset('custom'); }}
                                    className={inputCls}
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--admin-text-dim))]/40">to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    min={startDate || undefined}
                                    onChange={(e) => { setEndDate(e.target.value); setPreset('custom'); }}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Sort + count */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
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
                                <span className="text-[10px] font-bold uppercase tracking-widest text-teal">{filteredDonors.length} {rangeActive ? `in ${rangeLabel}` : 'Donors'}</span>
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
                            filteredDonors.map((d) => (
                                <div key={d.key} className="p-5 border-b border-[hsl(var(--admin-border))]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-[10px] ${d.name === 'Anonymous' ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20' : 'bg-teal/10 text-teal border border-teal/20'}`}>{d.name?.[0]?.toUpperCase() || '?'}</div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[hsl(var(--admin-text))] tracking-tight truncate">{d.name}</p>
                                            <p className="text-[11px] text-[hsl(var(--admin-text-dim))] font-bold truncate">{d.email || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border bg-[hsl(var(--admin-text))]/5 border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-dim))]">{d.count} gifts</span>
                                        <span className="text-sm font-bold text-teal font-display">₱{d.total.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-[hsl(var(--admin-text-dim))] opacity-40 tracking-widest uppercase mt-2">Last gift · {toDateLabel(d.lastAt)}</p>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 text-center text-xs font-bold uppercase tracking-[0.4em] opacity-20">{rangeActive ? 'No giving in this range' : 'No donor records found'}</div>
                        )}
                    </div>

                    <div className="overflow-x-auto custom-scrollbar hidden md:block">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-text))]/2">
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40">Donor</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40">Email</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40">{rangeActive ? 'Gifts in range' : 'Donations'}</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40">{rangeActive ? 'Given in range' : 'Total Given'}</th>
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
                                        filteredDonors.map((d, i) => (
                                            <motion.tr
                                                key={d.key}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: Math.min(i, 12) * 0.05 }}
                                                className="border-b border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--admin-text))]/2 transition-colors duration-300 group"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] ${d.name === 'Anonymous' ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20' : 'bg-teal/10 text-teal border border-teal/20'}`}>
                                                            {d.name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <p className="text-sm font-bold text-[hsl(var(--admin-text))] tracking-tight">{d.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-[11px] text-[hsl(var(--admin-text-dim))] font-bold tracking-widest">{d.email || '—'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border bg-[hsl(var(--admin-text))]/5 border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-dim))]">
                                                        {d.count} gifts
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-teal font-display">₱{d.total.toLocaleString()}</p>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <p className="text-[10px] font-bold text-[hsl(var(--admin-text-dim))] opacity-40 tracking-widest uppercase">
                                                        {toDateLabel(d.lastAt)}
                                                    </p>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-20">
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                    <p className="text-xs font-bold uppercase tracking-[0.4em]">{rangeActive ? 'No giving in this range' : 'No donor records found'}</p>
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
