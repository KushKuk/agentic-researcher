import React, { useState } from 'react';
import '../../styles/auth.css';

export default function AuthPage({ onAuth }) {
    const [mode, setMode] = useState('signup'); // 'login' | 'signup'
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const [animating, setAnimating] = useState(false);

    const switchMode = (next) => {
        if (next === mode) return;
        setAnimating(true);
        setErrors({});
        setTimeout(() => {
            setMode(next);
            setForm({ name: '', email: '', password: '', confirm: '' });
            setAnimating(false);
        }, 220);
    };

    const validate = () => {
        const e = {};
        if (mode === 'signup' && !form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
        if (!form.password) e.password = 'Password is required';
        else if (form.password.length < 6) e.password = 'Min 6 characters';
        if (mode === 'signup' && form.password !== form.confirm) e.confirm = 'Passwords do not match';
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        // Stub: call onAuth with user info
        onAuth({ name: form.name || form.email.split('@')[0], email: form.email, mode });
    };

    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <div className="auth-page">
            {/* ── Left panel ── */}
            <div className="auth-left">
                {/* Background orbs */}
                <div className="auth-orb auth-orb-1" />
                <div className="auth-orb auth-orb-2" />

                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <span>Clarity</span>
                </div>

                {/* Headline */}
                <div className="auth-left-content">
                    <h1 className="auth-headline">
                        {mode === 'signup'
                            ? <>Start your<br />research journey.</>
                            : <>Welcome<br />back.</>}
                    </h1>
                    <p className="auth-left-sub">
                        {mode === 'signup'
                            ? <>Already have an account?{' '}
                                <button className="auth-switch-link" onClick={() => switchMode('login')}>Log in →</button></>
                            : <>Don't have an account?{' '}
                                <button className="auth-switch-link" onClick={() => switchMode('signup')}>Sign up →</button></>}
                    </p>
                </div>
            </div>

            {/* ── Right panel ── */}
            <div className="auth-right">
                {/* Orbs behind the card */}
                <div className="auth-right-orb auth-right-orb-1" />
                <div className="auth-right-orb auth-right-orb-2" />

                {/* Glass card */}
                <div className={`auth-card ${animating ? 'auth-card--fade' : ''}`}>
                    <h2 className="auth-card-title">
                        {mode === 'signup' ? 'Create Account' : 'Sign In'}
                    </h2>

                    <form className="auth-form" onSubmit={handleSubmit} noValidate>
                        {mode === 'signup' && (
                            <div className="auth-field">
                                <input
                                    className={`auth-input ${errors.name ? 'auth-input--error' : ''}`}
                                    type="text"
                                    placeholder="Your name"
                                    value={form.name}
                                    onChange={set('name')}
                                    autoComplete="name"
                                />
                                {errors.name && <span className="auth-error">{errors.name}</span>}
                            </div>
                        )}

                        <div className="auth-field">
                            <input
                                className={`auth-input ${errors.email ? 'auth-input--error' : ''}`}
                                type="email"
                                placeholder="Email address"
                                value={form.email}
                                onChange={set('email')}
                                autoComplete="email"
                            />
                            {errors.email && <span className="auth-error">{errors.email}</span>}
                        </div>

                        <div className="auth-field">
                            <input
                                className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                                type="password"
                                placeholder="Password"
                                value={form.password}
                                onChange={set('password')}
                                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                            />
                            {errors.password && <span className="auth-error">{errors.password}</span>}
                            {mode === 'login' && (
                                <button type="button" className="auth-forgot-link">Forgot password?</button>
                            )}
                        </div>

                        {mode === 'signup' && (
                            <div className="auth-field">
                                <input
                                    className={`auth-input ${errors.confirm ? 'auth-input--error' : ''}`}
                                    type="password"
                                    placeholder="Confirm password"
                                    value={form.confirm}
                                    onChange={set('confirm')}
                                    autoComplete="new-password"
                                />
                                {errors.confirm && <span className="auth-error">{errors.confirm}</span>}
                            </div>
                        )}

                        <button className="auth-btn-primary" type="submit">
                            {mode === 'signup' ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>or</span>
                    </div>

                    <button className="auth-btn-social" type="button">
                        {/* Google "G" SVG */}
                        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <p className="auth-card-switch">
                        {mode === 'signup'
                            ? <>Already have an account?{' '}
                                <button className="auth-switch-link" onClick={() => switchMode('login')}>Log in</button></>
                            : <>No account?{' '}
                                <button className="auth-switch-link" onClick={() => switchMode('signup')}>Sign up</button></>}
                    </p>
                </div>
            </div>
        </div>
    );
}
