"use client";

import { Sora } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import DevtoolsIndicator from "@/components/DevtoolsIndicator";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const sora = Sora({ subsets: ["latin"], weight: ["200", "300", "400", "500", "600", "700"], display: "swap" });

function Spinner() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(0,0,0,0.10)', borderTopColor: 'rgba(0,0,0,0.45)', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: '12px', color: '#bbb', fontFamily: 'Sora, sans-serif' }}>Loading…</p>
        </div>
    );
}

function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const isPublicPage = pathname === "/login" || pathname === "/privacy-policy" || pathname === "/delete-account";

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (!token && !isPublicPage) {
            router.replace("/login");
        } else {
            setReady(true);
        }
    }, [pathname, isPublicPage, router]);

    if (!ready) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <Spinner />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {!isPublicPage && <Sidebar />}
            <main style={{ flex: 1, overflowY: 'auto', padding: isPublicPage ? '0' : '40px 44px' }}>
                {children}
            </main>
        </div>
    );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <head>
                <title>SAMRA Admin</title>
                <meta name="description" content="SAMRA eLearning Admin Panel" />
            </head>
            <body className={sora.className} style={{ background: 'rgb(188,188,188)' }} suppressHydrationWarning>
                <AppShell>{children}</AppShell>
                <DevtoolsIndicator />
            </body>
        </html>
    );
}
