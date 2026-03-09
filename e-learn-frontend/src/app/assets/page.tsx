"use client";

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const tok = () => localStorage.getItem('admin_token') ?? '';

interface Asset {
    key: string;
    size: number;
    lastModified: string;
    inUse: boolean;
    previewUrl: string | null;
}

function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fileType(key: string) {
    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video';
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(ext)) return 'doc';
    return 'other';
}
const typeIcon: Record<string, string> = { image: '🖼', video: '🎬', doc: '📄', other: '📦' };

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [total, setTotal] = useState(0);
    const [orphanCount, setOrphanCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [deleted, setDeleted] = useState<number | null>(null);
    const [filter, setFilter] = useState<'all' | 'used' | 'orphan'>('all');
    const [search, setSearch] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);

    const load = async () => {
        setLoading(true); setDeleted(null);
        try {
            const res = await fetch(`${API}/storage/assets`, { headers: { Authorization: `Bearer ${tok()}` } });
            const data = await res.json();
            setAssets(data.objects ?? []); setTotal(data.total); setOrphanCount(data.orphanCount);
        } catch { setAssets([]); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleCleanup = async () => {
        setConfirmOpen(false); setDeleting(true);
        const res = await fetch(`${API}/storage/assets/cleanup`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
        const data = await res.json();
        setDeleted(data.deleted);
        setDeleting(false); load();
    };

    const visible = assets.filter(a => {
        if (filter === 'used' && !a.inUse) return false;
        if (filter === 'orphan' && a.inUse) return false;
        if (search && !a.key.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <>
            {/* Confirm cleanup dialog */}
            {confirmOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }} onClick={() => setConfirmOpen(false)}>
                    <div style={{ background: 'white', borderRadius: '14px', padding: '28px 32px', maxWidth: '360px', width: '90%', boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a', marginBottom: '10px' }}>Delete Orphaned Files?</h3>
                        <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
                            This will permanently delete <strong style={{ color: '#dc2626' }}>{orphanCount} files</strong> that are not linked to any course, section, or lesson. This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setConfirmOpen(false)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)', background: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'Sora,sans-serif' }}>Cancel</button>
                            <button onClick={handleCleanup} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontSize: '13px', fontFamily: 'Sora,sans-serif', fontWeight: 500 }}>Delete {orphanCount} Files</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '64px' }} className="animate-fade-up">

                {/* Page header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <p className="label-xs" style={{ marginBottom: '6px' }}>Storage</p>
                        <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>Assets</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button onClick={load} className="btn-ghost" style={{ fontSize: '12px', padding: '9px 16px' }}>↻ Refresh</button>
                        {orphanCount > 0 && (
                            <button onClick={() => setConfirmOpen(true)} disabled={deleting} style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontSize: '12px', fontFamily: 'Sora,sans-serif', fontWeight: 500, opacity: deleting ? 0.6 : 1 }}>
                                {deleting ? 'Deleting…' : `🗑 Delete ${orphanCount} Unused`}
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                    {[
                        { label: 'Total Files', value: total, color: '#1a1a1a' },
                        { label: 'In Use', value: total - orphanCount, color: '#047857' },
                        { label: 'Orphaned', value: orphanCount, color: orphanCount > 0 ? '#dc2626' : '#aaa' },
                    ].map(s => (
                        <div key={s.label} className="glass-card" style={{ padding: '18px 20px' }}>
                            <div style={{ fontSize: '26px', fontWeight: 600, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px', letterSpacing: '0.04em' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {deleted !== null && (
                    <div style={{ padding: '12px 16px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.18)', borderRadius: '10px', fontSize: '13px', color: '#047857', marginBottom: '20px' }}>
                        ✓ Successfully deleted {deleted} orphaned file{deleted !== 1 ? 's' : ''}.
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', padding: '3px' }}>
                        {([['all', 'All'], ['used', 'In Use'], ['orphan', 'Orphaned']] as const).map(([k, l]) => (
                            <button key={k} onClick={() => setFilter(k)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Sora,sans-serif', fontSize: '11px', fontWeight: 500, background: filter === k ? '#fff' : 'transparent', color: filter === k ? '#1a1a1a' : '#999', boxShadow: filter === k ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s' }}>
                                {l}
                            </button>
                        ))}
                    </div>
                    <input className="glass-input" style={{ flex: 1, minWidth: '180px', maxWidth: '300px', fontSize: '12px', padding: '8px 12px' }} placeholder="Search by filename…" value={search} onChange={e => setSearch(e.target.value)} />
                    <span style={{ fontSize: '11px', color: '#aaa', flexShrink: 0 }}>{visible.length} files</span>
                </div>

                {/* Assets table */}
                <div className="content-block">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>Loading assets…</div>
                    ) : visible.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>
                            {filter === 'orphan' ? '🎉 No orphaned files! Your bucket is clean.' : 'No files found.'}
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                                    {['Preview', 'File', 'Size', 'Date', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((a, i) => (
                                    <tr key={a.key} style={{ borderBottom: i < visible.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', background: a.inUse ? 'transparent' : 'rgba(220,0,0,0.015)' }}>
                                        <td style={{ padding: '10px 16px', width: '60px' }}>
                                            {a.previewUrl ? (
                                                <img src={a.previewUrl} alt="" style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '6px', background: '#eee' }} />
                                            ) : (
                                                <div style={{ width: '48px', height: '36px', borderRadius: '6px', background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                    {typeIcon[fileType(a.key)]}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px 16px', maxWidth: '320px' }}>
                                            <div style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.key.split('/').pop()}</div>
                                            <div style={{ fontSize: '10px', color: '#bbb', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.key}</div>
                                        </td>
                                        <td style={{ padding: '10px 16px', fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>{fmtSize(a.size)}</td>
                                        <td style={{ padding: '10px 16px', fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>{fmtDate(a.lastModified)}</td>
                                        <td style={{ padding: '10px 16px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', background: a.inUse ? 'rgba(5,150,105,0.10)' : 'rgba(220,38,38,0.09)', color: a.inUse ? '#047857' : '#dc2626' }}>
                                                {a.inUse ? '● In Use' : '○ Orphaned'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
