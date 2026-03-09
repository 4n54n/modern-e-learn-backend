import React from 'react';

export default function PrivacyPolicyPage() {
    return (
        <div style={{ minHeight: '100vh', padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
            {/* The main container uses the same 'glass-card' principles seen in globals.css */}
            <div className="glass-card" style={{ maxWidth: '900px', width: '100%', overflow: 'hidden' }}>

                {/* Header Area using a high-opacity glass panel look to stand out */}
                <header className="glass-panel" style={{ padding: '48px 40px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: 600, margin: '0 0 16px 0', lineHeight: 1, letterSpacing: '-0.02em' }}>Privacy Policy</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0, fontWeight: 500 }}>Effective Date: March 1, 2026</p>
                </header>

                <div style={{ padding: '48px 40px', fontSize: '1.05rem', lineHeight: '1.8' }}>

                    <section style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>1. Basic Details</h2>
                        <ul className="content-block" style={{ listStyleType: 'none', margin: '24px 0 0 0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <li><strong style={{ fontWeight: 600 }}>App Name:</strong> <span style={{ color: 'var(--text-muted)' }}>SAMRA</span></li>
                            <li><strong style={{ fontWeight: 600 }}>Company / Developer Name:</strong> <span style={{ color: 'var(--text-muted)' }}>INTOAI TECHNOLOGIES PRIVATE LIMITED</span></li>
                            <li><strong style={{ fontWeight: 600 }}>Effective Date:</strong> <span style={{ color: 'var(--text-muted)' }}>March 1, 2026</span></li>
                            <li><strong style={{ fontWeight: 600 }}>Contact Email:</strong> <span style={{ color: 'var(--text-muted)' }}>cs.intoai@gmail.com</span></li>
                            <li><strong style={{ fontWeight: 600 }}>Website URL:</strong> <span style={{ color: 'var(--text-muted)' }}>https://intoai.ai</span></li>
                        </ul>
                        <p style={{ marginTop: '32px', color: 'var(--text-primary)' }}>
                            Welcome to <strong style={{ fontWeight: 600 }}>SAMRA</strong> ("we," "our," or "us"), operated by <strong style={{ fontWeight: 600 }}>INTOAI TECHNOLOGIES PRIVATE LIMITED</strong>. We are committed to protecting your personal information and your right to privacy when you use our mobile application and related services.
                        </p>
                    </section>

                    <section style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '32px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>2. Data Collection Details</h2>

                        <div className="content-block" style={{ padding: '32px', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Personal Data We Collect</h3>
                            <ul style={{ listStyleType: 'disc', margin: '0 0 0 24px', padding: 0, color: 'var(--text-muted)' }}>
                                <li style={{ marginBottom: '8px' }}>Name</li>
                                <li style={{ marginBottom: '8px' }}>Email Address</li>
                                <li style={{ marginBottom: '8px' }}>Phone Number (if applicable)</li>
                                <li style={{ marginBottom: '8px' }}>Profile Photo</li>
                            </ul>
                        </div>

                        <div className="content-block" style={{ padding: '32px', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Technical Data We Collect</h3>
                            <ul style={{ listStyleType: 'disc', margin: '0 0 0 24px', padding: 0, color: 'var(--text-muted)' }}>
                                <li style={{ marginBottom: '8px' }}>Device ID</li>
                                <li style={{ marginBottom: '8px' }}>IP Address</li>
                                <li style={{ marginBottom: '8px' }}>Device Model</li>
                                <li style={{ marginBottom: '8px' }}>Operating System (OS) Version</li>
                            </ul>
                        </div>

                        <div className="content-block" style={{ padding: '32px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Usage Data We Collect</h3>
                            <ul style={{ listStyleType: 'disc', margin: '0 0 0 24px', padding: 0, color: 'var(--text-muted)' }}>
                                <li style={{ marginBottom: '8px' }}>App Activity and Interaction</li>
                                <li style={{ marginBottom: '8px' }}>Log Data and Crash Reports</li>
                                <li style={{ marginBottom: '8px' }}>Analytics Data</li>
                            </ul>
                        </div>
                    </section>

                    <section style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '32px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>3. Purpose of Data Collection</h2>
                        <p style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>We collect and use your personal information for the following purposes:</p>
                        <div className="content-block" style={{ padding: '32px' }}>
                            <ul style={{ listStyleType: 'disc', margin: '0 0 0 24px', padding: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Account Creation:</strong> To set up and manage your user account.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Authentication:</strong> To securely log you into the application.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Payments:</strong> To process and verify transactions for course purchases.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Support:</strong> To provide customer support and respond to your inquiries.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Analytics:</strong> To understand how users interact with our app and improve our services.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Security:</strong> To detect and prevent fraudulent activities and secure our platform.</li>
                            </ul>
                        </div>
                    </section>

                    <section style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '32px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>4. Third-Party Services</h2>
                        <p style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>We may employ third-party companies and services to facilitate our App and provide certain features. These third parties include:</p>

                        <div className="content-block" style={{ padding: '32px', marginBottom: '24px' }}>
                            <ul style={{ listStyleType: 'disc', margin: '0 0 0 24px', padding: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Firebase:</strong> Used for app infrastructure, notifications, and analytics.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Google Sign-In:</strong> Used to provide seamless social authentication.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Razorpay:</strong> Used for secure payment processing.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Analytics Tools:</strong> Used to monitor and analyze app usage.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Hosting Providers:</strong> Used to securely host our backend services and data.</li>
                            </ul>
                        </div>

                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.1)' }}>
                            <p style={{ fontStyle: 'italic', fontSize: '0.95rem', margin: 0, color: 'var(--text-muted)' }}>
                                Please note that these third-party service providers have their own Privacy Policies addressing how they use such information. We encourage you to review their respective privacy policies.
                            </p>
                        </div>
                    </section>

                    <section style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>5. Payment Information</h2>
                        <div className="content-block" style={{ padding: '32px' }}>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                All payment processing is handled securely by our third-party payment gateway, <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Razorpay</strong>. We want to clarify that <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>we do NOT store or retain your credit/debit card details, UPI PINs, or any sensitive financial data</strong> on our servers. Your payment information is transmitted directly to the payment processor.
                            </p>
                        </div>
                    </section>

                    <section style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>6. Data Security</h2>
                        <div className="content-block" style={{ padding: '32px' }}>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                We employ industry-standard technical and organizational security measures designed to protect your personal data from unauthorized access, alteration, disclosure, or destruction.
                                However, please be aware that no method of transmission over the internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security due to the inherent limitations of the internet.
                            </p>
                        </div>
                    </section>

                    <section style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>7. Data Retention</h2>
                        <div className="content-block" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>How long we store data:</strong> We will retain your personal data only for as long as is necessary for the purposes set out in this Privacy Policy, or as required by legal, regulatory, or accounting rules.
                            </p>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>When data is deleted:</strong> We will securely delete or anonymize your personal information once it is no longer needed for its intended purpose, or when you explicitly request its deletion (subject to any overriding legal obligations).
                            </p>
                        </div>
                    </section>

                    <section style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '32px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>8. User Rights</h2>
                        <p style={{ margin: '0 0 24px 0', color: 'var(--text-primary)' }}>Depending on your location and applicable laws, you have the following rights regarding your personal data:</p>
                        <div className="content-block" style={{ padding: '32px' }}>
                            <ul style={{ listStyleType: 'disc', margin: '0 0 0 24px', padding: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Access your data:</strong> You have the right to request a copy of the personal data we hold about you.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Request correction:</strong> You have the right to request that we correct any inaccurate or incomplete information.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Request deletion:</strong> You have the right to ask us to delete your personal data when it is no longer necessary for us to retain it.</li>
                                <li><strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Withdraw consent:</strong> If you have provided consent for us to process your data, you have the right to withdraw that consent at any time.</li>
                            </ul>
                        </div>
                    </section>

                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>9. Contact Us</h2>
                        <p style={{ margin: '0 0 24px 0', color: 'var(--text-primary)' }}>
                            If you have questions, concerns, or requests relating to this Privacy Policy or your personal data, please contact us at:
                        </p>
                        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'inline-block' }}>
                            <p className="label-xs" style={{ marginBottom: '8px' }}>COMPANY DETAILS</p>
                            <p style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>INTOAI TECHNOLOGIES PRIVATE LIMITED</p>
                            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>Email: cs.intoai@gmail.com</p>
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
