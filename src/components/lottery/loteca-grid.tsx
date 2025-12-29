'use client';

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LotteryConfig } from "@/lib/config/lotteries";

interface LotecaGridProps {
    config: LotteryConfig;
    selectedOutcomes: Record<number, string>; // { 1: 'col1', 2: 'middle' } etc
    onToggle: (matchIndex: number, outcome: string) => void;
}

export function LotecaGrid({ config, selectedOutcomes, onToggle }: LotecaGridProps) {
    // 14 Matches
    const matches = Array.from({ length: 14 }, (_, i) => i + 1);

    return (
        <div className="space-y-6">
            <div className="relative group rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl z-0"></div>
                <div className="relative z-10 border-b border-white/5 p-5 flex justify-between items-center bg-black/20">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: config.hexColor }}></span>
                        Programação da Rodada
                    </span>
                    <div className="text-xs font-medium text-slate-400">
                        <span className="text-white font-bold">{Object.keys(selectedOutcomes).length}</span> / 14 Jogos
                    </div>
                </div>

                <div className="relative z-10 p-0 md:p-0">
                    {matches.map((match) => {
                        const current = selectedOutcomes[match];
                        return (
                            <div key={match} className="flex items-center justify-between p-4 border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                {/* Match Number */}
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                    {match}
                                </div>

                                {/* Teams (Mock) */}
                                <div className="flex-1 px-4 flex justify-between items-center text-sm font-medium text-slate-300">
                                    <span className="w-1/3 text-right">Time A</span>
                                    <span className="text-slate-600 text-xs">VS</span>
                                    <span className="w-1/3 text-left">Time B</span>
                                </div>

                                {/* Outcomes: 1 (Win A) | X (Draw) | 2 (Win B) */}
                                <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
                                    {[
                                        { key: 'col1', label: '1' },
                                        { key: 'middle', label: 'X' },
                                        { key: 'col2', label: '2' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.key}
                                            onClick={() => onToggle(match, opt.key)}
                                            className={cn(
                                                "w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all",
                                                current === opt.key
                                                    ? "bg-white text-black shadow-lg scale-105"
                                                    : "bg-transparent text-slate-600 hover:bg-slate-800 hover:text-slate-300"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
