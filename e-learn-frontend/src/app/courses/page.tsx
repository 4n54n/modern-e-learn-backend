"use client";

import { useEffect, useState, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Lesson {
    id: string; title: string; description?: string;
    video_url?: string; document_url?: string; order_index: number;
}
interface Section {
    id: string; title: string;
    is_free: boolean;
    order_index: number; lessons: Lesson[];
}
interface Course {
    id: string; title: string; description: string; price: number; original_price?: number;
    contact_number: string; thumbnail_url: string; intro_video_url?: string; is_active: boolean;
    sections: Section[]; _count?: { purchases: number };
}

const GradientBg = [
    'linear-gradient(135deg,#e8e5e0,#d4d4d4)',
    'linear-gradient(135deg,#e0e0ee,#d0d0e6)',
    'linear-gradient(135deg,#e0eee0,#d0e6d0)',
    'linear-gradient(135deg,#eee0e0,#e6d0d0)',
    'linear-gradient(135deg,#eee8e0,#e6dcd0)',
    'linear-gradient(135deg,#e0eee8,#d0e6dc)',
];

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const tok = () => localStorage.getItem('admin_token') ?? '';

// ── Thumbnail ────────────────────────────────────────────────────────────────
function Thumbnail({ fileKey, style }: { fileKey?: string; style?: React.CSSProperties }) {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!fileKey) return;
        if (fileKey.startsWith('http')) { setUrl(fileKey); return; }
        fetch(`${API}/storage/file-url?key=${encodeURIComponent(fileKey)}`, {
            headers: { Authorization: `Bearer ${tok()}` },
        }).then(r => r.json()).then(d => d.url && setUrl(d.url)).catch(() => { });
    }, [fileKey]);
    if (!url) return null;
    return <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />;
}

// ── Upload with progress (XHR so we get progress events) ─────────────────────
function uploadToR2(file: File, onProgress?: (pct: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
        const fd = new FormData();
        fd.append('file', file);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API}/storage/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${tok()}`);
        if (onProgress) {
            // xhr.upload.onprogress only tracks browser→backend (first leg).
            // Cap at 90% so user doesn't think it's done while backend streams to R2.
            xhr.upload.onprogress = e => {
                if (e.lengthComputable) onProgress(Math.min(90, Math.round((e.loaded / e.total) * 90)));
            };
        }
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress?.(100); // backend→R2 complete — truly done now
                const { fileKey } = JSON.parse(xhr.responseText);
                resolve(fileKey);
            } else {
                reject(new Error(`Upload failed: ${xhr.responseText}`));
            }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(fd);
    });
}

// ── Upload Button with progress ───────────────────────────────────────────────
function UploadButton({ label, accept, onDone, style }: { label: string; accept: string; onDone: (key: string) => void; style?: React.CSSProperties }) {
    const [pct, setPct] = useState<number | null>(null);
    const [done, setDone] = useState(false);
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setDone(false); setPct(0);
        try {
            const key = await uploadToR2(file, p => setPct(p));
            setDone(true); setPct(null);
            onDone(key);
        } catch (err: any) { setPct(null); alert(err.message); }
        e.target.value = '';
    };
    return (
        <div style={style}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px dashed rgba(0,0,0,0.14)', cursor: 'pointer', fontSize: '11px', color: '#888', whiteSpace: 'nowrap' }}>
                {pct !== null ? `⏳ ${pct}%` : done ? '✓ Done' : label}
                <input type="file" accept={accept} style={{ display: 'none' }} onChange={handleChange} />
            </label>
        </div>
    );
}

// ── Custom Confirm Dialog ──────────────────────────────────────────────────────
function ConfirmDialog({ msg, onConfirm, onCancel }: { msg: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }} onClick={onCancel}>
            <div style={{ background: 'white', borderRadius: '14px', padding: '28px 32px', maxWidth: '340px', width: '90%', boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
                <p style={{ fontSize: '14px', color: '#1a1a1a', marginBottom: '20px', lineHeight: 1.5 }}>{msg}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onCancel} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)', background: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Sora,sans-serif' }}>Cancel</button>
                    <button onClick={onConfirm} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontSize: '12px', fontFamily: 'Sora,sans-serif' }}>Delete</button>
                </div>
            </div>
        </div>
    );
}
function useConfirm() {
    const [state, setState] = useState<{ msg: string; resolve: (v: boolean) => void } | null>(null);
    const confirm = (msg: string) => new Promise<boolean>(resolve => setState({ msg, resolve }));
    const dialog = state ? (
        <ConfirmDialog msg={state.msg}
            onConfirm={() => { state.resolve(true); setState(null); }}
            onCancel={() => { state.resolve(false); setState(null); }} />
    ) : null;
    return { confirm, dialog };
}

// ─────────────────────────────────────────────────────────────────────────────
// Manage Modal
// ─────────────────────────────────────────────────────────────────────────────
function ManageModal({ course, onClose, onRefresh }: { course: Course; onClose: () => void; onRefresh: () => void }) {
    const [tab, setTab] = useState<'info' | 'sections'>('info');
    const [sections, setSections] = useState<Section[]>(course.sections ?? []);
    const { confirm, dialog } = useConfirm();

    // ── Course Info ──────────────────────────────────────────────────────────
    const [info, setInfo] = useState({ title: course.title, description: course.description, price: String(course.price), original_price: String((course as any).original_price ?? ''), validity_days: String((course as any).validity_days ?? ''), thumbnail_url: course.thumbnail_url, intro_video_url: course.intro_video_url ?? '' });
    const [savingInfo, setSavingInfo] = useState(false);
    const saveInfo = async () => {
        setSavingInfo(true);
        await fetch(`${API}/courses/${course.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
            body: JSON.stringify({ ...info, price: parseFloat(info.price), original_price: info.original_price ? parseFloat(info.original_price) : null, validity_days: info.validity_days ? parseInt(info.validity_days) : null }),
        });
        setSavingInfo(false); onRefresh();
    };

    // ── Section state ────────────────────────────────────────────────────────
    const [openSec, setOpenSec] = useState<string | null>(null);
    const [editingSec, setEditingSec] = useState<string | null>(null);
    const [secEdit, setSecEdit] = useState<{ [id: string]: { title: string; is_free: boolean } }>({});
    const [newSecTitle, setNewSecTitle] = useState('');
    const [newSecIsFree, setNewSecIsFree] = useState(false);
    const [addingSection, setAddingSection] = useState(false);

    // ── Lesson state ─────────────────────────────────────────────────────────
    const [newLesson, setNewLesson] = useState<{ [sid: string]: { title: string; description: string; mediaType: 'video' | 'document'; fileKey: string } }>({});
    const [editingLesson, setEditingLesson] = useState<string | null>(null);
    const [lessonEdit, setLessonEdit] = useState<{ title: string; description: string; mediaType: 'video' | 'document'; fileKey: string }>({ title: '', description: '', mediaType: 'video', fileKey: '' });

    // ── Drag state ───────────────────────────────────────────────────────────
    const dragInfo = useRef<{ sectionId: string; fromIdx: number } | null>(null);

    const startEditSection = (sec: Section) => {
        setSecEdit(prev => ({ ...prev, [sec.id]: { title: sec.title, is_free: sec.is_free ?? false } }));
        setEditingSec(sec.id); setOpenSec(sec.id);
    };

    const saveSection = async (sid: string) => {
        const res = await fetch(`${API}/courses/sections/${sid}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
            body: JSON.stringify(secEdit[sid]),
        });
        const updated = await res.json();
        setSections(prev => prev.map(s => s.id === sid ? { ...s, ...updated } : s));
        setEditingSec(null);
    };

    const deleteSection = async (sid: string) => {
        if (!await confirm('Delete this section and all its lessons? This cannot be undone.')) return;
        await fetch(`${API}/courses/sections/${sid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
        setSections(prev => prev.filter(s => s.id !== sid));
        if (openSec === sid) setOpenSec(null);
    };

    const addSection = async () => {
        if (!newSecTitle.trim()) return;
        setAddingSection(true);
        const res = await fetch(`${API}/courses/${course.id}/sections`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
            body: JSON.stringify({ title: newSecTitle, order_index: sections.length + 1, is_free: newSecIsFree }),
        });
        const sec = await res.json();
        setSections(prev => [...prev, { ...sec, lessons: [] }]);
        setNewSecTitle(''); setNewSecIsFree(false); setAddingSection(false);
    };

    const getNewLesson = (sid: string) => newLesson[sid] ?? { title: '', description: '', mediaType: 'video' as const, fileKey: '' };
    const setNL = (sid: string, patch: Partial<typeof newLesson[string]>) =>
        setNewLesson(prev => ({ ...prev, [sid]: { ...getNewLesson(sid), ...patch } }));

    const addLesson = async (sec: Section) => {
        const nl = getNewLesson(sec.id);
        if (!nl.title) return;
        const payload: any = { title: nl.title, description: nl.description, order_index: sec.lessons.length + 1 };
        if (nl.mediaType === 'video') payload.video_url = nl.fileKey; else payload.document_url = nl.fileKey;
        const res = await fetch(`${API}/courses/${course.id}/sections/${sec.id}/lessons`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
            body: JSON.stringify(payload),
        });
        const lesson = await res.json();
        setSections(prev => prev.map(s => s.id === sec.id ? { ...s, lessons: [...s.lessons, lesson] } : s));
        setNewLesson(prev => ({ ...prev, [sec.id]: { title: '', description: '', mediaType: 'video', fileKey: '' } }));
    };

    const startEditLesson = (l: Lesson) => {
        setLessonEdit({ title: l.title, description: l.description ?? '', mediaType: l.video_url ? 'video' : 'document', fileKey: l.video_url ?? l.document_url ?? '' });
        setEditingLesson(l.id);
    };

    const saveLesson = async (lid: string, sid: string) => {
        const payload: any = { title: lessonEdit.title, description: lessonEdit.description };
        if (lessonEdit.mediaType === 'video') { payload.video_url = lessonEdit.fileKey; payload.document_url = null; }
        else { payload.document_url = lessonEdit.fileKey; payload.video_url = null; }
        await fetch(`${API}/courses/lessons/${lid}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
            body: JSON.stringify(payload),
        });
        setSections(prev => prev.map(s => s.id === sid ? { ...s, lessons: s.lessons.map(l => l.id === lid ? { ...l, ...payload } : l) } : s));
        setEditingLesson(null);
    };

    const deleteLesson = async (lid: string, sid: string) => {
        if (!await confirm('Delete this lesson? This cannot be undone.')) return;
        await fetch(`${API}/courses/lessons/${lid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
        setSections(prev => prev.map(s => s.id === sid ? { ...s, lessons: s.lessons.filter(l => l.id !== lid) } : s));
        if (editingLesson === lid) setEditingLesson(null);
    };

    // ── Drag to reorder lessons ──────────────────────────────────────────────
    const handleDragStart = (sectionId: string, fromIdx: number) => {
        dragInfo.current = { sectionId, fromIdx };
    };

    const handleDrop = async (sectionId: string, toIdx: number) => {
        if (!dragInfo.current || dragInfo.current.sectionId !== sectionId) return;
        const { fromIdx } = dragInfo.current;
        if (fromIdx === toIdx) return;
        dragInfo.current = null;

        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            const lessons = [...s.lessons];
            const [moved] = lessons.splice(fromIdx, 1);
            lessons.splice(toIdx, 0, moved);
            return { ...s, lessons };
        }));

        // Persist reorder to backend
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;
        const lessons = [...section.lessons];
        const [moved] = lessons.splice(fromIdx, 1);
        lessons.splice(toIdx, 0, moved);
        await fetch(`${API}/courses/sections/${sectionId}/reorder-lessons`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
            body: JSON.stringify({ lessonIds: lessons.map(l => l.id) }),
        });
    };

    return (
        <>
            {dialog}
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
            <div style={{ position: 'fixed', zIndex: 101, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(860px, 96vw)', maxHeight: '84vh', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '20px', boxShadow: '0 24px 80px rgba(0,0,0,0.22)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0, background: '#fff' }}>
                    <div>
                        <p style={{ fontSize: '10px', color: '#aaa', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Managing</p>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginTop: '2px' }}>{course.title}</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', padding: '3px' }}>
                            {([{ key: 'info', label: 'Course Info' }, { key: 'sections', label: `Sections (${sections.length})` }] as const).map(t => (
                                <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Sora,sans-serif', fontSize: '11px', fontWeight: 500, background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#1a1a1a' : '#999', boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s' }}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.12)', background: 'none', cursor: 'pointer', fontSize: '15px', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '20px 22px' }}>

                    {/* ═══ COURSE INFO ════════════════════════════════════════ */}
                    {tab === 'info' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Course Title</label>
                                    <input className="glass-input" value={info.title} onChange={e => setInfo(f => ({ ...f, title: e.target.value }))} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Price (₹)</label>
                                        <input className="glass-input" type="number" value={info.price} onChange={e => setInfo(f => ({ ...f, price: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Original (₹)</label>
                                        <input className="glass-input" type="number" placeholder="Discount" value={info.original_price} onChange={e => setInfo(f => ({ ...f, original_price: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Validity (days)</label>
                                        <input className="glass-input" type="number" min="1" placeholder="Leave blank = ∞" value={info.validity_days} onChange={e => setInfo(f => ({ ...f, validity_days: e.target.value }))} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Main Description</label>
                                <textarea rows={5} className="glass-input" style={{ resize: 'vertical', minHeight: '100px' }} value={info.description} onChange={e => setInfo(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Thumbnail</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {info.thumbnail_url && (
                                            <div style={{ width: '80px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: '#eee', flexShrink: 0 }}>
                                                <Thumbnail fileKey={info.thumbnail_url} />
                                            </div>
                                        )}
                                        <UploadButton label="📷 Replace thumbnail" accept="image/*" onDone={k => setInfo(f => ({ ...f, thumbnail_url: k }))} />
                                    </div>
                                </div>
                                <div>
                                    <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Intro Video (Autoplays on app)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {info.intro_video_url && (
                                            <div style={{ flexShrink: 0, fontSize: '11px', color: '#059669', fontWeight: 600 }}>✓ Ready</div>
                                        )}
                                        <UploadButton label={info.intro_video_url ? '🔄 Replace Video' : '🎬 Upload Video'} accept="video/*" onDone={k => setInfo(f => ({ ...f, intro_video_url: k }))} />
                                    </div>
                                </div>
                            </div>
                            <button onClick={saveInfo} disabled={savingInfo} className="btn-primary" style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '10px 24px', opacity: savingInfo ? 0.6 : 1 }}>
                                {savingInfo ? 'Saving…' : 'Save Course Details'}
                            </button>
                        </div>
                    )}

                    {/* ═══ SECTIONS ════════════════════════════════════════════ */}
                    {tab === 'sections' && (
                        <div>
                            {sections.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', padding: '24px 0', fontSize: '12px' }}>No sections yet.</div>}

                            {sections.map(sec => (
                                <div key={sec.id} style={{ marginBottom: '10px', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '12px', overflow: 'hidden' }}>

                                    {/* Section header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(248,247,246,0.9)', cursor: 'pointer' }}
                                        onClick={() => { setOpenSec(openSec === sec.id ? null : sec.id); setEditingSec(null); }}>
                                        <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#eee', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                            📂
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{sec.title}</div>
                                            {sec.is_free && <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em' }}>FREE</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
                                            <span style={{ fontSize: '10px', color: '#aaa', marginRight: '4px' }}>{sec.lessons.length} lessons</span>
                                            <button onClick={e => { e.stopPropagation(); startEditSection(sec); }} style={{ padding: '4px 10px', borderRadius: '7px', border: '1px solid rgba(0,0,0,0.12)', background: 'none', cursor: 'pointer', fontSize: '10px', color: '#555', fontFamily: 'Sora,sans-serif' }}>Edit</button>
                                            <button onClick={e => { e.stopPropagation(); deleteSection(sec.id); }} style={{ padding: '4px 8px', borderRadius: '7px', border: '1px solid rgba(0,0,0,0.12)', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#e00', fontFamily: 'Sora,sans-serif' }}>🗑</button>
                                            <span style={{ fontSize: '9px', color: '#ccc', display: 'inline-block', transform: openSec === sec.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                                        </div>
                                    </div>

                                    {/* PANEL A: Edit section details */}
                                    {editingSec === sec.id && (
                                        <div style={{ padding: '14px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,252,246,0.97)', borderLeft: '3px solid rgba(160,120,40,0.35)' }}>
                                            <p style={{ fontSize: '10px', color: '#7a5c18', fontWeight: 700, letterSpacing: '0.07em', marginBottom: '10px' }}>✏️ EDIT SECTION DETAILS</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
                                                <div>
                                                    <label style={{ fontSize: '10px', color: '#aaa', fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>TITLE</label>
                                                    <input className="glass-input" style={{ fontSize: '12px' }} value={secEdit[sec.id]?.title ?? ''} onChange={e => setSecEdit(p => ({ ...p, [sec.id]: { ...p[sec.id], title: e.target.value } }))} />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input type="checkbox" id={`free-${sec.id}`} checked={secEdit[sec.id]?.is_free ?? false} onChange={e => setSecEdit(p => ({ ...p, [sec.id]: { ...p[sec.id], is_free: e.target.checked } }))} />
                                                    <label htmlFor={`free-${sec.id}`} style={{ fontSize: '12px', color: '#333', cursor: 'pointer' }}>Mark section as Free (unlocked for all users)</label>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => setEditingSec(null)} className="btn-ghost" style={{ fontSize: '11px', padding: '7px 14px' }}>Cancel</button>
                                                <button onClick={() => saveSection(sec.id)} className="btn-primary" style={{ fontSize: '11px', padding: '7px 14px' }}>Save Section</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* PANEL B: Lessons (drag to reorder) */}
                                    {openSec === sec.id && (
                                        <div style={{ padding: '12px 14px', background: 'rgba(250,249,248,0.6)' }}>
                                            <p style={{ fontSize: '10px', color: '#aaa', fontWeight: 700, letterSpacing: '0.07em', marginBottom: '8px' }}>SUB-SECTIONS / LESSONS <span style={{ fontWeight: 400, opacity: 0.6 }}>(drag ⠿ to reorder)</span></p>

                                            {sec.lessons.length === 0 && <p style={{ fontSize: '11px', color: '#ccc', marginBottom: '10px' }}>No lessons yet.</p>}

                                            {sec.lessons.map((l, idx) => (
                                                <div key={l.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(sec.id, idx)}
                                                    onDragOver={e => e.preventDefault()}
                                                    onDrop={() => handleDrop(sec.id, idx)}
                                                    style={{ marginBottom: '6px' }}>
                                                    {editingLesson !== l.id ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px', cursor: 'grab' }}>
                                                            <span style={{ fontSize: '12px', color: '#ccc', cursor: 'grab', userSelect: 'none', flexShrink: 0 }}>⠿</span>
                                                            <span style={{ fontSize: '12px', flexShrink: 0 }}>{l.video_url ? '🎬' : '📄'}</span>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontSize: '12px', fontWeight: 500, color: '#1a1a1a' }}>{l.title}</div>
                                                                {l.description && <div style={{ fontSize: '10px', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description}</div>}
                                                            </div>
                                                            <button onClick={() => startEditLesson(l)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.10)', background: 'none', cursor: 'pointer', fontSize: '10px', color: '#555', fontFamily: 'Sora,sans-serif' }}>Edit</button>
                                                            <button onClick={() => deleteLesson(l.id, sec.id)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.10)', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#e00', fontFamily: 'Sora,sans-serif' }}>🗑</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ padding: '12px', background: 'rgba(255,253,248,0.98)', border: '1px solid rgba(0,0,0,0.10)', borderLeft: '3px solid rgba(160,120,40,0.4)', borderRadius: '10px' }}>
                                                            <p style={{ fontSize: '10px', color: '#7a5c18', fontWeight: 700, letterSpacing: '0.07em', marginBottom: '8px' }}>✏️ EDIT LESSON</p>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                                <input className="glass-input" style={{ fontSize: '11px' }} placeholder="Title" value={lessonEdit.title} onChange={e => setLessonEdit(f => ({ ...f, title: e.target.value }))} />
                                                                <textarea rows={3} className="glass-input" style={{ fontSize: '11px', resize: 'vertical', minHeight: '70px' }} placeholder="Description" value={lessonEdit.description} onChange={e => setLessonEdit(f => ({ ...f, description: e.target.value }))} />
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                {(['video', 'document'] as const).map(mt => (
                                                                    <button key={mt} onClick={() => setLessonEdit(f => ({ ...f, mediaType: mt }))} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer', fontFamily: 'Sora,sans-serif', fontSize: '11px', background: lessonEdit.mediaType === mt ? '#1a1a1a' : 'transparent', color: lessonEdit.mediaType === mt ? '#fff' : '#888' }}>
                                                                        {mt === 'video' ? '🎬 Video' : '📄 Doc'}
                                                                    </button>
                                                                ))}
                                                                <UploadButton label={`📤 ${lessonEdit.fileKey ? 'Replace file' : 'Upload'}`} accept={lessonEdit.mediaType === 'video' ? 'video/*' : '.pdf,.doc,.docx,.ppt,.pptx'} onDone={k => setLessonEdit(f => ({ ...f, fileKey: k }))} />
                                                                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                                                                    <button onClick={() => setEditingLesson(null)} className="btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }}>Cancel</button>
                                                                    <button onClick={() => saveLesson(l.id, sec.id)} className="btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>Save</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Add sub-section */}
                                            <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(26,26,26,0.03)', border: '1px dashed rgba(26,26,26,0.13)', borderRadius: '10px' }}>
                                                <p style={{ fontSize: '10px', color: '#1a1a1a', fontWeight: 700, letterSpacing: '0.07em', marginBottom: '10px', opacity: 0.55 }}>+ ADD SUB-SECTION</p>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                    <input className="glass-input" style={{ fontSize: '11px' }} placeholder="Title *" value={getNewLesson(sec.id).title} onChange={e => setNL(sec.id, { title: e.target.value })} />
                                                    <textarea rows={3} className="glass-input" style={{ fontSize: '11px', resize: 'vertical', minHeight: '70px' }} placeholder="Description" value={getNewLesson(sec.id).description} onChange={e => setNL(sec.id, { description: e.target.value })} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    {(['video', 'document'] as const).map(mt => (
                                                        <button key={mt} onClick={() => setNL(sec.id, { mediaType: mt })} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer', fontFamily: 'Sora,sans-serif', fontSize: '11px', background: getNewLesson(sec.id).mediaType === mt ? '#1a1a1a' : 'transparent', color: getNewLesson(sec.id).mediaType === mt ? '#fff' : '#888' }}>
                                                            {mt === 'video' ? '🎬 Video' : '📄 Doc'}
                                                        </button>
                                                    ))}
                                                    <UploadButton label={`📤 Upload ${getNewLesson(sec.id).mediaType}`} accept={getNewLesson(sec.id).mediaType === 'video' ? 'video/*' : '.pdf,.doc,.docx,.ppt,.pptx'} onDone={k => setNL(sec.id, { fileKey: k })} />
                                                    <button onClick={() => addLesson(sec)} disabled={!getNewLesson(sec.id).title} className="btn-primary" style={{ marginLeft: 'auto', fontSize: '11px', padding: '6px 16px', opacity: !getNewLesson(sec.id).title ? 0.5 : 1 }}>
                                                        + Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add new section */}
                            <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <p style={{ fontSize: '10px', color: '#888', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', margin: 0 }}>New Section</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <input type="checkbox" id="new-sec-free" checked={newSecIsFree} onChange={e => setNewSecIsFree(e.target.checked)} />
                                        <label htmlFor="new-sec-free" style={{ fontSize: '10px', color: '#555', cursor: 'pointer' }}>Make Free</label>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input className="glass-input" style={{ flex: 1, fontSize: '12px' }} placeholder="Section title, e.g. Getting Started" value={newSecTitle} onChange={e => setNewSecTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSection()} />
                                    <button onClick={addSection} disabled={addingSection || !newSecTitle.trim()} className="btn-primary" style={{ fontSize: '12px', padding: '9px 18px', opacity: !newSecTitle.trim() || addingSection ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                                        {addingSection ? '…' : '+ Add Section'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Modal
// ─────────────────────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [form, setForm] = useState({ title: '', description: '', price: '', original_price: '', validity_days: '' });
    const [thumbKey, setThumbKey] = useState('');
    const [introVideoKey, setIntroVideoKey] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true); setError('');
        try {
            const res = await fetch(`${API}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
                body: JSON.stringify({ ...form, price: parseFloat(form.price), original_price: form.original_price ? parseFloat(form.original_price) : null, validity_days: form.validity_days ? parseInt(form.validity_days) : null, thumbnail_url: thumbKey, intro_video_url: introVideoKey || null }),
            });
            if (!res.ok) throw new Error((await res.json()).message || 'Failed');
            onCreated();
        } catch (e: any) { setError(e.message); }
        finally { setSubmitting(false); }
    };

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
            <div style={{ position: 'fixed', zIndex: 101, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(540px, 96vw)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: '20px', boxShadow: '0 24px 80px rgba(0,0,0,0.22)', padding: '32px' }} onClick={e => e.stopPropagation()}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', marginBottom: '22px' }}>New Course</h2>
                {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '8px', color: '#b91c1c', fontSize: '12px', marginBottom: '14px' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Course Title *</label>
                            <input required className="glass-input" placeholder="e.g. Complete React Course" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Description</label>
                            <textarea rows={4} className="glass-input" style={{ resize: 'vertical', minHeight: '90px' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div>
                                <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Price (₹) *</label>
                                <input required type="number" min="0" className="glass-input" placeholder="999" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                            </div>
                            <div>
                                <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Original (₹)</label>
                                <input type="number" min="0" className="glass-input" placeholder="e.g 1500" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} />
                            </div>
                            <div>
                                <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Validity (days)</label>
                                <input type="number" min="1" className="glass-input" placeholder="Leave blank = ∞" value={form.validity_days} onChange={e => setForm(f => ({ ...f, validity_days: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Thumbnail</label>
                                <UploadButton label="📁 Choose image" accept="image/*" onDone={k => setThumbKey(k)} />
                                {thumbKey && <p style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>✓ Image ready</p>}
                            </div>
                            <div>
                                <label className="label-xs" style={{ display: 'block', marginBottom: '6px' }}>Intro Video</label>
                                <UploadButton label={introVideoKey ? '🔄 Replace video' : '🎬 Choose video'} accept="video/*" onDone={k => setIntroVideoKey(k)} />
                                {introVideoKey && <p style={{ fontSize: '10px', color: '#047857', marginTop: '4px' }}>✓ Video ready</p>}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} className="btn-ghost" style={{ fontSize: '12px', padding: '9px 18px' }}>Cancel</button>
                        <button type="submit" disabled={submitting} className="btn-primary" style={{ fontSize: '12px', padding: '9px 18px', opacity: submitting ? 0.6 : 1 }}>
                            {submitting ? 'Creating…' : 'Create Course'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
function CopyIdChip({ id }: { id: string }) {
    const [copied, setCopied] = useState(false);
    const copy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };
    return (
        <div
            onClick={copy}
            title="Click to copy Course ID"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '6px', padding: '2px 8px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', cursor: 'pointer', maxWidth: '100%', border: '1px solid rgba(0,0,0,0.07)' }}
        >
            <span style={{ fontSize: '9px', color: '#aaa', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>ID</span>
            <span style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{id}</span>
            <span style={{ fontSize: '9px', color: copied ? '#047857' : '#bbb', flexShrink: 0, marginLeft: '2px' }}>{copied ? '✓' : '⎘'}</span>
        </div>
    );
}

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [managing, setManaging] = useState<Course | null>(null);
    const [toggling, setToggling] = useState<string | null>(null);
    const { confirm, dialog } = useConfirm();

    const load = () => {
        setLoading(true);
        fetch(`${API}/courses`, { headers: { Authorization: `Bearer ${tok()}` } })
            .then(r => r.json()).then(d => { setCourses(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const toggleActive = async (id: string) => {
        setToggling(id);
        await fetch(`${API}/courses/${id}/toggle-active`, { method: 'PUT', headers: { Authorization: `Bearer ${tok()}` } });
        setToggling(null); load();
    };

    const deleteCourse = async (id: string) => {
        if (!await confirm('Permanently delete this course and all its sections? This cannot be undone.')) return;
        await fetch(`${API}/courses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
        load();
    };

    return (
        <>
            {dialog}
            <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '64px' }} className="animate-fade-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <p className="label-xs" style={{ marginBottom: '6px' }}>Content</p>
                        <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>Course Management</h1>
                    </div>
                    <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: '12px' }}>+ New Course</button>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
                        {[0, 1, 2].map(i => <div key={i} className="glass-card" style={{ height: '300px', opacity: 0.4 }} />)}
                    </div>
                ) : courses.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#aaa', padding: '80px 0', fontSize: '13px' }}>No courses yet — create your first one!</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
                        {courses.map((c, i) => (
                            <div key={c.id} className="glass-card" style={{ overflow: 'hidden', padding: 0, opacity: c.is_active ? 1 : 0.65, transition: 'opacity 0.2s' }}>
                                <div style={{ height: '148px', position: 'relative', overflow: 'hidden', background: GradientBg[i % GradientBg.length] }}>
                                    {c.thumbnail_url && <div style={{ position: 'absolute', inset: 0 }}><Thumbnail fileKey={c.thumbnail_url} /></div>}
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', padding: '3px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', backdropFilter: 'blur(8px)', background: c.is_active ? 'rgba(5,150,105,0.15)' : 'rgba(0,0,0,0.15)', color: c.is_active ? '#047857' : '#888' }}>
                                        {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '10px', padding: '6px 12px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>{c.sections?.length ?? 0}</div>
                                        <div style={{ fontSize: '8px', color: '#999', letterSpacing: '0.08em' }}>SECTIONS</div>
                                    </div>
                                </div>
                                <div style={{ padding: '16px' }}>
                                    <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>{c.title}</h2>
                                    <CopyIdChip id={c.id} />
                                    <p style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.6, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>₹{c.price.toLocaleString('en-IN')}</span>
                                        {(c._count?.purchases ?? 0) > 0 && <span style={{ fontSize: '11px', color: '#aaa' }}>· {c._count?.purchases} sold</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => setManaging(c)} className="btn-ghost" style={{ flex: 1, fontSize: '11px', padding: '7px 0', justifyContent: 'center' }}>Manage →</button>
                                        <button onClick={() => toggleActive(c.id)} disabled={toggling === c.id} style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.10)', fontSize: '11px', cursor: 'pointer', fontFamily: 'Sora,sans-serif', background: c.is_active ? 'rgba(239,68,68,0.07)' : 'rgba(5,150,105,0.09)', color: c.is_active ? '#b91c1c' : '#047857', opacity: toggling === c.id ? 0.4 : 1 }}>
                                            {toggling === c.id ? '…' : c.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button onClick={() => deleteCourse(c.id)} style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.10)', fontSize: '13px', cursor: 'pointer', color: '#e00', background: 'rgba(220,0,0,0.05)' }}>🗑</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
            {managing && <ManageModal course={managing} onClose={() => setManaging(null)} onRefresh={() => { setManaging(null); load(); }} />}
        </>
    );
}
