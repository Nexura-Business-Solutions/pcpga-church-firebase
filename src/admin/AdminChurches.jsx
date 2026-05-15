import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    getChurches,
    addChurch,
    updateChurch,
    deleteChurch,
} from '../lib/store.js';
import { uploadFile } from '../lib/storage.js';
import { regions } from '../lib/seed-data.js';
import { AdminListSkeleton } from '../components/admin/AdminSkeleton.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import { MapPin, User, Sparkles } from 'lucide-react';

const emptyChurch = {
    name: '', address: '', region: '', province: '',
    serviceTime: '', pastor: '', phone: '', email: '', mapLink: '',
    photoUrl: '',
};

export default function AdminChurches() {
    const [churches, setChurches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyChurch);
    const [showForm, setShowForm] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoProgress, setPhotoProgress] = useState(0);

    useEffect(() => {
        const fetchChurches = async () => {
            const data = await getChurches();
            setChurches(data);
            setLoading(false);
        };
        fetchChurches();
    }, []);

    const refresh = async () => {
        const data = await getChurches();
        setChurches(data);
    };

    // Save-first: ensure we have a church doc id before uploading any files.
    // If we're creating a new church, persist the current form first so the
    // new doc id can drive the Storage path. Returns the resolved id or null.
    const ensureChurchId = async () => {
        if (editing?.id) return editing.id;
        if (!form.name.trim() || !form.region) {
            toast.error('Fill in name and region before uploading');
            return null;
        }
        const created = await addChurch({ ...form });
        if (!created?.id) {
            toast.error('Failed to initialize church record');
            return null;
        }
        setEditing(created);
        return created.id;
    };

    const handlePhotoUpload = async (file) => {
        if (!file) return;
        const churchId = await ensureChurchId();
        if (!churchId) return;
        setPhotoUploading(true);
        setPhotoProgress(0);
        try {
            const url = await uploadFile(`churches/${churchId}/${file.name}`, file, setPhotoProgress);
            await updateChurch(churchId, { photoUrl: url });
            setForm((f) => ({ ...f, photoUrl: url }));
            toast.success('Photo uploaded ✦');
        } catch (err) {
            toast.error(err.message || 'Photo upload failed');
            console.error(err);
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.region) {
            toast.error('Please fill in required fields');
            return;
        }

        setLoading(true);
        if (editing) {
            await updateChurch(editing.id, form);
            toast.success('Church updated successfully');
        } else {
            await addChurch({ ...form });
            toast.success('Church added successfully');
        }

        setShowForm(false);
        setForm(emptyChurch);
        setEditing(null);
        await refresh();
        setLoading(false);
    };

    const handleEdit = (church) => {
        setEditing(church);
        setForm({ ...emptyChurch, ...church });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this congregation?')) {
            setLoading(true);
            await deleteChurch(id);
            toast.error('Church removed');
            await refresh();
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setForm(emptyChurch);
        setEditing(null);
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto selection:bg-accent/10">

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2">
                    <div>
                        <h1 className="text-4xl font-bold text-[hsl(var(--admin-text))] tracking-tighter font-display mb-3">Registry</h1>
                        <p className="text-[hsl(var(--admin-text-dim))] text-[11px] font-bold tracking-[0.3em] uppercase">Congregation Network Management</p>
                    </div>
                    <button
                        onClick={() => { setEditing(null); setForm(emptyChurch); setShowForm(true); }}
                        className="h-14 px-8 bg-accent text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:shadow-2xl hover:shadow-accent/30 transition-all duration-300 active:scale-95 font-display"
                    >
                        + Register Church
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
                                className="bg-[hsl(var(--admin-surface))] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[hsl(var(--admin-border))] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] custom-scrollbar"
                            >
                                <div className="flex items-center justify-between mb-12">
                                    <div>
                                        <h2 className="text-3xl font-bold text-[hsl(var(--admin-text))] font-display tracking-tight mb-2">
                                            {editing ? 'Modify Church' : 'Add to Network'}
                                        </h2>
                                        <p className="text-[hsl(var(--admin-text-dim))] text-[10px] uppercase tracking-widest font-bold">Registry Entry System</p>
                                    </div>
                                    <button onClick={handleCancel} className="w-12 h-12 flex items-center justify-center bg-[hsl(var(--admin-text))]/5 rounded-full text-[hsl(var(--admin-text))]/20 hover:text-[hsl(var(--admin-text))] hover:bg-[hsl(var(--admin-text))]/10 transition-all">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>

                                <div className="mb-10 pb-10 border-b border-[hsl(var(--admin-border))]">
                                    <label className="block text-accent text-[10px] tracking-[0.25em] uppercase mb-4 font-bold flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> Smart Map Import (Free)
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="relative flex-1 group">
                                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-accent/40 group-focus-within:text-accent transition-colors">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Paste Google Maps link here..."
                                                className="w-full bg-accent/5 border border-accent/20 rounded-3xl pl-16 pr-8 py-5 text-[hsl(var(--admin-text))] text-sm placeholder:text-accent/30 focus:ring-8 focus:ring-accent/5 focus:border-accent/40 outline-none transition-all duration-300"
                                                onPaste={(e) => {
                                                    const link = e.clipboardData.getData('text');
                                                    if (!link.includes('google.com/maps')) return;

                                                    try {
                                                        // Parse Name: Extract from /place/NAME/
                                                        let name = '';
                                                        const placeMatch = link.match(/\/place\/([^/]+)/);
                                                        if (placeMatch) {
                                                            name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
                                                        }

                                                        // Extract Address if available in search query
                                                        let address = '';
                                                        const searchMatch = link.match(/query=([^&]+)/);
                                                        if (searchMatch) {
                                                            address = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
                                                        }

                                                        setForm(prev => ({
                                                            ...prev,
                                                            name: name || prev.name,
                                                            address: address || prev.address,
                                                            mapLink: link
                                                        }));
                                                        toast.success('Imported from link!');
                                                    } catch (err) {
                                                        console.error('Parse error', err);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-[hsl(var(--admin-text-dim))] uppercase tracking-widest font-bold self-center opacity-40 px-2">OR FILL MANUALLY BELOW</p>
                                    </div>
                                    <p className="mt-3 text-[10px] text-accent/40 italic font-medium px-6">💡 Pro-tip: Copy the address and name directly from Google Maps to auto-fill.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {[
                                        { key: 'name', label: 'Congregation Name', placeholder: 'e.g. PCP Manila' },
                                        { key: 'address', label: 'Physical Address', placeholder: 'Full Street Details' },
                                        { key: 'pastor', label: 'Responsible Pastor', placeholder: 'Rev. Full Name' },
                                        { key: 'province', label: 'Province/City', placeholder: 'e.g. Metro Manila' },
                                        { key: 'serviceTime', label: 'Weekly Service', placeholder: 'Sundays @ 10AM' },
                                        { key: 'phone', label: 'Primary Contact', placeholder: '+63 9...' },
                                        { key: 'email', label: 'Official Email', placeholder: 'office@pcp.org' },
                                        { key: 'mapLink', label: 'Map Coordinate Link', placeholder: 'Google Maps Embed/URL' },
                                    ].map((field) => (
                                        <div key={field.key} className={field.key === 'address' ? 'md:col-span-2' : ''}>
                                            <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">{field.label}</label>
                                            <input
                                                value={form[field.key]}
                                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                                placeholder={field.placeholder}
                                                className="w-full bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-2xl px-6 py-4.5 text-[hsl(var(--admin-text))] text-sm placeholder:text-[hsl(var(--admin-text-dim))]/30 focus:ring-4 focus:ring-accent/5 focus:border-accent/40 outline-none transition-all duration-300"
                                            />
                                        </div>
                                    ))}

                                    <div className="md:col-span-2">
                                        <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-4 font-bold">Mission Region</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {regions.map((r) => (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, region: r })}
                                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-widest transition-all uppercase ${form.region === r
                                                        ? 'bg-accent text-white shadow-lg shadow-accent/20 border border-white/10'
                                                        : 'bg-[hsl(var(--admin-text))]/5 text-[hsl(var(--admin-text-dim))]/30 hover:bg-[hsl(var(--admin-text))]/10 border border-transparent'
                                                        }`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Photo upload */}
                                    <div className="md:col-span-2">
                                        <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">Congregation Photo</label>
                                        <div className="flex items-center gap-4">
                                            <label className="cursor-pointer flex-1 h-14 flex items-center justify-center bg-accent/5 border border-dashed border-accent/30 rounded-2xl text-accent text-[11px] font-bold tracking-widest uppercase hover:bg-accent/10 transition-all">
                                                {photoUploading
                                                    ? `Uploading... ${photoProgress}%`
                                                    : form.photoUrl ? 'Replace Photo' : 'Upload Photo'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handlePhotoUpload(e.target.files[0])}
                                                    disabled={photoUploading}
                                                />
                                            </label>
                                            {form.photoUrl && !photoUploading && (
                                                <img
                                                    src={form.photoUrl}
                                                    alt="Church preview"
                                                    className="w-14 h-14 rounded-xl object-cover border border-accent/20"
                                                />
                                            )}
                                        </div>
                                        {photoUploading && (
                                            <div className="mt-3 w-full h-1.5 bg-accent/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-accent"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${photoProgress}%` }}
                                                    transition={{ duration: 0.2 }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-16 pt-10 border-t border-[hsl(var(--admin-border))]">
                                    <button onClick={handleCancel} className="flex-1 h-16 text-[11px] font-bold tracking-widest uppercase text-[hsl(var(--admin-text-dim))]/20 rounded-[1.5rem] border border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--admin-text))]/5 transition-all">
                                        Discard Changes
                                    </button>
                                    <button onClick={handleSave} className="flex-1 h-16 bg-accent text-white text-[11px] font-bold tracking-widest uppercase rounded-[1.5rem] hover:shadow-2xl hover:shadow-accent/40 transition-all hover:scale-105 active:scale-95">
                                        {editing ? 'Update Registry' : 'Confirm Registry'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* List Section */}
                <div className="space-y-4">
                    {loading ? (
                        <AdminListSkeleton />
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {churches.map((church) => (
                                <motion.div
                                    key={church.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="group bg-[hsl(var(--admin-surface))] rounded-[2rem] p-6 sm:p-8 border border-[hsl(var(--admin-border))] hover:border-accent/20 hover:shadow-lg transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8 relative overflow-hidden"
                                >
                                    {/* Item Accent Glow */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent/0 group-hover:bg-accent transition-all duration-500" />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-4 mb-2.5">
                                            <h3 className="text-xl font-bold text-[hsl(var(--admin-text))] tracking-tight truncate font-display group-hover:text-accent transition-colors">{church.name}</h3>
                                            <span className="px-3 py-1 bg-accent/10 text-accent text-[9px] font-bold uppercase tracking-[0.2em] rounded-lg border border-accent/20">{church.region}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[hsl(var(--admin-text-dim))] text-[11px] font-medium transition-colors">
                                            <p className="truncate max-w-lg opacity-60 flex items-center gap-1.5">
                                                <MapPin className="w-3 h-3" /> {church.address}
                                            </p>
                                            <span className="w-1 h-1 rounded-full bg-accent/20" />
                                            <p className="whitespace-nowrap italic opacity-60 flex items-center gap-1.5">
                                                <User className="w-3 h-3" /> Rev. {church.pastor}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 lg:opacity-20 group-hover:opacity-100 transition-all duration-300">
                                        <button
                                            onClick={() => handleEdit(church)}
                                            className="w-12 h-12 flex items-center justify-center bg-accent/5 text-accent rounded-2xl border border-accent/10 hover:bg-accent hover:text-white hover:border-transparent transition-all shadow-xl"
                                            title="Edit Entry"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(church.id)}
                                            className="w-12 h-12 flex items-center justify-center bg-coral/5 text-coral rounded-2xl border border-coral/10 hover:bg-coral hover:text-white hover:border-transparent transition-all shadow-xl"
                                            title="Delete Entry"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}

                    {!loading && churches.length === 0 && (
                        <div className="text-center py-32 bg-[hsl(var(--admin-surface))] rounded-[3rem] border border-dashed border-[hsl(var(--admin-border))] px-6">
                            <p className="text-[hsl(var(--admin-text-dim))] font-bold text-xl font-display mb-10 opacity-30 tracking-tight">Database Registry Empty</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-10 py-4 bg-accent text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:shadow-2xl hover:shadow-accent/40 transition-all font-display"
                            >
                                Confirm First Registry
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
