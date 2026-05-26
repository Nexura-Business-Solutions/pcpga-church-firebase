import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ShieldCheck, Crown, Trash2, UserPlus } from 'lucide-react';
import { listAdmins, setAdmin, removeAdmin } from '../lib/firestore.js';
import { useAuth } from '../lib/auth.js';
import AdminLayout from '../components/admin/AdminLayout.jsx';

const ROLES = [
    { id: 'admin', label: 'Admin' },
    { id: 'manager', label: 'Manager' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toDateLabel(value) {
    if (!value) return '—';
    if (value && typeof value.toDate === 'function') value = value.toDate();
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function roleBadge(role) {
    const map = {
        owner: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        admin: 'bg-teal/10 text-teal border-teal/20',
        manager: 'bg-violet/10 text-violet border-violet/20',
    };
    return map[role] || 'bg-[hsl(var(--admin-text))]/5 border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-dim))]';
}

// Force Sync: Access Control v1.0.0
export default function AdminAdmins() {
    const { user } = useAuth();
    const me = (user?.email || '').trim().toLowerCase();

    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('admin');
    const [saving, setSaving] = useState(false);

    const refresh = useCallback(async () => {
        const data = await listAdmins();
        setAdmins(Array.isArray(data) ? data : []);
    }, []);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const data = await listAdmins();
                if (active) setAdmins(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to load admins:', err);
                toast.error('Hindi ma-load ang admins.');
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    async function handleAdd(e) {
        e.preventDefault();
        const target = email.trim().toLowerCase();
        if (!EMAIL_RE.test(target)) {
            toast.error('Maglagay ng valid na email.');
            return;
        }
        if (admins.some((a) => a.email === target)) {
            toast.error('Naka-add na ang email na ito.');
            return;
        }
        setSaving(true);
        try {
            await setAdmin(target, role, me);
            toast.success(`Naidagdag si ${target} bilang ${role}.`);
            setEmail('');
            setRole('admin');
            await refresh();
        } catch (err) {
            console.error('setAdmin failed:', err);
            toast.error('Hindi naidagdag — owner lang ang pwede.');
        } finally {
            setSaving(false);
        }
    }

    async function handleRoleChange(targetEmail, newRole) {
        try {
            await setAdmin(targetEmail, newRole, me);
            toast.success(`Na-update ang role ni ${targetEmail}.`);
            await refresh();
        } catch (err) {
            console.error('role change failed:', err);
            toast.error('Hindi na-update ang role.');
        }
    }

    async function handleRemove(targetEmail) {
        if (!window.confirm(`Alisin si ${targetEmail} sa admins?`)) return;
        try {
            await removeAdmin(targetEmail);
            toast.success(`Naalis si ${targetEmail}.`);
            await refresh();
        } catch (err) {
            console.error('removeAdmin failed:', err);
            toast.error('Hindi naalis.');
        }
    }

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 px-2">
                    <div>
                        <h1 className="text-4xl font-bold text-[hsl(var(--admin-text))] tracking-tighter font-display mb-3 flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-accent" /> Access Control
                        </h1>
                        <p className="text-[hsl(var(--admin-text-dim))] text-[11px] font-bold tracking-[0.3em] uppercase">Who can sign in to the console</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-accent/5 rounded-xl border border-accent/10">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{admins.length} People</span>
                    </div>
                </div>

                {/* Add form */}
                <form onSubmit={handleAdd} className="bg-[hsl(var(--admin-surface))] rounded-[2rem] border border-[hsl(var(--admin-border))] shadow-xl p-6 md:p-8 mb-10">
                    <p className="text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.25em] opacity-50 mb-5">Grant access</p>
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="flex-1 h-14 px-6 bg-[hsl(var(--admin-text))]/5 border border-transparent rounded-2xl text-sm font-bold outline-none focus:border-accent/40 transition-all placeholder:text-[hsl(var(--admin-text-dim))]/30"
                        />
                        <div className="flex items-center gap-1 px-2 bg-[hsl(var(--admin-text))]/5 rounded-2xl border border-[hsl(var(--admin-border))]">
                            {ROLES.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setRole(r.id)}
                                    className={`px-5 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${role === r.id ? 'bg-accent text-white' : 'text-[hsl(var(--admin-text-dim))]/40 hover:text-[hsl(var(--admin-text))]'}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-14 px-8 bg-accent text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:shadow-2xl hover:shadow-accent/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <UserPlus className="w-4 h-4" /> {saving ? 'Adding…' : 'Add'}
                        </button>
                    </div>
                </form>

                {/* List */}
                <div className="bg-[hsl(var(--admin-surface))] rounded-[2.5rem] border border-[hsl(var(--admin-border))] shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-text))]/2">
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40">Email</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40">Role</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40">Added</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] opacity-40 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        [...Array(3)].map((_, i) => (
                                            <tr key={i} className="border-b border-[hsl(var(--admin-border))] animate-pulse">
                                                <td colSpan={4} className="px-8 py-8"><div className="h-4 bg-[hsl(var(--admin-text))]/5 rounded-lg w-full" /></td>
                                            </tr>
                                        ))
                                    ) : admins.length > 0 ? (
                                        admins.map((a, i) => {
                                            const isOwnerRow = a.role === 'owner';
                                            const isSelf = a.email === me;
                                            const locked = isOwnerRow || isSelf;
                                            return (
                                                <motion.tr
                                                    key={a.email}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    className="border-b border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--admin-text))]/2 transition-colors duration-300"
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[11px] border ${roleBadge(a.role)}`}>
                                                                {isOwnerRow ? <Crown className="w-4 h-4" /> : (a.email[0] || '?').toUpperCase()}
                                                            </div>
                                                            <p className="text-sm font-bold text-[hsl(var(--admin-text))] tracking-tight">
                                                                {a.email}{isSelf && <span className="ml-2 text-[9px] text-[hsl(var(--admin-text-dim))]/40 uppercase tracking-widest">(you)</span>}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {locked ? (
                                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${roleBadge(a.role)}`}>{a.role}</span>
                                                        ) : (
                                                            <select
                                                                value={a.role}
                                                                onChange={(e) => handleRoleChange(a.email, e.target.value)}
                                                                className="bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--admin-text))] outline-none focus:border-accent/40"
                                                            >
                                                                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-[10px] font-bold text-[hsl(var(--admin-text-dim))] opacity-40 tracking-widest uppercase">{toDateLabel(a.updatedAt)}</p>
                                                        {a.addedBy && <p className="text-[9px] text-[hsl(var(--admin-text-dim))]/30 tracking-wide mt-1">by {a.addedBy}</p>}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button
                                                            onClick={() => handleRemove(a.email)}
                                                            disabled={locked}
                                                            title={isOwnerRow ? 'Cannot remove the owner' : isSelf ? 'Cannot remove yourself' : 'Remove'}
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-coral/60 hover:text-coral hover:bg-coral/5 transition-all disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Remove
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-20">
                                                    <ShieldCheck className="w-12 h-12" />
                                                    <p className="text-xs font-bold uppercase tracking-[0.4em]">No admins yet</p>
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
