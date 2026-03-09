import React from 'react';

export default function DeleteAccountPage() {
    return (
        <div style={{ minHeight: '100vh', padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
            <div className="glass-card" style={{ maxWidth: '900px', width: '100%', overflow: 'hidden' }}>

                {/* Header */}
                <header className="glass-panel" style={{ padding: '48px 40px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 12px rgba(239,68,68,0.5)' }} />
                        <span className="label-xs">DATA DELETION REQUEST</span>
                    </div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 600, margin: '0 0 16px 0', lineHeight: 1, letterSpacing: '-0.02em' }}>Delete Your Account</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0, fontWeight: 400, lineHeight: 1.6 }}>
                        SAMRA
                    </p>
                </header>

                <div style={{ padding: '48px 40px', fontSize: '1.05rem', lineHeight: '1.8' }}>

                    {/* Important Notice */}
                    <div className="content-block" style={{ padding: '28px 32px', marginBottom: '48px', borderLeft: '4px solid #ef4444' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ef4444', margin: '0 0 10px 0' }}>⚠ Important — Please Read Before Proceeding</h3>
                        <ul style={{ listStyleType: 'disc', margin: '0 0 0 24px', padding: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li>You will <strong style={{ color: 'var(--text-primary)' }}>immediately lose access</strong> to your SAMRA account and all purchased courses from Day 1 of the request.</li>
                            <li>All your data will be <strong style={{ color: 'var(--text-primary)' }}>permanently deleted after 90 days</strong> from the date of your request.</li>
                            <li>This action <strong style={{ color: 'var(--text-primary)' }}>cannot be reversed</strong> once the 90-day retention period expires.</li>
                        </ul>
                    </div>

                    {/* Steps */}
                    <section style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '32px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>How to Request Account Deletion</h2>

                        {/* Step 1 */}
                        <div className="content-block" style={{ padding: '32px', marginBottom: '20px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                            <div style={{ minWidth: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>1</div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Email Us Directly</h3>
                                <p style={{ color: 'var(--text-muted)', margin: '0 0 16px 0' }}>Send a deletion request email to our support team from your registered email address. Include a brief note confirming you want your account and data deleted.</p>
                                <a href="mailto:cs.intoai@gmail.com" style={{ display: 'inline-block', padding: '10px 22px', backgroundColor: 'var(--accent)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', letterSpacing: '0.03em' }}>
                                    cs.intoai@gmail.com →
                                </a>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="content-block" style={{ padding: '32px', marginBottom: '20px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                            <div style={{ minWidth: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>2</div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Use In-App Support (Alternatively)</h3>
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Open the <strong style={{ color: 'var(--text-primary)' }}>SAMRA app</strong>, go to the <strong style={{ color: 'var(--text-primary)' }}>Home</strong> screen, and tap the <strong style={{ color: 'var(--text-primary)' }}>"Need Help?"</strong> button at the bottom of the screen. This will connect you directly to our WhatsApp support team, who can guide you through the deletion process.</p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="content-block" style={{ padding: '32px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                            <div style={{ minWidth: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>3</div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Confirmation & Processing</h3>
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Once we receive your request, our team will send a confirmation. Your account access will be revoked immediately. All associated data will be permanently removed after the 90-day retention window.</p>
                            </div>
                        </div>
                    </section>

                    {/* Data that will be deleted */}
                    <section style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '32px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>What Data is Deleted</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="content-block" style={{ padding: '28px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ef4444', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🗑</span> Deleted (After 90 Days)
                                </h3>
                                <ul style={{ listStyleType: 'disc', margin: '0 0 0 20px', padding: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
                                    <li>Account profile & credentials</li>
                                    <li>Name, email, phone number</li>
                                    <li>Profile photo</li>
                                    <li>Course enrollment records</li>
                                    <li>App activity & usage data</li>
                                    <li>Device & technical data</li>
                                </ul>
                            </div>
                            <div className="content-block" style={{ padding: '28px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📋</span> Retained (Legal Requirement)
                                </h3>
                                <ul style={{ listStyleType: 'disc', margin: '0 0 0 20px', padding: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
                                    <li>Transaction / payment records</li>
                                    <li>Required by financial & tax laws</li>
                                    <li>Retained anonymously as required</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Timeline */}
                    <section style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '32px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>Deletion Timeline</h2>
                        <div className="content-block" style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {[
                                    { day: 'Day 1', label: 'Request Received', desc: 'We receive and confirm your deletion request. Your account access is revoked immediately.', color: '#ef4444' },
                                    { day: 'Day 1–90', label: 'Retention Period', desc: 'Your data is held in our systems for 90 days. This allows us to resolve any ongoing disputes or legal obligations.', color: '#f59e0b' },
                                    { day: 'Day 90', label: 'Permanent Deletion', desc: 'All personal data tied to your account is permanently and irreversibly deleted from our systems.', color: '#22c55e' },
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', paddingBottom: i < 2 ? '32px' : '0', position: 'relative' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '16px' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: item.color, marginTop: '3px', flexShrink: 0 }} />
                                            {i < 2 && <div style={{ width: '2px', flex: 1, backgroundColor: 'var(--border)', marginTop: '4px', minHeight: '40px' }} />}
                                        </div>
                                        <div>
                                            <span className="label-xs" style={{ color: item.color }}>{item.day}</span>
                                            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '4px 0 6px 0', color: 'var(--text-primary)' }}>{item.label}</h4>
                                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Contact */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>Contact & Support</h2>
                        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'inline-block', width: '100%' }}>
                            <p className="label-xs" style={{ marginBottom: '8px' }}>INTOAI TECHNOLOGIES PRIVATE LIMITED</p>
                            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>For data deletion requests or support, reach out us at:</p>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <a href="mailto:cs.intoai@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', backgroundColor: 'var(--accent)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
                                    ✉ cs.intoai@gmail.com
                                </a>
                            </div>
                        </div>
                    </section>

                    <footer style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                        <p style={{ margin: 0, letterSpacing: '0.05em' }}>© {new Date().getFullYear()} INTOAI TECHNOLOGIES PRIVATE LIMITED. ALL RIGHTS RESERVED.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
