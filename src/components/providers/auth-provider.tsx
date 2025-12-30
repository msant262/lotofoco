"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    setPersistence,
    browserLocalPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { },
    isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // garante persistência (evita “logou e sumiu”)
        setPersistence(auth, browserLocalPersistence).catch(console.error);

        // tenta processar retorno do redirect (se algum dia você usar)
        getRedirectResult(auth).catch(() => { });
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
            setIsAdmin(!!(currentUser && adminEmail && currentUser.email === adminEmail));

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();

        try {
            // popup como padrão (resolve seu loop)
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            // fallback: se popup bloqueado, tenta redirect
            if (err?.code === "auth/popup-blocked" || err?.code === "auth/popup-closed-by-user") {
                await signInWithRedirect(auth, provider);
                return;
            }
            console.error("Error signing in with Google", err);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);