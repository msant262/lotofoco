'use client';

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Save,
    CheckCircle2,
    BarChart2,
    Gem,
    User,
    LogOut,
    HelpCircle,
    ChevronRight,
    Sparkles
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import anime from 'animejs';
import { Button, Tooltip, Avatar } from "@heroui/react";

const MENU_ITEMS = [
    { name: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
    { name: "Jogos Salvos", href: "/dashboard/bets", icon: Save },
    { name: "Conferência", href: "/dashboard/checker", icon: CheckCircle2 },
    { name: "Estatísticas", href: "/dashboard/stats", icon: BarChart2 },
    { name: "Assinatura", href: "/dashboard/subscription", icon: Gem },
    { name: "Perfil", href: "/dashboard/profile", icon: User },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        anime({
            targets: '.sidebar-item',
            translateX: [-10, 0],
            opacity: [0, 1],
            delay: anime.stagger(70),
            easing: 'easeOutElastic(1, .8)',
            duration: 800
        });
    }, []);

    return (
        <aside className="hidden md:flex flex-col w-72 bg-slate-950/50 backdrop-blur-xl border-r border-white/5 h-[calc(100vh-4rem)] sticky top-16 p-4">
            {/* Scrollable Content */}
            <div className="flex-1 flex flex-col gap-8 py-2">
                <div ref={listRef} className="space-y-1">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-3 sidebar-item opacity-0">
                        Menu Principal
                    </h2>
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "sidebar-item opacity-0 group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden",
                                    isActive
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                                        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <Icon
                                        className={cn(
                                            "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                            isActive ? "text-emerald-400 fill-emerald-500/20" : "text-slate-500 group-hover:text-emerald-400"
                                        )}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    <span className={cn("text-sm font-bold", isActive ? "tracking-wide" : "")}>
                                        {item.name}
                                    </span>
                                </div>
                                {isActive && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                                )}
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="space-y-1 mt-2">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-3 sidebar-item opacity-0">
                        Suporte
                    </h2>
                    <Link
                        href="#"
                        className="sidebar-item opacity-0 group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"
                    >
                        <HelpCircle className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        <span className="text-sm font-medium">Ajuda e Suporte</span>
                    </Link>
                </div>
            </div>

            {/* Footer / Logout */}
            <div className="mt-auto pt-4 border-t border-white/5 sidebar-item opacity-0">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-2xl border border-white/5 flex flex-col gap-4 shadow-xl">
                    {user && (
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={user.photoURL || undefined}
                                name={user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                                size="sm"
                                isBordered
                                classNames={{ base: "bg-emerald-500 text-slate-950 font-black" }}
                            />
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-white truncate">{user.displayName || "Usuário"}</p>
                                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    )}

                    <Button
                        color="danger"
                        variant="flat"
                        onPress={() => logout()}
                        startContent={<LogOut size={16} />}
                        className="w-full font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        size="sm"
                    >
                        Sair da Conta
                    </Button>
                </div>

                <div className="mt-4 flex justify-center opacity-30 hover:opacity-100 transition-opacity">
                    <Sparkles size={12} className="text-emerald-500 mr-2" />
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">LotoFoco Premium</span>
                </div>
            </div>
        </aside>
    );
}
