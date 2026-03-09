"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login failed');
            localStorage.setItem('admin_token', data.access_token);
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            /* light warm background matching the body */
            background: '#f0eeeb',
            backgroundImage: 'radial-gradient(circle at 20% 15%, rgba(200,200,200,0.20) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(215,210,205,0.25) 0%, transparent 55%)',
            backgroundAttachment: 'fixed',
            padding: '24px',
        }}>
            {/* Card */}
            <div className="animate-fade-up" style={{
                width: '100%',
                maxWidth: '400px',
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.90)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
                borderRadius: '20px',
                padding: '48px 40px',
            }}>
                {/* Brand */}
                <div style={{ marginBottom: '36px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', marginBottom: '10px' }}>
                        Samra
                    </div>
                    <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '6px' }}>
                        Welcome back
                    </h1>
                    <p style={{ fontSize: '13px', color: '#999', fontWeight: 300 }}>
                        Sign in to your admin panel
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.07)',
                        border: '1px solid rgba(239,68,68,0.20)',
                        color: '#c53030',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '12px',
                        marginBottom: '20px',
                    }}>{error}</div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Email Address</label>
                        <input
                            type="email"
                            required
                            className="glass-input"
                            placeholder="admin@samra.intoai.in"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Password</label>
                        <input
                            type="password"
                            required
                            className="glass-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ marginTop: '8px', width: '100%', justifyContent: 'center', opacity: loading ? 0.6 : 1, fontSize: '13px', padding: '12px' }}
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
