import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    getLibraryResources,
    addLibraryResource,
    updateLibraryResource,
    deleteLibraryResource,
} from '../lib/store.js';
import { uploadFile } from '../lib/storage.js';
import { AdminListSkeleton } from '../components/admin/AdminSkeleton.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';

const emptyResource = { title: '', description: '', category: 'Bulletins', fileUrl: '', fileType: 'PDF' };
const categories = ['Bulletins', 'Newsletters', 'Forms', 'Bible Studies', 'Missions', 'Legal'];
const fileTypes = ['PDF', 'DOCX', 'XLSX', 'Link', 'Image'];

export default function AdminLibrary() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyResource);
    const [showForm, setShowForm] = useState(false);
    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [uploadPct, setUploadPct] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchResources = async () => {
            const data = await getLibraryResources();
            setResources(data);
            setLoading(false);
        };
        fetchResources();
    }, []);

    const refresh = async () => {
        const data = await getLibraryResources();
        setResources(data);
    };

    // Save-first: ensure we have a library doc id before uploading. If creating
    // a new resource and no record exists yet, persist the current form first
    // so the new doc id can drive the Storage path.
    const ensureResourceId = async () => {
        if (editing?.id) return editing.id;
        if (!form.title.trim()) {
            // Title not required to upload (source allows upload-then-fill),
            // so synthesize a placeholder if none provided yet.
            const placeholder = { ...form, title: form.title || 'Untitled Resource' };
            const created = await addLibraryResource(placeholder);
            if (!created?.id) {
                toast.error('Failed to initialize resource record');
                return null;
            }
            setEditing(created);
            setForm((f) => ({ ...f, title: created.title }));
            return created.id;
        }
        const created = await addLibraryResource({ ...form });
        if (!created?.id) {
            toast.error('Failed to initialize resource record');
            return null;
        }
        setEditing(created);
        return created.id;
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        // Auto-detect file type
        const ext = file.name.split('.').pop().toUpperCase();
        const detectedType = fileTypes.includes(ext) ? ext : 'Link';

        const resourceId = await ensureResourceId();
        if (!resourceId) return;

        setUploading(true);
        setUploadPct(0);
        setUploadProgress('Uploading to cloud...');

        try {
            const url = await uploadFile(
                `library/files/${resourceId}/${file.name}`,
                file,
                (pct) => {
                    setUploadPct(pct);
                    setUploadProgress(`Uploading... ${pct}%`);
                },
            );

            const niceTitle = form.title || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
            const patch = {
                fileUrl: url,
                fileType: detectedType,
                title: niceTitle,
            };
            await updateLibraryResource(resourceId, patch);

            setForm((prev) => ({
                ...prev,
                ...patch,
            }));

            setUploadProgress(null);
            toast.success('File uploaded successfully ✦');
        } catch (err) {
            setUploadProgress(null);
            toast.error(err.message || 'Upload failed');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleDropZoneClick = () => fileInputRef.current?.click();

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.fileUrl.trim()) {
            toast.error('Title and File URL are required');
            return;
        }
        setLoading(true);
        if (editing) {
            await updateLibraryResource(editing.id, form);
            toast.success('Resource updated successfully');
        } else {
            await addLibraryResource({ ...form });
            toast.success('Resource added successfully');
        }
        setShowForm(false);
        setForm(emptyResource);
        setEditing(null);
        await refresh();
        setLoading(false);
    };

    const handleEdit = (r) => {
        setEditing(r);
        setForm({ ...emptyResource, ...r });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this resource?')) {
            setLoading(true);
            await deleteLibraryResource(id);
            toast.error('Resource deleted');
            await refresh();
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setForm(emptyResource);
        setEditing(null);
        setUploadProgress(null);
        setUploadPct(0);
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto selection:bg-emerald/10">

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2">
                    <div>
                        <h1 className="text-4xl font-bold text-[hsl(var(--admin-text))] tracking-tighter font-display mb-3">Library</h1>
                        <p className="text-[hsl(var(--admin-text-dim))] text-[11px] font-bold tracking-[0.3em] uppercase">Document & Resource Management</p>
                    </div>
                    <button
                        onClick={() => { setEditing(null); setForm(emptyResource); setShowForm(true); }}
                        className="h-14 px-8 bg-emerald text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:shadow-2xl hover:shadow-emerald/30 transition-all duration-300 active:scale-95 font-display"
                    >
                        + Add New Resource
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
                                            {editing ? 'Modify Resource' : 'Register Resource'}
                                        </h2>
                                        <p className="text-[hsl(var(--admin-text-dim))] text-[10px] uppercase tracking-widest font-bold">Library Asset Control</p>
                                    </div>
                                    <button onClick={handleCancel} className="w-12 h-12 flex items-center justify-center bg-[hsl(var(--admin-text))]/5 rounded-full text-[hsl(var(--admin-text))]/20 hover:text-[hsl(var(--admin-text))] hover:bg-[hsl(var(--admin-text))]/10 transition-all">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>

                                <div className="flex flex-col gap-8">

                                    {/* ── FILE UPLOAD DROP ZONE ── */}
                                    <div>
                                        <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">
                                            Upload File <span className="opacity-40 normal-case tracking-normal">(PDF, DOCX, Image…)</span>
                                        </label>

                                        {/* Hidden real input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileUpload(file);
                                                e.target.value = '';
                                            }}
                                        />

                                        {/* Drop zone */}
                                        <div
                                            onClick={handleDropZoneClick}
                                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={handleDrop}
                                            className={`relative flex flex-col items-center justify-center gap-4 h-36 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 select-none
                                                ${dragOver
                                                    ? 'border-emerald bg-emerald/10 scale-[1.01]'
                                                    : uploading
                                                        ? 'border-emerald/40 bg-emerald/5'
                                                        : form.fileUrl
                                                            ? 'border-emerald/60 bg-emerald/5'
                                                            : 'border-[hsl(var(--admin-border))] hover:border-emerald/50 hover:bg-emerald/5'
                                                }`}
                                        >
                                            {uploading ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        className="w-8 h-8 rounded-full border-2 border-emerald border-t-transparent"
                                                    />
                                                    <p className="text-emerald text-[11px] font-bold tracking-widest uppercase">{uploadProgress}</p>
                                                    <div className="mt-2 w-3/4 h-1.5 bg-emerald/10 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-emerald"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${uploadPct}%` }}
                                                            transition={{ duration: 0.2 }}
                                                        />
                                                    </div>
                                                </>
                                            ) : form.fileUrl ? (
                                                <>
                                                    <div className="w-10 h-10 rounded-2xl bg-emerald/10 border border-emerald/20 flex items-center justify-center text-emerald text-lg">✓</div>
                                                    <div className="text-center px-4">
                                                        <p className="text-emerald text-[11px] font-bold tracking-wider mb-1">File Uploaded</p>
                                                        <p className="text-[hsl(var(--admin-text-dim))]/40 text-[10px] truncate max-w-[280px]">{form.fileUrl}</p>
                                                    </div>
                                                    <p className="text-[9px] text-[hsl(var(--admin-text-dim))]/30 uppercase tracking-widest">Click to replace</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] flex items-center justify-center">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[hsl(var(--admin-text-dim))]/40">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                            <polyline points="17 8 12 3 7 8" />
                                                            <line x1="12" y1="3" x2="12" y2="15" />
                                                        </svg>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[hsl(var(--admin-text-dim))]/60 text-[11px] font-bold">Drop file here or <span className="text-emerald">click to browse</span></p>
                                                        <p className="text-[hsl(var(--admin-text-dim))]/30 text-[9px] mt-1 uppercase tracking-widest">PDF · DOCX · XLSX · Images</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-px bg-[hsl(var(--admin-border))]" />
                                        <span className="text-[9px] text-[hsl(var(--admin-text-dim))]/30 font-bold uppercase tracking-widest">or paste a URL</span>
                                        <div className="flex-1 h-px bg-[hsl(var(--admin-border))]" />
                                    </div>

                                    {/* Resource Title */}
                                    <div>
                                        <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">Resource Title</label>
                                        <input
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            placeholder="e.g. Weekly Bulletin - Feb 23, 2026"
                                            className="w-full bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-2xl px-6 py-4 text-[hsl(var(--admin-text))] text-sm placeholder:text-[hsl(var(--admin-text-dim))]/30 focus:ring-4 focus:ring-emerald/5 focus:border-emerald/40 outline-none transition-all duration-300"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Category */}
                                        <div>
                                            <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">Category</label>
                                            <select
                                                value={form.category}
                                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                                className="w-full bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-2xl px-6 py-4 text-[hsl(var(--admin-text))] text-sm focus:ring-4 focus:ring-emerald/5 focus:border-emerald/40 outline-none transition-all duration-300 appearance-none"
                                            >
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>

                                        {/* File Type */}
                                        <div>
                                            <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">File Type</label>
                                            <select
                                                value={form.fileType}
                                                onChange={(e) => setForm({ ...form, fileType: e.target.value })}
                                                className="w-full bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-2xl px-6 py-4 text-[hsl(var(--admin-text))] text-sm focus:ring-4 focus:ring-emerald/5 focus:border-emerald/40 outline-none transition-all duration-300 appearance-none"
                                            >
                                                {fileTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Manual URL */}
                                    <div>
                                        <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">File / Download URL</label>
                                        <input
                                            value={form.fileUrl}
                                            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                                            placeholder="https://…  (auto-filled after upload)"
                                            className="w-full bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-2xl px-6 py-4 text-[hsl(var(--admin-text))] text-sm placeholder:text-[hsl(var(--admin-text-dim))]/30 focus:ring-4 focus:ring-emerald/5 focus:border-emerald/40 outline-none transition-all duration-300"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">Short Description</label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            rows={3}
                                            placeholder="Brief summary of the content…"
                                            className="w-full bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-[2rem] px-6 py-5 text-[hsl(var(--admin-text))] text-sm placeholder:text-[hsl(var(--admin-text-dim))]/30 focus:ring-4 focus:ring-emerald/5 focus:border-emerald/40 outline-none transition-all duration-300 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-10 pt-10 border-t border-[hsl(var(--admin-border))]">
                                    <button onClick={handleCancel} className="flex-1 h-16 text-[11px] font-bold tracking-widest uppercase text-[hsl(var(--admin-text-dim))]/20 rounded-[1.5rem] border border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--admin-text))]/5 transition-all">
                                        Discard Entry
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={uploading}
                                        className="flex-1 h-16 bg-emerald text-white text-[11px] font-bold tracking-widest uppercase rounded-[1.5rem] hover:shadow-2xl hover:shadow-emerald/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {editing ? 'Update Resource' : 'Save Resource'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Resource Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <AdminListSkeleton />
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {resources.map((r) => (
                                <motion.div
                                    key={r.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group bg-[hsl(var(--admin-surface))] rounded-[2rem] p-8 border border-[hsl(var(--admin-border))] hover:border-emerald/40 hover:shadow-xl transition-all duration-500 relative flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="px-3 py-1 rounded-lg bg-emerald/10 text-emerald text-[9px] font-bold uppercase tracking-widest border border-emerald/20">
                                                {r.category}
                                            </div>
                                            <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(r)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-white/50 hover:text-emerald transition-colors">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(r.id)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-white/50 hover:text-coral transition-colors">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-[hsl(var(--admin-text))] mb-2 font-display leading-tight group-hover:text-emerald transition-colors">{r.title}</h3>
                                        <p className="text-[hsl(var(--admin-text-dim))] text-xs line-clamp-2 leading-relaxed opacity-60 mb-6">{r.description}</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--admin-border))]">
                                        <span className="text-[9px] font-bold text-[hsl(var(--admin-text-dim))]/40 uppercase tracking-widest">{r.file_type || r.fileType}</span>
                                        <a href={r.file_url || r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-emerald uppercase tracking-widest hover:underline">
                                            Open File →
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {!loading && resources.length === 0 && (
                    <div className="text-center py-40 bg-[hsl(var(--admin-surface))] rounded-[4rem] border border-dashed border-[hsl(var(--admin-border))] px-6">
                        <p className="text-[hsl(var(--admin-text-dim))] font-bold text-xl font-display mb-10 tracking-tight opacity-30">The Library is Empty</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-10 py-4 bg-emerald text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:shadow-2xl hover:shadow-emerald/40 transition-all font-display"
                        >
                            Upload First Asset
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
