import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getSettings, saveSettings } from '../lib/store.js';
import { uploadFile } from '../lib/storage.js';
import { defaultPresbyteries } from '../lib/seed-data.js';
import { mergePresbyteries } from '../lib/directorySync.js';
import GuidedTour from '../components/admin/GuidedTour.jsx';
import { AdminSkeleton, AdminHeaderSkeleton, AdminCardSkeleton } from '../components/admin/AdminSkeleton.jsx';
import AdminEmptyState from '../components/admin/AdminEmptyState.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import ContentPreview from '../components/admin/ContentPreview.jsx';
import IconPicker from '../components/admin/IconPicker.jsx';
import AnnouncementModal from '../components/AnnouncementModal.jsx';
import {
    Home,
    Palette,
    Scroll,
    Footprints,
    Amphora,
    BarChart3,
    Landmark,
    CircleDollarSign,
    Sparkles,
    Eye,
    Globe,
    Target,
    Activity,
    Clock,
    Bell,
    CalendarDays,
    ChevronUp,
    ChevronDown,
    RefreshCw,
    Plus,
    ImagePlus,
    Film,
    Quote,
    Trash2,
    X,
    ExternalLink
} from 'lucide-react';

// Labels name the public site section each tab edits (the old one-word metaphor
// labels were mislabelled too: id 'mission' read "Narrative", id 'points' read
// "Mission"). IDs are unchanged so saved data + section logic are untouched.
const TABS = [
    { id: 'hero', label: 'Homepage Banner', icon: Home },
    { id: 'identity', label: 'Name & Footer', icon: Palette },
    { id: 'mission', label: 'Mission & Vision', icon: Scroll },
    { id: 'points', label: 'Mission Points', icon: Footprints },
    { id: 'commitments', label: 'Commitments', icon: Amphora },
    { id: 'welcome', label: 'Welcome Messages', icon: Quote },
    { id: 'stats', label: 'Stats & Visit Info', icon: BarChart3 },
    { id: 'committees', label: 'Standing Committees', icon: Landmark },
    { id: 'presbyteries', label: 'Church Directory', icon: Globe },
    { id: 'donations', label: 'Giving', icon: CircleDollarSign },
    { id: 'announcement', label: 'Announcement Popup', icon: Bell },
    { id: 'events', label: 'Upcoming Events', icon: CalendarDays },
    { id: 'videos', label: 'Video Greetings', icon: Film }
];

// Shared field styles. Padding is responsive (smaller on phones) so long values
// aren't clipped on narrow screens. Long-content fields use the textarea variant
// so the text wraps and is fully visible instead of scrolling out of a one-line box.
const FIELD_CLS = 'w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm font-medium focus:ring-2 focus:ring-coral/20 outline-none transition-all';
const FIELD_TEXTAREA_CLS = FIELD_CLS + ' leading-relaxed resize-y min-h-[3.5rem]';

export default function AdminContent() {
    const [activeTab, setActiveTab] = useState('identity');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isTourActive, setIsTourActive] = useState(false);
    // Live preview opens as a slide-over panel (toggle) instead of a permanent
    // side column, so the editor fields get the full width and don't feel cramped.
    const [showPreview, setShowPreview] = useState(false);

    // Esc closes the live-preview panel.
    useEffect(() => {
        if (!showPreview) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setShowPreview(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showPreview]);

    const tourSteps = [
        { selector: '#tour-tabs', title: 'Content Categories', message: 'Switch between different sections like Identity, Mission, and Governance using these tabs.' },
        { selector: '#tour-fields-header', title: 'Live Editing', message: 'You can edit the text fields directly. Changes will be saved once you click the button at the bottom.' },
        { selector: '#tour-dynamic', title: 'Dynamic Lists', message: 'Use the "+ Add" and delete buttons to manage lists like Mission Points or Committee Duties.' },
        { selector: '#tour-save', title: 'Save Everything', message: 'CRITICAL: Always click here to push your changes to the live website. It may take 60 seconds to update.' }
    ];

    const [identity, setIdentity] = useState({});
    const [mission, setMission] = useState({});
    const [stats, setStats] = useState({});
    const [committees, setCommittees] = useState([]);
    const [presbyteries, setPresbyteries] = useState([]);
    const [hero, setHero] = useState({});
    const [donations, setDonations] = useState({});
    const [announcement, setAnnouncement] = useState({});
    const [events, setEvents] = useState([]);
    const [videoGreetings, setVideoGreetings] = useState([]);
    const [welcomeOfficers, setWelcomeOfficers] = useState([]);
    const [showPopupPreview, setShowPopupPreview] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        async function load() {
            const [id, mv, iv, coms, hr, dn, an] = await Promise.all([
                getSettings('site-identity'),
                getSettings('mission-vision'),
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
            setStats(iv && iv.stats ? iv : {
                stats: [{ value: '', label: '' }],
                visitTitle: '', visitSubtitle: '',
                serviceTimes: [{ label: '', value: '' }]
            });
            setCommittees(Array.isArray(coms) ? coms : []);
            setHero(hr || {});
            setDonations(dn || {});
            setAnnouncement(an && Object.keys(an).length > 0 ? { type: 'info', ...an } : { isActive: false, type: 'info', title: 'Upcoming Service', message: 'Join us this Sunday!', buttonText: '', buttonLink: '', updatedAt: Date.now() });
            const ue = await getSettings('upcoming-events');
            setEvents(Array.isArray(ue) ? ue : []);
            const vg = await getSettings('video-greetings');
            setVideoGreetings(Array.isArray(vg) ? vg : []);
            const wo = await getSettings('welcome-officers');
            setWelcomeOfficers(Array.isArray(wo) ? wo : []);
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
                saveSettings('invitation-stats', stats),
                saveSettings('standing-committees', committees),
                saveSettings('presbyteries', presbyteries),
                saveSettings('hero', hero),
                saveSettings('donations', donations),
                saveSettings('announcement', { ...announcement, updatedAt: Date.now() }),
                saveSettings('upcoming-events', events),
                saveSettings('video-greetings', videoGreetings),
                saveSettings('welcome-officers', welcomeOfficers)
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

    const handleSyncDirectory = () => {
        if (!confirm('Sync the directory from the latest defaults? Officer rosters are refreshed from the latest directory (your uploaded officer photos are kept), and churches are added or updated without removing your existing entries.')) return;
        const merged = mergePresbyteries(presbyteries, defaultPresbyteries);
        setPresbyteries(merged);
        toast.success('Directory synced — review, then Save to publish ✦');
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

        const isEvent = target.startsWith('event-');
        const isVgVideo = target.startsWith('vg-video-');
        const isVgPoster = target.startsWith('vg-poster-');
        const isWoPhoto = target.startsWith('wo-photo-');

        // Validate by kind. Images (announcement, event poster, video-greeting
        // poster, welcome-officer photo) are capped small; greeting videos accept
        // video files up to 50 MB — for longer clips the admin pastes a link.
        if (target === 'announcement' || isEvent || isVgPoster || isWoPhoto) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please choose an image file (JPG, PNG, WEBP, GIF).');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Image must be 10 MB or smaller.');
                return;
            }
        } else if (isVgVideo) {
            if (!file.type.startsWith('video/')) {
                toast.error('Please choose a video file (MP4, MOV, WEBM).');
                return;
            }
            if (file.size > 50 * 1024 * 1024) {
                toast.error('Video must be 50 MB or smaller. For a longer video, paste a YouTube/Facebook link instead.');
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

            // Other uploads (hero, QR, announcement, event poster, video greetings,
            // welcome-officer photo): Firebase Storage
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const folder = isEvent ? 'events'
                : ((isVgVideo || isVgPoster) ? 'videos'
                    : (isWoPhoto ? 'welcome-officers' : target));
            const path = `content/${folder}/${Date.now()}-${safeName}`;
            const url = await uploadFile(path, file);
            if (target === 'hero') setHero({ ...hero, heroImage: url });
            else if (target === 'announcement') {
                setAnnouncement({ ...announcement, mediaUrl: url, mediaType: 'image' });
            } else if (isEvent) {
                const idx = parseInt(target.split('-')[1], 10);
                setEvents((prev) => prev.map((ev, i) => (i === idx ? { ...ev, imageUrl: url } : ev)));
            } else if (isVgVideo) {
                const idx = parseInt(target.split('-')[2], 10);
                setVideoGreetings((prev) => prev.map((g, i) => (i === idx ? { ...g, videoUrl: url } : g)));
            } else if (isVgPoster) {
                const idx = parseInt(target.split('-')[2], 10);
                setVideoGreetings((prev) => prev.map((g, i) => (i === idx ? { ...g, posterUrl: url } : g)));
            } else if (isWoPhoto) {
                const idx = parseInt(target.split('-')[2], 10);
                setWelcomeOfficers((prev) => prev.map((o, i) => (i === idx ? { ...o, photo: url } : o)));
            }

            toast.success('Media uploaded successfully ✦');
        } catch (err) {
            // Show the Firebase error code when present — it's the actionable
            // part (e.g. storage/unauthorized → re-login; storage/canceled).
            toast.error(err?.code ? `${err.message} (${err.code})` : (err?.message || 'Upload failed'));
        } finally {
            setIsUploading(false);
        }
    };

    // Drag-and-drop upload — a file-dialog-FREE path. The native Windows "Open"
    // dialog can hang while enumerating large/cloud (OneDrive) image folders, so
    // dragging a file straight onto the box lets the admin upload without it.
    const handleDrop = (e, target) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (file) handleImageUpload(file, target);
    };
    const allowDrop = (e) => e.preventDefault();

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

    // Upcoming Events helpers — a free-length, reorderable list (no minimum).
    const addEvent = () => {
        const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setEvents([...events, { id, imageUrl: '', title: '', date: '', venue: '' }]);
    };
    const updateEvent = (i, patch) => {
        setEvents((prev) => prev.map((ev, idx) => (idx === i ? { ...ev, ...patch } : ev)));
    };
    const removeEvent = (i) => {
        setEvents((prev) => prev.filter((_, idx) => idx !== i));
    };
    const moveEvent = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= events.length) return;
        setEvents((prev) => {
            const next = [...prev];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
        });
    };

    // Re-publish the popup so every visitor (even those who already closed it)
    // sees it again — bumping updatedAt changes the per-visitor "seen" id.
    const handleShowAgainToAll = async () => {
        const bumped = { ...announcement, updatedAt: Date.now() };
        setAnnouncement(bumped);
        const ok = await saveSettings('announcement', bumped);
        if (ok) toast.success('Re-published — all visitors will see the popup again ✦');
        else toast.error('Could not re-publish the popup.');
    };

    // Video Greetings helpers — a capped, reorderable list shown after the hero.
    const MAX_VIDEO_GREETINGS = 6;
    const addVideoGreeting = () => {
        if (videoGreetings.length >= MAX_VIDEO_GREETINGS) {
            return toast.error(`You can add up to ${MAX_VIDEO_GREETINGS} videos.`);
        }
        const id = `vg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setVideoGreetings([...videoGreetings, { id, videoUrl: '', posterUrl: '', title: '', caption: '' }]);
    };
    const updateVideoGreeting = (i, patch) => {
        setVideoGreetings((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
    };
    const removeVideoGreeting = (i) => {
        setVideoGreetings((prev) => prev.filter((_, idx) => idx !== i));
    };
    const moveVideoGreeting = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= videoGreetings.length) return;
        setVideoGreetings((prev) => {
            const next = [...prev];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
        });
    };
    // Detect a direct (uploaded) video file vs a YouTube/link, for the editor preview.
    const isVideoFileUrl = (url) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(String(url || ''));

    // Welcome Officers helpers — the "A Word of Welcome" carousel in the Message
    // section. Only officers that carry a message render on the site.
    const MAX_WELCOME_OFFICERS = 8;
    const addOfficer = () => {
        if (welcomeOfficers.length >= MAX_WELCOME_OFFICERS) {
            return toast.error(`You can add up to ${MAX_WELCOME_OFFICERS} officers.`);
        }
        const id = `wo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setWelcomeOfficers([...welcomeOfficers, { id, name: '', role: '', photo: '', greeting: '', message: '' }]);
    };
    const updateOfficer = (i, patch) => {
        setWelcomeOfficers((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
    };
    const removeOfficer = (i) => {
        setWelcomeOfficers((prev) => prev.filter((_, idx) => idx !== i));
    };
    const moveOfficer = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= welcomeOfficers.length) return;
        setWelcomeOfficers((prev) => {
            const next = [...prev];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
        });
    };

    if (loading) return (
        <AdminLayout>
            <div className="min-h-screen bg-[hsl(var(--admin-bg))] p-4 sm:p-8 lg:p-12 pb-32">
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
            <div className="min-h-screen bg-[hsl(var(--admin-bg))] p-4 sm:p-8 lg:p-12 pb-44">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
                        <div>
                            <h1 id="tour-fields-header" className="text-3xl md:text-4xl font-bold text-[hsl(var(--admin-text))] font-display tracking-tight leading-none mb-2">
                                Website Content
                            </h1>
                            <p className="text-[hsl(var(--admin-text-dim))] text-sm max-w-lg">
                                Pick a section below to edit it, then press <span className="font-semibold text-[hsl(var(--admin-text))]">Save changes</span>.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setIsTourActive(true)}
                                className="px-5 py-2.5 bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-border))] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 transition-all shadow-sm flex items-center gap-2"
                            >
                                <Sparkles className="w-3 h-3" /> Take a tour
                            </button>
                            <button
                                onClick={() => setShowPreview(true)}
                                className="flex items-center gap-2.5 px-6 py-2.5 bg-[hsl(var(--admin-surface))] rounded-2xl border border-[hsl(var(--admin-border))] hover:bg-accent/5 transition-all"
                            >
                                <Eye className="w-4 h-4" />
                                <span className="text-[10px] font-bold text-[hsl(var(--admin-text))] uppercase tracking-widest">Live preview</span>
                            </button>
                            <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-6 py-2.5 bg-[hsl(var(--admin-surface))] rounded-2xl border border-[hsl(var(--admin-border))] hover:bg-accent/5 transition-all group">
                                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-[hsl(var(--admin-text))] uppercase tracking-widest">View live site</span>
                            </a>
                        </div>
                    </div>

                    {/* Tabs. Wrapped (every tab visible + tappable, no hidden off-screen
                        ones) but compact on phones — smaller chips so the 13 sections fit a
                        few short rows instead of filling the whole screen. Not sticky: the
                        AdminLayout wraps page content in a framer-motion transform, which
                        breaks position:sticky. */}
                    <div id="tour-tabs" className="flex flex-wrap gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-[hsl(var(--admin-bg-alt))] rounded-2xl sm:rounded-3xl border border-[hsl(var(--admin-border))] mb-6 md:mb-10">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wide sm:tracking-widest transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-[hsl(var(--admin-surface))] text-coral shadow-lg'
                                    : 'text-[hsl(var(--admin-text-dim))] hover:bg-[hsl(var(--admin-surface))]/60 hover:text-coral/70'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Editor content — full width. The live preview is a toggled
                        slide-over panel (see below), not a permanent side column, so the
                        fields get the whole width and don't feel cramped. */}
                    <div className="max-w-4xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="bg-[hsl(var(--admin-surface))] rounded-[2.5rem] border border-[hsl(var(--admin-border))] p-5 sm:p-8 md:p-12 shadow-sm min-h-[600px]"
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
                                                            <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], 'hero')} />
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

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                                            {[
                                                { key: 'editionText', label: 'Edition Line', placeholder: 'A Communion of Reformed Churches', long: true },
                                                { key: 'heading', label: 'Headline (English)', placeholder: 'Welcome home.' },
                                                { key: 'headingTl', label: 'Headline (Tagalog)', placeholder: 'Maligayang pagdating.' },
                                                { key: 'lede', label: 'Intro Paragraph', placeholder: 'A communion of Reformed congregations…', long: true, rows: 3 },
                                                { key: 'ctaPrimary', label: 'Primary Button', placeholder: 'Find a Church' },
                                                { key: 'ctaSecondary', label: 'Secondary Button', placeholder: 'Watch the Sermon' },
                                                { key: 'times', label: 'Service Times Banner', placeholder: 'Sunday Worship · 9:00 & 11:00 AM · Metro Manila', long: true },
                                            ].map((field) => (
                                                <div key={field.key} className={field.long ? 'md:col-span-2' : ''}>
                                                    <label className="block text-coral text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">{field.label}</label>
                                                    {field.long ? (
                                                        <textarea
                                                            value={hero[field.key] || ''}
                                                            onChange={(e) => setHero({ ...hero, [field.key]: e.target.value })}
                                                            placeholder={field.placeholder}
                                                            rows={field.rows || 2}
                                                            className={FIELD_TEXTAREA_CLS}
                                                        />
                                                    ) : (
                                                        <input
                                                            value={hero[field.key] || ''}
                                                            onChange={(e) => setHero({ ...hero, [field.key]: e.target.value })}
                                                            placeholder={field.placeholder}
                                                            className={FIELD_CLS}
                                                        />
                                                    )}
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
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm focus:ring-2 focus:ring-coral/20 transition-all font-medium"
                                                    placeholder="e.g. Presbyterian Church"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Subtitle (under the name)</label>
                                                <input
                                                    type="text"
                                                    value={identity.sub || ''}
                                                    onChange={e => setIdentity({ ...identity, sub: e.target.value })}
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm focus:ring-2 focus:ring-coral/20 transition-all font-medium"
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
                                                className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm focus:ring-2 focus:ring-coral/20 transition-all font-medium resize-none"
                                                placeholder="The short narrative at the bottom of the site..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[hsl(var(--admin-border))]">
                                            {['facebook', 'youtube', 'instagram', 'email'].map(field => (
                                                <div key={field} className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1 capitalize">{field}</label>
                                                    </div>
                                                    <textarea
                                                        rows={2}
                                                        value={identity.social?.[field] || ''}
                                                        onChange={e => setIdentity({ ...identity, social: { ...identity.social, [field]: e.target.value } })}
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm focus:ring-2 focus:ring-coral/20 transition-all font-medium resize-y leading-relaxed break-all outline-none"
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
                                            <textarea
                                                rows={2}
                                                value={mission.motto || ''}
                                                onChange={e => setMission({ ...mission, motto: e.target.value })}
                                                className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-lg font-bold text-coral focus:ring-2 focus:ring-coral/20 transition-all leading-snug resize-y"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Vision Statement</label>
                                            <textarea
                                                rows={5}
                                                value={mission.vision || ''}
                                                onChange={e => setMission({ ...mission, vision: e.target.value })}
                                                className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm focus:ring-2 focus:ring-coral/20 transition-all font-medium leading-relaxed resize-none"
                                            />
                                        </div>
                                        <div className="space-y-4 pt-6 border-t border-[hsl(var(--admin-border))]">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Summary Statement</label>
                                            <textarea
                                                rows={4}
                                                value={mission.summary || ''}
                                                onChange={e => setMission({ ...mission, summary: e.target.value })}
                                                className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm italic focus:ring-2 focus:ring-coral/20 transition-all font-medium leading-relaxed resize-none"
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
                                            <div key={i} className="p-5 sm:p-8 bg-[hsl(var(--admin-bg-alt))] rounded-3xl space-y-6 relative overflow-hidden group border border-[hsl(var(--admin-border))]">
                                                <div className="flex items-center gap-4">
                                                    <IconPicker
                                                        value={point.icon}
                                                        onChange={(name) => {
                                                            const p = [...mission.missionPoints];
                                                            p[i].icon = name;
                                                            setMission({ ...mission, missionPoints: p });
                                                        }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={point.title}
                                                        onChange={e => {
                                                            const p = [...mission.missionPoints];
                                                            p[i].title = e.target.value;
                                                            setMission({ ...mission, missionPoints: p });
                                                        }}
                                                        className="flex-1 min-w-0 bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-4 text-sm font-bold focus:ring-2 focus:ring-coral/20 outline-none"
                                                    />
                                                    <button onClick={() => removeItem(mission.missionPoints, (l) => setMission({ ...mission, missionPoints: l }), i)} className="shrink-0 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                                <textarea
                                                    rows={3}
                                                    value={point.sub}
                                                    onChange={e => {
                                                        const p = [...mission.missionPoints];
                                                        p[i].sub = e.target.value;
                                                        setMission({ ...mission, missionPoints: p });
                                                    }}
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm resize-y focus:ring-2 focus:ring-coral/20 font-medium leading-relaxed"
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
                                            <div key={i} className="p-5 sm:p-8 bg-[hsl(17_47%_13%)] rounded-3xl space-y-6 relative overflow-hidden group border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <IconPicker
                                                        value={item.icon}
                                                        onChange={(name) => {
                                                            const c = [...mission.commitments];
                                                            c[i].icon = name;
                                                            setMission({ ...mission, commitments: c });
                                                        }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={item.title}
                                                        onChange={e => {
                                                            const c = [...mission.commitments];
                                                            c[i].title = e.target.value;
                                                            setMission({ ...mission, commitments: c });
                                                        }}
                                                        className="flex-1 bg-white/5 border border-white/15 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-coral/40 text-white"
                                                    />
                                                    <button onClick={() => removeItem(mission.commitments, (l) => setMission({ ...mission, commitments: l }), i)} className="p-3 text-red-400 hover:bg-white/5 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    value={item.sub}
                                                    onChange={e => {
                                                        const c = [...mission.commitments];
                                                        c[i].sub = e.target.value;
                                                        setMission({ ...mission, commitments: c });
                                                    }}
                                                    className="w-full bg-white/5 border border-white/15 rounded-2xl p-3.5 sm:p-5 text-sm resize-none focus:ring-2 focus:ring-coral/40 font-medium text-white/50"
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

                                {/* STATS & VISIT TAB */}
                                {activeTab === 'stats' && (
                                    <div className="space-y-16">
                                        <div className="space-y-8">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-coral border-b border-[hsl(var(--admin-border))] pb-4">Denominational Statistics</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                                                {(!stats.stats || stats.stats.length === 0) && (
                                                    <div className="col-span-1 sm:col-span-2 lg:col-span-4">
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
                                                        <button onClick={() => removeItem(stats.stats, (l) => setStats({ ...stats, stats: l }), i)} aria-label="Remove stat" className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-[11px] shadow-lg hover:bg-red-600 transition-colors">✕</button>
                                                        <input
                                                            type="text"
                                                            value={stat.value}
                                                            onChange={e => {
                                                                const s = [...stats.stats];
                                                                s[i].value = e.target.value;
                                                                setStats({ ...stats, stats: s });
                                                            }}
                                                            className="w-full bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-xl font-bold text-coral text-center border border-[hsl(var(--admin-text))]/20 shadow-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={stat.label}
                                                            onChange={e => {
                                                                const s = [...stats.stats];
                                                                s[i].label = e.target.value;
                                                                setStats({ ...stats, stats: s });
                                                            }}
                                                            className="w-full bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-sm font-bold uppercase tracking-wide text-center border border-[hsl(var(--admin-text))]/20 shadow-sm"
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
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] p-5 rounded-2xl text-lg font-bold border border-[hsl(var(--admin-text))]/20"
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-coral ml-1">Subtitle narrative</label>
                                                    <textarea
                                                        rows={3}
                                                        value={stats.visitSubtitle || ''}
                                                        onChange={e => setStats({ ...stats, visitSubtitle: e.target.value })}
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] p-5 rounded-2xl text-sm font-medium leading-relaxed border border-[hsl(var(--admin-text))]/20 resize-none"
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
                                                            <button onClick={() => removeItem(stats.serviceTimes, (l) => setStats({ ...stats, serviceTimes: l }), i)} aria-label="Remove" className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-[11px] shadow-lg hover:bg-red-600 transition-colors">✕</button>
                                                            <input
                                                                type="text"
                                                                value={item.label}
                                                                onChange={e => {
                                                                    const times = [...stats.serviceTimes];
                                                                    times[i].label = e.target.value;
                                                                    setStats({ ...stats, serviceTimes: times });
                                                                }}
                                                                className="w-full bg-[hsl(var(--admin-bg-alt))] p-3 rounded-xl text-sm font-bold uppercase tracking-widest border border-[hsl(var(--admin-text))]/20 shadow-sm"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={item.value}
                                                                onChange={e => {
                                                                    const times = [...stats.serviceTimes];
                                                                    times[i].value = e.target.value;
                                                                    setStats({ ...stats, serviceTimes: times });
                                                                }}
                                                                className="w-full bg-[hsl(var(--admin-bg-alt))] p-3.5 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-text))]/20 shadow-sm"
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
                                                <div key={i} className="p-5 sm:p-8 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] space-y-6 relative group">
                                                    <button onClick={() => removeItem(committees, setCommittees, i)} className="absolute top-8 right-8 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-bold uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity">Delete Committee</button>
                                                    <div className="flex items-center gap-4">
                                                        <IconPicker
                                                            value={com.icon}
                                                            onChange={(name) => {
                                                                const newComs = [...committees];
                                                                newComs[i].icon = name;
                                                                setCommittees(newComs);
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={com.name}
                                                            onChange={e => {
                                                                const newComs = [...committees];
                                                                newComs[i].name = e.target.value;
                                                                setCommittees(newComs);
                                                            }}
                                                            className="flex-1 bg-[hsl(var(--admin-bg-alt))] p-4 rounded-2xl text-sm font-bold border border-[hsl(var(--admin-text))]/20 shadow-sm"
                                                        />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Short Subtitle</label>
                                                        <input
                                                            type="text"
                                                            value={com.sub || ''}
                                                            onChange={e => {
                                                                const newComs = [...committees];
                                                                newComs[i].sub = e.target.value;
                                                                setCommittees(newComs);
                                                            }}
                                                            placeholder="Acts for the General Assembly between sessions."
                                                            className="w-full bg-[hsl(var(--admin-bg-alt))] p-4 rounded-2xl text-sm border border-[hsl(var(--admin-text))]/20 shadow-sm font-medium"
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
                                                            className="w-full bg-[hsl(var(--admin-bg-alt))] p-5 rounded-2xl text-sm border border-[hsl(var(--admin-text))]/20 shadow-sm resize-none font-medium"
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
                                                                            className="flex-1 bg-[hsl(var(--admin-bg-alt))] p-3.5 rounded-xl text-sm border border-[hsl(var(--admin-text))]/20 shadow-sm"
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
                                                                                <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={e => handleImageUpload(e.target.files[0], `committee-${i}-officer-${oi}`)} />
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
                                                                                className="w-full bg-[hsl(var(--admin-bg))] p-3 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-text))]/20"
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
                                                                                className="w-full bg-[hsl(var(--admin-bg))] p-3 rounded-xl text-sm border border-[hsl(var(--admin-text))]/20 text-coral/60"
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                const newComs = [...committees];
                                                                                newComs[i].officers.splice(oi, 1);
                                                                                setCommittees(newComs);
                                                                            }}
                                                                            className="text-sm opacity-50 hover:opacity-100 hover:text-red-500 transition-all shrink-0"
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
                                                onClick={() => setCommittees([...committees, { icon: 'Landmark', name: 'New Committee', description: '', details: ['', ''], officers: [], photo: '' }])}
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
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-coral border-b border-[hsl(var(--admin-border))] pb-4">The church directory — presbyteries &amp; their churches</h3>
                                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <p className="text-[hsl(var(--admin-text-dim))] text-xs max-w-md">Restore any presbyteries or churches that came built-in but are missing here. This only adds — it never overwrites what you&apos;ve edited.</p>
                                            <button type="button" onClick={handleSyncDirectory}
                                                className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-accent/10 text-accent text-[11px] font-bold uppercase tracking-widest border border-accent/20 hover:bg-accent hover:text-white transition-all">
                                                Restore built-in directory
                                            </button>
                                        </div>
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
                                                <div key={p.id || idx} className="p-5 sm:p-8 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] space-y-6 relative group">
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Delete this record?')) {
                                                                const updated = [...presbyteries];
                                                                updated.splice(idx, 1);
                                                                setPresbyteries(updated);
                                                            }
                                                        }}
                                                        className="absolute top-8 right-8 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-bold uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity"
                                                    >Delete Record</button>
                                                    <div className="flex flex-col md:flex-row gap-8">
                                                        <div className="flex-1 space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Presbytery Name</label>
                                                                    <input type="text" value={p.name} onChange={e => { const updated = [...presbyteries]; updated[idx] = { ...updated[idx], name: e.target.value }; setPresbyteries(updated); }} className="w-full bg-[hsl(var(--admin-bg-alt))] p-3.5 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-text))]/20 shadow-sm" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Region</label>
                                                                    <select value={p.region} onChange={e => { const updated = [...presbyteries]; updated[idx] = { ...updated[idx], region: e.target.value }; setPresbyteries(updated); }} className="w-full bg-[hsl(var(--admin-bg-alt))] p-3.5 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-text))]/20 shadow-sm">
                                                                        {['NCR', 'Luzon', 'Visayas', 'Mindanao', 'CAR'].map(r => (<option key={r} value={r}>{r}</option>))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-3">
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Seat</label>
                                                                    <input type="text" placeholder="Laoag City" value={p.seat || ''} onChange={e => { const updated = [...presbyteries]; updated[idx] = { ...updated[idx], seat: e.target.value }; setPresbyteries(updated); }} className="w-full bg-[hsl(var(--admin-bg-alt))] p-3.5 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-text))]/20 shadow-sm" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Congregations</label>
                                                                    <input type="text" placeholder="24" value={p.congregations || ''} onChange={e => { const updated = [...presbyteries]; updated[idx] = { ...updated[idx], congregations: e.target.value }; setPresbyteries(updated); }} className="w-full bg-[hsl(var(--admin-bg-alt))] p-3.5 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-text))]/20 shadow-sm" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Founded</label>
                                                                    <input type="text" placeholder="e.g. 1987" value={p.founded || ''} onChange={e => { const updated = [...presbyteries]; updated[idx] = { ...updated[idx], founded: e.target.value }; setPresbyteries(updated); }} className="w-full bg-[hsl(var(--admin-bg-alt))] p-3.5 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-text))]/20 shadow-sm" />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Regional Narrative / Description</label>
                                                                <textarea value={p.description} onChange={e => { const updated = [...presbyteries]; updated[idx] = { ...updated[idx], description: e.target.value }; setPresbyteries(updated); }} rows={4} className="w-full bg-[hsl(var(--admin-bg-alt))] p-3.5 rounded-xl text-sm border border-[hsl(var(--admin-text))]/20 shadow-sm resize-y font-medium leading-relaxed outline-none focus:ring-2 focus:ring-coral/20" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-widest text-coral ml-1">Official Website URL</label>
                                                                <input type="text" placeholder="https://..." value={p.website || ''} onChange={e => { const updated = [...presbyteries]; updated[idx] = { ...updated[idx], website: e.target.value }; setPresbyteries(updated); }} className="w-full bg-[hsl(var(--admin-bg-alt))] p-3.5 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-text))]/20 shadow-sm" />
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
                                                                                        <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={e => handleImageUpload(e.target.files[0], `presbytery-${idx}-officer-${oIdx}`)} />
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
                                                                                        className="w-full bg-[hsl(var(--admin-bg))] p-3 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-text))]/20"
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
                                                                                        className="w-full bg-[hsl(var(--admin-bg))] p-3 rounded-xl text-sm border border-[hsl(var(--admin-text))]/20 text-coral/60"
                                                                                    />
                                                                                </div>
                                                                                <button onClick={() => { const updated = [...presbyteries]; updated[idx].officers.splice(oIdx, 1); setPresbyteries(updated); }} className="text-sm opacity-50 hover:opacity-100 hover:text-red-500 transition-all shrink-0">✕</button>
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                                            {[
                                                { key: 'heading', label: 'Primary Heading', placeholder: 'Give Generously.', long: true },
                                                { key: 'contactEmail', label: 'Management Email', placeholder: 'give@pcp.org' },
                                                { key: 'subtitle', label: 'Portal Subtitle', placeholder: 'Your generosity helps...', long: true, rows: 3 },
                                            ].map((field) => (
                                                <div key={field.key} className={field.long ? 'md:col-span-2' : ''}>
                                                    <label className="block text-coral text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">{field.label}</label>
                                                    {field.long ? (
                                                        <textarea
                                                            value={donations[field.key] || ''}
                                                            onChange={(e) => setDonations({ ...donations, [field.key]: e.target.value })}
                                                            placeholder={field.placeholder}
                                                            rows={field.rows || 2}
                                                            className={FIELD_TEXTAREA_CLS}
                                                        />
                                                    ) : (
                                                        <input
                                                            value={donations[field.key] || ''}
                                                            onChange={(e) => setDonations({ ...donations, [field.key]: e.target.value })}
                                                            placeholder={field.placeholder}
                                                            className={FIELD_CLS}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-8 pt-6 border-t border-[hsl(var(--admin-border))]">
                                            <div>
                                                <label className="block text-coral text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">Scripture Citation</label>
                                                <input
                                                    value={donations.scriptureRef || ''}
                                                    onChange={(e) => setDonations({ ...donations, scriptureRef: e.target.value })}
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm font-medium focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                />
                                            </div>
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

                                        {/* Admin actions: preview the real popup anytime + re-show to everyone */}
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => setShowPopupPreview(true)}
                                                className="flex items-center gap-2 px-6 py-3 bg-accent/10 text-accent rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-accent/15 transition-all"
                                            >
                                                <Eye className="w-4 h-4" /> Preview Popup
                                            </button>
                                            <button
                                                onClick={handleShowAgainToAll}
                                                className="flex items-center gap-2 px-6 py-3 bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text))] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-coral/5 hover:text-coral transition-all"
                                            >
                                                <RefreshCw className="w-4 h-4" /> Show Again to All
                                            </button>
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
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-base font-semibold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
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
                                                    className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none"
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

                                            <div className="relative group" onDragOver={allowDrop} onDrop={(e) => handleDrop(e, 'announcement')}>
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
                                                            <p className="text-[hsl(var(--admin-text-dim))] text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Add a photo poster</p>
                                                            <p className="text-[hsl(var(--admin-text-dim))]/40 text-[9px] uppercase tracking-widest">JPG / PNG / WEBP · up to 8 MB</p>
                                                            <p className="text-accent/70 text-[9px] font-bold uppercase tracking-widest mt-2">↧ or DRAG a photo here (no file window)</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {!isUploading && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/45 backdrop-blur-sm rounded-3xl">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <label className="cursor-pointer px-10 py-4 bg-white text-accent text-[11px] font-bold uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl">
                                                                {announcement.mediaUrl ? 'Replace Media' : 'Upload Image'}
                                                                <input
                                                                    type="file"
                                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
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
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-accent text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">Button Link</label>
                                                    <input
                                                        value={announcement.buttonLink || ''}
                                                        onChange={(e) => setAnnouncement({ ...announcement, buttonLink: e.target.value })}
                                                        placeholder="e.g. /churches or https://..."
                                                        className="w-full bg-[hsl(var(--admin-bg-alt))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 sm:p-5 text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
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
                                                <strong>Tip:</strong> Each visitor sees this popup only once — that&apos;s why it may not pop up again for you after you close it. Use <strong>Preview Popup</strong> above to see exactly how it looks anytime, or <strong>Show Again to All</strong> to re-show it to everyone (also happens automatically when you change the title or message and Save).
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* UPCOMING EVENTS TAB */}
                                {activeTab === 'events' && (
                                    <div className="space-y-8">
                                        {/* Header */}
                                        <div className="flex items-start gap-4 p-6 bg-[hsl(var(--admin-bg-alt))] rounded-2xl border border-[hsl(var(--admin-border))]">
                                            <div className="w-12 h-12 rounded-2xl bg-coral/10 flex items-center justify-center flex-shrink-0">
                                                <CalendarDays className="w-5 h-5 text-coral" />
                                            </div>
                                            <div>
                                                <h3 className="text-[hsl(var(--admin-text))] font-bold text-base mb-1">Upcoming Events Carousel</h3>
                                                <p className="text-[hsl(var(--admin-text-dim))] text-xs leading-relaxed max-w-md">
                                                    These rotating posters appear in the &ldquo;Upcoming &amp; in session&rdquo; section of the homepage. Add as many as you like, reorder them with the arrows, and remember to click <strong>Update</strong> below to publish.
                                                </p>
                                            </div>
                                        </div>

                                        {events.length === 0 ? (
                                            <AdminEmptyState
                                                title="No Upcoming Events"
                                                description="Add event posters to display them in the homepage carousel."
                                                icon={<CalendarDays className="w-12 h-12 text-coral/20" />}
                                                actionText="Add Event"
                                                onAction={addEvent}
                                            />
                                        ) : (
                                            <div className="space-y-6">
                                                {events.map((ev, i) => (
                                                    <div key={ev.id || i} className="p-5 sm:p-6 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] flex flex-col sm:flex-row gap-6 relative">
                                                        {/* Poster */}
                                                        <div className="relative w-full sm:w-40 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed border-coral/20 shrink-0 bg-[hsl(var(--admin-bg))] group/poster" onDragOver={allowDrop} onDrop={(e) => handleDrop(e, `event-${i}`)}>
                                                            {ev.imageUrl ? (
                                                                <img src={ev.imageUrl} alt={ev.title || `Event ${i + 1}`} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center text-coral/30 gap-2">
                                                                    <ImagePlus className="w-6 h-6" />
                                                                    <span className="text-[9px] font-bold uppercase tracking-widest">Poster</span>
                                                                </div>
                                                            )}
                                                            <label className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity cursor-pointer">
                                                                <span className="text-white text-[10px] font-bold uppercase tracking-widest">{ev.imageUrl ? 'Replace' : 'Upload'}</span>
                                                                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], `event-${i}`)} />
                                                            </label>
                                                        </div>

                                                        {/* Fields */}
                                                        <div className="flex-1 space-y-4">
                                                            <div>
                                                                <label className="block text-coral text-[9px] tracking-[0.25em] uppercase mb-2 font-bold">Event Title</label>
                                                                <input
                                                                    value={ev.title || ''}
                                                                    onChange={(e) => updateEvent(i, { title: e.target.value })}
                                                                    placeholder="e.g. 60th Stated Meeting of the Visayas Presbytery"
                                                                    className="w-full bg-[hsl(var(--admin-bg))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-coral text-[9px] tracking-[0.25em] uppercase mb-2 font-bold">Date</label>
                                                                    <input
                                                                        value={ev.date || ''}
                                                                        onChange={(e) => updateEvent(i, { date: e.target.value })}
                                                                        placeholder="e.g. June 9, 2026"
                                                                        className="w-full bg-[hsl(var(--admin-bg))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-coral text-[9px] tracking-[0.25em] uppercase mb-2 font-bold">Venue</label>
                                                                    <textarea
                                                                        rows={2}
                                                                        value={ev.venue || ''}
                                                                        onChange={(e) => updateEvent(i, { venue: e.target.value })}
                                                                        placeholder="e.g. Cogon Cruz Presbyterian Church, Danao City, Cebu"
                                                                        className="w-full bg-[hsl(var(--admin-bg))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-coral/20 outline-none transition-all resize-y leading-relaxed"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Controls */}
                                                        <div className="flex sm:flex-col items-center justify-end sm:justify-start gap-2 shrink-0">
                                                            <button onClick={() => moveEvent(i, -1)} disabled={i === 0} className="p-2 rounded-xl text-[hsl(var(--admin-text-dim))] hover:bg-coral/5 hover:text-coral disabled:opacity-20 disabled:cursor-not-allowed transition-colors" aria-label="Move event up"><ChevronUp className="w-4 h-4" /></button>
                                                            <button onClick={() => moveEvent(i, 1)} disabled={i === events.length - 1} className="p-2 rounded-xl text-[hsl(var(--admin-text-dim))] hover:bg-coral/5 hover:text-coral disabled:opacity-20 disabled:cursor-not-allowed transition-colors" aria-label="Move event down"><ChevronDown className="w-4 h-4" /></button>
                                                            <button onClick={() => removeEvent(i)} className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors" aria-label="Delete event"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    onClick={addEvent}
                                                    className="w-full py-6 rounded-2xl border-2 border-dashed border-[hsl(var(--admin-border))] text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" /> Add Event
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* VIDEO GREETINGS TAB */}
                                {activeTab === 'videos' && (
                                    <div className="space-y-8">
                                        {/* Header */}
                                        <div className="flex items-start gap-4 p-6 bg-[hsl(var(--admin-bg-alt))] rounded-2xl border border-[hsl(var(--admin-border))]">
                                            <div className="w-12 h-12 rounded-2xl bg-coral/10 flex items-center justify-center flex-shrink-0">
                                                <Film className="w-5 h-5 text-coral" />
                                            </div>
                                            <div>
                                                <h3 className="text-[hsl(var(--admin-text))] font-bold text-base mb-1">Video Greetings Carousel</h3>
                                                <p className="text-[hsl(var(--admin-text-dim))] text-xs leading-relaxed max-w-md">
                                                    Rotating greeting videos shown <strong>right after the hero</strong> on the homepage. <strong>Upload a short video</strong> (drag it in, or from your phone — ≤50&nbsp;MB) <strong>or paste a YouTube/Facebook link</strong>. Up to {MAX_VIDEO_GREETINGS} videos.
                                                </p>
                                            </div>
                                        </div>

                                        {videoGreetings.length === 0 ? (
                                            <AdminEmptyState
                                                title="No Video Greetings"
                                                description="Add a greeting video to feature it right after the hero."
                                                icon={<Film className="w-12 h-12 text-coral/20" />}
                                                actionText="Add Video"
                                                onAction={addVideoGreeting}
                                            />
                                        ) : (
                                            <div className="space-y-6">
                                                {videoGreetings.map((g, i) => (
                                                    <div key={g.id || i} className="p-5 sm:p-6 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] space-y-5 relative">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-coral">Video {i + 1}</span>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => moveVideoGreeting(i, -1)} disabled={i === 0} className="p-2 rounded-xl text-[hsl(var(--admin-text-dim))] hover:bg-coral/5 hover:text-coral disabled:opacity-20 disabled:cursor-not-allowed transition-colors" aria-label="Move video up"><ChevronUp className="w-4 h-4" /></button>
                                                                <button onClick={() => moveVideoGreeting(i, 1)} disabled={i === videoGreetings.length - 1} className="p-2 rounded-xl text-[hsl(var(--admin-text-dim))] hover:bg-coral/5 hover:text-coral disabled:opacity-20 disabled:cursor-not-allowed transition-colors" aria-label="Move video down"><ChevronDown className="w-4 h-4" /></button>
                                                                <button onClick={() => removeVideoGreeting(i)} className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors" aria-label="Delete video"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                            {/* Video + poster (left column) */}
                                                            <div className="space-y-3">
                                                            <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-coral/20 bg-[hsl(var(--admin-bg))] group/vid" onDragOver={allowDrop} onDrop={(e) => handleDrop(e, `vg-video-${i}`)}>
                                                                {isVideoFileUrl(g.videoUrl) ? (
                                                                    <video src={g.videoUrl} className="w-full h-full object-contain bg-black" controls preload="metadata" />
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center text-coral/40 gap-2 p-4 text-center">
                                                                        <Film className="w-7 h-7" />
                                                                        <span className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">Drag a video here<br />or upload · ≤50 MB</span>
                                                                    </div>
                                                                )}
                                                                <label className="absolute top-2 right-2 px-3 py-1.5 bg-black/60 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg cursor-pointer hover:bg-black/80 transition-colors">
                                                                    {isVideoFileUrl(g.videoUrl) ? 'Replace' : 'Upload'}
                                                                    <input type="file" accept=".mp4,.mov,.m4v,.webm" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], `vg-video-${i}`)} />
                                                                </label>
                                                            </div>
                                                            {/* Poster — optional; used for uploaded MP4s (YouTube auto-thumbnails) */}
                                                            <div className="relative h-20 rounded-2xl overflow-hidden border-2 border-dashed border-coral/20 bg-[hsl(var(--admin-bg))] flex items-center" onDragOver={allowDrop} onDrop={(e) => handleDrop(e, `vg-poster-${i}`)}>
                                                                {g.posterUrl ? (
                                                                    <img src={g.posterUrl} alt="" className="h-full w-auto object-cover" />
                                                                ) : (
                                                                    <div className="flex items-center gap-2 px-4 text-coral/40">
                                                                        <ImagePlus className="w-4 h-4" />
                                                                        <span className="text-[9px] font-bold uppercase tracking-widest">Poster · optional (for uploaded video)</span>
                                                                    </div>
                                                                )}
                                                                <label className="absolute top-1.5 right-1.5 px-2.5 py-1 bg-black/60 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg cursor-pointer hover:bg-black/80 transition-colors">
                                                                    {g.posterUrl ? 'Replace' : 'Upload'}
                                                                    <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], `vg-poster-${i}`)} />
                                                                </label>
                                                            </div>
                                                            </div>

                                                            {/* Fields */}
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="block text-coral text-[9px] tracking-[0.25em] uppercase mb-2 font-bold">Or YouTube / Facebook link</label>
                                                                    <input
                                                                        value={g.videoUrl || ''}
                                                                        onChange={(e) => updateVideoGreeting(i, { videoUrl: e.target.value })}
                                                                        placeholder="https://youtu.be/…"
                                                                        className="w-full bg-[hsl(var(--admin-bg))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-coral text-[9px] tracking-[0.25em] uppercase mb-2 font-bold">Title</label>
                                                                    <input
                                                                        value={g.title || ''}
                                                                        onChange={(e) => updateVideoGreeting(i, { title: e.target.value })}
                                                                        placeholder="e.g. A welcome from the Moderator"
                                                                        className="w-full bg-[hsl(var(--admin-bg))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 text-sm font-semibold focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-coral text-[9px] tracking-[0.25em] uppercase mb-2 font-bold">Caption</label>
                                                                    <input
                                                                        value={g.caption || ''}
                                                                        onChange={(e) => updateVideoGreeting(i, { caption: e.target.value })}
                                                                        placeholder="Short line shown under the video"
                                                                        className="w-full bg-[hsl(var(--admin-bg))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {videoGreetings.length < MAX_VIDEO_GREETINGS && (
                                                    <button
                                                        onClick={addVideoGreeting}
                                                        className="w-full py-6 rounded-2xl border-2 border-dashed border-[hsl(var(--admin-border))] text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" /> Add Video ({videoGreetings.length}/{MAX_VIDEO_GREETINGS})
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* WELCOME OFFICERS TAB ("A Word of Welcome") */}
                                {activeTab === 'welcome' && (
                                    <div className="space-y-8">
                                        {/* Header */}
                                        <div className="flex items-start gap-4 p-6 bg-[hsl(var(--admin-bg-alt))] rounded-2xl border border-[hsl(var(--admin-border))]">
                                            <div className="w-12 h-12 rounded-2xl bg-coral/10 flex items-center justify-center flex-shrink-0">
                                                <Quote className="w-5 h-5 text-coral" />
                                            </div>
                                            <div>
                                                <h3 className="text-[hsl(var(--admin-text))] font-bold text-base mb-1">A Word of Welcome</h3>
                                                <p className="text-[hsl(var(--admin-text-dim))] text-xs leading-relaxed max-w-md">
                                                    The rotating welcome messages in the <strong>Message section</strong> of the homepage — one slide per officer (photo, greeting, message, signature). <strong>Only officers with a message appear</strong> on the site. Up to {MAX_WELCOME_OFFICERS}.
                                                </p>
                                            </div>
                                        </div>

                                        {welcomeOfficers.length === 0 ? (
                                            <AdminEmptyState
                                                title="No Welcome Officers"
                                                description="Add an officer to show their word of welcome on the homepage."
                                                icon={<Quote className="w-12 h-12 text-coral/20" />}
                                                actionText="Add Officer"
                                                onAction={addOfficer}
                                            />
                                        ) : (
                                            <div className="space-y-6">
                                                {welcomeOfficers.map((o, i) => (
                                                    <div key={o.id || i} className="p-5 sm:p-6 bg-[hsl(var(--admin-bg-alt))] rounded-3xl border border-[hsl(var(--admin-border))] space-y-5 relative">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-coral">Officer {i + 1}{!String(o.message || '').trim() && <span className="ml-2 text-[hsl(var(--admin-text-dim))] normal-case tracking-normal">· hidden (no message)</span>}</span>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => moveOfficer(i, -1)} disabled={i === 0} className="p-2 rounded-xl text-[hsl(var(--admin-text-dim))] hover:bg-coral/5 hover:text-coral disabled:opacity-20 disabled:cursor-not-allowed transition-colors" aria-label="Move officer up"><ChevronUp className="w-4 h-4" /></button>
                                                                <button onClick={() => moveOfficer(i, 1)} disabled={i === welcomeOfficers.length - 1} className="p-2 rounded-xl text-[hsl(var(--admin-text-dim))] hover:bg-coral/5 hover:text-coral disabled:opacity-20 disabled:cursor-not-allowed transition-colors" aria-label="Move officer down"><ChevronDown className="w-4 h-4" /></button>
                                                                <button onClick={() => removeOfficer(i)} className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors" aria-label="Delete officer"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-[8rem,1fr] gap-5">
                                                            {/* Photo (optional — falls back to a monogram) */}
                                                            <div className="space-y-2">
                                                                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-coral/20 bg-[hsl(var(--admin-bg))]" onDragOver={allowDrop} onDrop={(e) => handleDrop(e, `wo-photo-${i}`)}>
                                                                    {o.photo ? (
                                                                        <img src={o.photo} alt={o.name || ''} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex flex-col items-center justify-center text-coral/40 gap-1.5 p-2 text-center">
                                                                            <ImagePlus className="w-6 h-6" />
                                                                            <span className="text-[8px] font-bold uppercase tracking-widest leading-tight">Drag photo<br />or upload</span>
                                                                        </div>
                                                                    )}
                                                                    <label className="absolute bottom-1.5 right-1.5 px-2.5 py-1 bg-black/60 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg cursor-pointer hover:bg-black/80 transition-colors">
                                                                        {o.photo ? 'Replace' : 'Upload'}
                                                                        <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], `wo-photo-${i}`)} />
                                                                    </label>
                                                                </div>
                                                                <p className="text-[8px] text-[hsl(var(--admin-text-dim))] uppercase tracking-widest text-center leading-tight">No photo → initials shown</p>
                                                            </div>

                                                            {/* Fields */}
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-coral text-[9px] tracking-[0.25em] uppercase mb-2 font-bold">Name</label>
                                                                        <input
                                                                            value={o.name || ''}
                                                                            onChange={(e) => updateOfficer(i, { name: e.target.value })}
                                                                            placeholder="e.g. Rev. Edgar P. Adra"
                                                                            className="w-full bg-[hsl(var(--admin-bg))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 text-sm font-semibold focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-coral text-[9px] tracking-[0.25em] uppercase mb-2 font-bold">Role / Title</label>
                                                                        <input
                                                                            value={o.role || ''}
                                                                            onChange={(e) => updateOfficer(i, { role: e.target.value })}
                                                                            placeholder="e.g. Moderator, General Assembly"
                                                                            className="w-full bg-[hsl(var(--admin-bg))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-coral text-[9px] tracking-[0.25em] uppercase mb-2 font-bold">Greeting <span className="normal-case tracking-normal text-[hsl(var(--admin-text-dim))]">(short headline)</span></label>
                                                                    <input
                                                                        value={o.greeting || ''}
                                                                        onChange={(e) => updateOfficer(i, { greeting: e.target.value })}
                                                                        placeholder="e.g. Welcome — you are among friends on the old paths."
                                                                        className="w-full bg-[hsl(var(--admin-bg))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-coral/20 outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-coral text-[9px] tracking-[0.25em] uppercase mb-2 font-bold">Message <span className="normal-case tracking-normal text-[hsl(var(--admin-text-dim))]">(the welcome paragraph)</span></label>
                                                                    <textarea
                                                                        value={o.message || ''}
                                                                        onChange={(e) => updateOfficer(i, { message: e.target.value })}
                                                                        rows={5}
                                                                        placeholder="The officer's word of welcome…"
                                                                        className="w-full bg-[hsl(var(--admin-bg))] border border-[hsl(var(--admin-text))]/20 rounded-2xl p-3.5 text-sm font-medium leading-relaxed focus:ring-2 focus:ring-coral/20 outline-none transition-all resize-y"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {welcomeOfficers.length < MAX_WELCOME_OFFICERS && (
                                                    <button
                                                        onClick={addOfficer}
                                                        className="w-full py-6 rounded-2xl border-2 border-dashed border-[hsl(var(--admin-border))] text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" /> Add Officer ({welcomeOfficers.length}/{MAX_WELCOME_OFFICERS})
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Live preview — a slide-over panel toggled from the header, so
                            the editor keeps the full width and the two never crowd each
                            other. Backdrop click or ✕ closes it. */}
                        <AnimatePresence>
                            {showPreview && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 bg-black/40 z-[55]"
                                        onClick={() => setShowPreview(false)}
                                        aria-hidden="true"
                                    />
                                    <motion.aside
                                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                        transition={{ type: 'tween', duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                        className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-[hsl(var(--admin-bg))] border-l border-[hsl(var(--admin-border))] shadow-2xl z-[60] flex flex-col"
                                        role="dialog" aria-label="Live preview"
                                    >
                                        <div className="flex items-center justify-between px-5 h-16 border-b border-[hsl(var(--admin-border))] shrink-0">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--admin-text-dim))]">Live Preview</span>
                                            </div>
                                            <button onClick={() => setShowPreview(false)} aria-label="Close preview" className="w-9 h-9 flex items-center justify-center rounded-xl bg-[hsl(var(--admin-text))]/5 text-[hsl(var(--admin-text))]/50 hover:text-[hsl(var(--admin-text))] hover:bg-[hsl(var(--admin-text))]/10 transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                            <p className="text-[11px] text-[hsl(var(--admin-text-dim))]/70 mb-4">How this section looks on the live site — it updates as you edit.</p>
                                            <ContentPreview
                                                tab={activeTab}
                                                hero={hero}
                                                identity={identity}
                                                mission={mission}
                                                stats={stats}
                                                committees={committees}
                                                presbyteries={presbyteries}
                                                donations={donations}
                                                announcement={announcement}
                                            />
                                        </div>
                                    </motion.aside>
                                </>
                            )}
                        </AnimatePresence>

                        {/* Save bar — a docked footer with a fade backdrop so content
                            scrolls cleanly beneath it (the page reserves matching bottom
                            padding so no field is ever hidden behind it). */}
                        <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-8 pt-12 pb-4 sm:pb-6 flex flex-col items-center pointer-events-none z-[100] bg-gradient-to-t from-[hsl(var(--admin-bg))] via-[hsl(var(--admin-bg))] to-transparent">
                            <div className="w-full max-w-7xl mx-auto flex justify-center sm:justify-end">
                                <button
                                    id="tour-save"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`h-14 w-full sm:w-auto px-8 sm:px-16 rounded-2xl text-[11px] font-bold uppercase tracking-[0.25em] shadow-2xl transition-all duration-300 pointer-events-auto active:scale-95 ${saving
                                        ? 'bg-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-dim))]'
                                        : 'bg-coral text-white hover:shadow-coral/30'
                                        }`}
                                >
                                    {saving ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                            Saving…
                                        </div>
                                    ) : (
                                        'Save changes'
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

                {/* Faithful preview of the live announcement popup — bypasses the
                    once-per-visitor "seen" lock so admins can review it anytime. */}
                <AnnouncementModal
                    previewData={announcement}
                    open={showPopupPreview}
                    onRequestClose={() => setShowPopupPreview(false)}
                />
            </div>
        </AdminLayout>
    );
}
