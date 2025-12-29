'use client';

import { cn } from "@/lib/utils";
import { LotteryConfig, SOCCER_TEAMS } from "@/lib/config/lotteries";

interface VolanteGridProps {
    config: LotteryConfig;
    selectedNumbers: string[];
    onToggle: (num: string) => void;
    maxSelection: number;
    // Extras (Trevos/Months)
    selectedExtras: string[];
    onToggleExtra: (num: string) => void;
    maxExtra: number;
}

export function VolanteGrid({
    config,
    selectedNumbers,
    onToggle,
    maxSelection,
    selectedExtras,
    onToggleExtra,
    maxExtra
}: VolanteGridProps) {

    // Main Numbers Grid
    const numbers = Array.from({ length: config.range }, (_, i) =>
        String(i + 1).padStart(2, '0')
    );

    // Extra Numbers Grid logic
    const hasExtras = config.extraType !== 'none';
    let extras: string[] = [];

    if (config.extraType === 'trevos') {
        extras = Array.from({ length: config.extraRange || 6 }, (_, i) => String(i + 1));
    } else if (config.extraType === 'months') {
        // We use indices 00-11 for logic, but display names
        extras = Array.from({ length: 12 }, (_, i) => String(i + 1));
    } else if (config.extraType === 'teams') {
        // Timemania: Teams 1-80
        extras = Array.from({ length: config.extraRange || 80 }, (_, i) => String(i + 1));
    }

    let gridCols = "grid-cols-10";
    if (config.range === 25) gridCols = "grid-cols-5";
    if (config.range === 50) gridCols = "grid-cols-10";
    if (config.range === 31) gridCols = "grid-cols-7";
    if (config.range === 9) gridCols = "grid-cols-3";

    const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

    return (
        <div className="space-y-6">
            {/* MAIN GRID */}
            <div className="relative group rounded-3xl overflow-hidden shadow-2xl transition-all hover:shadow-emerald-900/10">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl z-0"></div>
                <div className="absolute -inset-1 bg-gradient-to-br from-white/5 to-white/0 rounded-3xl z-0 pointer-events-none border border-white/10"></div>

                <div className="relative z-10 border-b border-white/5 p-5 flex justify-between items-center bg-black/20">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: config.hexColor }}></span>
                            Volante Principal
                        </span>
                    </div>
                    <div className="text-xs font-medium text-slate-400">
                        <span className={cn("text-white font-bold text-sm", selectedNumbers.length === maxSelection ? "text-emerald-400" : "")}>{selectedNumbers.length}</span> <span className="text-slate-600">/</span> <span className="text-white font-bold">{maxSelection}</span>
                    </div>
                </div>

                <div className="relative z-10 p-6 md:p-8 bg-gradient-to-b from-transparent to-black/20">
                    <div className={cn("grid gap-3 place-content-center", gridCols)}>
                        {numbers.map((num) => {
                            const isSelected = selectedNumbers.includes(num);
                            const isLimitReached = selectedNumbers.length >= maxSelection && !isSelected;

                            return (
                                <button
                                    key={num}
                                    onClick={() => onToggle(num)}
                                    disabled={isLimitReached}
                                    style={{
                                        backgroundColor: isSelected ? config.hexColor : undefined,
                                        borderColor: isSelected ? config.hexColor : undefined,
                                        color: isSelected && config.lightText ? '#000' : undefined, // Accessibility Fix
                                        boxShadow: isSelected ? `0 0 15px -3px ${config.hexColor}80` : undefined
                                    }}
                                    className={cn(
                                        "w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border",
                                        isSelected
                                            ? "text-white scale-110 z-10"
                                            : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white hover:border-slate-500",
                                        isLimitReached && "opacity-30 grayscale cursor-not-allowed scale-90"
                                    )}
                                >
                                    {num}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* EXTRA GRID (Trevos / Months / Teams) */}
            {hasExtras && (
                <div className="relative group rounded-3xl overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl z-0"></div>
                    <div className="relative z-10 border-b border-white/5 p-5 flex justify-between items-center bg-black/20">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: config.hexColor }}></span>
                            {config.extraName || 'Extras'}
                        </span>
                        <div className="text-xs font-medium text-slate-400">
                            <span className={cn("text-white font-bold text-sm", selectedExtras.length === maxExtra ? "text-yellow-400" : "")}>{selectedExtras.length}</span> <span className="text-slate-600">/</span> <span className="text-white font-bold">{maxExtra}</span>
                        </div>
                    </div>

                    <div className="relative z-10 p-6">
                        {/* Teams Grid (Timemania) often large list */}
                        <div className={cn("flex flex-wrap gap-4 justify-center", config.extraType === 'teams' ? "h-64 overflow-y-auto content-start" : "")}>
                            {extras.map((num, idx) => {
                                const isSelected = selectedExtras.includes(num);
                                const isLimitReached = selectedExtras.length >= maxExtra && !isSelected;
                                const label = config.extraType === 'months'
                                    ? months[idx]
                                    : (config.extraType === 'teams' ? (SOCCER_TEAMS[idx] || `Time ${num}`) : num);

                                return (
                                    <button
                                        key={num}
                                        onClick={() => onToggleExtra(num)}
                                        disabled={isLimitReached}
                                        className={cn(
                                            "flex items-center justify-center font-bold transition-all duration-300 border",
                                            config.extraType === 'months' ? "w-16 h-10 rounded-lg text-xs"
                                                : config.extraType === 'teams' ? "px-4 py-2 rounded-lg text-xs min-w-[100px]"
                                                    : "w-10 h-10 rounded-full text-sm",

                                            isSelected
                                                ? "bg-yellow-500 border-yellow-500 text-black shadow-[0_0_15px_-3px_rgba(234,179,8,0.5)] scale-105 font-black"
                                                : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white",
                                            isLimitReached && "opacity-30 cursor-not-allowed"
                                        )}
                                    >
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
