'use client';

import React, { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

interface PredictionRevealProps {
    numbers: string[]; // e.g., ["05", "12", "33", ...]
    isRevealing: boolean;
}

export function PredictionReveal({ numbers, isRevealing }: PredictionRevealProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isRevealing && numbers.length > 0) {
            // 1. Reset opacity
            anime.set('.slot-ball', { opacity: 1, translateY: -50, scale: 0.5 });

            // 2. Animate appearance (Drop in)
            anime({
                targets: '.slot-ball',
                translateY: 0,
                scale: 1,
                opacity: 1,
                duration: 800,
                delay: anime.stagger(150), // Sequence
                easing: 'easeOutBounce'
            });

            // 3. Counter/Slot effect
            // We'll select the inner text elements
            const elements = document.querySelectorAll('.slot-ball-text');
            elements.forEach((el, index) => {
                const targetVal = parseInt(numbers[index]);
                const obj = { value: 0 };

                anime({
                    targets: obj,
                    value: targetVal,
                    round: 1, // Integers
                    duration: 1500,
                    delay: index * 150, // Sync with drop
                    easing: 'easeInOutQuad',
                    update: function () {
                        el.innerHTML = obj.value.toString().padStart(2, '0');
                    }
                });
            });
        }
    }, [isRevealing, numbers]);

    if (numbers.length === 0) return null;

    return (
        <div ref={containerRef} className="flex flex-wrap gap-4 justify-center py-12">
            {numbers.map((num, i) => (
                <div key={i} className="slot-ball relative group">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full blur opacity-40 group-hover:opacity-75 transition-opacity duration-300"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/50 flex items-center justify-center shadow-2xl">
                        <span className="slot-ball-text text-3xl font-bold bg-gradient-to-b from-emerald-300 to-emerald-500 bg-clip-text text-transparent font-mono">
                            {isRevealing ? '00' : num}
                        </span>
                    </div>
                    {/* Shine effect */}
                    <div className="absolute top-2 left-4 w-6 h-3 bg-white/10 rounded-full -rotate-12"></div>
                </div>
            ))}
        </div>
    );
}
