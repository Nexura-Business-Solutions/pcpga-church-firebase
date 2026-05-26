import { useState, useMemo, useRef, useEffect } from 'react';
import * as Lucide from 'lucide-react';

// Curated, professional icons that suit a church / ministry site (shown first).
const CURATED = [
    'Church', 'Cross', 'BookOpen', 'BookMarked', 'Bird', 'Heart', 'HeartHandshake', 'HandHeart',
    'Users', 'UsersRound', 'Handshake', 'Globe', 'Globe2', 'MapPin', 'Landmark', 'Building2',
    'Sun', 'Sunrise', 'Star', 'Sparkles', 'Flame', 'Leaf', 'Sprout', 'Wheat', 'Grape',
    'Music', 'Music2', 'Mic2', 'Speech', 'MessageSquare', 'Bell', 'Calendar', 'Clock',
    'GraduationCap', 'School', 'Library', 'Scroll', 'ScrollText', 'PenTool', 'Feather',
    'ShieldCheck', 'Shield', 'Key', 'Anchor', 'Compass', 'Map', 'Home', 'DoorOpen',
    'Gift', 'HandCoins', 'CircleDollarSign', 'Wallet', 'PiggyBank', 'Banknote',
    'Crown', 'Award', 'Medal', 'Target', 'Footprints', 'Route', 'Milestone', 'Mountain',
];

// Keys that lucide exports but are not renderable icons.
const NOT_ICONS = new Set(['createLucideIcon', 'Icon', 'icons', 'default', 'LucideProvider']);

// PascalCase exports that aren't the `*Icon` aliases or helpers = the icon set.
const ALL_ICONS = Object.keys(Lucide).filter(
    (k) => /^[A-Z]/.test(k) && !k.endsWith('Icon') && !NOT_ICONS.has(k),
);

export default function IconPicker({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const Current = (value && Lucide[value]) || Lucide.Shapes;

    const results = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return CURATED.filter((n) => Lucide[n]);
        return ALL_ICONS.filter((n) => n.toLowerCase().includes(term)).slice(0, 60);
    }, [q]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                title={value || 'Pick an icon'}
                className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 hover:border-coral/50 text-coral transition-all"
            >
                <Current className="w-5 h-5" />
            </button>

            {open && (
                <div className="absolute z-50 mt-2 left-0 w-72 p-3 rounded-2xl bg-[hsl(var(--admin-surface))] border border-[hsl(var(--admin-border))] shadow-2xl">
                    <div className="relative mb-3">
                        <Lucide.Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--admin-text-dim))]/40" />
                        <input
                            autoFocus
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search icons…"
                            className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/15 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-coral/20"
                            style={{ color: 'hsl(var(--admin-text))' }}
                        />
                    </div>
                    {!q && <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--admin-text-dim))]/40 mb-2 px-1">Suggested</p>}
                    <div className="grid grid-cols-6 gap-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                        {results.map((name) => {
                            const Ico = Lucide[name];
                            const active = name === value;
                            return (
                                <button
                                    key={name}
                                    type="button"
                                    title={name}
                                    onClick={() => { onChange(name); setOpen(false); setQ(''); }}
                                    className={`aspect-square rounded-lg flex items-center justify-center transition-all ${active ? 'bg-coral text-white' : 'text-[hsl(var(--admin-text-dim))] hover:bg-[hsl(var(--admin-text))]/5 hover:text-coral'}`}
                                >
                                    <Ico className="w-4 h-4" />
                                </button>
                            );
                        })}
                        {results.length === 0 && (
                            <p className="col-span-6 text-center text-[10px] text-[hsl(var(--admin-text-dim))]/40 py-6">No icons match “{q}”.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
