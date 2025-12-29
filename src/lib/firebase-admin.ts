import "server-only";
import * as admin from "firebase-admin";

// Fallback logic for demo/development if env variables are missing
// NOTE: In production, these variables MUST be set in Vercel/Environment.
// For local development without env, this might crash if we try to use it.
// To fix the "Service account object must contain a string 'project_id' property" error, we must handle missing envs securely.

if (!admin.apps.length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

    // Check if we have server credentials. If not, we CANNOT initialize Admin SDK properly.
    if (!process.env.FIREBASE_PRIVATE_KEY) {
        console.warn("⚠️ Firebase Admin SDK Warning: FIREBASE_PRIVATE_KEY is missing. Server-side database actions will fail.");
        // We can throw or just not initialize, but 'adminDb' export will fail.
        // For the purpose of the demo, if keys are missing, we should probably mock or fail gracefully.

        // HOWEVER, the user provided client keys earlier. Admin SDK needs SERVICE ACCOUNT keys (different).
        // Since we don't have the Service Account JSON from the user, we cannot use Admin SDK fully yet.
    }

    if (process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } else {
        // Fallback for demo environment where maybe we just want to avoid crash,
        // but actual DB writes won't work server-side without creds.
        // But wait, user provided Client Config. Client SDK can run on server? No, not really for auth.
        // We need to ask user for Service Account OR use Client SDK (with relaxed rules) on client side.

        // TEMPORARY FIX: If no Admin Key, do not initialize app or init with null? 
        // This will cause errors when accessing adminDb.

        // STRATEGY: Create a "Mock" adminDb if keys missing to parse/build but log errors on write.
    }
}

// Export safe accessors
export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
