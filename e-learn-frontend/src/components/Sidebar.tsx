"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
    { name: 'Dashboard', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'Users', href: '/users' },
    { name: 'Assets', href: '/assets' },
    { name: 'Notifications', href: '/notifications' },
    { name: 'Developer', href: '/developer' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <aside className="glass-panel" style={{
            width: '220px',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            zIndex: 10,
        }}>
            {/* Brand */}
            <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1a1a1a' }}>
                    SAMRA
                </div>
                <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px', letterSpacing: '0.06em' }}>Admin Panel</div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {NAV_LINKS.map(link => {
                    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                    return (
                        <Link key={link.href} href={link.href} style={{
                            display: 'block',
                            padding: '9px 14px',
                            borderRadius: '9px',
                            fontSize: '13px',
                            fontWeight: isActive ? 500 : 400,
                            color: isActive ? '#1a1a1a' : '#999',
                            background: isActive ? 'rgba(0,0,0,0.06)' : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 0.18s ease',
                            letterSpacing: '0.01em',
                        }}>
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
