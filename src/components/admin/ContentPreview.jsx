import * as Lucide from 'lucide-react';

/**
 * Live, site-like preview of the content section currently being edited.
 * Renders on a fixed LIGHT "paper" surface (the real site is light) regardless
 * of the admin dark-mode toggle, so it accurately represents the published look.
 * Not pixel-perfect with the homepage — a faithful, fast-updating approximation.
 */

const Icon = ({ name, className }) => {
    const Cmp = (name && Lucide[name]) || Lucide.Sparkle;
    return <Cmp className={className} />;
};

const fallback = (v, f) => (v && String(v).trim() ? v : f);

function Frame({ children }) {
    return (
        <div
            className="rounded-[1.75rem] overflow-hidden border border-black/10 shadow-2xl"
            style={{ background: '#faf6ec', color: '#2b1a12', fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
            {children}
        </div>
    );
}

const Empty = ({ label }) => (
    <Frame>
        <div className="py-24 px-8 text-center">
            <Lucide.Eye className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-[11px] uppercase tracking-[0.3em] opacity-40">{label}</p>
        </div>
    </Frame>
);

function Hero({ hero }) {
    const bg = hero?.heroImage;
    return (
        <Frame>
            <div className="relative min-h-[280px] flex flex-col items-center justify-center text-center px-8 py-16"
                style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: 'linear-gradient(135deg, #3a2417, #6b3f22)' }}>
                <div className="absolute inset-0" style={{ background: 'rgba(20,12,8,0.55)' }} />
                <div className="relative" style={{ color: '#fbf4dc' }}>
                    {(hero?.editionText) && <p className="text-[9px] uppercase tracking-[0.3em] mb-3 opacity-70">{hero.editionText}</p>}
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">{fallback(hero?.heading, 'Welcome home.')}</h1>
                    <p className="text-base opacity-90 max-w-md mx-auto mb-7">{fallback(hero?.lede, 'A communion of Reformed congregations gathered around Scripture and the historic Presbyterian faith.')}</p>
                    <span className="inline-block px-7 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em]"
                        style={{ background: '#c9a24a', color: '#2b1a12' }}>{fallback(hero?.ctaPrimary, 'Find a Church')}</span>
                    {hero?.times && <p className="text-[10px] uppercase tracking-[0.3em] mt-5 opacity-70">{hero.times}</p>}
                </div>
            </div>
        </Frame>
    );
}

function Identity({ identity }) {
    const social = identity?.social || {};
    const links = Object.entries(social).filter(([, v]) => v && String(v).trim());
    return (
        <Frame>
            <div className="px-8 py-12" style={{ background: '#2b1a12', color: '#fbf4dc' }}>
                <h3 className="text-2xl font-bold mb-1">{fallback(identity?.name, 'Church Name')}</h3>
                <p className="text-xs uppercase tracking-[0.3em] opacity-60 mb-5">{fallback(identity?.sub, 'Tagline / subtitle')}</p>
                <p className="text-sm opacity-80 leading-relaxed max-w-md mb-6">{fallback(identity?.footerDesc, 'A short description shown in the website footer.')}</p>
                <div className="flex gap-3">
                    {(links.length ? links : [['facebook', '#'], ['instagram', '#']]).map(([k]) => (
                        <span key={k} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(251,244,220,0.1)' }}>
                            <Icon name={k[0].toUpperCase() + k.slice(1)} className="w-4 h-4" />
                        </span>
                    ))}
                </div>
            </div>
        </Frame>
    );
}

function Mission({ mission }) {
    return (
        <Frame>
            <div className="px-8 py-14 text-center">
                <p className="text-[10px] uppercase tracking-[0.4em] mb-5" style={{ color: '#a8742f' }}>{fallback(mission?.motto, 'Our Mission')}</p>
                <h2 className="text-3xl font-bold leading-snug max-w-lg mx-auto mb-5">{fallback(mission?.vision, 'A vision statement for the church.')}</h2>
                <p className="text-sm leading-relaxed opacity-70 max-w-md mx-auto">{fallback(mission?.summary, 'A longer summary paragraph that expands on the mission and vision of the congregation.')}</p>
            </div>
        </Frame>
    );
}

function IconCards({ items, dark }) {
    const list = (Array.isArray(items) ? items : []).filter((x) => x && (x.title || x.sub));
    if (!list.length) return <Empty label="Add items to preview" />;
    return (
        <Frame>
            <div className="px-6 py-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {list.map((it, i) => (
                    <div key={i} className="p-5 rounded-2xl"
                        style={dark ? { background: '#2b1a12', color: '#fbf4dc' } : { background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: dark ? 'rgba(201,162,74,0.2)' : 'rgba(168,116,47,0.1)', color: '#c9a24a' }}>
                            <Icon name={it.icon} className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-base mb-1">{fallback(it.title, 'Title')}</p>
                        <p className="text-xs opacity-70 leading-relaxed">{fallback(it.sub, 'Supporting description.')}</p>
                    </div>
                ))}
            </div>
        </Frame>
    );
}

function Principles({ principles }) {
    const paras = (principles?.paragraphs || []).filter((p) => p && String(p).trim());
    return (
        <Frame>
            <div className="px-8 py-14">
                <h2 className="text-2xl md:text-3xl font-bold leading-snug mb-8">{fallback(principles?.title, 'A heading for the pastoral message.')}</h2>
                <div className="space-y-4">
                    {(paras.length ? paras : ['The body of the pastoral message appears here, paragraph by paragraph.']).map((p, i) => (
                        <p key={i} className="text-sm leading-relaxed opacity-75">{p}</p>
                    ))}
                </div>
                {principles?.pullQuote && (
                    <blockquote className="my-6 pl-5 border-l-2 text-base italic" style={{ borderColor: '#c9a24a', color: '#6b3f22' }}>{principles.pullQuote}</blockquote>
                )}
                <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    <p className="italic font-bold" style={{ color: '#6b3f22' }}>{fallback(principles?.signer, 'Signed by…')}</p>
                    <p className="text-[11px] uppercase tracking-[0.25em] opacity-50 mt-1">{fallback(principles?.role, 'Role / title')}</p>
                </div>
            </div>
        </Frame>
    );
}

function Stats({ stats }) {
    const nums = (stats?.stats || []).filter((s) => s && (s.value || s.label));
    const times = (stats?.serviceTimes || []).filter((t) => t && (t.label || t.value));
    return (
        <Frame>
            <div className="px-8 py-12">
                {nums.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-8 mb-10">
                        {nums.map((s, i) => (
                            <div key={i} className="text-center">
                                <p className="text-4xl font-bold" style={{ color: '#a8742f' }}>{fallback(s.value, '—')}</p>
                                <p className="text-[10px] uppercase tracking-[0.25em] opacity-60 mt-1">{fallback(s.label, 'Label')}</p>
                            </div>
                        ))}
                    </div>
                )}
                <div className="text-center border-t pt-8" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    <h3 className="text-2xl font-bold mb-1">{fallback(stats?.visitTitle, 'Plan Your Visit')}</h3>
                    <p className="text-sm opacity-70 mb-5">{fallback(stats?.visitSubtitle, 'We would love to see you this Sunday.')}</p>
                    <div className="flex flex-col gap-2 max-w-xs mx-auto">
                        {(times.length ? times : [{ label: 'Sunday Service', value: '9:00 AM' }]).map((t, i) => (
                            <div key={i} className="flex justify-between text-sm px-4 py-2 rounded-xl" style={{ background: '#fff' }}>
                                <span className="opacity-70">{fallback(t.label, 'Service')}</span>
                                <span className="font-bold">{fallback(t.value, '—')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Frame>
    );
}

function officerName(o) { return typeof o === 'string' ? o : (o?.name || ''); }

function ListPreview({ items, label }) {
    const list = (Array.isArray(items) ? items : []).filter((c) => c && c.name);
    if (!list.length) return <Empty label={`Add ${label} to preview`} />;
    return (
        <Frame>
            <div className="px-6 py-8 space-y-3">
                {list.map((c, i) => {
                    const officers = (c.officers || []).map(officerName).filter(Boolean);
                    return (
                        <div key={i} className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>
                            <div className="flex items-center gap-3 mb-1">
                                {c.icon && <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,116,47,0.1)', color: '#a8742f' }}><Icon name={c.icon} className="w-4 h-4" /></span>}
                                <p className="font-bold">{c.name}</p>
                            </div>
                            {(c.description || c.details) && <p className="text-xs opacity-70 leading-relaxed mb-2">{c.description || c.details}</p>}
                            {officers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {officers.slice(0, 6).map((n, j) => (
                                        <span key={j} className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.05)' }}>{n}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Frame>
    );
}

function Donations({ donations }) {
    return (
        <Frame>
            <div className="px-8 py-12 text-center">
                <h2 className="text-2xl font-bold mb-2">{fallback(donations?.heading, 'Give Generously')}</h2>
                <p className="text-sm opacity-75 max-w-md mx-auto mb-3">{fallback(donations?.subtitle, 'Your generosity sustains the ministry of the church.')}</p>
                {donations?.scriptureRef && <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 mb-8">— {donations.scriptureRef}</p>}
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest" style={{ background: '#0f172a', color: '#fff' }}>
                    <Lucide.CreditCard className="w-4 h-4" /> Donate Now
                </div>
                <p className="text-[10px] opacity-50 mt-3">Secure online giving via Xendit (GCash, Maya, cards &amp; bank).</p>
            </div>
        </Frame>
    );
}

function Announcement({ announcement }) {
    if (!announcement || announcement.isActive === false) return <Empty label="Announcement is inactive" />;
    const tones = {
        info: '#3a6ea5', event: '#3a7d44', warning: '#a8742f', urgent: '#a53a3a',
    };
    const tone = tones[announcement.type] || tones.info;
    return (
        <Frame>
            <div className="px-8 py-12 text-center">
                <div className="rounded-2xl px-6 py-8" style={{ background: tone, color: '#fff' }}>
                    <p className="text-[10px] uppercase tracking-[0.3em] opacity-80 mb-2">{announcement.type || 'info'}</p>
                    <h3 className="text-2xl font-bold mb-2">{fallback(announcement.title, 'Announcement title')}</h3>
                    <p className="text-sm opacity-90 mb-5">{fallback(announcement.message, 'Your message to visitors appears here.')}</p>
                    {announcement.buttonText && (
                        <span className="inline-block px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em]" style={{ background: '#fff', color: tone }}>{announcement.buttonText}</span>
                    )}
                </div>
            </div>
        </Frame>
    );
}

export default function ContentPreview({ tab, hero, identity, mission, principles, stats, committees, presbyteries, donations, announcement }) {
    switch (tab) {
        case 'hero': return <Hero hero={hero} />;
        case 'identity': return <Identity identity={identity} />;
        case 'mission': return <Mission mission={mission} />;
        case 'points': return <IconCards items={mission?.missionPoints} />;
        case 'commitments': return <IconCards items={mission?.commitments} dark />;
        case 'principles': return <Principles principles={principles} />;
        case 'stats': return <Stats stats={stats} />;
        case 'committees': return <ListPreview items={committees} label="committees" />;
        case 'presbyteries': return <ListPreview items={presbyteries} label="presbyteries" />;
        case 'donations': return <Donations donations={donations} />;
        case 'announcement': return <Announcement announcement={announcement} />;
        default: return <Empty label="Select a section" />;
    }
}
