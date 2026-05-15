// To grant admin access:
// 1. Add the user in Firebase Console > Authentication > Users
// 2. Add a doc at Firestore: admins/{uid} with { email, role, addedAt }
// The useAuth() hook reads this allowlist to set isAdmin=true.

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { loginWithEmail, sendReset, useAuth } from '../lib/auth.js';

export default function LoginPage() {
    const { user, isAdmin, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromPath = location.state?.from?.pathname || '/admin';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // If already authenticated as admin, bounce to admin.
    if (!loading && user && isAdmin) {
        if (typeof window !== 'undefined') {
            navigate(fromPath, { replace: true });
        }
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter your email and access key.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await loginWithEmail(email, password);
            navigate(fromPath, { replace: true });
        } catch (err) {
            const msg =
                err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential'
                    ? 'Invalid email or password'
                    : err?.code === 'auth/too-many-requests'
                        ? 'Too many failed attempts. Try again later.'
                        : 'Login failed. Please try again.';
            setError(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleReset() {
        if (!email) {
            const msg = 'Enter your email first';
            setError(msg);
            return toast.error(msg);
        }
        try {
            await sendReset(email);
            toast.success('Password reset link sent. Check your email.');
        } catch {
            toast.error('Could not send reset email. Check the address and try again.');
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-6 relative overflow-hidden">
            <Helmet>
                <title>Login | PCP</title>
            </Helmet>

            {/* Background orbs */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[140px] opacity-40 animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet/20 rounded-full blur-[120px] opacity-30" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 mb-3">
                        <span className="text-3xl text-accent">✦</span>
                        <h1 className="text-2xl font-bold text-white tracking-tighter font-display">PCP Admin</h1>
                    </div>
                    <p className="text-white/30 text-[11px] tracking-[0.2em] uppercase font-bold">Secure Gateway</p>
                </motion.div>

                {/* Login Card */}
                <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onSubmit={handleSubmit}
                    className="glass-dark rounded-[2.5rem] p-10 border border-white/5 shadow-2xl"
                >
                    <div className="mb-6">
                        <label className="block text-white/40 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-base placeholder:text-white/10 focus:outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-white/40 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">
                            Access Key
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-base placeholder:text-white/10 focus:outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all outline-none"
                        />
                    </div>

                    {error && (
                        <p className="text-coral text-xs font-bold mb-6 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-coral" />
                            {error}
                        </p>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={submitting}
                        className="w-full h-14 bg-accent text-white font-bold text-xs tracking-[0.2em] uppercase rounded-2xl transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
                    >
                        {submitting ? (
                            <span className="inline-flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                Authenticating
                            </span>
                        ) : 'Sign In ➜'}
                    </motion.button>

                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-sm text-white/40 hover:text-white/80 mt-4 tracking-wide transition-colors"
                        >
                            Forgot password?
                        </button>
                    </div>
                </motion.form>

                {/* Footer Info */}
                <div className="flex flex-col items-center gap-6 mt-8">
                    <p className="text-[10px] text-white/15 tracking-widest uppercase font-bold">
                        Admin Access Only
                    </p>
                    <Link to="/" className="text-[11px] font-bold text-white/30 hover:text-white/60 transition-colors tracking-widest uppercase">
                        ← Exit to Site
                    </Link>
                </div>
            </div>
        </div>
    );
}
