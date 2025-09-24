const options = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    cookieName: 'AuthToken',
    cookieSignatureKeys: [process.env.COOKIE_SIGNATURE_KEY || 'dev-change-me-32-bytes-long!!!'],
    ...(process.env.NODE_ENV === 'development' ? {
        serviceAccount: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        clientEmail: process.env.PRIVATE_CLIENT_EMAIL!,
        privateKey: process.env.PRIVATE_PRIVATE_KEY!,
        }
    } : {}),
}

export default options;