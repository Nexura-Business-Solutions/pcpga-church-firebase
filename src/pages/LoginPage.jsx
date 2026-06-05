// To grant admin access: add the person's Google email to the allowlist at
// Firestore admins/{lowercased-email} (or via /admin → Access Control). They
// then sign in with one-click Google — no Firebase Auth user to create. The
// useAuth() hook reads this allowlist to set isAdmin=true.

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    loginWithEmail,
    loginWithGoogle,
    loginWithGoogleRedirect,
    completeGoogleRedirect,
    recordLoginDiagnostic,
    sendReset,
    useAuth,
} from '../lib/auth.js';

export default function LoginPage() {
    const { user, isAdmin, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromPath = location.state?.from?.pathname || '/admin';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [googling, setGoogling] = useState(false);

    // If we just returned from a redirect-based Google sign-in, finish it here.
    // (Must run before any early return so the hook order stays stable.)
    useEffect(() => {
        completeGoogleRedirect()
            .then((role) => { if (role) navigate(fromPath, { replace: true }); })
            .catch((err) => {
                console.error('Google redirect completion error:', err);
                recordLoginDiagnostic('redirect', err);
                const code = err?.code || '';
                setError(code === 'admin/not-authorized'
                    ? 'This Google account is not an authorized admin.'
                    : `Google sign-in failed${code ? ` (${code})` : ''}.`);
            });
    }, [navigate, fromPath]);

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

    async function handleGoogle() {
        setGoogling(true);
        setError('');
        try {
            await loginWithGoogle();
            navigate(fromPath, { replace: true });
        } catch (err) {
            console.error('Google sign-in error:', err);
            recordLoginDiagnostic('popup', err);
            const code = err?.code || '';
            // Popups are blocked in many in-app/mobile browsers — fall back to a
            // full-page redirect, which works where popups don't.
            const popupFailed = [
                'auth/popup-blocked',
                'auth/cancelled-popup-request',
                'auth/operation-not-supported-in-this-environment',
                'auth/web-storage-unsupported',
            ].includes(code);
            if (popupFailed) {
                try {
                    await loginWithGoogleRedirect(); // navigates away
                    return;
                } catch (e2) {
                    console.error('Google redirect error:', e2);
                }
            }
            const msg =
                code === 'admin/not-authorized'
                    ? 'This Google account is not an authorized admin.'
                    : code === 'auth/popup-closed-by-user'
                        ? 'Sign-in was cancelled.'
                        : `Google sign-in failed${code ? ` (${code})` : ''}. You can use the email login below.`;
            setError(msg);
            toast.error(msg);
        } finally {
            setGoogling(false);
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
                    <button
                        type="button"
                        onClick={handleGoogle}
                        disabled={googling || submitting}
                        className="login-page__google"
                    >
                        {googling ? (
                            <span className="login-page__spinner-wrap">
                                <svg className="login-page__spinner" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                Connecting…
                            </span>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </button>

                    {error && (
                        <p className="login-page__error" role="alert">
                            <span className="login-page__error-dot" />
                            {error}
                        </p>
                    )}

                    <div className="login-page__divider"><span>or with email</span></div>

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
