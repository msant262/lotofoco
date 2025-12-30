"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
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
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            // Check if user is admin based on email
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
            if (currentUser && adminEmail && currentUser.email === adminEmail) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Handle redirect result on load
        getRedirectResult(auth).catch((error) => {
            console.error("Error confirming redirect sign in", error);
        });
    }, []);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithRedirect(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
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
