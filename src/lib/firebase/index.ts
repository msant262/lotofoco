import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!apiKey || !projectId) {
    if (typeof window !== 'undefined') {
        console.error("⚠️ ERRO CRÍTICO: Variáveis de ambiente do Firebase não encontradas. Verifique se o arquivo .env.local está configurado ou se as variáveis de ambiente foram adicionadas no painel de deploy.");
    } else {
        console.warn("⚠️ AVISO DE BUILD: Variáveis de ambiente do Firebase ausentes no servidor. Usando valores mock para compilação.");
    }
}

const firebaseConfig = {
    apiKey: apiKey || "mock_key_for_build",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock_project.firebaseapp.com",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://mock_project.firebaseio.com",
    projectId: projectId || "mock_project",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock_project.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "00000000000",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:00000000000:web:00000000000000",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-00000000"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Polyfill para evitar erro "navigator is not defined" no Edge Runtime SSR
if (typeof window === 'undefined' && typeof navigator === 'undefined') {
    try {
        // @ts-ignore
        global.navigator = {
            userAgent: 'node',
        };
    } catch (e) {
        // Ignore se não conseguir definir
    }
}

const db = getFirestore(app);

export { app, auth, db };

