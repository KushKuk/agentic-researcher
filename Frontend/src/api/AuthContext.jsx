import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial session check
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.data.user);
            } else {
                setUser(null);
            }
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signup = async (fullName, email, password) => {
        const res = await fetch('/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Signup failed');
        return data; // returns { status: 'pending', message: 'OTP sent...' }
    };

    const verifyEmail = async (email, otp) => {
        const res = await fetch('/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Verification failed');
        // The backend created the user. Now log them in via the standard login endpoint to get cookies
        return data;
    };

    const resendOtp = async (email) => {
        const res = await fetch('/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
        return data;
    };

    const login = async (email, password) => {
        const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        setUser({ id: data.data.userId, email: data.data.email });
        return data;
    };

    const logout = async () => {
        await fetch('/auth/logout', { method: 'POST' });
        setUser(null);
    };

    const requestPasswordReset = async (email) => {
        const res = await fetch('/auth/password-reset-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Request failed');
        return data;
    };

    const resetPassword = async (email, otp, newPassword) => {
        const res = await fetch('/auth/password-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Reset failed');
        return data;
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            checkAuth,
            login,
            signup,
            verifyEmail,
            resendOtp,
            logout,
            requestPasswordReset,
            resetPassword
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
