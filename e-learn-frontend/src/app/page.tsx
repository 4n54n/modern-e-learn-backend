"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RecentPurchase { id: string; userName: string; userEmail: string; courseTitle: string; amount: number; createdAt: string; }
interface MonthlyRevenue { month: string; revenue: number; }
interface Stats {
    totalUsers: number;
    activeCourses: number;
    inactiveCourses: number;
    totalRevenue: number;
    revenueThisMonth: number;
    pendingNotifications: number;
    monthlyRevenue: MonthlyRevenue[];
    recentPurchases: RecentPurchase[];
}

function fmt(n: number) {
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

// Simple SVG bar chart with gridlines + Y-axis labels
function BarChart({ data }: { data: MonthlyRevenue[] }) {
    const max = Math.max(...data.map(d => d.revenue), 1);
    const W = 640, H = 180, BAR_W = 48, PAD_L = 58, PAD_B = 28, PAD_T = 20;
    const chartW = W - PAD_L;
    const GAP = (chartW - data.length * BAR_W) / (data.length + 1);
    // 4 gridlines at 25%, 50%, 75%, 100%
    const ticks = [0.25, 0.5, 0.75, 1.0];
    return (
        <svg viewBox={`0 0 ${W} ${H + PAD_B + PAD_T}`} style={{ width: '100%' }}>
            {/* Gridlines + Y-axis labels */}
            {ticks.map(t => {
                const y = PAD_T + H - t * H;
                const val = t * max;
                return (
                    <g key={t}>
                        <line x1={PAD_L} y1={y} x2={W} y2={y}
                            stroke="rgba(0,0,0,0.06)" strokeWidth={1} strokeDasharray="4 3" />
                        <text x={PAD_L - 6} y={y + 4} textAnchor="end"
                            fontSize={9} fill="rgba(0,0,0,0.35)" fontFamily="Sora, sans-serif">
                            {val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val.toFixed(0)}`}
                        </text>
                    </g>
                );
            })}
            {/* Bars */}
            {data.map((d, i) => {
                const barH = Math.max(4, (d.revenue / max) * H);
                const x = PAD_L + GAP + i * (BAR_W + GAP);
                const y = PAD_T + H - barH;
                const isLatest = i === data.length - 1;
                const textInside = barH > 20;
                return (
                    <g key={d.month}>
                        <rect x={x} y={y} width={BAR_W} height={barH} rx={6}
                            fill={isLatest ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.10)'} />
                        <text x={x + BAR_W / 2} y={PAD_T + H + 18} textAnchor="middle"
                            fontSize={10} fill="rgba(0,0,0,0.40)" fontFamily="Sora, sans-serif">
                            {d.month}
                        </text>
                        {d.revenue > 0 && (
                            <text x={x + BAR_W / 2} y={textInside ? y + 14 : y - 6} textAnchor="middle"
                                fontSize={9} fill={isLatest ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.45)'} fontFamily="Sora, sans-serif" fontWeight={isLatest ? 600 : 500}>
                                {d.revenue >= 1000 ? `₹${(d.revenue / 1000).toFixed(1)}k` : fmt(d.revenue)}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.statusCode) setError(data.message || 'Failed to load stats');
                else setStats(data);
            })
            .catch(() => setError('Could not connect to backend'));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/login');
    };

    const STAT_CARDS = stats ? [
        {
            label: 'Total Users',
            value: stats.totalUsers.toLocaleString('en-IN'),
            note: 'Registered accounts'
        },
        {
            label: 'Active Courses',
            value: stats.activeCourses.toString(),
            note: `+${stats.inactiveCourses} inactive`
        },
        {
            label: 'Total Revenue',
            value: fmt(stats.totalRevenue),
            note: `+${fmt(stats.revenueThisMonth)} this month`
        },
        {
            label: 'Pending Notifications',
            value: stats.pendingNotifications.toString(),
            noteLink: true,
        },
    ] : null;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-up">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <p className="label-xs" style={{ marginBottom: '6px' }}>Overview</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>Dashboard</h1>
                </div>
                <button className="btn-primary" onClick={handleLogout} style={{ fontSize: '12px' }}>
                    Log out
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: '10px', color: '#b91c1c', fontSize: '13px', marginBottom: '24px' }}>
                    {error}
                </div>
            )}

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {!stats
                    ? [0, 1, 2, 3].map(i => (
                        <div key={i} className="glass-card" style={{ padding: '24px 22px', minHeight: '100px', opacity: 0.5 }}>
                            <div style={{ height: '10px', width: '60%', background: 'rgba(0,0,0,0.10)', borderRadius: '4px', marginBottom: '14px' }} />
                            <div style={{ height: '28px', width: '40%', background: 'rgba(0,0,0,0.08)', borderRadius: '6px', marginBottom: '10px' }} />
                            <div style={{ height: '10px', width: '80%', background: 'rgba(0,0,0,0.06)', borderRadius: '4px' }} />
                        </div>
                    ))
                    : STAT_CARDS!.map((s, i) => (
                        <div key={i} className="glass-card" style={{ padding: '24px 22px' }}>
                            <p className="label-xs" style={{ marginBottom: '14px' }}>{s.label}</p>
                            <div style={{ fontSize: '30px', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.03em', marginBottom: '8px' }}>{s.value}</div>
                            {s.noteLink
                                ? <Link href="/notifications" style={{ fontSize: '12px', color: '#555', textDecoration: 'underline', textUnderlineOffset: '3px' }}>View →</Link>
                                : <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 300 }}>{s.note}</div>
                            }
                        </div>
                    ))
                }
            </div>

            {/* Body panels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>

                {/* Revenue chart */}
                <div className="glass-card" style={{ padding: '28px', minHeight: '320px' }}>
                    <p className="label-xs" style={{ marginBottom: '20px' }}>Revenue Analytics</p>
                    {stats?.monthlyRevenue && stats.monthlyRevenue.some(m => m.revenue > 0)
                        ? <BarChart data={stats.monthlyRevenue} />
                        : (
                            <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ccc', gap: '8px' }}>
                                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-10" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <span style={{ fontSize: '12px' }}>No revenue data yet</span>
                            </div>
                        )
                    }
                </div>

                {/* Recent Purchases */}
                <div className="glass-card" style={{ padding: '28px' }}>
                    <p className="label-xs" style={{ marginBottom: '20px' }}>Recent Purchases</p>
                    {!stats
                        ? <div style={{ color: '#ccc', fontSize: '12px' }}>Loading…</div>
                        : stats.recentPurchases.length === 0
                            ? <div style={{ color: '#aaa', fontSize: '12px', marginTop: '20px', textAlign: 'center' }}>No purchases yet</div>
                            : stats.recentPurchases.map((p, i) => (
                                <div key={p.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '13px 0',
                                    borderBottom: i < stats.recentPurchases.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                }}>
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '10px',
                                        background: 'rgba(0,0,0,0.07)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '11px', fontWeight: 600, color: '#555', flexShrink: 0,
                                    }}>{initials(p.userName)}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>{p.userName}</div>
                                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.courseTitle}</div>
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a', flexShrink: 0 }}>{fmt(p.amount)}</div>
                                </div>
                            ))
                    }
                </div>
            </div>
        </div>
    );
}
