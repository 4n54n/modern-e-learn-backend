"use client";

import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from "@/config/api-endpoints";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const tok = () => localStorage.getItem('admin_token') ?? '';

const METHOD_STYLES: Record<string, { bg: string; color: string }> = {
    GET: { bg: 'rgba(37,99,235,0.08)', color: '#2563eb' },
    POST: { bg: 'rgba(5,150,105,0.08)', color: '#059669' },
    PUT: { bg: 'rgba(180,83,9,0.08)', color: '#b45309' },
    DELETE: { bg: 'rgba(185,28,28,0.08)', color: '#b91c1c' },
};

interface EnvEntry { key: string; label: string; hasValue: boolean; preview: string; }

const ENV_GROUPS = [
    { group: 'Cloudflare R2', keys: ['CLOUDFLARE_R2_ENDPOINT', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET_NAME'] },
    { group: 'Razorpay', keys: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'] },
    { group: 'Firebase', keys: ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL'] },
    { group: 'Telegram Bot', keys: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'] },
    { group: 'Security', keys: ['JWT_SECRET'] },
    { group: 'App Settings', keys: ['SUPPORT_PHONE'] },
];

function EnvPanel() {
    const [entries, setEntries] = useState<EnvEntry[]>([]);
    const [editing, setEditing] = useState<{ [key: string]: string }>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        fetch(`${API}/admin/env-config`, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(r => r.json())
            .then(d => setEntries(Array.isArray(d) ? d : []))
            .catch(() => { });
    }, [open]);

    const save = async (key: string) => {
        if (!editing[key]) return;
        setSaving(key);
        await fetch(`${API}/admin/update-env`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
            body: JSON.stringify({ key, value: editing[key] }),
        });
        setSaving(null);
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
        setEditing(prev => { const n = { ...prev }; delete n[key]; return n; });
        // refresh entries
        fetch(`${API}/admin/env-config`, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(r => r.json()).then(d => setEntries(Array.isArray(d) ? d : []));
    };

    const getEntry = (key: string) => entries.find(e => e.key === key);

    return (
        <div style={{ marginBottom: '40px' }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: open ? '16px 16px 0 0' : '16px', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>⚙️</span>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>Service Configuration</p>
                        <p style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>Update Cloudflare R2, Razorpay, Firebase, and JWT keys</p>
                    </div>
                </div>
                <span style={{ fontSize: '12px', color: '#aaa', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
            </div>

            {open && (
                <div style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.85)', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        {ENV_GROUPS.map(group => (
                            <div key={group.group}>
                                <p className="label-xs" style={{ marginBottom: '10px' }}>{group.group}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {group.keys.map(key => {
                                        const entry = getEntry(key);
                                        const isEditing = key in editing;
                                        return (
                                            <div key={key} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '10px', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.06)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '11px', color: '#555', fontWeight: 500, flexShrink: 0 }}>{entry?.label ?? key}</span>
                                                    <span style={{ flex: 1, height: '1px', borderBottom: '1px dashed rgba(0,0,0,0.12)', margin: '0 6px' }} />
                                                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', flexShrink: 0, background: entry?.hasValue ? 'rgba(5,150,105,0.10)' : 'rgba(0,0,0,0.07)', color: entry?.hasValue ? '#047857' : '#aaa' }}>
                                                        {entry?.hasValue ? '✓ configured' : 'not set'}
                                                    </span>
                                                </div>
                                                {!isEditing && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '11px', color: '#aaa', flex: 1, fontFamily: 'monospace' }}>{entry?.preview || '—'}</span>
                                                        <button onClick={() => setEditing(prev => ({ ...prev, [key]: '' }))} style={{ fontSize: '10px', color: '#888', background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontFamily: 'Sora,sans-serif' }}>Edit</button>
                                                    </div>
                                                )}
                                                {isEditing && (
                                                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                                        <input
                                                            autoFocus
                                                            style={{ flex: 1, padding: '6px 10px', borderRadius: '7px', border: '1px solid rgba(0,0,0,0.15)', fontSize: '11px', fontFamily: 'monospace', background: 'white', outline: 'none' }}
                                                            placeholder={key.includes('PRIVATE') ? 'Paste private key…' : 'New value…'}
                                                            value={editing[key]}
                                                            onChange={e => setEditing(prev => ({ ...prev, [key]: e.target.value }))}
                                                            onKeyDown={e => e.key === 'Escape' && setEditing(prev => { const n = { ...prev }; delete n[key]; return n; })}
                                                        />
                                                        <button onClick={() => save(key)} disabled={saving === key || !editing[key]} style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', background: saved === key ? '#047857' : '#1a1a1a', color: 'white', fontSize: '11px', cursor: 'pointer', fontFamily: 'Sora,sans-serif', whiteSpace: 'nowrap', opacity: !editing[key] ? 0.5 : 1 }}>
                                                            {saving === key ? '…' : saved === key ? '✓' : 'Save'}
                                                        </button>
                                                        <button onClick={() => setEditing(prev => { const n = { ...prev }; delete n[key]; return n; })} style={{ padding: '6px 8px', borderRadius: '7px', border: '1px solid rgba(0,0,0,0.12)', background: 'none', color: '#aaa', fontSize: '11px', cursor: 'pointer', fontFamily: 'Sora,sans-serif' }}>✕</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DeveloperTab() {
    const categories = Array.from(new Set(API_ENDPOINTS.map(ep => ep.category)));

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '64px' }} className="animate-fade-up">

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <p className="label-xs" style={{ marginBottom: '6px' }}>Documentation</p>
                <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>API Reference</h1>
            </div>

            {/* Env Settings Panel */}
            <EnvPanel />

            {/* Credentials Settings Panel */}
            <div style={{ marginBottom: '40px' }}>
                <CredentialsPanel />
            </div>

            {/* API Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '44px' }}>
                {categories.map(category => (
                    <section key={category}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <span className="label-xs">{category}</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
                            <span style={{ fontSize: '10px', color: '#ccc' }}>{API_ENDPOINTS.filter(ep => ep.category === category).length} endpoints</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {API_ENDPOINTS.filter(ep => ep.category === category).map((ep, idx) => {
                                const ms = METHOD_STYLES[ep.method] ?? METHOD_STYLES.GET;
                                return (
                                    <div key={idx} className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                                        {/* Route header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', background: 'rgba(255,255,255,0.55)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', background: ms.bg, color: ms.color }}>
                                                {ep.method}
                                            </span>
                                            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#333', fontWeight: 500 }}>{ep.url}</span>
                                        </div>

                                        {/* Details */}
                                        <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', background: 'rgba(248,247,245,0.60)' }}>
                                            <div>
                                                <p className="label-xs" style={{ marginBottom: '6px', fontSize: '9px' }}>Headers</p>
                                                <pre style={{ background: 'rgba(255,255,255,0.85)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.07)', fontSize: '10px', overflowX: 'auto', color: '#b45309', margin: 0, lineHeight: 1.6, fontFamily: 'monospace' }}>
                                                    {JSON.stringify(ep.headers, null, 2)}
                                                </pre>
                                                {ep.bodyFormat && (
                                                    <>
                                                        <p className="label-xs" style={{ marginBottom: '6px', fontSize: '9px', marginTop: '10px' }}>Request Body</p>
                                                        <pre style={{ background: 'rgba(255,255,255,0.85)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.07)', fontSize: '10px', overflowX: 'auto', color: '#059669', margin: 0, lineHeight: 1.6, fontFamily: 'monospace' }}>
                                                            {ep.bodyFormat}
                                                        </pre>
                                                    </>
                                                )}
                                            </div>
                                            <div>
                                                <p className="label-xs" style={{ marginBottom: '6px', fontSize: '9px' }}>Example Request</p>
                                                <pre style={{ background: 'rgba(255,255,255,0.85)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.07)', borderLeftColor: '#2563eb', borderLeftWidth: '2px', fontSize: '10px', overflowX: 'auto', color: '#444', margin: 0, lineHeight: 1.6, fontFamily: 'monospace' }}>
                                                    {ep.exampleRequest}
                                                </pre>
                                                <p className="label-xs" style={{ marginBottom: '6px', fontSize: '9px', marginTop: '10px' }}>Example Response</p>
                                                <pre style={{ background: 'rgba(255,255,255,0.85)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.07)', borderLeftColor: '#059669', borderLeftWidth: '2px', fontSize: '10px', overflowX: 'auto', color: '#047857', margin: 0, lineHeight: 1.6, fontFamily: 'monospace' }}>
                                                    {ep.exampleResponse}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

function CredentialsPanel() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await fetch(`${API}/admin/update-credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
                body: JSON.stringify({ email: email || undefined, password: password || undefined }),
            });
            setSaved(true);
            setEmail('');
            setPassword('');
            setTimeout(() => setSaved(false), 2000);
        } catch (err) { }
        setSaving(false);
    };

    return (
        <div style={{ marginBottom: '40px' }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: open ? '16px 16px 0 0' : '16px', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>🔐</span>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>Admin Credentials</p>
                        <p style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>Update your admin login email and password</p>
                    </div>
                </div>
                <span style={{ fontSize: '12px', color: '#aaa', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
            </div>

            {open && (
                <div style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.85)', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        <div>
                            <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>New Email Address</label>
                            <input
                                type="email"
                                className="glass-input"
                                placeholder="Leave blank to keep current"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>New Password</label>
                            <input
                                type="password"
                                className="glass-input"
                                placeholder="Leave blank to keep current"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                type="submit"
                                disabled={saving || (!email && !password)}
                                className="btn-primary"
                                style={{ padding: '12px 24px', opacity: (saving || (!email && !password)) ? 0.6 : 1 }}
                            >
                                {saving ? 'Saving...' : saved ? 'Saved!' : 'Update Credentials'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
