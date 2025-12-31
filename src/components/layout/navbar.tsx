'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, ChevronDown, Menu, User as UserIcon, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { LOTTERIES } from '@/lib/config/lotteries';
import { useAuth } from '@/components/providers/auth-provider';

export function Navbar() {
    const { user, logout, loading, isAdmin } = useAuth();
    const games = Object.values(LOTTERIES);

    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/60">
            <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-90">
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-500/30">
                        <Target className="h-5 w-5 text-emerald-400" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white hidden sm:inline-block">
                        Loto<span className="text-emerald-400">Foco</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
                    {/* Games Warning Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1 hover:text-white outline-none">
                            Loterias <ChevronDown className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-200 w-48">
                            <DropdownMenuItem asChild className="focus:bg-yellow-900/40 focus:text-yellow-400 cursor-pointer border-b border-white/10 mb-1">
                                <Link href="/mega-da-virada" className="flex items-center gap-2 font-bold text-yellow-500" prefetch={false}>
                                    <span>✨</span> Mega da Virada
                                </Link>
                            </DropdownMenuItem>
                            {games.map((game) => (
                                <DropdownMenuItem key={game.slug} asChild className="focus:bg-slate-800 focus:text-white cursor-pointer">
                                    <Link href={`/apostas/${game.slug}`} prefetch={false}>
                                        {game.name}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href="/estatisticas" className="hover:text-emerald-400 transition-colors" prefetch={false}>Estatísticas</Link>
                    <Link href="/pricing" className="hover:text-emerald-400 transition-colors" prefetch={false}>Planos</Link>
                </div>

                {/* CTA / User Menu */}
                <div className="flex items-center gap-4">
                    {loading ? (
                        <div className="w-20 h-9 bg-slate-800/50 animate-pulse rounded-md" />
                    ) : user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="outline-none">
                                <div className="flex items-center gap-2 p-1 pr-3 rounded-full bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                                    <div className="bg-emerald-600 rounded-full p-1.5">
                                        <UserIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none text-white">{user.displayName || 'Usuário'}</p>
                                        <p className="text-xs leading-none text-slate-400 truncate">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-800" />

                                <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer">
                                    <Link href="/dashboard">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Painel
                                    </Link>
                                </DropdownMenuItem>

                                {isAdmin && (
                                    <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer">
                                        <Link href="/admin">
                                            <Shield className="mr-2 h-4 w-4" />
                                            Admin
                                        </Link>
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuItem onClick={() => logout()} className="focus:bg-red-900/20 focus:text-red-400 text-red-400 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <Link href="/entrar?mode=login" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white" prefetch={false}>
                                Entrar
                            </Link>
                            <Link href="/entrar?mode=signup" prefetch={false}>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20">
                                    Criar Conta
                                </Button>
                            </Link>
                        </>
                    )}

                    {/* Mobile Menu Trigger */}
                    <Button variant="ghost" size="icon" className="md:hidden text-slate-300">
                        <Menu className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </nav>
    );
}
