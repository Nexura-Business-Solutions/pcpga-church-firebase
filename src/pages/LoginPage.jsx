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

    if (!loading && user && isAdmin) {
        if (typeof window !== 'undefined') {
            navigate(fromPath, { replace: true });
        }
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter your email and password.');
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
        <div className="login-page">
            <Helmet>
                <title>Sign In · PCP Admin</title>
            </Helmet>

            <div className="login-page__shell">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="login-page__brand"
                >
                    <span className="login-page__mark">✦</span>
                    <h1 className="login-page__title">PCP Admin</h1>
                    <p className="login-page__eyebrow">Secure Gateway</p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onSubmit={handleSubmit}
                    className="login-page__card"
                >
                    <label className="login-page__label">
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            className="login-page__input"
                            autoFocus
                        />
                    </label>

                    <label className="login-page__label">
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="login-page__input"
                        />
                    </label>

                    {error && (
                        <p className="login-page__error" role="alert">
                            <span className="login-page__error-dot" />
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn--primary login-page__submit"
                    >
                        {submitting ? (
                            <span className="login-page__spinner-wrap">
                                <svg className="login-page__spinner" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                Signing in
                            </span>
                        ) : 'Sign In →'}
                    </button>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="login-page__reset"
                    >
                        Forgot password?
                    </button>
                </motion.form>

                <div className="login-page__footer">
                    <p className="login-page__small">Admin Access Only</p>
                    <Link to="/" className="login-page__exit">← Exit to Site</Link>
                </div>
            </div>
        </div>
    );
}
