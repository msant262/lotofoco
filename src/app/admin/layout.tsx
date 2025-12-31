'use client';

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            // If not logged in OR not admin, redirect to Dashboard (or Home)
            if (!user) {
                router.push('/entrar');
            } else if (!isAdmin) {
                router.push('/dashboard');
            }
        }
    }, [user, isAdmin, loading, router]);

    // Show loader while checking permissions
    if (loading || !user || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-slate-500 text-sm">Verificando permissões...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
