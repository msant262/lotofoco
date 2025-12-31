'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Save,
    CheckCircle2,
    BarChart2,
    Gem,
    User,
    Settings,
    LogOut,
    HelpCircle
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
    { name: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
    { name: "Jogos Salvos", href: "/dashboard/bets", icon: Save },
    { name: "Conferência", href: "/dashboard/checker", icon: CheckCircle2 },
    { name: "Estatísticas", href: "/dashboard/stats", icon: BarChart2 },
    { name: "Assinatura", href: "/dashboard/subscription", icon: Gem },
    { name: "Perfil", href: "/dashboard/profile", icon: User },
    // { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-[calc(100vh-4rem)] sticky top-16">
            <div className="p-6">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Menu Principal
                </h2>
                <nav className="space-y-1">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-slate-500")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4">
                    Outros
                </h2>
                <nav className="space-y-1">
                    <Link
                        href="#"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
                    >
                        <HelpCircle className="w-4 h-4 text-slate-500" />
                        Ajuda e Suporte
                    </Link>
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-md transition-colors text-left"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </nav>
            </div>
        </aside>
    );
}
