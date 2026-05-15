import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getHeroContent, saveHeroContent } from '../lib/store.js';
import { uploadFile } from '../lib/storage.js';
import { AdminCardSkeleton } from '../components/admin/AdminSkeleton.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';

export default function AdminHero() {
    const [form, setForm] = useState({ heading: '', subtitle: '', ctaText: '', serviceTimes: '', heroImage: '' });
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const fetchHero = async () => {
            const content = await getHeroContent();
            if (content) setForm(content);
            setLoading(false);
        };
        fetchHero();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        await saveHeroContent(form);
        toast.success('Hero content published successfully');
        setLoading(false);
    };

    const handleImageUpload = async (file) => {
        if (!file) return;
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const url = await uploadFile(`hero/${Date.now()}-${file.name}`, file, setUploadProgress);
            const newForm = { ...form, heroImage: url };
            setForm(newForm);
            await saveHeroContent(newForm);
            toast.success('Hero image uploaded ✦');
        } catch (err) {
            toast.error(err.message || 'Upload failed');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto selection:bg-coral/10">

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2">
                    <div>
                        <h1 className="text-4xl font-bold text-[hsl(var(--admin-text))] tracking-tighter font-display mb-3">Hero Setting</h1>
                        <p className="text-[hsl(var(--admin-text-dim))] text-[11px] font-bold tracking-[0.3em] uppercase">Visual Experience Configuration</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="h-14 px-8 bg-coral text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:shadow-2xl hover:shadow-coral/30 transition-all duration-300 active:scale-95 font-display"
                    >
                        Publish Changes
                    </button>
                </div>

                <div className="space-y-12">
                    {loading ? (
                        <AdminCardSkeleton />
                    ) : (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[hsl(var(--admin-surface))] rounded-[3rem] p-12 border border-[hsl(var(--admin-border))] shadow-2xl transition-colors duration-500"
                            >
                                <div className="flex items-center gap-5 mb-12">
                                    <div className="w-14 h-14 rounded-2xl bg-coral/10 flex items-center justify-center text-coral border border-coral/20">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[hsl(var(--admin-text))] font-display tracking-tight">Main Visual</h2>
                                        <p className="text-[hsl(var(--admin-text-dim))] text-[9px] uppercase tracking-widest font-bold">Atmospheric Background</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="relative group">
                                        <div className={`w-full aspect-[21/9] rounded-[2.5rem] border-2 border-dashed overflow-hidden transition-all duration-500 flex items-center justify-center ${form.heroImage ? 'border-coral/40 bg-coral/5' : 'border-[hsl(var(--admin-border))] hover:border-coral/40'}`}>
                                            {isUploading ? (
                                                <div className="flex flex-col items-center gap-4 w-2/3">
                                                    <div className="w-8 h-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
                                                    <p className="text-coral text-[10px] font-bold uppercase tracking-widest">Uploading Photo... {uploadProgress}%</p>
                                                    <div className="w-full h-1.5 bg-coral/10 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-coral"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${uploadProgress}%` }}
                                                            transition={{ duration: 0.2 }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : form.heroImage ? (
                                                <img src={form.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-8">
                                                    <p className="text-[hsl(var(--admin-text-dim))] text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">No custom background</p>
                                                    <p className="text-[hsl(var(--admin-text-dim))]/20 text-[9px] uppercase tracking-widest">Falls back to professional default</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm rounded-[2.5rem]">
                                            <label className="cursor-pointer px-10 py-4 bg-white text-coral text-[11px] font-bold uppercase tracking-widest rounded-2xl hover:scale-105 transition-all">
                                                {form.heroImage ? 'Replace Image' : 'Upload Image'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(e.target.files[0])}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    {form.heroImage && (
                                        <button
                                            onClick={() => setForm({ ...form, heroImage: '' })}
                                            className="w-full text-center text-coral/40 hover:text-coral text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
                                        >
                                            Remove Custom Background
                                        </button>
                                    )}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-[hsl(var(--admin-surface))] rounded-[3rem] p-12 border border-[hsl(var(--admin-border))] shadow-2xl transition-colors duration-500"
                            >
                                <div className="flex items-center gap-5 mb-12">
                                    <div className="w-14 h-14 rounded-2xl bg-coral/10 flex items-center justify-center text-coral border border-coral/20">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[hsl(var(--admin-text))] font-display tracking-tight">Messaging System</h2>
                                        <p className="text-[hsl(var(--admin-text-dim))] text-[9px] uppercase tracking-widest font-bold">Identity & Narrative</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {[
                                        { key: 'heading', label: 'Main Headline', placeholder: 'Welcome Home.' },
                                        { key: 'subtitle', label: 'Supportive Narrative', placeholder: 'Where faith and community meet.' },
                                        { key: 'ctaText', label: 'Primary Action Label', placeholder: 'Join Us Sunday' },
                                        { key: 'serviceTimes', label: 'Operational Banner', placeholder: 'Sunday Worship · 9:00 AM' },
                                    ].map((field) => (
                                        <div key={field.key} className={field.key === 'heading' || field.key === 'subtitle' ? 'md:col-span-2' : ''}>
                                            <label className="block text-[hsl(var(--admin-text-dim))] text-[10px] tracking-[0.25em] uppercase mb-3 font-bold">{field.label}</label>
                                            <input
                                                value={form[field.key] || ''}
                                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                                placeholder={field.placeholder}
                                                className="w-full bg-[hsl(var(--admin-text))]/5 border border-[hsl(var(--admin-border))] rounded-2xl px-6 py-4.5 text-[hsl(var(--admin-text))] text-sm placeholder:text-[hsl(var(--admin-text-dim))]/30 focus:ring-4 focus:ring-coral/5 focus:border-coral/40 outline-none transition-all duration-300"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>

                <div className="mt-16 flex justify-center pb-20">
                    <button
                        onClick={handleSave}
                        className="h-18 px-20 bg-coral text-white text-sm font-bold tracking-[0.1em] rounded-2xl hover:shadow-[0_24px_48px_-12px_rgba(255,107,107,0.3)] transition-all hover:scale-105 active:scale-95 font-display"
                    >
                        Update Live Hero Experience
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
