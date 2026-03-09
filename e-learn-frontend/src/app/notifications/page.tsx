"use client";

import { useEffect, useRef, useState } from 'react';

interface Notification {
    id: string;
    title: string;
    message: string;
    scheduled_at: string;
    status: string;
    target_audience: string;
    course: { title: string } | null;
    repeat_type?: string | null;
    repeat_count?: number;
    repeat_sent?: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const tok = () => localStorage.getItem('admin_token') ?? '';

/** Convert a datetime-local string (e.g. "2026-02-25T14:30") to a proper ISO string
 *  preserving the user's local timezone (IST = +05:30).
 *  Without this, the browser sends it as UTC which arrives 5:30 h early. */
function localToISO(dtLocal: string): string {
    if (!dtLocal) return dtLocal;
    const d = new Date(dtLocal); // Date constructor treats datetime-local as local time ✓
    return d.toISOString();
}

const AUDIENCE_OPTIONS = [
    { value: 'ALL', label: '🌐 Everyone (all logged-in + not-logged-in users)' },
    { value: 'INSTALLED_NO_PURCHASE', label: '🛍️ Installed but no purchase (logged-in + anonymous)' },
    { value: 'NOT_PURCHASED', label: '👤 Logged in but no purchase' },
    { value: 'ANONYMOUS', label: '📲 Not logged in only (anonymous installs)' },
    { value: 'COURSE', label: '🎓 Specific Course Purchasers' },
    { value: 'EMAIL', label: '✉️ Specific User (by email)' },
];

function audienceLabel(notif: Notification): string {
    switch (notif.target_audience) {
        case 'ALL': return '🌐 All Users';
        case 'INSTALLED_NO_PURCHASE': return '🛍️ No Purchase';
        case 'NOT_PURCHASED': return '👤 Logged In, No Purchase';
        case 'ANONYMOUS': return '📲 Anonymous Only';
        case 'COURSE': return notif.course ? `🎓 ${notif.course.title}` : '🎓 Course';
        case 'EMAIL': return `✉️ ${(notif as any).target_email || 'Email User'}`;
        default: return notif.target_audience;
    }
}

function repeatLabel(notif: Notification): string | null {
    if (!notif.repeat_type || notif.repeat_count === 1) return null;
    const sent = notif.repeat_sent ?? 0;
    const total = notif.repeat_count ?? 1;
    const icon = notif.repeat_type === 'DAILY' ? '📅' : '🗓️';
    const cadence = notif.repeat_type === 'DAILY' ? 'Daily' : 'Weekly';
    return `${icon} ${cadence} × ${total} (${sent}/${total} sent)`;
}

export default function NotificationsPage() {
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        title: '', message: '', scheduledAt: '', targetAudience: 'ALL',
        courseId: '', userEmail: '',
        repeatType: 'NONE', repeatCount: '1',
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const load = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const r = await fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${tok()}` } });
            const data = await r.json();
            setNotifs(Array.isArray(data) ? data : []);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Initial load + real-time polling every 10 seconds
    useEffect(() => {
        load();
        pollRef.current = setInterval(() => load(true), 10_000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const hasRepeat = form.repeatType !== 'NONE';
            await fetch(`${API}/notifications/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
                body: JSON.stringify({
                    title: form.title,
                    message: form.message,
                    scheduledAt: localToISO(form.scheduledAt),
                    targetAudience: form.targetAudience,
                    courseId: form.targetAudience === 'COURSE' ? form.courseId || undefined : undefined,
                    userEmail: form.targetAudience === 'EMAIL' ? form.userEmail || undefined : undefined,
                    repeatType: hasRepeat ? form.repeatType : undefined,
                    repeatCount: hasRepeat ? parseInt(form.repeatCount, 10) || 1 : 1,
                }),
            });
            setModalOpen(false);
            setForm({ title: '', message: '', scheduledAt: '', targetAudience: 'ALL', courseId: '', userEmail: '', repeatType: 'NONE', repeatCount: '1' });
            load();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        await fetch(`${API}/notifications/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
        });
        setDeleting(null);
        load(true);
    };

    const fmtDate = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-up">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <p className="label-xs" style={{ marginBottom: '6px' }}>Communications</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>Push Notifications</h1>
                </div>
                <button className="btn-primary" onClick={() => setModalOpen(true)} style={{ fontSize: '12px' }}>+ New Notification</button>
            </div>

            {/* Table */}
            <div className="content-block">
                <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="label-xs">Scheduled &amp; Sent</p>
                    <span style={{ fontSize: '11px', color: '#aaa' }}>{notifs.length} total</span>
                </div>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#ccc', fontSize: '12px' }}>Loading…</div>
                ) : notifs.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>No notifications yet.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.025)' }}>
                                {['Title', 'Audience', 'Scheduled For', 'Repeat', 'Status', ''].map(h => (
                                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {notifs.map((n, i) => (
                                <tr key={n.id} style={{ borderBottom: i < notifs.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>{n.title}</div>
                                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.message}</div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ fontSize: '11px', color: '#777', background: 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: '6px' }}>
                                            {audienceLabel(n)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: '12px', color: '#888' }}>{fmtDate(n.scheduled_at)}</td>
                                    <td style={{ padding: '16px 20px' }}>
                                        {repeatLabel(n) ? (
                                            <span style={{ fontSize: '10px', color: '#6d28d9', background: 'rgba(109,40,217,0.08)', padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                                                {repeatLabel(n)}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '10px', color: '#ccc' }}>Once</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{
                                            fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: '20px',
                                            background: n.status === 'PENDING' ? 'rgba(217,119,6,0.10)' : n.status === 'SENT' ? 'rgba(5,150,105,0.10)' : 'rgba(185,28,28,0.08)',
                                            color: n.status === 'PENDING' ? '#b45309' : n.status === 'SENT' ? '#047857' : '#b91c1c',
                                        }}>
                                            {n.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        {n.status === 'PENDING' && (
                                            <button
                                                disabled={deleting === n.id}
                                                onClick={() => handleDelete(n.id)}
                                                style={{ fontSize: '12px', color: '#ccc', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', opacity: deleting === n.id ? 0.4 : 1 }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#e53e3e')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}>
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal — no scroll, fits all content */}
            {isModalOpen && (
                <div
                    onClick={() => setModalOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(180,180,180,0.55)',
                        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        padding: '24px',
                    }}>
                    <div
                        className="animate-fade-up"
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '580px',
                            background: 'rgba(255,255,255,0.97)',
                            backdropFilter: 'blur(24px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                            border: '1px solid rgba(255,255,255,0.95)',
                            boxShadow: '0 16px 60px rgba(0,0,0,0.14)',
                            borderRadius: '20px',
                            display: 'flex', flexDirection: 'column',
                            maxHeight: 'min(92vh, 820px)',
                        }}>
                        {/* Fixed header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 32px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a' }}>New Notification</h2>
                            <button onClick={() => setModalOpen(false)} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.12)', background: 'none', cursor: 'pointer', fontSize: '15px', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                        {/* Scrollable form body */}
                        <form onSubmit={handleCreate} style={{ overflowY: 'auto', flex: 1, padding: '20px 32px 0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Notification Title</label>
                                    <input type="text" required className="glass-input" placeholder="Limited Time Offer!" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Message Body</label>
                                    <textarea rows={3} required className="glass-input" placeholder="Enter message…" style={{ resize: 'none' }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Schedule Date &amp; Time (IST)</label>
                                    <input type="datetime-local" required className="glass-input" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                                    <p style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>Time is in your local timezone (IST)</p>
                                </div>

                                {/* ── Repeat section ── */}
                                <div style={{ background: 'rgba(109,40,217,0.04)', border: '1px solid rgba(109,40,217,0.12)', borderRadius: '12px', padding: '14px 16px' }}>
                                    <label className="label-xs" style={{ display: 'block', marginBottom: '10px', color: '#6d28d9' }}>🔁 Repeat Schedule</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: form.repeatType !== 'NONE' ? '10px' : '0' }}>
                                        {[
                                            { value: 'NONE', label: 'No Repeat' },
                                            { value: 'DAILY', label: '📅 Daily' },
                                            { value: 'WEEKLY', label: '🗓️ Weekly' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, repeatType: opt.value, repeatCount: opt.value === 'NONE' ? '1' : f.repeatCount === '1' ? '7' : f.repeatCount }))}
                                                style={{
                                                    padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 500,
                                                    border: form.repeatType === opt.value ? '1.5px solid #6d28d9' : '1px solid rgba(0,0,0,0.12)',
                                                    background: form.repeatType === opt.value ? 'rgba(109,40,217,0.10)' : 'white',
                                                    color: form.repeatType === opt.value ? '#6d28d9' : '#555',
                                                    cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                                                }}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {form.repeatType !== 'NONE' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label style={{ fontSize: '11px', color: '#555', whiteSpace: 'nowrap' }}>Repeat</label>
                                            <input
                                                type="number"
                                                min="2"
                                                max="365"
                                                required
                                                className="glass-input"
                                                style={{ width: '80px', textAlign: 'center' }}
                                                value={form.repeatCount}
                                                onChange={e => setForm(f => ({ ...f, repeatCount: e.target.value }))}
                                            />
                                            <span style={{ fontSize: '11px', color: '#888' }}>
                                                times {form.repeatType === 'DAILY' ? '(every day)' : '(every week)'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Select (audience changes)</label>
                                    <select
                                        className="glass-input"
                                        value={form.targetAudience}
                                        onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value, courseId: '', userEmail: '' }))}
                                        style={{ cursor: 'pointer' }}>
                                        {AUDIENCE_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                {form.targetAudience === 'COURSE' && (
                                    <div>
                                        <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Course ID</label>
                                        <input
                                            type="text"
                                            required={form.targetAudience === 'COURSE'}
                                            className="glass-input"
                                            placeholder="Paste the Course ID from the Courses page"
                                            value={form.courseId}
                                            onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                                        />
                                        <p style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>Copy the Course ID from the Courses page card</p>
                                    </div>
                                )}
                                {form.targetAudience === 'EMAIL' && (
                                    <div>
                                        <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>User Email</label>
                                        <input
                                            type="email"
                                            required={form.targetAudience === 'EMAIL'}
                                            className="glass-input"
                                            placeholder="user@example.com"
                                            value={form.userEmail}
                                            onChange={e => setForm(f => ({ ...f, userEmail: e.target.value }))}
                                        />
                                        <p style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>Must match the email the user signed in with</p>
                                    </div>
                                )}
                            </div>
                            {/* Sticky footer inside the scrollable form */}
                            <div style={{ position: 'sticky', bottom: 0, background: 'rgba(255,255,255,0.97)', padding: '16px 0 20px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost" style={{ fontSize: '12px', padding: '9px 18px' }}>Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize: '12px', padding: '9px 18px', opacity: saving ? 0.6 : 1 }}>
                                    {saving ? 'Scheduling…' : 'Schedule Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
