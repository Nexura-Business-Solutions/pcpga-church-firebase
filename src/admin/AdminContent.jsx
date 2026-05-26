import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getSettings, saveSettings } from '../lib/store.js';
import { uploadFile } from '../lib/storage.js';
import { defaultPresbyteries } from '../lib/seed-data.js';
import GuidedTour from '../components/admin/GuidedTour.jsx';
import { AdminSkeleton, AdminHeaderSkeleton, AdminCardSkeleton } from '../components/admin/AdminSkeleton.jsx';
import AdminEmptyState from '../components/admin/AdminEmptyState.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import ContentPreview from '../components/admin/ContentPreview.jsx';
import {
    Home,
    Palette,
    Scroll,
    Footprints,
    Amphora,
    Cross,
    BarChart3,
    Landmark,
    CircleDollarSign,
    Sparkles,
    Eye,
    Globe,
    Target,
    Activity,
    MessageSquare,
    Clock,
    Bell,
    ImagePlus,
    Film,
    X
} from 'lucide-react';

const TABS = [
    { id: 'hero', label: 'Hero', icon: Home },
    { id: 'identity', label: 'Identity', icon: Palette },
    { id: 'mission', label: 'Narrative', icon: Scroll },
    { id: 'points', label: 'Mission', icon: Footprints },
    { id: 'commitments', label: 'Spirit', icon: Amphora },
    { id: 'principles', label: 'Core', icon: Cross },
    { id: 'stats', label: 'Visitor', icon: BarChart3 },
    { id: 'committees', label: 'Governance', icon: Landmark },
    { id: 'presbyteries', label: 'Regional', icon: Globe },
    { id: 'donations', label: 'Giving', icon: CircleDollarSign },
    { id: 'announcement', label: 'Announcement', icon: Bell }
];

export default function AdminContent() {
    const [activeTab, setActiveTab] = useState('identity');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isTourActive, setIsTourActive] = useState(false);

    const tourSteps = [
        { selector: '#tour-tabs', title: 'Content Categories', message: 'Switch between different sections like Identity, Mission, and Governance using these tabs.' },
        { selector: '#tour-fields-header', title: 'Live Editing', message: 'You can edit the text fields directly. Changes will be saved once you click the button at the bottom.' },
        { selector: '#tour-dynamic', title: 'Dynamic Lists', message: 'Use the "+ Add" and "🗑️" buttons to manage lists like Mission Points or Committee Duties.' },
        { selector: '#tour-save', title: 'Save Everything', message: 'CRITICAL: Always click here to push your changes to the live website. It may take 60 seconds to update.' }
    ];

    const [identity, setIdentity] = useState({});
    const [mission, setMission] = useState({});
    const [principles, setPrinciples] = useState({});
    const [stats, setStats] = useState({});
    const [committees, setCommittees] = useState([]);
    const [presbyteries, setPresbyteries] = useState([]);
    const [hero, setHero] = useState({});
    const [donations, setDonations] = useState({});
    const [announcement, setAnnouncement] = useState({});
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        async function load() {
            const [id, mv, cp, iv, coms, hr, dn, an] = await Promise.all([
                getSettings('site-identity'),
                getSettings('mission-vision'),
                getSettings('core-principles'),
                getSettings('invitation-stats'),
                getSettings('standing-committees'),
                getSettings('hero'),
                getSettings('donations'),
                getSettings('announcement')
            ]);
            setIdentity(id && id.name ? id : { name: '', sub: '', footerDesc: '', social: {} });
            setMission(mv && mv.missionPoints ? mv : {
                motto: '', vision: '', summary: '',
                missionPoints: [{ title: '', sub: '', icon: 'Bird' }],
                commitments: [{ title: '', sub: '', icon: 'Amphora' }]
            });
            const py = await getSettings('presbyteries');
            setPresbyteries(Array.isArray(py) && py.length > 0 ? py : defaultPresbyteries);
            setPrinciples(cp && cp.pillars ? cp : {
                pillars: [{ title: '', desc: '', icon: 'Cross' }],
                quotes: [{ text: '', highlight: '', color: '' }]
            });
            setStats(iv && iv.stats ? iv : {
                stats: [{ value: '', label: '' }],
                visitTitle: '', visitSubtitle: '',
                serviceTimes: [{ label: '', value: '' }]
            });
            setCommittees(Array.isArray(coms) ? coms : []);
            setHero(hr || {});
            setDonations(dn || {});
            setAnnouncement(an && Object.keys(an).length > 0 ? { type: 'info', ...an } : { isActive: false, type: 'info', title: 'Upcoming Service', message: 'Join us this Sunday!', buttonText: '', buttonLink: '', updatedAt: Date.now() });
            setLoading(false);
        }
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const results = await Promise.all([
                saveSettings('site-identity', identity),
                saveSettings('mission-vision', mission),
                saveSettings('core-principles', principles),
                saveSettings('invitation-stats', stats),
                saveSettings('standing-committees', committees),
                saveSettings('presbyteries', presbyteries),
                saveSettings('hero', hero),
                saveSettings('donations', donations),
                saveSettings('announcement', { ...announcement, updatedAt: Date.now() })
            ]);
            if (results.every(r => r)) {
                toast.success('Website updated ✦ Site revalidated.');
            } else {
                throw new Error('Some sections failed to save');
            }
        } catch (err) {
            toast.error(err.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    // Convert file to compressed base64 data URL (for officer photos)
    const fileToBase64 = (file, maxSize = 200) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > maxSize || h > maxSize) {
                        const ratio = Math.min(maxSize / w, maxSize / h);
                        w = Math.round(w * ratio);
                        h = Math.round(h * ratio);
                    }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleImageUpload = async (file, target = 'hero') => {
        if (!file) return;

        // Validate announcement media: accept images and videos, cap size to keep modal lean
        if (target === 'announcement') {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            if (!isImage && !isVideo) {
                toast.error('Only image or video files are allowed.');
                return;
            }
            const maxBytes = isVideo ? 25 * 1024 * 1024 : 8 * 1024 * 1024;
            if (file.size > maxBytes) {
                toast.error(isVideo ? 'Video must be 25 MB or smaller.' : 'Image must be 8 MB or smaller.');
                return;
            }
        }

        setIsUploading(true);
        try {
            // Officer photos: convert to base64 client-side (no blob storage needed)
            if (target.includes('-officer-')) {
                const base64Url = await fileToBase64(file);
                if (target.startsWith('committee-')) {
                    const parts = target.split('-');
                    const comIdx = parseInt(parts[1]);
                    const offIdx = parseInt(parts[3]);
                    const newComs = [...committees];
                    newComs[comIdx].officers[offIdx].photo = base64Url;
                    setCommittees(newComs);
                } else if (target.startsWith('presbytery-')) {
                    const parts = target.split('-');
                    const presIdx = parseInt(parts[1]);
                    const offIdx = parseInt(parts[3]);
                    const newPres = [...presbyteries];
                    if (typeof newPres[presIdx].officers[offIdx] === 'string') {
                        newPres[presIdx].officers[offIdx] = { name: newPres[presIdx].officers[offIdx], role: '', photo: base64Url };
                    } else {
                        newPres[presIdx].officers[offIdx].photo = base64Url;
                    }
                    setPresbyteries(newPres);
                }
                toast.success('Photo added ✦');
                return;
            }

            // Other uploads (hero, QR codes, announcement media): upload to Firebase Storage
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `content/${target}/${Date.now()}-${safeName}`;
            const url = await uploadFile(path, file);
            if (target === 'hero') setHero({ ...hero, heroImage: url });
            else if (target === 'gcash') setDonations({ ...donations, gcashQR: url });
            else if (target === 'maya') setDonations({ ...donations, mayaQR: url });
            else if (target === 'announcement') {
                const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
                setAnnouncement({ ...announcement, mediaUrl: url, mediaType });
            }

            toast.success('Media uploaded successfully ✦');
        } catch (err) {
            toast.error(err.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    // Generic Add/Remove Helpers
    const addItem = (list, setFn, defaultItem) => {
        setFn([...list, defaultItem]);
    };

    const removeItem = (list, setFn, index) => {
        if (list.length <= 1) return toast.error('Must have at least one item.');
        const newList = [...list];
        newList.splice(index, 1);
        setFn(newList);
    };

    if (loading) return (
        <AdminLayout>
            <div className="min-h-screen bg-[hsl(var(--admin-bg))] p-8 lg:p-12 pb-32">
                <div className="max-w-7xl mx-auto">
                    <AdminHeaderSkeleton />
                    <div className="flex gap-2 mb-12 inline-flex">
                        {[...Array(6)].map((_, i) => <AdminSkeleton key={i} className="h-12 w-32 rounded-2xl" />)}
                    </div>
                    <AdminCardSkeleton />
                </div>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[hsl(var(--admin-bg))] p-8 lg:p-12 pb-32">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Globe className="w-5 h-5 text-coral" />
                                <span className="text-coral text-[10px] font-bold uppercase tracking-[0.4em]">Global Management</span>
                            </div>
                            <h1 id="tour-fields-header" className="text-4xl md:text-5xl font-bold text-[hsl(var(--admin-text))] font-display tracking-tight leading-none mb-4">
                                Master <span className="opacity-40">Content Manager</span>
                            </h1>
                            <p className="text-[hsl(var(--admin-text-dim))] text-sm max-w-lg">
                                Control every narrative, principle, and identity marker across the entire website from one unified dashboard.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsTourActive(true)}
                                className="px-6 py-3 bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-border))] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 transition-all shadow-sm hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <Sparkles className="w-3 h-3" /> Take a Tour
                            </button>
                            <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-8 py-3 bg-[hsl(var(--admin-surface))] rounded-2xl border border-[hsl(var(--admin-border))] hover:bg-accent/5 transition-all group hover:scale-105 active:scale-95">
                                <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-[hsl(var(--admin-text))] uppercase tracking-widest">Live Site</span>
                            </a>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div id="tour-tabs" className="flex flex-wrap gap-2 p-2 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] mb-12 self-start inline-flex">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-[hsl(var(--admin-surface))] text-coral shadow-lg'
                                    : 'text-[hsl(var(--admin-text-dim))] hover:bg-[hsl(var(--admin-surface))]/60 hover:text-coral/70'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Editor Content — form (left) + live preview (right on xl) */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="bg-[hsl(var(--admin-surface))] rounded-[2.5rem] border border-[hsl(var(--admin-border))] p-8 md:p-12 shadow-sm min-h-[600px]"
                            >
                                {/* HERO TAB */}
                                {activeTab === 'hero' && (
                                    <div className="space-y-12">
                                        <div className="space-y-8">
                                            <div className="relative group">
                                                <div className={`w-full aspect-[21/9] rounded-[2.5rem] border-2 border-dashed overflow-hidden transition-all duration-500 flex items-center justify-center ${hero.heroImage ? 'border-coral/40 bg-coral/5' : 'border-[hsl(var(--admin-border))] hover:border-coral/40'}`}>
                                                    {isUploading ? (
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
                                                            <p className="text-coral text-[10px] font-bold uppercase tracking-widest">Uploading Photo...</p>
                                                        </div>
                                                    ) : hero.heroImage ? (
                                                        <img src={hero.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-center p-8">
                                                            <p className="text-[hsl(var(--admin-text-dim))] text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">No custom background</p>
                                                            <p className="text-[hsl(var(--admin-text-dim))]/20 text-[9px] uppercase tracking-widest">Falls back to professional default</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm rounded-[2.5rem]">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <label className="cursor-pointer px-10 py-4 bg-white text-coral text-[11px] font-bold uppercase tracking-widest rounded-2xl hover:scale-105 transition-all">
                                                            {hero.heroImage ? 'Replace Image' : 'Upload Image'}
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], 'hero')} />
                                                        </label>
                                                        {hero.heroImage && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setHero({ ...hero, heroImage: '' }); }}
                                                                className="text-white text-[9px] font-bold uppercase tracking-widest hover:text-red-400 transition-colors"
                                                            >
                                                                Remove Custom Background
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {[
                                                { key: 'heading', label: 'Main Headline', placeholder: 'Welcome Home.' },
                                                { key: 'subtitle', label: 'Supportive Narrative', placeholder: 'Where faith meets community.' },
                                                { key: 'ctaText', label: 'Action Label', placeholder: 'Join Us Sunday' },
                                                { key: 'serviceTimes', label: 'Schedule Banner', placeholder: 'Sundays · 9:00 AM' },
                                            ].map((field) => (
                                                <div key={field.key} className={field.key === 'heading' || field.key === 'subtitle' ? 'md:col-span-2' : ''}>
                                                    <label className="block text-coral text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">{field.label}</label>
                                                    <input
                                                        value={hero[field.key] || ''}
                                                        onChange={(e) => setHero({ ...hero, [field.key]: e.target.value })}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* IDENTITY TAB */}
                                {activeTab === 'identity' && (
                                    <div className="space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Church Name</label>
                                                <input
                                                    type="text"
                                                    value={identity.name || ''}
                                                    onChange={e => setIdentity({ ...identity, name: e.target.value })}
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-coral/20 transition-all font-medium"
                                                    placeholder="e.g. Presbyterian Church"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Suffix/Location</label>
                                                <input
                                                    type="text"
                                                    value={identity.sub || ''}
                                                    onChange={e => setIdentity({ ...identity, sub: e.target.value })}
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-coral/20 transition-all font-medium"
                                                    placeholder="e.g. Philippines"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Footer Description</label>
                                            <textarea
                                                rows={4}
                                                value={identity.footerDesc || ''}
                                                onChange={e => setIdentity({ ...identity, footerDesc: e.target.value })}
                                                className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-coral/20 transition-all font-medium resize-none"
                                                placeholder="The short narrative at the bottom of the site..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[hsl(var(--admin-border))]">
                                            {['facebook', 'youtube', 'instagram', 'email'].map(field => (
                                                <div key={field} className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1 capitalize">{field}</label>
                                                        <span className="text-[8px] opacity-30 font-bold uppercase">Dynamic Link</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={identity.social?.[field] || ''}
                                                        onChange={e => setIdentity({ ...identity, social: { ...identity.social, [field]: e.target.value } })}
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-coral/20 transition-all font-medium"
                                                        placeholder={`Link or address for ${field}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* NARRATIVE TAB */}
                                {activeTab === 'mission' && (
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Ministry Motto</label>
                                            <input
                                                type="text"
                                                value={mission.motto || ''}
                                                onChange={e => setMission({ ...mission, motto: e.target.value })}
                                                className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-lg font-bold text-coral focus:ring-2 focus:ring-coral/20 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Vision Statement</label>
                                            <textarea
                                                rows={5}
                                                value={mission.vision || ''}
                                                onChange={e => setMission({ ...mission, vision: e.target.value })}
                                                className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-coral/20 transition-all font-medium leading-relaxed resize-none"
                                            />
                                        </div>
                                        <div className="space-y-4 pt-6 border-t border-[hsl(var(--admin-border))]">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Summary Statement</label>
                                            <textarea
                                                rows={4}
                                                value={mission.summary || ''}
                                                onChange={e => setMission({ ...mission, summary: e.target.value })}
                                                className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm italic focus:ring-2 focus:ring-coral/20 transition-all font-medium leading-relaxed resize-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* MISSION POINTS TAB */}
                                {activeTab === 'points' && (
                                    <div className="space-y-10">
                                        {(!mission.missionPoints || mission.missionPoints.length === 0) && (
                                            <AdminEmptyState
                                                title="No Mission Points"
                                                description="Add points to define your mission statement on the public site."
                                                icon={<Target className="w-12 h-12 text-coral/20" />}
                                                actionText="Add Mission Point"
                                                onAction={() => addItem(mission.missionPoints || [], (l) => setMission({ ...mission, missionPoints: l }), { icon: 'Bird', title: 'New Mission Point', sub: '' })}
                                            />
                                        )}
                                        {(Array.isArray(mission.missionPoints) ? mission.missionPoints : []).map((point, i) => (
                                            <div key={i} className="p-8 bg-[hsl(var(--admin-bg-alt))] rounded-3xl space-y-6 relative overflow-hidden group border border-[hsl(var(--admin-border))]">
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="text"
                                                        value={point.icon}
                                                        onChange={e => {
                                                            const p = [...mission.missionPoints];
                                                            p[i].icon = e.target.value;
                                                            setMission({ ...mission, missionPoints: p });
                                                        }}
                                                        className="w-16 h-16 bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl text-2xl flex items-center justify-center text-center focus:ring-2 focus:ring-coral/20"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={point.title}
                                                        onChange={e => {
                                                            const p = [...mission.missionPoints];
                                                            p[i].title = e.target.value;
                                                            setMission({ ...mission, missionPoints: p });
                                                        }}
                                                        className="flex-1 bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-coral/20"
                                                    />
                                                    <button onClick={() => removeItem(mission.missionPoints, (l) => setMission({ ...mission, missionPoints: l }), i)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">🗑️</button>
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    value={point.sub}
                                                    onChange={e => {
                                                        const p = [...mission.missionPoints];
                                                        p[i].sub = e.target.value;
                                                        setMission({ ...mission, missionPoints: p });
                                                    }}
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm resize-none focus:ring-2 focus:ring-coral/20 font-medium opacity-70"
                                                />
                                            </div>
                                        ))}
                                        {mission.missionPoints?.length > 0 && (
                                            <button
                                                id="tour-dynamic"
                                                onClick={() => addItem(mission.missionPoints, (l) => setMission({ ...mission, missionPoints: l }), { icon: '✨', title: 'New Mission Point', sub: '' })}
                                                className="w-full py-6 rounded-2xl border-2 border-dashed border-[hsl(var(--admin-border))] text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 transition-all"
                                            >
                                                + Add Mission Point
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* CORE COMMITMENTS TAB */}
                                {activeTab === 'commitments' && (
                                    <div className="space-y-10">
                                        {(!mission.commitments || mission.commitments.length === 0) && (
                                            <AdminEmptyState
                                                title="No Core Commitments"
                                                description="Share the foundational values of your church."
                                                icon={<Activity className="w-12 h-12 text-coral/20" />}
                                                actionText="Add Core Commitment"
                                                onAction={() => addItem(mission.commitments || [], (l) => setMission({ ...mission, commitments: l }), { icon: 'Amphora', title: 'New Commitment', sub: '' })}
                                            />
                                        )}
                                        {(Array.isArray(mission.commitments) ? mission.commitments : []).map((item, i) => (
                                            <div key={i} className="p-8 bg-[hsl(17_47%_13%)] rounded-3xl space-y-6 relative overflow-hidden group border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="text"
                                                        value={item.icon}
                                                        onChange={e => {
                                                            const c = [...mission.commitments];
                                                            c[i].icon = e.target.value;
                                                            setMission({ ...mission, commitments: c });
                                                        }}
                                                        className="w-16 h-16 bg-white/5 border-0 rounded-2xl text-2xl flex items-center justify-center text-center focus:ring-2 focus:ring-coral/40 text-white"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={item.title}
                                                        onChange={e => {
                                                            const c = [...mission.commitments];
                                                            c[i].title = e.target.value;
                                                            setMission({ ...mission, commitments: c });
                                                        }}
                                                        className="flex-1 bg-white/5 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-coral/40 text-white"
                                                    />
                                                    <button onClick={() => removeItem(mission.commitments, (l) => setMission({ ...mission, commitments: l }), i)} className="p-3 text-red-400 hover:bg-white/5 rounded-xl transition-colors">🗑️</button>
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    value={item.sub}
                                                    onChange={e => {
                                                        const c = [...mission.commitments];
                                                        c[i].sub = e.target.value;
                                                        setMission({ ...mission, commitments: c });
                                                    }}
                                                    className="w-full bg-white/5 border-0 rounded-2xl p-5 text-sm resize-none focus:ring-2 focus:ring-coral/40 font-medium text-white/50"
                                                />
                                            </div>
                                        ))}
                                        {mission.commitments?.length > 0 && (
                                            <button
                                                onClick={() => addItem(mission.commitments, (l) => setMission({ ...mission, commitments: l }), { icon: '🛡️', title: 'New Commitment', sub: '' })}
                                                className="w-full py-6 rounded-2xl border-2 border-dashed border-[hsl(var(--admin-border))] text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 transition-all"
                                            >
                                                + Add Core Commitment
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* PRINCIPLES & QUOTES TAB */}
                                {activeTab === 'principles' && (
                                    <div className="space-y-16">
                                        <div className="space-y-8">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-coral border-b border-[hsl(var(--admin-border))] pb-4">Core Principles</h3>
                                            <div className="grid grid-cols-1 gap-6">
                                                {(!principles.pillars || principles.pillars.length === 0) && (
                                                    <AdminEmptyState
                                                        title="No Core Pillars"
                                                        description="Highlight the main pillars of your church community."
                                                        icon={<Landmark className="w-12 h-12 text-coral/20" />}
                                                        actionText="Add Core Pillar"
                                                        onAction={() => addItem(principles.pillars || [], (l) => setPrinciples({ ...principles, pillars: l }), { icon: 'Cross', title: 'New Pillar', desc: '' })}
                                                    />
                                                )}
                                                {(Array.isArray(principles.pillars) ? principles.pillars : []).map((p, i) => (
                                                    <div key={i} className="p-8 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <input
                                                                type="text"
                                                                value={p.icon}
                                                                onChange={e => {
                                                                    const pillars = [...principles.pillars];
                                                                    pillars[i].icon = e.target.value;
                                                                    setPrinciples({ ...principles, pillars });
                                                                }}
                                                                className="w-12 h-12 bg-[hsl(var(--admin-bg-alt))] rounded-xl text-center text-xl focus:ring-2 focus:ring-coral transition-all border-0 shadow-sm"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={p.title}
                                                                onChange={e => {
                                                                    const pillars = [...principles.pillars];
                                                                    pillars[i].title = e.target.value;
                                                                    setPrinciples({ ...principles, pillars });
                                                                }}
                                                                className="flex-1 bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-coral border-0 shadow-sm"
                                                            />
                                                            <button onClick={() => removeItem(principles.pillars, (l) => setPrinciples({ ...principles, pillars: l }), i)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">🗑️</button>
                                                        </div>
                                                        <textarea
                                                            rows={2}
                                                            value={p.desc}
                                                            onChange={e => {
                                                                const pillars = [...principles.pillars];
                                                                pillars[i].desc = e.target.value;
                                                                setPrinciples({ ...principles, pillars });
                                                            }}
                                                            className="w-full bg-[hsl(var(--admin-bg-alt))] p-4 rounded-xl text-sm resize-none focus:ring-2 focus:ring-coral border-0 shadow-sm"
                                                        />
                                                    </div>
                                                ))}
                                                {principles.pillars?.length > 0 && (
                                                    <button
                                                        onClick={() => addItem(principles.pillars, (l) => setPrinciples({ ...principles, pillars: l }), { icon: '🏛️', title: 'New Pillar', desc: '' })}
                                                        className="w-full py-6 rounded-2xl border-2 border-dashed border-[hsl(var(--admin-border))] text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 transition-all"
                                                    >
                                                        + Add Core Pillar
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-coral border-b border-[hsl(var(--admin-border))] pb-4">Dynamic Quote Messages</h3>
                                            <div className="grid grid-cols-1 gap-6">
                                                {(!principles.quotes || principles.quotes.length === 0) && (
                                                    <AdminEmptyState
                                                        title="No Dynamic Quotes"
                                                        description="Add engaging text with highlighted words to show on the public page."
                                                        icon={<MessageSquare className="w-12 h-12 text-coral/20" />}
                                                        actionText="Add Dynamic Quote"
                                                        onAction={() => addItem(principles.quotes || [], (l) => setPrinciples({ ...principles, quotes: l }), { text: "New Quote Here.", highlight: "Here", color: "text-accent" })}
                                                    />
                                                )}
                                                {(Array.isArray(principles.quotes) ? principles.quotes : []).map((q, i) => (
                                                    <div key={i} className="p-8 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] space-y-4">
                                                        <div className="flex justify-end">
                                                            <button onClick={() => removeItem(principles.quotes, (l) => setPrinciples({ ...principles, quotes: l }), i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors opacity-40 hover:opacity-100">Remove Quote 🗑️</button>
                                                        </div>
                                                        <textarea
                                                            rows={3}
                                                            value={q.text}
                                                            onChange={e => {
                                                                const quotes = [...principles.quotes];
                                                                quotes[i].text = e.target.value;
                                                                setPrinciples({ ...principles, quotes });
                                                            }}
                                                            className="w-full bg-[hsl(var(--admin-bg-alt))] p-5 rounded-xl text-lg font-display font-medium leading-relaxed focus:ring-2 focus:ring-coral border-0 shadow-sm"
                                                        />
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-2 block ml-1">Highlight Word</label>
                                                                <input
                                                                    type="text"
                                                                    value={q.highlight}
                                                                    onChange={e => {
                                                                        const quotes = [...principles.quotes];
                                                                        quotes[i].highlight = e.target.value;
                                                                        setPrinciples({ ...principles, quotes });
                                                                    }}
                                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-coral border-0 shadow-sm"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-2 block ml-1">Color Class</label>
                                                                <input
                                                                    type="text"
                                                                    value={q.color}
                                                                    onChange={e => {
                                                                        const quotes = [...principles.quotes];
                                                                        quotes[i].color = e.target.value;
                                                                        setPrinciples({ ...principles, quotes });
                                                                    }}
                                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-coral border-0 shadow-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {principles.quotes?.length > 0 && (
                                                    <button
                                                        onClick={() => addItem(principles.quotes, (l) => setPrinciples({ ...principles, quotes: l }), { text: "New Quote Here.", highlight: "Here", color: "text-accent" })}
                                                        className="w-full py-6 rounded-2xl border-2 border-dashed border-[hsl(var(--admin-border))] text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 transition-all"
                                                    >
                                                        + Add Quote Message
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STATS & VISIT TAB */}
                                {activeTab === 'stats' && (
                                    <div className="space-y-16">
                                        <div className="space-y-8">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-coral border-b border-[hsl(var(--admin-border))] pb-4">Denominational Statistics</h3>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                {(!stats.stats || stats.stats.length === 0) && (
                                                    <div className="col-span-2 lg:col-span-4">
                                                        <AdminEmptyState
                                                            title="No Statistics"
                                                            description="Showcase key numbers about your denomination."
                                                            icon={<BarChart3 className="w-12 h-12 text-coral/20" />}
                                                            actionText="Add Stat"
                                                            onAction={() => addItem(stats.stats || [], (l) => setStats({ ...stats, stats: l }), { value: '0', label: 'New Metric' })}
                                                        />
                                                    </div>
                                                )}
                                                {(Array.isArray(stats.stats) ? stats.stats : []).map((stat, i) => (
                                                    <div key={i} className="p-6 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] space-y-3 relative group">
                                                        <button onClick={() => removeItem(stats.stats, (l) => setStats({ ...stats, stats: l }), i)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">✕</button>
                                                        <input
                                                            type="text"
                                                            value={stat.value}
                                                            onChange={e => {
                                                                const s = [...stats.stats];
                                                                s[i].value = e.target.value;
                                                                setStats({ ...stats, stats: s });
                                                            }}
                                                            className="w-full bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-xl font-bold text-coral text-center border-0 shadow-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={stat.label}
                                                            onChange={e => {
                                                                const s = [...stats.stats];
                                                                s[i].label = e.target.value;
                                                                setStats({ ...stats, stats: s });
                                                            }}
                                                            className="w-full bg-[hsl(var(--admin-bg-alt))] p-2 rounded-xl text-[9px] font-bold uppercase tracking-tighter text-center border-0 shadow-sm"
                                                        />
                                                    </div>
                                                ))}
                                                {stats.stats?.length > 0 && (
                                                    <button
                                                        onClick={() => addItem(stats.stats, (l) => setStats({ ...stats, stats: l }), { value: '0', label: 'New Metric' })}
                                                        className="p-6 rounded-3xl border-2 border-dashed border-[hsl(var(--admin-border))] text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 transition-all flex items-center justify-center text-center"
                                                    >
                                                        + Add Stat
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-coral border-b border-[hsl(var(--admin-border))] pb-4">Invitation Section</h3>
                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Main Heading</label>
                                                    <input
                                                        type="text"
                                                        value={stats.visitTitle || ''}
                                                        onChange={e => setStats({ ...stats, visitTitle: e.target.value })}
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] p-5 rounded-2xl text-lg font-bold border-0"
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Subtitle narrative</label>
                                                    <textarea
                                                        rows={3}
                                                        value={stats.visitSubtitle || ''}
                                                        onChange={e => setStats({ ...stats, visitSubtitle: e.target.value })}
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] p-5 rounded-2xl text-sm font-medium leading-relaxed border-0 resize-none"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                                                    {(!stats.serviceTimes || stats.serviceTimes.length === 0) && (
                                                        <div className="md:col-span-3">
                                                            <AdminEmptyState
                                                                title="No Service Times"
                                                                description="Let people know when and where to visit."
                                                                icon={<Clock className="w-12 h-12 text-coral/20" />}
                                                                actionText="Add Schedule"
                                                                onAction={() => addItem(stats.serviceTimes || [], (l) => setStats({ ...stats, serviceTimes: l }), { label: 'Day', value: 'Time/Location' })}
                                                            />
                                                        </div>
                                                    )}
                                                    {(Array.isArray(stats.serviceTimes) ? stats.serviceTimes : []).map((item, i) => (
                                                        <div key={i} className="p-6 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] space-y-3 relative group">
                                                            <button onClick={() => removeItem(stats.serviceTimes, (l) => setStats({ ...stats, serviceTimes: l }), i)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">✕</button>
                                                            <input
                                                                type="text"
                                                                value={item.label}
                                                                onChange={e => {
                                                                    const times = [...stats.serviceTimes];
                                                                    times[i].label = e.target.value;
                                                                    setStats({ ...stats, serviceTimes: times });
                                                                }}
                                                                className="w-full bg-[hsl(var(--admin-bg-alt))] p-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border-0 shadow-sm"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={item.value}
                                                                onChange={e => {
                                                                    const times = [...stats.serviceTimes];
                                                                    times[i].value = e.target.value;
                                                                    setStats({ ...stats, serviceTimes: times });
                                                                }}
                                                                className="w-full bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-xs font-bold border-0 shadow-sm"
                                                            />
                                                        </div>
                                                    ))}
                                                    {stats.serviceTimes?.length > 0 && (
                                                        <button
                                                            onClick={() => addItem(stats.serviceTimes, (l) => setStats({ ...stats, serviceTimes: l }), { label: 'Day', value: 'Time/Location' })}
                                                            className="p-6 rounded-3xl border-2 border-dashed border-[hsl(var(--admin-border))] text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 transition-all flex items-center justify-center text-center"
                                                        >
                                                            + Add Schedule
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* COMMITTEES TAB */}
                                {activeTab === 'committees' && (
                                    <div className="space-y-12">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-coral border-b border-[hsl(var(--admin-border))] pb-4">Denominational Governance</h3>
                                        <div className="grid grid-cols-1 gap-8">
                                            {(!committees || committees.length === 0) && (
                                                <AdminEmptyState
                                                    title="No Standing Committees"
                                                    description="Outline your church governance and standing committees."
                                                    icon={<Landmark className="w-12 h-12 text-coral/20" />}
                                                    actionText="Add Standing Committee"
                                                    onAction={() => setCommittees([...committees, { icon: 'Landmark', name: 'New Committee', description: '', details: ['', ''], officers: [], photo: '' }])}
                                                />
                                            )}
                                            {(Array.isArray(committees) ? committees : []).map((com, i) => (
                                                <div key={i} className="p-8 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] space-y-6 relative group">
                                                    <button onClick={() => removeItem(committees, setCommittees, i)} className="absolute top-8 right-8 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Delete Committee</button>
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="text"
                                                            value={com.icon}
                                                            onChange={e => {
                                                                const newComs = [...committees];
                                                                newComs[i].icon = e.target.value;
                                                                setCommittees(newComs);
                                                            }}
                                                            className="w-14 h-14 bg-[hsl(var(--admin-bg-alt))] rounded-2xl text-center text-2xl border-0 shadow-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={com.name}
                                                            onChange={e => {
                                                                const newComs = [...committees];
                                                                newComs[i].name = e.target.value;
                                                                setCommittees(newComs);
                                                            }}
                                                            className="flex-1 bg-[hsl(var(--admin-bg-alt))] p-4 rounded-2xl text-sm font-bold border-0 shadow-sm"
                                                        />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Committee Statement/Description</label>
                                                        <textarea
                                                            rows={4}
                                                            value={com.description}
                                                            onChange={e => {
                                                                const newComs = [...committees];
                                                                newComs[i].description = e.target.value;
                                                                setCommittees(newComs);
                                                            }}
                                                            className="w-full bg-[hsl(var(--admin-bg-alt))] p-5 rounded-2xl text-sm border-0 shadow-sm resize-none font-medium"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-widest opacity-30 ml-1">Key Duties / Rules</label>
                                                                <button
                                                                    onClick={() => {
                                                                        const newComs = [...committees];
                                                                        newComs[i].details = [...(newComs[i].details || []), 'New duty'];
                                                                        setCommittees(newComs);
                                                                    }}
                                                                    className="text-[9px] font-bold uppercase tracking-widest text-coral"
                                                                >+ Add Duty</button>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {(Array.isArray(com.details) ? com.details : []).map((detail, di) => (
                                                                    <div key={di} className="flex gap-3">
                                                                        <input
                                                                            type="text"
                                                                            value={detail}
                                                                            onChange={e => {
                                                                                const newComs = [...committees];
                                                                                newComs[i].details[di] = e.target.value;
                                                                                setCommittees(newComs);
                                                                            }}
                                                                            className="flex-1 bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-xs border-0 shadow-sm"
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const newComs = [...committees];
                                                                                newComs[i].details.splice(di, 1);
                                                                                setCommittees(newComs);
                                                                            }}
                                                                            className="text-xs opacity-20 hover:opacity-100 transition-opacity"
                                                                        >✕</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-widest opacity-30 ml-1">Committee Officers</label>
                                                                <button
                                                                    onClick={() => {
                                                                        const newComs = [...committees];
                                                                        newComs[i].officers = [...(newComs[i].officers || []), { name: '', role: '', photo: '' }];
                                                                        setCommittees(newComs);
                                                                    }}
                                                                    className="text-[9px] font-bold uppercase tracking-widest text-coral"
                                                                >+ Add Officer</button>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {(Array.isArray(com.officers) ? com.officers : []).map((off, oi) => (
                                                                    <div key={oi} className="p-4 bg-[hsl(var(--admin-bg-alt))] rounded-2xl shadow-sm border border-[hsl(var(--admin-border))] flex items-center gap-4">
                                                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-coral/20 shrink-0 group/avatar cursor-pointer">
                                                                            {off.photo ? (
                                                                                <img src={off.photo} alt={off.name} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-full h-full bg-coral/5 flex items-center justify-center text-coral/30 text-lg">👤</div>
                                                                            )}
                                                                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                                                                <span className="text-white text-[8px] font-bold uppercase">📷</span>
                                                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e.target.files[0], `committee-${i}-officer-${oi}`)} />
                                                                            </label>
                                                                        </div>
                                                                        <div className="flex-1 space-y-2">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Officer Name"
                                                                                value={off.name}
                                                                                onChange={e => {
                                                                                    const newComs = [...committees];
                                                                                    newComs[i].officers[oi].name = e.target.value;
                                                                                    setCommittees(newComs);
                                                                                }}
                                                                                className="w-full bg-[hsl(var(--admin-bg))] p-2.5 rounded-xl text-[11px] font-bold border-0"
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Role / Position"
                                                                                value={off.role}
                                                                                onChange={e => {
                                                                                    const newComs = [...committees];
                                                                                    newComs[i].officers[oi].role = e.target.value;
                                                                                    setCommittees(newComs);
                                                                                }}
                                                                                className="w-full bg-[hsl(var(--admin-bg))] p-2.5 rounded-xl text-[10px] border-0 text-coral/60"
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                const newComs = [...committees];
                                                                                newComs[i].officers.splice(oi, 1);
                                                                                setCommittees(newComs);
                                                                            }}
                                                                            className="text-xs opacity-20 hover:opacity-100 hover:text-red-500 transition-all shrink-0"
                                                                        >✕</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {committees?.length > 0 && (
                                            <button
                                                onClick={() => setCommittees([...committees, { icon: '🏛️', name: 'New Committee', description: '', details: ['', ''], officers: [], photo: '' }])}
                                                className="w-full h-16 rounded-2xl border-2 border-dashed border-[hsl(var(--admin-border))] text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 hover:border-coral/20 transition-all"
                                            >
                                                + Add New Standing Committee
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* PRESBYTERIES TAB */}
                                {activeTab === 'presbyteries' && (
                                    <div className="space-y-12">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-coral border-b border-[hsl(var(--admin-border))] pb-4">Regional Governance</h3>
                                        <div className="grid grid-cols-1 gap-8">
                                            {(!presbyteries || presbyteries.length === 0) && (
                                                <AdminEmptyState
                                                    title="No Presbyteries"
                                                    description="Organize your regional church councils and rosters."
                                                    icon={<Globe className="w-12 h-12 text-coral/20" />}
                                                    actionText="Add Regional Presbytery"
                                                    onAction={() => setPresbyteries([{ id: Date.now().toString(), name: 'New Presbytery', region: 'NCR', officers: [], description: '', photo: '', website: '' }])}
                                                />
                                            )}
                                            {(Array.isArray(presbyteries) ? presbyteries : []).map((p, idx) => (
                                                <div key={p.id || idx} className="p-8 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] space-y-6 relative group">
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Delete this record?')) {
                                                                const updated = [...presbyteries];
                                                                updated.splice(idx, 1);
                                                                setPresbyteries(updated);
                                                            }
                                                        }}
                                                        className="absolute top-8 right-8 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >Delete Record</button>
                                                    <div className="flex flex-col md:flex-row gap-8">
                                                        <div className="flex-1 space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Presbytery Name</label>
                                                                    <input type="text" value={p.name} onChange={e => { const updated = [...presbyteries]; updated[idx] = { ...updated[idx], name: e.target.value }; setPresbyteries(updated); }} className="w-full bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-xs font-bold border-0 shadow-sm" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Region</label>
                                                                    <select value={p.region} onChange={e => { const updated = [...presbyteries]; updated[idx] = { ...updated[idx], region: e.target.value }; setPresbyteries(updated); }} className="w-full bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-xs font-bold border-0 shadow-sm">
                                                                        {['NCR', 'Luzon', 'Visayas', 'Mindanao', 'CAR'].map(r => (<option key={r} value={r}>{r}</option>))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Regional Narrative / Description</label>
                                                                <textarea value={p.description} onChange={e => { const updated = [...presbyteries]; updated[idx].description = e.target.value; setPresbyteries(updated); }} rows={2} className="w-full bg-[hsl(var(--admin-bg-alt))] p-4 rounded-xl text-sm border-0 shadow-sm resize-none font-medium" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Official Website URL</label>
                                                                <input type="text" placeholder="https://..." value={p.website || ''} onChange={e => { const updated = [...presbyteries]; updated[idx] = { ...updated[idx], website: e.target.value }; setPresbyteries(updated); }} className="w-full bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-[10px] font-bold border-0 shadow-sm" />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-30 ml-1">Commissioned Elders / Officers</label>
                                                                    <button onClick={() => { const updated = [...presbyteries]; updated[idx].officers = [...(updated[idx].officers || []), { name: '', role: '', photo: '' }]; setPresbyteries(updated); }} className="text-[9px] font-bold uppercase tracking-widest text-coral">+ Add Officer</button>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {(Array.isArray(p.officers) ? p.officers : []).map((off, oIdx) => {
                                                                        const offName = typeof off === 'string' ? off : off.name;
                                                                        const offRole = typeof off === 'string' ? '' : off.role;
                                                                        const offPhoto = typeof off === 'string' ? '' : (off.photo || '');
                                                                        return (
                                                                            <div key={oIdx} className="p-4 bg-[hsl(var(--admin-bg-alt))] rounded-2xl shadow-sm border border-[hsl(var(--admin-border))] flex items-center gap-4">
                                                                                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-coral/20 shrink-0 group/avatar cursor-pointer">
                                                                                    {offPhoto ? (
                                                                                        <img src={offPhoto} alt={offName} className="w-full h-full object-cover" />
                                                                                    ) : (
                                                                                        <div className="w-full h-full bg-coral/5 flex items-center justify-center text-coral/30 text-lg">👤</div>
                                                                                    )}
                                                                                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                                                                        <span className="text-white text-[8px] font-bold uppercase">📷</span>
                                                                                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e.target.files[0], `presbytery-${idx}-officer-${oIdx}`)} />
                                                                                    </label>
                                                                                </div>
                                                                                <div className="flex-1 space-y-2">
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="Officer Name"
                                                                                        value={offName}
                                                                                        onChange={e => {
                                                                                            const updated = [...presbyteries];
                                                                                            if (typeof updated[idx].officers[oIdx] === 'string') {
                                                                                                updated[idx].officers[oIdx] = { name: e.target.value, role: '', photo: '' };
                                                                                            } else {
                                                                                                updated[idx].officers[oIdx].name = e.target.value;
                                                                                            }
                                                                                            setPresbyteries(updated);
                                                                                        }}
                                                                                        className="w-full bg-[hsl(var(--admin-bg))] p-2.5 rounded-xl text-[11px] font-bold border-0"
                                                                                    />
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="Role / Position"
                                                                                        value={offRole}
                                                                                        onChange={e => {
                                                                                            const updated = [...presbyteries];
                                                                                            if (typeof updated[idx].officers[oIdx] === 'string') {
                                                                                                updated[idx].officers[oIdx] = { name: updated[idx].officers[oIdx], role: e.target.value, photo: '' };
                                                                                            } else {
                                                                                                updated[idx].officers[oIdx].role = e.target.value;
                                                                                            }
                                                                                            setPresbyteries(updated);
                                                                                        }}
                                                                                        className="w-full bg-[hsl(var(--admin-bg))] p-2.5 rounded-xl text-[10px] border-0 text-coral/60"
                                                                                    />
                                                                                </div>
                                                                                <button onClick={() => { const updated = [...presbyteries]; updated[idx].officers.splice(oIdx, 1); setPresbyteries(updated); }} className="text-xs opacity-20 hover:opacity-100 hover:text-red-500 transition-all shrink-0">✕</button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {presbyteries?.length > 0 && (
                                            <button onClick={() => setPresbyteries([...presbyteries, { id: Date.now().toString(), name: 'New Presbytery', region: 'NCR', officers: [], description: '', photo: '', website: '' }])} className="w-full h-16 rounded-2xl border-2 border-dashed border-[hsl(var(--admin-border))] text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 hover:border-coral/20 transition-all font-display"> + Add New Presbytery </button>
                                        )}
                                    </div>
                                )}

                                {/* GIVING PORTAL TAB */}
                                {activeTab === 'donations' && (
                                    <div className="space-y-12">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {[
                                                { key: 'heading', label: 'Primary Heading', placeholder: 'Give Generously.' },
                                                { key: 'contactEmail', label: 'Management Email', placeholder: 'give@pcp.org' },
                                                { key: 'subtitle', label: 'Portal Subtitle', placeholder: 'Your generosity helps...' },
                                            ].map((field) => (
                                                <div key={field.key} className={field.key === 'subtitle' ? 'md:col-span-2' : ''}>
                                                    <label className="block text-coral text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">{field.label}</label>
                                                    <input
                                                        value={donations[field.key] || ''}
                                                        onChange={(e) => setDonations({ ...donations, [field.key]: e.target.value })}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-8 pt-6 border-t border-[hsl(var(--admin-border))]">
                                            <div>
                                                <label className="block text-coral text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">Inspirational Reflection</label>
                                                <textarea
                                                    value={donations.scriptureText || ''}
                                                    onChange={(e) => setDonations({ ...donations, scriptureText: e.target.value })}
                                                    rows={4}
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm italic focus:ring-2 focus:ring-coral/20 outline-none transition-all resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-coral text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">Citation</label>
                                                <input
                                                    value={donations.scriptureRef || ''}
                                                    onChange={(e) => setDonations({ ...donations, scriptureRef: e.target.value })}
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[hsl(var(--admin-border))]">
                                            {[
                                                { id: 'gcash', label: 'GCash Payment QR', key: 'gcashQR' },
                                                { id: 'maya', label: 'Maya Payment QR', key: 'mayaQR' },
                                            ].map(qr => (
                                                <div key={qr.id} className="space-y-4">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">{qr.label}</label>
                                                    <div className={`aspect-square w-full max-w-[200px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative group ${donations[qr.key] ? 'border-coral/20 bg-coral/5' : 'border-[hsl(var(--admin-border))]'}`}>
                                                        {donations[qr.key] ? (
                                                            <img src={donations[qr.key]} alt={qr.label} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <span className="text-[20px] opacity-20">📸</span>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <label className="cursor-pointer px-4 py-2 bg-white text-coral text-[9px] font-bold uppercase rounded-xl">
                                                                Upload
                                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e.target.files[0], qr.id)} />
                                                            </label>
                                                            {donations[qr.key] && (
                                                                <button
                                                                    onClick={() => setDonations({ ...donations, [qr.key]: '' })}
                                                                    className="mt-2 text-white text-[8px] font-bold uppercase hover:text-red-400"
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ANNOUNCEMENT TAB */}
                                {activeTab === 'announcement' && (
                                    <div className="space-y-10">
                                        {/* Header & Toggle */}
                                        <div className="flex items-start justify-between p-6 bg-[hsl(var(--admin-bg-alt))] rounded-2xl border border-[hsl(var(--admin-border))]">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                                                    <Bell className="w-5 h-5 text-accent" />
                                                </div>
                                                <div>
                                                    <h3 className="text-[hsl(var(--admin-text))] font-bold text-base mb-1">Site-Wide Announcement Popup</h3>
                                                    <p className="text-[hsl(var(--admin-text-dim))] text-xs leading-relaxed max-w-md">
                                                        When active, this popup will appear once for each visitor when they land on the homepage. Visitors who close it won&apos;t see it again unless you change the title or message.
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                                                <input
                                                    type="checkbox"
                                                    checked={!!announcement.isActive}
                                                    onChange={(e) => setAnnouncement({ ...announcement, isActive: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-[hsl(var(--admin-border))] rounded-full peer peer-checked:bg-accent transition-colors duration-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:shadow-md after:transition-all after:duration-300 peer-checked:after:translate-x-7" />
                                                <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--admin-text-dim))]">
                                                    {announcement.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </label>
                                        </div>

                                        {/* Type Selector */}
                                        <div>
                                            <label className="block text-accent text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">Announcement Type</label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {[
                                                    { id: 'info', label: 'Information', emoji: 'ℹ', color: 'hsl(221 83% 53%)' },
                                                    { id: 'event', label: 'Event', emoji: '✦', color: 'hsl(262 83% 58%)' },
                                                    { id: 'warning', label: 'Warning', emoji: '⚠', color: 'hsl(38 92% 50%)' },
                                                    { id: 'urgent', label: 'Urgent', emoji: '!', color: 'hsl(0 84% 60%)' }
                                                ].map((type) => (
                                                    <button
                                                        key={type.id}
                                                        onClick={() => setAnnouncement({ ...announcement, type: type.id })}
                                                        className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-left ${(announcement.type || 'info') === type.id
                                                            ? 'border-accent bg-accent/5 scale-[1.02]'
                                                            : 'border-[hsl(var(--admin-border))] hover:border-accent/30'
                                                            }`}
                                                    >
                                                        <div
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base mb-2"
                                                            style={{ background: type.color }}
                                                        >
                                                            {type.emoji}
                                                        </div>
                                                        <div className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--admin-text))]">
                                                            {type.label}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Title & Message */}
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-accent text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">Title</label>
                                                <input
                                                    value={announcement.title || ''}
                                                    onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                                    placeholder="e.g. Special Sunday Service"
                                                    maxLength={80}
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-base font-semibold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                                />
                                                <div className="mt-2 text-right text-[9px] text-[hsl(var(--admin-text-dim))]">
                                                    {(announcement.title || '').length} / 80
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-accent text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">Message</label>
                                                <textarea
                                                    value={announcement.message || ''}
                                                    onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                                                    placeholder="Write the full announcement message here. You can use multiple lines."
                                                    rows={5}
                                                    maxLength={500}
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none"
                                                />
                                                <div className="mt-2 text-right text-[9px] text-[hsl(var(--admin-text-dim))]">
                                                    {(announcement.message || '').length} / 500
                                                </div>
                                            </div>
                                        </div>

                                        {/* Optional Media (Image / Video) */}
                                        <div className="space-y-6 pt-6 border-t border-[hsl(var(--admin-border))]">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-[hsl(var(--admin-text))] text-xs font-bold uppercase tracking-widest">Featured Media</h4>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--admin-text-dim))] px-2 py-0.5 rounded-full bg-[hsl(var(--admin-bg-alt))]">Optional</span>
                                            </div>

                                            <div className="relative group">
                                                <div className={`w-full aspect-[16/9] rounded-3xl border-2 border-dashed overflow-hidden transition-all duration-500 flex items-center justify-center ${announcement.mediaUrl ? 'border-accent/40 bg-black' : 'border-[hsl(var(--admin-border))] hover:border-accent/40 bg-[hsl(var(--admin-bg-alt))]'}`}>
                                                    {isUploading ? (
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                                                            <p className="text-accent text-[10px] font-bold uppercase tracking-widest">Uploading Media...</p>
                                                        </div>
                                                    ) : announcement.mediaUrl ? (
                                                        announcement.mediaType === 'video' ? (
                                                            <video
                                                                src={announcement.mediaUrl}
                                                                controls
                                                                playsInline
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={announcement.mediaUrl}
                                                                alt="Announcement Media"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )
                                                    ) : (
                                                        <div className="text-center p-8">
                                                            <div className="flex items-center justify-center gap-3 mb-3">
                                                                <ImagePlus className="w-5 h-5 text-[hsl(var(--admin-text-dim))]/50" />
                                                                <Film className="w-5 h-5 text-[hsl(var(--admin-text-dim))]/50" />
                                                            </div>
                                                            <p className="text-[hsl(var(--admin-text-dim))] text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Add a photo or short video</p>
                                                            <p className="text-[hsl(var(--admin-text-dim))]/40 text-[9px] uppercase tracking-widest">Image up to 8 MB · Video up to 25 MB</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {!isUploading && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/45 backdrop-blur-sm rounded-3xl">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <label className="cursor-pointer px-10 py-4 bg-white text-accent text-[11px] font-bold uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl">
                                                                {announcement.mediaUrl ? 'Replace Media' : 'Upload Image or Video'}
                                                                <input
                                                                    type="file"
                                                                    accept="image/*,video/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handleImageUpload(e.target.files[0], 'announcement')}
                                                                />
                                                            </label>
                                                            {announcement.mediaUrl && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setAnnouncement({ ...announcement, mediaUrl: '', mediaType: '' }); }}
                                                                    className="flex items-center gap-2 text-white text-[9px] font-bold uppercase tracking-widest hover:text-red-300 transition-colors"
                                                                >
                                                                    <X className="w-3 h-3" /> Remove Media
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Optional CTA Button */}
                                        <div className="space-y-6 pt-6 border-t border-[hsl(var(--admin-border))]">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-[hsl(var(--admin-text))] text-xs font-bold uppercase tracking-widest">Call-to-Action Button</h4>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--admin-text-dim))] px-2 py-0.5 rounded-full bg-[hsl(var(--admin-bg-alt))]">Optional</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-accent text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">Button Text</label>
                                                    <input
                                                        value={announcement.buttonText || ''}
                                                        onChange={(e) => setAnnouncement({ ...announcement, buttonText: e.target.value })}
                                                        placeholder="e.g. Learn More"
                                                        maxLength={30}
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-accent text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">Button Link</label>
                                                    <input
                                                        value={announcement.buttonLink || ''}
                                                        onChange={(e) => setAnnouncement({ ...announcement, buttonLink: e.target.value })}
                                                        placeholder="e.g. /churches or https://..."
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] border-0 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Live Preview */}
                                        <div className="pt-6 border-t border-[hsl(var(--admin-border))]">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Eye className="w-4 h-4 text-accent" />
                                                <h4 className="text-[hsl(var(--admin-text))] text-xs font-bold uppercase tracking-widest">Live Preview</h4>
                                            </div>
                                            <div className="bg-gradient-to-br from-[hsl(var(--admin-bg-alt))] to-[hsl(var(--admin-bg))] p-12 rounded-3xl border border-[hsl(var(--admin-border))]">
                                                <div className="max-w-md mx-auto bg-white rounded-[2rem] overflow-hidden shadow-2xl">
                                                    {(() => {
                                                        const typeStyles = {
                                                            info: { bg: 'hsl(221 83% 53%)', icon: 'ℹ' },
                                                            event: { bg: 'hsl(262 83% 58%)', icon: '✦' },
                                                            warning: { bg: 'hsl(38 92% 50%)', icon: '⚠' },
                                                            urgent: { bg: 'hsl(0 84% 60%)', icon: '!' }
                                                        };
                                                        const t = typeStyles[announcement.type || 'info'];
                                                        return (
                                                            <>
                                                                <div className="text-white p-8 text-center relative overflow-hidden" style={{ background: t.bg }}>
                                                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm text-2xl font-bold">
                                                                        {t.icon}
                                                                    </div>
                                                                    <h3 className="text-2xl font-bold tracking-tight">
                                                                        {announcement.title || 'Your Title Here'}
                                                                    </h3>
                                                                </div>
                                                                {announcement.mediaUrl && (
                                                                    <div className="bg-black aspect-[16/9] overflow-hidden">
                                                                        {announcement.mediaType === 'video' ? (
                                                                            <video
                                                                                src={announcement.mediaUrl}
                                                                                controls
                                                                                playsInline
                                                                                className="w-full h-full object-contain"
                                                                            />
                                                                        ) : (
                                                                            <img
                                                                                src={announcement.mediaUrl}
                                                                                alt="Announcement Media"
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <div className="p-8 text-center bg-white">
                                                                    <p className="text-gray-600 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                                                                        {announcement.message || 'Your announcement message will appear here.'}
                                                                    </p>
                                                                    {announcement.buttonText && announcement.buttonLink ? (
                                                                        <div className="px-8 py-3.5 w-full bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest text-center">
                                                                            {announcement.buttonText}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="px-8 py-3.5 w-full bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest text-center">
                                                                            Close Message
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                <p className="text-center text-[hsl(var(--admin-text-dim))] text-[10px] uppercase tracking-widest font-bold mt-6">
                                                    {announcement.isActive ? '✦ Will Show on Homepage' : '○ Currently Hidden'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Reset notice */}
                                        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                                            <p className="text-amber-900 text-xs leading-relaxed">
                                                <strong>Tip:</strong> Each visitor will see this popup only once. If you change the <strong>Title</strong> or <strong>Message</strong>, all visitors will see the updated popup again on their next visit (it&apos;s treated as a new announcement).
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Live preview column (desktop) */}
                        <div className="hidden xl:block xl:sticky xl:top-24">
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--admin-text-dim))]">Live Preview</span>
                                <span className="text-[10px] text-[hsl(var(--admin-text-dim))]/40 tracking-wide ml-1">— how this section looks on the site</span>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <ContentPreview
                                        tab={activeTab}
                                        hero={hero}
                                        identity={identity}
                                        mission={mission}
                                        principles={principles}
                                        stats={stats}
                                        committees={committees}
                                        presbyteries={presbyteries}
                                        donations={donations}
                                        announcement={announcement}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Feedback & Save Bar */}
                        <div className="fixed bottom-0 left-0 right-0 p-8 flex flex-col items-center pointer-events-none z-[100]">
                            <div className="w-full max-w-7xl mx-auto flex justify-center">
                                <button
                                    id="tour-save"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`h-18 px-24 rounded-2xl text-[11px] font-bold uppercase tracking-[0.3em] shadow-2xl transition-all duration-500 pointer-events-auto hover:scale-105 active:scale-95 ${saving
                                        ? 'bg-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-dim))]'
                                        : 'bg-coral text-white hover:shadow-coral/30'
                                        }`}
                                >
                                    {saving ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                            Updating Cloud Experience...
                                        </div>
                                    ) : (
                                        'Update Live Narrative ✦'
                                    )}
                                </button>
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
