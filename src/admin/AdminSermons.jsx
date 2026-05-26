import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getSermons, addSermon, updateSermon, deleteSermon } from '../lib/store.js';
import { uploadFile } from '../lib/storage.js';
import { AdminListSkeleton } from '../components/admin/AdminSkeleton.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';

const emptySermon = {
    title: '',
    speaker: '',
    date: '',
    duration: '',
    scripture: '',
    series: '',
    videoUrl: '',
    description: '',
    audioUrl: '',
    thumbnailUrl: '',
};

export default function AdminSermons() {
    const [sermons, setSermons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptySermon);
    const [showForm, setShowForm] = useState(false);
    const [audioUploading, setAudioUploading] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [thumbUploading, setThumbUploading] = useState(false);
    const [thumbProgress, setThumbProgress] = useState(0);

    useEffect(() => {
        const fetchSermons = async () => {
            const data = await getSermons();
            setSermons(data);
            setLoading(false);
        };
        fetchSermons();
    }, []);

    const refresh = async () => {
        const data = await getSermons();
        setSermons(data);
    };

    // Ensure we have a sermon doc id before uploading any files. If we're
    // creating a new sermon, persist the current form first so the new doc id
    // can be used in the Storage path. Returns the resolved sermon id (or null
    // on failure).
    const ensureSermonId = async () => {
        if (editing?.id) return editing.id;
        if (!form.title.trim() || !form.speaker || !form.date) {
            toast.error('Fill in title, speaker, and date before uploading');
            return null;
        }
        const created = await addSermon({ ...form });
        if (!created?.id) {
            toast.error('Failed to initialize sermon record');
            return null;
        }
        setEditing(created);
        return created.id;
    };

    const handleAudioUpload = async (file) => {
        if (!file) return;
        const sermonId = await ensureSermonId();
        if (!sermonId) return;
        setAudioUploading(true);
        setAudioProgress(0);
        try {
            const url = await uploadFile(`sermons/audio/${sermonId}/${file.name}`, file, setAudioProgress);
            await updateSermon(sermonId, { audioUrl: url });
            setForm((f) => ({ ...f, audioUrl: url }));
            toast.success('Audio uploaded ✦');
        } catch (err) {
            toast.error(err.message || 'Audio upload failed');
            console.error(err);
        } finally {
            setAudioUploading(false);
        }
    };

    const handleThumbnailUpload = async (file) => {
        if (!file) return;
        const sermonId = await ensureSermonId();
        if (!sermonId) return;
        setThumbUploading(true);
        setThumbProgress(0);
        try {
            const url = await uploadFile(`sermons/thumbnails/${sermonId}/${file.name}`, file, setThumbProgress);
            await updateSermon(sermonId, { thumbnailUrl: url });
            setForm((f) => ({ ...f, thumbnailUrl: url }));
            toast.success('Thumbnail uploaded ✦');
        } catch (err) {
            toast.error(err.message || 'Thumbnail upload failed');
            console.error(err);
        } finally {
            setThumbUploading(false);
        }
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.speaker || !form.date) {
            toast.error('Please fill in required fields');
            return;
        }
        setLoading(true);
        if (editing) {
            await updateSermon(editing.id, form);
            toast.success('Sermon updated successfully');
        } else {
            await addSermon({ ...form });
            toast.success('Sermon added successfully');
        }
        setShowForm(false);
        setForm(emptySermon);
        setEditing(null);
        await refresh();
        setLoading(false);
    };

    const handleEdit = (s) => {
        setEditing(s);
        setForm({ ...emptySermon, ...s });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to remove this sermon from the database?')) {
            setLoading(true);
            await deleteSermon(id);
            toast.success('Sermon deleted');
            await refresh();
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setForm(emptySermon);
        setEditing(null);
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto selection:bg-violet/10">

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2">
                    <div>
                        <h1 className="text-4xl font-bold text-[hsl(var(--admin-text))] tracking-tighter font-display mb-3">Archive</h1>
                        <p className="text-[hsl(var(--admin-text-dim))] text-[11px] font-bold tracking-[0.3em] uppercase">Spiritual Media Management</p>
                    </div>
                    <button
                        onClick={() => { setEditing(null); setForm(emptySermon); setShowForm(true); }}
                        className="h-14 px-8 bg-violet text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:shadow-2xl hover:shadow-violet/30 transition-all duration-300 active:scale-95 font-display"
                    >
                        + New Media Entry
                    </button>
                </div>

                {/* Form Modal */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 30 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="bg-[hsl(var(--admin-surface))] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[hsl(var(--admin-border))] shadow-3xl custom-scrollbar"
                            >
                                <div className="flex items-center justify-between mb-12">
                                    <div>
                                        <h2 className="text-3xl font-bold text-[hsl(var(--admin-text))] font-display tracking-tight mb-2">
                                            {editing ? 'Modify Message' : 'Register Message'}
                                        </h2>
                                        <p className="text-[hsl(var(--admin-text-dim))] text-[10px] uppercase tracking-widest font-bold">Media Archival System</p>
                                    </div>
                                    <button onClick={handleCancel} className="w-12 h-12 flex items-center justify-center bg-[hsl(var(--admin-text))]/5 rounded-full text-[hsl(var(--admin-text))]/20 hover:text-[hsl(var(--admin-text))] hover:bg-[hsl(var(--admin-text))]/10 transition-all">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="md:col-span-2">
                                        <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">Message Title</label>
                                        <input
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            placeholder="e.g. The Power of Grace"
                                            className="w-full bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-2xl px-6 py-4.5 text-[hsl(var(--admin-text))] text-sm placeholder:text-[hsl(var(--admin-text-dim))]/30 focus:ring-4 focus:ring-violet/5 focus:border-violet/40 outline-none transition-all duration-300"
                                        />
                                    </div>

                                    {[
                                        { key: 'speaker', label: 'Primary Speaker', placeholder: 'Rev. Name' },
                                        { key: 'scripture', label: 'Scripture Reference', placeholder: 'Romans 8:1–11' },
                                        { key: 'series', label: 'Series', placeholder: 'Romans · The Gospel of Grace' },
                                        { key: 'date', label: 'Recording Date', type: 'date' },
                                        { key: 'duration', label: 'Time Duration', placeholder: 'e.g. 45 min' },
                                        { key: 'videoUrl', label: 'YouTube Video URL', placeholder: 'https://youtube.com/watch?v=...' },
                                    ].map((field) => (
                                        <div key={field.key}>
                                            <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">{field.label}</label>
                                            <input
                                                type={field.type || 'text'}
                                                value={form[field.key]}
                                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                                placeholder={field.placeholder}
                                                className="w-full bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-2xl px-6 py-4.5 text-[hsl(var(--admin-text))] text-sm placeholder:text-[hsl(var(--admin-text-dim))]/30 focus:ring-4 focus:ring-violet/5 focus:border-violet/40 outline-none transition-all duration-300"
                                            />
                                        </div>
                                    ))}

                                    <div className="md:col-span-2">
                                        <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">Scriptural Synopsis</label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            rows={4}
                                            placeholder="Key themes and references..."
                                            className="w-full bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-[2rem] px-6 py-5 text-[hsl(var(--admin-text))] text-sm placeholder:text-[hsl(var(--admin-text-dim))]/30 focus:ring-4 focus:ring-violet/5 focus:border-violet/40 outline-none transition-all duration-300 resize-none"
                                        />
                                    </div>

                                    {/* Audio upload */}
                                    <div className="md:col-span-2">
                                        <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">Audio File</label>
                                        <div className="flex items-center gap-4">
                                            <label className="cursor-pointer flex-1 h-14 flex items-center justify-center bg-violet/5 border border-dashed border-violet/30 rounded-2xl text-violet text-[11px] font-bold tracking-widest uppercase hover:bg-violet/10 transition-all">
                                                {audioUploading
                                                    ? `Uploading... ${audioProgress}%`
                                                    : form.audioUrl ? 'Replace Audio' : 'Upload Audio'}
                                                <input
                                                    type="file"
                                                    accept="audio/*"
                                                    className="hidden"
                                                    onChange={(e) => handleAudioUpload(e.target.files[0])}
                                                    disabled={audioUploading}
                                                />
                                            </label>
                                            {form.audioUrl && !audioUploading && (
                                                <a
                                                    href={form.audioUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-violet/60 text-[10px] font-bold uppercase tracking-widest hover:text-violet"
                                                >
                                                    Preview
                                                </a>
                                            )}
                                        </div>
                                        {audioUploading && (
                                            <div className="mt-3 w-full h-1.5 bg-violet/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-violet"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${audioProgress}%` }}
                                                    transition={{ duration: 0.2 }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Thumbnail upload */}
                                    <div className="md:col-span-2">
                                        <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">Thumbnail Image</label>
                                        <div className="flex items-center gap-4">
                                            <label className="cursor-pointer flex-1 h-14 flex items-center justify-center bg-violet/5 border border-dashed border-violet/30 rounded-2xl text-violet text-[11px] font-bold tracking-widest uppercase hover:bg-violet/10 transition-all">
                                                {thumbUploading
                                                    ? `Uploading... ${thumbProgress}%`
                                                    : form.thumbnailUrl ? 'Replace Thumbnail' : 'Upload Thumbnail'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleThumbnailUpload(e.target.files[0])}
                                                    disabled={thumbUploading}
                                                />
                                            </label>
                                            {form.thumbnailUrl && !thumbUploading && (
                                                <img
                                                    src={form.thumbnailUrl}
                                                    alt="Thumbnail preview"
                                                    className="w-14 h-14 rounded-xl object-cover border border-violet/20"
                                                />
                                            )}
                                        </div>
                                        {thumbUploading && (
                                            <div className="mt-3 w-full h-1.5 bg-violet/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-violet"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${thumbProgress}%` }}
                                                    transition={{ duration: 0.2 }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-16 pt-10 border-t border-[hsl(var(--admin-border))]">
                                    <button onClick={handleCancel} className="flex-1 h-16 text-[11px] font-bold tracking-widest uppercase text-[hsl(var(--admin-text-dim))]/20 rounded-[1.5rem] border border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--admin-text))]/5 transition-all">
                                        Discard Entry
                                    </button>
                                    <button onClick={handleSave} className="flex-1 h-16 bg-violet text-white text-[11px] font-bold tracking-widest uppercase rounded-[1.5rem] hover:shadow-2xl hover:shadow-violet/40 transition-all hover:scale-105 active:scale-95">
                                        {editing ? 'Update Media' : 'Save Message'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* List Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {loading ? (
                        <AdminListSkeleton />
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {sermons.map((s) => (
                                <motion.div
                                    key={s.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group bg-[hsl(var(--admin-surface))] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-[hsl(var(--admin-border))] hover:border-violet/40 hover:shadow-xl transition-all duration-500 relative overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="w-14 h-14 rounded-2xl bg-violet/10 flex items-center justify-center text-violet border border-violet/20 group-hover:bg-violet group-hover:text-white transition-all duration-500 shadow-2xl">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                                            </div>
                                            <div className="flex gap-3 lg:opacity-20 group-hover:opacity-100 transition-all duration-300">
                                                <button
                                                    onClick={() => handleEdit(s)}
                                                    className="w-12 h-12 flex items-center justify-center bg-violet/5 text-violet rounded-2xl border border-violet/10 hover:bg-violet hover:text-white transition-all shadow-lg"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    className="w-12 h-12 flex items-center justify-center bg-coral/5 text-coral rounded-2xl border border-coral/10 hover:bg-coral hover:text-white hover:border-transparent transition-all shadow-lg"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-[hsl(var(--admin-text))] mb-3 font-display leading-tight group-hover:text-violet transition-colors">{s.title}</h3>
                                        <p className="text-[hsl(var(--admin-text-dim))] text-[11px] font-bold tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
                                            <span className="text-violet">✦</span> {s.speaker} <span className="text-white/5">/</span> {s.date}
                                        </p>

                                        {s.description && (
                                            <p className="text-[hsl(var(--admin-text-dim))] text-sm line-clamp-2 leading-relaxed mb-8 font-medium">
                                                {s.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-5 text-[10px] font-bold text-[hsl(var(--admin-text-dim))] uppercase tracking-[0.2em] pt-6 border-t border-[hsl(var(--admin-border))]">
                                            <span className="flex items-center gap-2 opacity-60">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-40"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                {s.duration || 'N/A'}
                                            </span>
                                            {s.videoUrl && (
                                                <span className="flex items-center gap-2 text-violet/60">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12l-18 12v-24z" /></svg>
                                                    Video
                                                </span>
                                            )}
                                            {s.audioUrl && (
                                                <span className="flex items-center gap-2 text-violet/60">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
                                                    Audio
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Item Glow Decor */}
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-violet/5 rounded-full blur-[100px] -mr-24 -mt-24 group-hover:bg-violet/15 transition-all duration-700" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {!loading && sermons.length === 0 && (
                    <div className="text-center py-40 bg-[hsl(var(--admin-surface))] rounded-[4rem] border border-dashed border-[hsl(var(--admin-border))] px-6">
                        <p className="text-[hsl(var(--admin-text-dim))] font-bold text-xl font-display mb-10 tracking-tight opacity-30">No Media Archived</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-10 py-4 bg-violet text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:shadow-2xl hover:shadow-violet/40 transition-all font-display"
                        >
                            Create First Entry
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
