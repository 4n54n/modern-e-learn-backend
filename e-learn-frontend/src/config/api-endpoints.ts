/**
 * User-facing API reference for the mobile app.
 * Admin-only endpoints (course CRUD, env config, notifications, asset management)
 * are intentionally omitted from this documentation for security.
 */
export const API_ENDPOINTS = [

    // ── Auth ─────────────────────────────────────────────────────────────────
    {
        category: 'Auth',
        method: 'POST',
        url: '/auth/google',
        headers: { 'Content-Type': 'application/json' },
        bodyFormat: '{"idToken":"<Google ID Token from firebase/google-sign-in>"}',
        exampleRequest: 'POST /auth/google\nbody: { "idToken": "eyJhbGci..." }',
        exampleResponse: '{"access_token":"eyJ...","user":{"id":"...","name":"John","email":"john@example.com"}}'
    },

    // ── App Settings ──────────────────────────────────────────────────────────
    {
        category: 'App Settings',
        method: 'GET',
        url: '/admin/contact',
        headers: {},
        bodyFormat: null,
        exampleRequest: 'GET /admin/contact  (no auth required)',
        exampleResponse: '{"phone":"+919999999999"}'
    },

    // ── Courses ───────────────────────────────────────────────────────────────
    {
        category: 'Courses',
        method: 'GET',
        url: '/courses',
        headers: { 'Authorization': 'Bearer <user-token>' },
        bodyFormat: null,
        exampleRequest: 'GET /courses  →  returns all active courses',
        exampleResponse: '[{"id":"...","title":"React Bootcamp","description":"...","price":999,"thumbnail_url":"uploads/...","sections":[...]}]'
    },
    {
        category: 'Courses',
        method: 'GET',
        url: '/courses/:id',
        headers: { 'Authorization': 'Bearer <user-token>' },
        bodyFormat: null,
        exampleRequest: 'GET /courses/abc123',
        exampleResponse: '{"id":"abc123","title":"React Bootcamp","thumbnail_url":"uploads/...","sections":[{"id":"...","title":"Intro","description":"...","lessons":[{"id":"...","title":"Lesson 1","video_url":"uploads/...","document_url":null}]}]}'
    },

    // ── Purchases ─────────────────────────────────────────────────────────────
    {
        category: 'Purchases',
        method: 'POST',
        url: '/payments/create-order',
        headers: { 'Authorization': 'Bearer <user-token>', 'Content-Type': 'application/json' },
        bodyFormat: '{"courseId":"<course-id>"}',
        exampleRequest: 'POST /payments/create-order\nbody: { "courseId": "abc123" }',
        exampleResponse: '{"orderId":"order_Hk...","amount":99900,"currency":"INR","key":"rzp_live_..."}'
    },
    {
        category: 'Purchases',
        method: 'POST',
        url: '/payments/verify',
        headers: { 'Authorization': 'Bearer <user-token>', 'Content-Type': 'application/json' },
        bodyFormat: '{"razorpayOrderId":"...","razorpayPaymentId":"...","razorpaySignature":"...","courseId":"..."}',
        exampleRequest: 'POST /payments/verify  →  call immediately after Razorpay checkout success',
        exampleResponse: '{"success":true,"purchase":{"id":"...","status":"SUCCESS","expires_at":"2024-06-01T...","created_at":"..."}}'
    },
    {
        category: 'Purchases',
        method: 'POST',
        url: '/payments/webhook',
        headers: { 'x-razorpay-signature': '<hmac-sha256>' },
        bodyFormat: 'Raw JSON from Razorpay (do not parse — signature is over raw bytes)',
        exampleRequest: 'Called automatically by Razorpay on payment.captured event. Register URL in Razorpay Dashboard → Settings → Webhooks.',
        exampleResponse: '{"received":true}'
    },

    // ── Content Access ────────────────────────────────────────────────────────
    {
        category: 'Content Access',
        method: 'GET',
        url: '/storage/video/:courseId/:videoKey',
        headers: { 'Authorization': 'Bearer <user-token>' },
        bodyFormat: null,
        exampleRequest: 'GET /storage/video/abc123/uploads%2Flesson1.mp4\n(user must have purchased the course)',
        exampleResponse: '{"url":"https://r2.../uploads/lesson1.mp4?X-Amz-Signature=...&Expires=300"}'
    },
    {
        category: 'Content Access',
        method: 'GET',
        url: '/storage/file-url?key=<fileKey>',
        headers: { 'Authorization': 'Bearer <user-token>' },
        bodyFormat: null,
        exampleRequest: 'GET /storage/file-url?key=uploads%2Fthumbnail.jpg\n(use for thumbnails, section images, documents)',
        exampleResponse: '{"url":"https://r2.../uploads/thumbnail.jpg?X-Amz-Signature=..."}'
    },

    // ── User / Devices ────────────────────────────────────────────────────────
    {
        category: 'User',
        method: 'POST',
        url: '/users/:userId/devices',
        headers: { 'Authorization': 'Bearer <user-token>', 'Content-Type': 'application/json' },
        bodyFormat: '{"deviceId":"<unique-device-uuid>","fcmToken":"<firebase-fcm-token>"}',
        exampleRequest: 'POST /users/usr123/devices\nbody: { "deviceId": "...", "fcmToken": "..." }',
        exampleResponse: '{"id":"...","fcm_token":"...","last_active":"2024-01-01T00:00:00.000Z"}'
    },
];
