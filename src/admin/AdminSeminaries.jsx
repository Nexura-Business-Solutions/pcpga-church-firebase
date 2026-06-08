import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { GraduationCap, Plus, Trash2, X } from 'lucide-react';
import { getSeminaries, saveSeminaries } from '../lib/store.js';
import { uploadFile } from '../lib/storage.js';
import { AdminListSkeleton } from '../components/admin/AdminSkeleton.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';

const emptySeminary = () => ({
    id: '', name: '', shortName: '', tagline: '', type: 'seminary',
    about: '', location: '', website: '', contact: '',
    vision: '', mission: [], statementOfFaith: [], officers: [], faculty: [],
    programs: [], admissions: { whoMayApply: [], requirements: [] },
    schedule: { day: '', time: '', mode: '', load: '' }, photoUrl: '',
});

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const inputCls = 'w-full bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-2xl px-5 py-3.5 text-[hsl(var(--admin-text))] text-sm placeholder:text-[hsl(var(--admin-text-dim))]/30 focus:ring-4 focus:ring-accent/5 focus:border-accent/40 outline-none transition-all';
const labelCls = 'block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-2 font-bold';

function StringList({ label, list, onChange, placeholder }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <div className="space-y-2">
                {list.map((val, i) => (
                    <div key={i} className="flex gap-2">
                        <input className={inputCls} value={val} placeholder={placeholder}
                            onChange={(e) => { const n = [...list]; n[i] = e.target.value; onChange(n); }} />
                        <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))}
                            className="shrink-0 w-11 h-11 flex items-center justify-center bg-coral/5 text-coral rounded-2xl border border-coral/10 hover:bg-coral hover:text-white transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => onChange([...list, ''])}
                    className="inline-flex items-center gap-1.5 text-accent text-[11px] font-bold uppercase tracking-widest hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add
                </button>
            </div>
        </div>
    );
}

function OfficerList({ list, onChange }) {
    const set = (i, key, v) => { const n = list.map((o) => ({ ...o })); n[i][key] = v; onChange(n); };
    return (
        <div>
            <label className={labelCls}>Administration / Officers</label>
            <div className="space-y-2">
                {list.map((o, i) => (
                    <div key={i} className="flex gap-2">
                        <input className={inputCls} value={o.name || ''} placeholder="Name" onChange={(e) => set(i, 'name', e.target.value)} />
                        <input className={inputCls} value={o.role || ''} placeholder="Role" onChange={(e) => set(i, 'role', e.target.value)} />
                        <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))}
                            className="shrink-0 w-11 h-11 flex items-center justify-center bg-coral/5 text-coral rounded-2xl border border-coral/10 hover:bg-coral hover:text-white transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => onChange([...list, { name: '', role: '' }])}
                    className="inline-flex items-center gap-1.5 text-accent text-[11px] font-bold uppercase tracking-widest hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add Officer
                </button>
            </div>
        </div>
    );
}

function SolaList({ list, onChange }) {
    const set = (i, key, v) => { const n = list.map((o) => ({ ...o })); n[i][key] = v; onChange(n); };
    return (
        <div>
            <label className={labelCls}>Statement of Faith</label>
            <div className="space-y-2">
                {list.map((x, i) => (
                    <div key={i} className="flex gap-2">
                        <input className={inputCls} value={x.title || ''} placeholder="Title (e.g. Sola Scriptura)" onChange={(e) => set(i, 'title', e.target.value)} />
                        <input className={inputCls} value={x.subtitle || ''} placeholder="Subtitle (e.g. Scripture Alone)" onChange={(e) => set(i, 'subtitle', e.target.value)} />
                        <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))}
                            className="shrink-0 w-11 h-11 flex items-center justify-center bg-coral/5 text-coral rounded-2xl border border-coral/10 hover:bg-coral hover:text-white transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => onChange([...list, { title: '', subtitle: '' }])}
                    className="inline-flex items-center gap-1.5 text-accent text-[11px] font-bold uppercase tracking-widest hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
            </div>
        </div>
    );
}

function ProgramList({ list, onChange }) {
    const set = (i, key, v) => { const n = list.map((p) => ({ ...p })); n[i][key] = v; onChange(n); };
    return (
        <div>
            <label className={labelCls}>Academic Programs</label>
            <div className="space-y-4">
                {list.map((p, i) => (
                    <div key={i} className="rounded-2xl border border-[hsl(var(--admin-border))] p-4 space-y-2">
                        <div className="flex gap-2">
                            <input className={inputCls} value={p.name || ''} placeholder="Program name" onChange={(e) => set(i, 'name', e.target.value)} />
                            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))}
                                className="shrink-0 w-11 h-11 flex items-center justify-center bg-coral/5 text-coral rounded-2xl border border-coral/10 hover:bg-coral hover:text-white transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input className={inputCls} value={p.duration || ''} placeholder="Duration" onChange={(e) => set(i, 'duration', e.target.value)} />
                            <input className={inputCls} value={p.units || ''} placeholder="Units" onChange={(e) => set(i, 'units', e.target.value)} />
                        </div>
                        <textarea className={inputCls} rows={2} value={p.description || ''} placeholder="Description" onChange={(e) => set(i, 'description', e.target.value)} />
                        <StringList label="Highlights" list={p.highlights || []} placeholder="Highlight" onChange={(v) => set(i, 'highlights', v)} />
                    </div>
                ))}
                <button type="button" onClick={() => onChange([...list, { name: '', duration: '', units: '', description: '', highlights: [] }])}
                    className="inline-flex items-center gap-1.5 text-accent text-[11px] font-bold uppercase tracking-widest hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add Program
                </button>
            </div>
        </div>
    );
}

export default function AdminSeminaries() {
    const [seminaries, setSeminaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(emptySeminary());
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);

    useEffect(() => {
        (async () => {
            const data = await getSeminaries();
            setSeminaries(Array.isArray(data) ? data : []);
            setLoading(false);
        })();
    }, []);

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
    const setSchedule = (key, val) => setForm((f) => ({ ...f, schedule: { ...f.schedule, [key]: val } }));
    const setAdmissions = (key, val) => setForm((f) => ({ ...f, admissions: { ...f.admissions, [key]: val } }));

    const openNew = () => { setForm(emptySeminary()); setEditingId(null); setShowForm(true); };
    const openEdit = (s) => { setForm({ ...emptySeminary(), ...s }); setEditingId(s.id); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setForm(emptySeminary()); setEditingId(null); };

    const persist = async (list) => {
        const ok = await saveSeminaries(list);
        if (ok) { setSeminaries(list); return true; }
        toast.error('Save failed'); return false;
    };

    const handlePhotoUpload = async (file) => {
        if (!file) return;
        if (!form.name.trim()) { toast.error('Enter a name before uploading'); return; }
        const id = form.id || slugify(form.name);
        setPhotoUploading(true);
        try {
            const url = await uploadFile(`seminaries/${id}/${file.name}`, file);
            setForm((f) => ({ ...f, id, photoUrl: url }));
            toast.success('Photo uploaded ✦');
        } catch (err) {
            toast.error(err.message || 'Upload failed');
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Name is required'); return; }
        const id = form.id || slugify(form.name);
        if (!editingId && seminaries.some((s) => s.id === id)) {
            toast.error('A seminary with this name already exists');
            return;
        }
        const record = { ...form, id };
        const list = editingId
            ? seminaries.map((s) => (s.id === editingId ? record : s))
            : [...seminaries, record];
        if (await persist(list)) {
            toast.success(editingId ? 'Seminary updated' : 'Seminary added');
            closeForm();
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this seminary?')) return;
        if (await persist(seminaries.filter((s) => s.id !== id))) toast.success('Seminary removed');
    };

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto">
                <div className="flex items-end justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-[hsl(var(--admin-text))] tracking-tighter font-display mb-2">Seminaries</h1>
                        <p className="text-[hsl(var(--admin-text-dim))] text-[11px] font-bold tracking-[0.3em] uppercase">Theological Schools</p>
                    </div>
                    <button onClick={openNew}
                        className="h-14 px-7 bg-accent text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:shadow-2xl hover:shadow-accent/30 transition-all active:scale-95">
                        + Add Seminary
                    </button>
                </div>

                <AnimatePresence>
                    {showForm && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                            <motion.div initial={{ scale: 0.96, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 24 }}
                                className="bg-[hsl(var(--admin-surface))] rounded-[2rem] p-6 sm:p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[hsl(var(--admin-border))] custom-scrollbar">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-[hsl(var(--admin-text))] font-display">{editingId ? 'Edit Seminary' : 'Add Seminary'}</h2>
                                    <button onClick={closeForm} className="w-11 h-11 flex items-center justify-center bg-[hsl(var(--admin-text))]/5 rounded-full text-[hsl(var(--admin-text))]/40 hover:text-[hsl(var(--admin-text))]"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelCls}>Name *</label><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
                                        <div><label className={labelCls}>Short Name</label><input className={inputCls} value={form.shortName} onChange={(e) => set('shortName', e.target.value)} /></div>
                                        <div><label className={labelCls}>Tagline</label><input className={inputCls} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} /></div>
                                        <div>
                                            <label className={labelCls}>Type</label>
                                            <div className="flex gap-2">
                                                {['seminary', 'college'].map((t) => (
                                                    <button key={t} type="button" onClick={() => set('type', t)}
                                                        className={`px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${form.type === t ? 'bg-accent text-white' : 'bg-[hsl(var(--admin-text))]/5 text-[hsl(var(--admin-text-dim))]/50'}`}>{t}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2"><label className={labelCls}>Location</label><input className={inputCls} value={form.location} onChange={(e) => set('location', e.target.value)} /></div>
                                        <div><label className={labelCls}>Website</label><input className={inputCls} value={form.website} onChange={(e) => set('website', e.target.value)} /></div>
                                        <div><label className={labelCls}>Contact</label><input className={inputCls} value={form.contact} onChange={(e) => set('contact', e.target.value)} /></div>
                                    </div>

                                    <div><label className={labelCls}>About</label><textarea className={inputCls} rows={4} value={form.about} onChange={(e) => set('about', e.target.value)} /></div>
                                    <div><label className={labelCls}>Vision</label><textarea className={inputCls} rows={2} value={form.vision} onChange={(e) => set('vision', e.target.value)} /></div>

                                    <StringList label="Mission" list={form.mission} placeholder="Mission point" onChange={(v) => set('mission', v)} />
                                    <SolaList list={form.statementOfFaith} onChange={(v) => set('statementOfFaith', v)} />
                                    <OfficerList list={form.officers} onChange={(v) => set('officers', v)} />
                                    <StringList label="Faculty" list={form.faculty} placeholder="Faculty member" onChange={(v) => set('faculty', v)} />
                                    <ProgramList list={form.programs} onChange={(v) => set('programs', v)} />
                                    <StringList label="Admissions — Who May Apply" list={form.admissions.whoMayApply} placeholder="Applicant type" onChange={(v) => setAdmissions('whoMayApply', v)} />
                                    <StringList label="Admissions — Requirements" list={form.admissions.requirements} placeholder="Requirement" onChange={(v) => setAdmissions('requirements', v)} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelCls}>Schedule — Day</label><input className={inputCls} value={form.schedule.day} onChange={(e) => setSchedule('day', e.target.value)} /></div>
                                        <div><label className={labelCls}>Schedule — Time</label><input className={inputCls} value={form.schedule.time} onChange={(e) => setSchedule('time', e.target.value)} /></div>
                                        <div><label className={labelCls}>Schedule — Mode</label><input className={inputCls} value={form.schedule.mode} onChange={(e) => setSchedule('mode', e.target.value)} /></div>
                                        <div><label className={labelCls}>Schedule — Load</label><input className={inputCls} value={form.schedule.load} onChange={(e) => setSchedule('load', e.target.value)} /></div>
                                    </div>

                                    <div>
                                        <label className={labelCls}>Photo</label>
                                        <div className="flex items-center gap-3">
                                            <label className="cursor-pointer flex-1 h-12 flex items-center justify-center bg-accent/5 border border-dashed border-accent/30 rounded-2xl text-accent text-[11px] font-bold tracking-widest uppercase hover:bg-accent/10 transition-all">
                                                {photoUploading ? 'Uploading…' : form.photoUrl ? 'Replace Photo' : 'Upload Photo'}
                                                <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" disabled={photoUploading} onChange={(e) => handlePhotoUpload(e.target.files[0])} />
                                            </label>
                                            {form.photoUrl && <img src={form.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-accent/20" />}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-10 pt-8 border-t border-[hsl(var(--admin-border))]">
                                    <button onClick={closeForm} className="flex-1 h-14 text-[11px] font-bold tracking-widest uppercase text-[hsl(var(--admin-text-dim))]/50 rounded-2xl border border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--admin-text))]/5 transition-all">Cancel</button>
                                    <button onClick={handleSave} className="flex-1 h-14 bg-accent text-white text-[11px] font-bold tracking-widest uppercase rounded-2xl hover:shadow-2xl hover:shadow-accent/40 transition-all active:scale-95">{editingId ? 'Update' : 'Add'}</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-4">
                    {loading ? <AdminListSkeleton /> : (
                        <AnimatePresence mode="popLayout">
                            {seminaries.map((s) => (
                                <motion.div key={s.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                                    className="group bg-[hsl(var(--admin-surface))] rounded-[2rem] p-6 border border-[hsl(var(--admin-border))] hover:border-accent/20 hover:shadow-lg transition-all flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <span className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0"><GraduationCap className="w-5 h-5 text-accent" /></span>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-bold text-[hsl(var(--admin-text))] font-display truncate group-hover:text-accent transition-colors">{s.name}</h3>
                                            <p className="text-[hsl(var(--admin-text-dim))] text-[11px] truncate">{s.tagline || s.shortName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => openEdit(s)} className="px-4 h-11 flex items-center bg-accent/5 text-accent rounded-2xl border border-accent/10 hover:bg-accent hover:text-white transition-all text-[11px] font-bold uppercase tracking-widest">Edit</button>
                                        <button onClick={() => handleDelete(s.id)} className="w-11 h-11 flex items-center justify-center bg-coral/5 text-coral rounded-2xl border border-coral/10 hover:bg-coral hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                    {!loading && seminaries.length === 0 && (
                        <div className="text-center py-24 bg-[hsl(var(--admin-surface))] rounded-[2rem] border border-dashed border-[hsl(var(--admin-border))]">
                            <p className="text-[hsl(var(--admin-text-dim))] font-bold text-lg font-display mb-6 opacity-40">No seminaries yet</p>
                            <button onClick={openNew} className="px-8 py-3 bg-accent text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl">Add the first seminary</button>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
