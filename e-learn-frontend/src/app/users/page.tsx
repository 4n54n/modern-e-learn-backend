"use client";

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const tok = () => localStorage.getItem('admin_token') ?? '';

interface Purchase {
    id: string;
    amount_paid: number;
    status: string;
    expires_at: string | null;
    created_at: string;
    course: { id: string; title: string; price: number } | null;
}
interface User {
    id: string;
    name: string;
    email: string;
    primary_device_id?: string | null;
    created_at: string;
    devices: { id: string; last_active: string }[];
    purchases: Purchase[];
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d: string) {
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtInr(n: number) { return `₹${n.toLocaleString('en-IN')}`; }
function initials(name: string) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
const AV_COLORS = ['#c9a84c', '#9b6b9b', '#6b9b9b', '#9b7b6b', '#6b9b7b', '#9b6b7b'];
function avatarColor(id: string) {
    let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    return AV_COLORS[h % AV_COLORS.length];
}
function isExpired(expires_at: string | null) {
    if (!expires_at) return false;
    return new Date(expires_at) < new Date();
}

// ── Inline-editable purchase row ──────────────────────────────────────────────
function PurchaseRow({ p, onSaved }: { p: Purchase; onSaved: (updated: Purchase) => void }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({ status: p.status, expires_at: p.expires_at ? p.expires_at.slice(0, 10) : '', amount_paid: String(p.amount_paid) });
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        const body: any = { status: draft.status, amount_paid: parseFloat(draft.amount_paid) };
        body.expires_at = draft.expires_at ? draft.expires_at : null;
        const res = await fetch(`${API}/users/purchases/${p.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
            body: JSON.stringify(body),
        });
        const updated = await res.json();
        setSaving(false); setEditing(false);
        onSaved({ ...p, ...updated });
    };

    const expired = isExpired(p.expires_at);

    if (!editing) return (
        <tr>
            <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 500, color: '#1a1a1a' }}>
                {p.course?.title ?? 'Unknown Course'}
            </td>
            <td style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#047857', background: 'rgba(5,150,105,0.09)', padding: '3px 10px', borderRadius: '20px' }}>
                    {fmtInr(p.amount_paid)}
                </span>
            </td>
            <td style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: p.status === 'SUCCESS' ? 'rgba(5,150,105,0.09)' : 'rgba(239,68,68,0.09)', color: p.status === 'SUCCESS' ? '#047857' : '#b91c1c' }}>
                    {p.status}
                </span>
            </td>
            <td style={{ padding: '10px 12px', fontSize: '11px', color: expired ? '#b91c1c' : '#888' }}>
                {p.expires_at ? `${fmtDate(p.expires_at)}${expired ? ' (expired)' : ''}` : <span style={{ color: '#ccc' }}>No expiry</span>}
            </td>
            <td style={{ padding: '10px 12px', fontSize: '11px', color: '#888' }}>{fmtDateTime(p.created_at)}</td>
            <td style={{ padding: '10px 12px' }}>
                <button onClick={() => setEditing(true)} style={{ fontSize: '10px', color: '#888', background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'Sora,sans-serif' }}>Edit</button>
            </td>
        </tr>
    );

    return (
        <tr style={{ background: 'rgba(201,168,76,0.05)' }}>
            <td style={{ padding: '10px 12px', fontSize: '12px', color: '#888' }}>{p.course?.title ?? '—'}</td>
            <td style={{ padding: '8px 12px' }}>
                <input type="number" value={draft.amount_paid} onChange={e => setDraft(d => ({ ...d, amount_paid: e.target.value }))} style={{ width: '80px', padding: '5px 8px', borderRadius: '7px', border: '1px solid rgba(0,0,0,0.15)', fontSize: '11px', fontFamily: 'Sora,sans-serif' }} />
            </td>
            <td style={{ padding: '8px 12px' }}>
                <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value }))} style={{ padding: '5px 8px', borderRadius: '7px', border: '1px solid rgba(0,0,0,0.15)', fontSize: '11px', fontFamily: 'Sora,sans-serif', background: '#fff' }}>
                    <option>SUCCESS</option><option>PENDING</option><option>FAILED</option>
                </select>
            </td>
            <td style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="date" value={draft.expires_at} onChange={e => setDraft(d => ({ ...d, expires_at: e.target.value }))} style={{ padding: '5px 8px', borderRadius: '7px', border: '1px solid rgba(0,0,0,0.15)', fontSize: '11px', fontFamily: 'Sora,sans-serif' }} />
                    {draft.expires_at && <button onClick={() => setDraft(d => ({ ...d, expires_at: '' }))} style={{ fontSize: '10px', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>}
                </div>
            </td>
            <td style={{ padding: '8px 12px', fontSize: '11px', color: '#888' }}>{fmtDateTime(p.created_at)}</td>
            <td style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={save} disabled={saving} style={{ fontSize: '10px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontFamily: 'Sora,sans-serif', opacity: saving ? 0.6 : 1 }}>{saving ? '…' : 'Save'}</button>
                    <button onClick={() => setEditing(false)} style={{ fontSize: '10px', color: '#aaa', background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'Sora,sans-serif' }}>✕</button>
                </div>
            </td>
        </tr>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [localPurchases, setLocalPurchases] = useState<{ [uid: string]: Purchase[] }>({});

    useEffect(() => {
        fetch(`${API}/users`, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(r => r.json())
            .then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const clearDevice = async (userId: string) => {
        if (!confirm('Are you sure you want to clear this user\'s primary device? They will be able to log in on a new device.')) return;
        try {
            const res = await fetch(`${API}/users/${userId}/clear-device`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${tok()}` },
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, primary_device_id: null } : u));
            } else {
                alert('Failed to clear device');
            }
        } catch (e) {
            alert('Error clearing device');
        }
    };

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const getPurchases = (u: User) => localPurchases[u.id] ?? u.purchases;

    const totalRevenue = users.reduce((s, u) => s + u.purchases.reduce((ps, p) => ps + p.amount_paid, 0), 0);
    const totalPurchases = users.reduce((s, u) => s + u.purchases.length, 0);

    return (
        <div style={{ maxWidth: '1140px', margin: '0 auto', paddingBottom: '64px' }} className="animate-fade-up">

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <p className="label-xs" style={{ marginBottom: '6px' }}>People</p>
                <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>Users</h1>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Users', value: users.length },
                    { label: 'Total Purchases', value: totalPurchases },
                    { label: 'Revenue Collected', value: fmtInr(totalRevenue) },
                ].map(s => (
                    <div key={s.label} className="glass-card" style={{ padding: '18px 20px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a1a' }}>{s.value}</div>
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ marginBottom: '16px' }}>
                <input className="glass-input" style={{ width: '100%', maxWidth: '320px', fontSize: '12px', padding: '9px 14px' }}
                    placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* User list */}
            <div className="content-block" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>Loading users…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>No users found.</div>
                ) : filtered.map((u, i) => {
                    const isOpen = expanded === u.id;
                    const bg = avatarColor(u.id);
                    const purchases = getPurchases(u);
                    const lastDevice = [...u.devices].sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime())[0];
                    const totalSpent = purchases.reduce((s, p) => s + p.amount_paid, 0);

                    return (
                        <div key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                            {/* User summary row */}
                            <div
                                onClick={() => setExpanded(isOpen ? null : u.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', cursor: 'pointer', background: isOpen ? 'rgba(0,0,0,0.02)' : 'transparent', transition: 'background 0.15s' }}
                            >
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                    {initials(u.name || u.email)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{u.name || '—'}</div>
                                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '1px' }}>{u.email}</div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: '11px', color: '#888' }}>Joined {fmtDate(u.created_at)}</div>
                                    {lastDevice && (() => {
                                        const ms = Date.now() - new Date(lastDevice.last_active).getTime();
                                        const isRecent = ms < 10 * 60 * 1000; // within 10 min
                                        const isToday = new Date(lastDevice.last_active).toDateString() === new Date().toDateString();
                                        return (
                                            <div style={{ fontSize: '10px', color: isRecent ? '#047857' : '#bbb', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                                {isRecent && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />}
                                                🕐 {isToday ? `Today ${new Date(lastDevice.last_active).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : fmtDateTime(lastDevice.last_active)}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div style={{ textAlign: 'right', minWidth: '80px', flexShrink: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{purchases.length}</div>
                                    <div style={{ fontSize: '10px', color: '#aaa' }}>course{purchases.length !== 1 ? 's' : ''}</div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: '80px', flexShrink: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{fmtInr(totalSpent)}</div>
                                    <div style={{ fontSize: '10px', color: '#aaa' }}>spent</div>
                                </div>
                                <span style={{ fontSize: '10px', color: '#ccc', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▼</span>
                            </div>

                            {/* Expanded: purchase table with inline editing */}
                            {isOpen && (
                                <div style={{ padding: '16px 20px 16px 74px', background: 'rgba(248,247,246,0.5)' }}>
                                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '11px', color: '#888' }}>Device Binding:</span>
                                        {u.primary_device_id ? (
                                            <>
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#047857' }}>Locked ({u.primary_device_id.slice(0, 8)}...)</span>
                                                <button onClick={() => clearDevice(u.id)} style={{ fontSize: '10px', background: '#fff', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontFamily: 'Sora,sans-serif' }}>Clear Device</button>
                                            </>
                                        ) : (
                                            <span style={{ fontSize: '11px', color: '#aaa' }}>Unbound</span>
                                        )}
                                    </div>

                                    {purchases.length === 0 ? (
                                        <p style={{ fontSize: '12px', color: '#ccc', padding: '12px 0' }}>No purchases yet.</p>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    {['Course', 'Amount', 'Status', 'Expires', 'Purchased', ''].map(h => (
                                                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {purchases.map(p => (
                                                    <PurchaseRow
                                                        key={p.id}
                                                        p={p}
                                                        onSaved={updated => {
                                                            setLocalPurchases(prev => ({
                                                                ...prev,
                                                                [u.id]: (prev[u.id] ?? u.purchases).map(x => x.id === updated.id ? updated : x),
                                                            }));
                                                        }}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
