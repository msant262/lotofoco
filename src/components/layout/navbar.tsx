'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';

export function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/60">
            <div className="container flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-90">
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-500/30">
                        <Target className="h-5 w-5 text-emerald-400" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        Loto<span className="text-emerald-400">Foco</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                    <Link href="#como-funciona" className="hover:text-emerald-400 transition-colors">Como Funciona</Link>
                    <Link href="/estatisticas" className="hover:text-emerald-400 transition-colors">Estatísticas</Link>
                    <Link href="#planos" className="hover:text-emerald-400 transition-colors">Planos</Link>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-4">
                    <Link href="#" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white">
                        Entrar
                    </Link>
                    <Link href="/pricing">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20">
                            Criar Conta
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
