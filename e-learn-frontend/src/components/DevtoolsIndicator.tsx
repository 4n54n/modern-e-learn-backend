"use client";

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Status = 'checking' | 'online' | 'offline';

export default function DevtoolsIndicator() {
    const [status, setStatus] = useState<Status>('checking');
    const [latency, setLatency] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    const [phone, setPhone] = useState('');

    const ping = async () => {
        setStatus('checking');
        const t0 = Date.now();
        try {
            const res = await fetch(`${API}/admin/contact`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setLatency(Date.now() - t0);
                setStatus('online');
                setPhone(data.phone || '');
            } else {
                setStatus('offline');
            }
        } catch {
            setStatus('offline');
            setLatency(null);
        }
    };

    useEffect(() => {
        ping();
        const id = setInterval(ping, 30_000); // re-check every 30s
        return () => clearInterval(id);
    }, []);

    const dot = status === 'online' ? '#22c55e' : status === 'offline' ? '#ef4444' : '#f59e0b';
    const label = status === 'online' ? 'API Online' : status === 'offline' ? 'API Offline' : 'Checking…';

    return (
        <div id="devtools-indicator" style={{ position: 'fixed', bottom: '16px', left: '16px', zIndex: 9999, fontFamily: 'Sora, sans-serif' }}>
            {open && (
                <div style={{ marginBottom: '8px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '12px', padding: '14px 16px', minWidth: '220px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                    <p style={{ fontSize: '10px', color: '#888', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '10px', textTransform: 'uppercase' }}>Dev Status</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Row label="Backend" value={<span style={{ color: dot, fontWeight: 600 }}>{label}</span>} />
                        {latency !== null && <Row label="Latency" value={`${latency}ms`} />}
                        <Row label="API Base" value={process.env.NEXT_PUBLIC_API_URL || "localhost:3000"} />
                        <Row label="App" value={typeof window !== 'undefined' ? window.location.host : 'Server'} />
                    </div>
                    <button onClick={ping} style={{ marginTop: '10px', width: '100%', padding: '6px', borderRadius: '7px', border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.04)', cursor: 'pointer', fontSize: '11px', color: '#555', fontFamily: 'Sora,sans-serif' }}>
                        ↻ Refresh
                    </button>
                </div>
            )}

            <button
                onClick={() => setOpen(o => !o)}
                title={label}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 12px', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', cursor: 'pointer', fontSize: '11px', color: '#555', fontFamily: 'Sora,sans-serif', fontWeight: 500 }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dot, display: 'inline-block', boxShadow: `0 0 0 2px ${dot}33`, flexShrink: 0, animation: status === 'checking' ? 'devPulse 1s ease-in-out infinite' : 'none' }} />
                {label}
                <style>{`@keyframes devPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            </button>
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: '#aaa', flexShrink: 0 }}>{label}</span>
            <span style={{ flex: 1, borderBottom: '1px dashed rgba(0,0,0,0.10)', height: '1px' }} />
            <span style={{ fontSize: '11px', color: '#1a1a1a', fontFamily: 'monospace', flexShrink: 0 }}>{value}</span>
        </div>
    );
}
