import React, { useState, useRef } from 'react';
import '../../styles/auth.css';

/* ── Step 1: Enter email ─────────────────────────── */
function StepEmail({ onNext, onBack }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return setError('Email is required');
        if (!/\S+@\S+\.\S+/.test(email)) return setError('Enter a valid email');

        setError('');
        setSent(true);

        try {
            await requestPasswordReset(email);
            // Always proceed to OTP stage to prevent email enumeration, matching backend logic
            onNext(email);
        } catch (err) {
            setError(err.message || 'Error requesting reset');
            setSent(false); // allow retry
        }
    };

    return (
        <>
            <h2 className="auth-card-title">Forgot password?</h2>
            <p className="auth-card-subtitle">
                Enter your account email and we'll send a one-time code to reset your password.
            </p>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                    <input
                        className={`auth-input ${error ? 'auth-input--error' : ''}`}
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        autoFocus
                        autoComplete="email"
                    />
                    {error && <span className="auth-error">{error}</span>}
                </div>
                <button className="auth-btn-primary" type="submit" disabled={sent}>
                    {sent ? 'Sending code…' : 'Send code'}
                </button>
            </form>
            <p className="auth-card-switch">
                <button className="auth-switch-link" onClick={onBack}>← Back to sign in</button>
            </p>
        </>
    );
}

/* ── Step 2: OTP verification ────────────────────── */
const OTP_LEN = 6;

function StepOTP({ email, onNext, onBack }) {
    const [digits, setDigits] = useState(Array(OTP_LEN).fill(''));
    const [error, setError] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [resent, setResent] = useState(false);
    const inputRefs = useRef([]);

    const handleChange = (idx, val) => {
        // Accept only digits
        const d = val.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[idx] = d;
        setDigits(next);
        setError('');
        // Move focus forward
        if (d && idx < OTP_LEN - 1) inputRefs.current[idx + 1]?.focus();
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus();
        if (e.key === 'ArrowRight' && idx < OTP_LEN - 1) inputRefs.current[idx + 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
        const next = [...digits];
        pasted.split('').forEach((ch, i) => { next[i] = ch; });
        setDigits(next);
        inputRefs.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const code = digits.join('');
        if (code.length < OTP_LEN) return setError('Please enter all 6 digits');
        // Backend expects otp + newPassword together. Just pass OTP forward.
        onNext(code);
    };

    const handleResend = async () => {
        try {
            await requestPasswordReset(email);
            setResent(true);
            setTimeout(() => setResent(false), 3000);
        } catch (err) {
            setError('Failed to resend code');
        }
    };

    const filled = digits.filter(Boolean).length;

    return (
        <>
            <h2 className="auth-card-title">Check your email</h2>
            <p className="auth-card-subtitle">
                We sent a 6-digit code to <strong>{email}</strong>.<br />
                It expires in 10 minutes.
            </p>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="otp-boxes" onPaste={handlePaste}>
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            ref={el => inputRefs.current[i] = el}
                            className={`otp-box ${d ? 'otp-box--filled' : ''} ${error ? 'otp-box--error' : ''}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={e => handleChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            autoFocus={i === 0}
                        />
                    ))}
                </div>
                {error && <span className="auth-error" style={{ textAlign: 'center' }}>{error}</span>}

                <button
                    className="auth-btn-primary"
                    type="submit"
                    disabled={filled < OTP_LEN || verifying}
                >
                    {verifying ? 'Verifying…' : 'Verify code'}
                </button>
            </form>
            <p className="auth-card-switch">
                {resent
                    ? <span style={{ color: '#00AA45' }}>Code resent!</span>
                    : <><span>Didn't receive it? </span>
                        <button className="auth-switch-link" onClick={handleResend}>Resend code</button></>}
            </p>
            <p className="auth-card-switch" style={{ marginTop: '4px' }}>
                <button className="auth-switch-link" onClick={onBack}>← Change email</button>
            </p>
        </>
    );
}

/* ── Step 3: New password ────────────────────────── */
function StepReset({ onDone }) {
    const [form, setForm] = useState({ password: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.password) errs.password = 'Password is required';
        else if (form.password.length < 6) errs.password = 'Min 6 characters';
        if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';

        if (Object.keys(errs).length) return setErrors(errs);

        setSaving(true);
        try {
            await resetPassword(email, otp, form.password);
            onDone();
        } catch (err) {
            setErrors({ api: err.message || 'Failed to reset password' });
            setSaving(false);
        }
    };

    return (
        <>
            <h2 className="auth-card-title">New password</h2>
            <p className="auth-card-subtitle">Choose a strong password for your account.</p>
            {errors.api && (
                <div className="auth-error" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,50,50,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                    {errors.api}
                </div>
            )}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                    <input
                        className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                        type="password"
                        placeholder="New password"
                        value={form.password}
                        onChange={set('password')}
                        autoFocus
                        autoComplete="new-password"
                    />
                    {errors.password && <span className="auth-error">{errors.password}</span>}
                </div>
                <div className="auth-field">
                    <input
                        className={`auth-input ${errors.confirm ? 'auth-input--error' : ''}`}
                        type="password"
                        placeholder="Confirm new password"
                        value={form.confirm}
                        onChange={set('confirm')}
                        autoComplete="new-password"
                    />
                    {errors.confirm && <span className="auth-error">{errors.confirm}</span>}
                </div>
                <button className="auth-btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Updating…' : 'Set new password'}
                </button>
            </form>
        </>
    );
}

/* ── Root: orchestrates the 3 steps ─────────────── */
export default function ForgotPasswordFlow({ onBack, onDone }) {
    const { requestPasswordReset, resetPassword } = useAuth();

    const [step, setStep] = useState('email');   // 'email' | 'otp' | 'reset' | 'success'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [animating, setAnimating] = useState(false);

    const go = (next) => {
        setAnimating(true);
        setTimeout(() => { setStep(next); setAnimating(false); }, 220);
    };

    const stepContent = () => {
        switch (step) {
            case 'email':
                return <StepEmail
                    requestPasswordReset={requestPasswordReset}
                    onNext={mail => { setEmail(mail); go('otp'); }}
                    onBack={onBack}
                />;
            case 'otp':
                return <StepOTP
                    email={email}
                    requestPasswordReset={requestPasswordReset}
                    onNext={(code) => { setOtp(code); go('reset'); }}
                    onBack={() => go('email')}
                />;
            case 'reset':
                return <StepReset
                    email={email}
                    otp={otp}
                    resetPassword={resetPassword}
                    onDone={() => go('success')}
                />;
            case 'success':
                return (
                    <div className="auth-success">
                        <h2 className="auth-card-title">Password updated!</h2>
                        <p className="auth-card-subtitle">You can now sign in with your new password.</p>
                        <button className="auth-btn-primary" onClick={onDone}>Back to sign in</button>
                    </div>
                );
            default:
                return null;
        }
    };

    /* Progress dots */
    const steps = ['email', 'otp', 'reset'];
    const activeIdx = steps.indexOf(step);

    return (
        <div className="auth-page">
            {/* Left panel */}
            <div className="auth-left">
                <div className="auth-orb auth-orb-1" />
                <div className="auth-orb auth-orb-2" />
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <span>Clarity</span>
                </div>
                <div className="auth-left-content">
                    <h1 className="auth-headline">
                        Reset your<br />password.
                    </h1>
                    <p className="auth-left-sub">
                        We'll send a secure code to verify it's you.
                    </p>
                </div>
            </div>

            {/* Right panel */}
            <div className="auth-right">
                <div className="auth-right-orb auth-right-orb-1" />
                <div className="auth-right-orb auth-right-orb-2" />
                <div className={`auth-card auth-card--centered ${animating ? 'auth-card--fade' : ''}`}>

                    {/* Progress indicator */}
                    {step !== 'success' && (
                        <div className="auth-progress">
                            {steps.map((s, i) => (
                                <div
                                    key={s}
                                    className={`auth-progress-dot ${i <= activeIdx ? 'auth-progress-dot--active' : ''}`}
                                />
                            ))}
                        </div>
                    )}

                    {stepContent()}
                </div>
            </div>
        </div>
    );
}
