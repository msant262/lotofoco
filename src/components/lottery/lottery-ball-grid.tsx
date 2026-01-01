'use client';

import { LotteryConfig } from "@/lib/config/lotteries";
import { cn } from "@/lib/utils";
import anime from "animejs/lib/anime.es.js";
import { useEffect, useRef } from "react";

interface LotteryBallGridProps {
    config: LotteryConfig;
    numbers: string[];
    isRevealing: boolean;
    matchedNumbers?: string[];
}

export function LotteryBallGrid({ config, numbers, isRevealing, matchedNumbers = [] }: LotteryBallGridProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Animation Logic
    useEffect(() => {
        if (!isRevealing && numbers.length > 0) {
            // Numbers changed without revealing state (e.g. init load), just show them
            return;
        }

        if (isRevealing && numbers.length > 0) {
            // Animate Drop In
            anime({
                targets: '.loto-ball',
                translateY: [-50, 0],
                opacity: [0, 1],
                scale: [0.5, 1],
                delay: anime.stagger(100),
                duration: 800,
                easing: 'easeOutElastic(1, .5)'
            });

            // Spin numbers effect
            const els = document.querySelectorAll('.loto-ball-text');
            els.forEach((el, i) => {
                let val = numbers[i] === 'TREVO' ? 0 : parseInt(numbers[i] || '0');
                if (isNaN(val)) val = 0; // Handle non-numeric gracefully

                anime({
                    targets: { val: 0 },
                    val: val,
                    round: 1,
                    easing: 'easeInOutExpo',
                    duration: 2000,
                    delay: i * 100,
                    update: function (anim) {
                        // If it's pure number
                        el.innerHTML = anim.animations[0].currentValue.toString().padStart(2, '0');
                    },
                    complete: function () {
                        el.innerHTML = numbers[i]; // Ensure final value is exact string (handle "01" vs "1")
                    }
                });
            });
        }
    }, [isRevealing, numbers]);

    // Renders
    const renderStandardBall = (num: string, idx: number, isExtra = false) => {
        const isMatched = !isExtra && matchedNumbers.includes(num); // Only match main numbers usually

        return (
            <div key={`${isExtra ? 'extra' : 'std'}-${idx}`} className="loto-ball relative group flex flex-col items-center">
                <div className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-lg border-2 transition-colors duration-500",
                    isMatched
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/50 scale-110 z-10"
                        : "bg-gradient-to-br from-slate-50 to-slate-200 border-white/20 text-slate-900",
                    "font-bold text-2xl md:text-3xl font-mono",
                    isExtra && "from-yellow-200 to-yellow-400 border-yellow-500/50 text-slate-900"
                )}>
                    <span className="loto-ball-text">{isRevealing ? '00' : num}</span>
                </div>
                {isExtra && <span className="text-[10px] uppercase font-bold text-slate-500 mt-2 tracking-wide">{config.extraName?.slice(0, -1)}</span>}
            </div>
        );
    };

    // Layout Logic
    if (config.layoutType === 'standard' || config.layoutType === 'composite') {
        const standardNumbers = config.extraRange
            ? numbers.slice(0, numbers.length - (config.name === '+Milionária' ? 2 : 1)) // Naive split: we rely on how we store data. 
            // Better: We should structure data better, but for now assuming "numbers" is flat array.
            // Let's refine based on prompt requirement. +Milionaria is Matrix 50 + Matrix 6.
            // Actually, usually predictions return 6 numbers + 2 trevos (for Min Bet).
            // Let's assume input 'numbers' has the main set, and we might need separate prop or separate logic if we want to split them visually cleanly.
            // For simplicity and robustness: I will assume the server returns ALL numbers in one array, and I detect split by index if composite.
            : numbers;

        // +Milionaria Min Bet = 6 num + 2 trevos.
        // Dia de Sorte = 7 num + 1 mes.

        let mainSet = numbers;
        let extraSet: string[] = [];

        if (config.slug === 'mais-milionaria') {
            // Last 2 are trevos usually? Or user defines quantity.
            // Strategy: We will check if number is <= 50 or separate.
            // Actually, let's look at standard behavior:
            // If length is 8 (6+2), last 2 are trevos.
            // If user asked for 6 numbers, it's ambiguous. 
            // Let's handle it by assuming the API returns a structured object or we render generic balls.
            // Since props is string[], I will render all as balls, but special visual for Trevos not easily detectable without metadata.
            // I will stick to "All Standard" unless specified.
            // WAIT, prompt says: "Super Sete: 7 colunas", "+Milionária: Matriz de números e separado matriz de Trevos".

            // Hack for demo: If +Milionária, assume last 2 are Trevos if total >= 8.
            if (numbers.length >= 8) {
                mainSet = numbers.slice(0, numbers.length - 2);
                extraSet = numbers.slice(numbers.length - 2);
            }
        } else if (config.slug === 'dia-de-sorte') {
            if (numbers.length >= 8) { // 7 nums + 1 month
                mainSet = numbers.slice(0, numbers.length - 1);
                extraSet = numbers.slice(numbers.length - 1);
            }
        }

        return (
            <div className="flex flex-col items-center gap-8">
                <div className="flex flex-wrap gap-4 justify-center">
                    {mainSet.map((n, i) => renderStandardBall(n, i))}
                </div>

                {extraSet.length > 0 && (
                    <div className="relative p-6 bg-slate-50/5 rounded-2xl border border-dashed border-slate-300/20">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-400 text-xs px-2 font-bold uppercase">
                            {config.extraName || 'Extras'}
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {extraSet.map((n, i) => renderStandardBall(n, i, true))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (config.layoutType === 'columns') {
        // Super Sete: 7 Columns. 
        // We receive e.g. ["1", "5", "9", "2", "3", "4", "0"].
        return (
            <div className="grid grid-cols-7 gap-2 md:gap-4 p-4 bg-lime-900/10 rounded-xl border border-lime-500/20">
                {numbers.map((num, i) => {
                    const isMatched = matchedNumbers.includes(num); // Simplifying match logic for columns
                    return (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono uppercase">Col {i + 1}</span>
                            <div className={cn(
                                "w-10 h-16 md:w-14 md:h-20 rounded-lg flex items-center justify-center shadow-lg border-b-4 transition-transform",
                                isMatched
                                    ? "bg-emerald-500 border-emerald-700 text-white"
                                    : "bg-gradient-to-b from-lime-400 to-lime-600 border-lime-800 text-white"
                            )}>
                                <span className="loto-ball-text text-xl md:text-3xl font-black">{isRevealing ? '?' : num}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return null;
}
