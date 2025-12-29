'use client';

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LotteryConfig } from "@/lib/config/lotteries";
import { Check } from "lucide-react";

interface ManualSelectorProps {
    config: LotteryConfig;
    selectedNumbers: string[];
    onToggle: (num: string) => void;
    maxSelection: number;
}

export function ManualSelector({ config, selectedNumbers, onToggle, maxSelection }: ManualSelectorProps) {
    const numbers = Array.from({ length: config.range }, (_, i) =>
        String(i + 1).padStart(2, '0')
    );

    return (
        <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-300">Escolha seus números da sorte</h3>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    {selectedNumbers.length} / {maxSelection} Selecionados
                </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {numbers.map((num) => {
                    const isSelected = selectedNumbers.includes(num);
                    return (
                        <button
                            key={num}
                            onClick={() => onToggle(num)}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200",
                                isSelected
                                    ? "bg-emerald-500 text-white shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)] scale-110"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                            )}
                        >
                            {num}
                        </button>
                    )
                })}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
                * A Inteligência Artificial completará os números restantes automaticamente.
            </p>
        </div>
    );
}
