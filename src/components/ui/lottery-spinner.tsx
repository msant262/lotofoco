'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';

export function LotterySpinner({ size = 80 }: { size?: number }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Animate the spinner rotation
        anime({
            targets: '.lottery-spinner-circle',
            rotate: 360,
            duration: 2000,
            easing: 'linear',
            loop: true
        });

        // Animate the color segments
        anime({
            targets: '.lottery-segment',
            scale: [0.95, 1.05, 0.95],
            duration: 1500,
            easing: 'easeInOutQuad',
            loop: true,
            delay: anime.stagger(200)
        });
    }, []);

    const colors = [
        '#10b981', // Mega-Sena (green)
        '#8b5cf6', // Lotofácil (purple)
        '#f59e0b', // Quina (amber)
        '#ef4444', // Lotomania (red)
        '#06b6d4', // Timemania (cyan)
        '#ec4899'  // +Milionária (pink)
    ];

    const segmentAngle = 360 / colors.length;

    return (
        <div ref={containerRef} className="flex flex-col items-center justify-center gap-4">
            <div
                className="lottery-spinner-circle relative"
                style={{ width: size, height: size }}
            >
                {colors.map((color, index) => {
                    const rotation = segmentAngle * index;
                    return (
                        <div
                            key={index}
                            className="lottery-segment absolute inset-0"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                transformOrigin: 'center'
                            }}
                        >
                            <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                                style={{
                                    width: size / 6,
                                    height: size / 6,
                                    backgroundColor: color,
                                    boxShadow: `0 0 20px ${color}80`
                                }}
                            />
                        </div>
                    );
                })}

                {/* Center circle */}
                <div
                    className="absolute inset-0 m-auto bg-slate-950 rounded-full border-2 border-white/10"
                    style={{
                        width: size / 2.5,
                        height: size / 2.5
                    }}
                />
            </div>

            <div className="text-center">
                <p className="text-sm font-bold text-white animate-pulse">
                    Carregando seus dados...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                    Analisando estatísticas
                </p>
            </div>
        </div>
    );
}
