'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

export function HeroAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Generate random numbers
        const container = containerRef.current;
        const numElements = 30; // Number of floating balls
        container.innerHTML = ''; // Clear

        for (let i = 0; i < numElements; i++) {
            const el = document.createElement('div');
            el.classList.add('absolute', 'text-slate-700', 'font-mono', 'text-sm', 'opacity-20', 'select-none');
            el.innerText = Math.floor(Math.random() * 60 + 1).toString().padStart(2, '0');
            // Random position
            el.style.left = `${Math.random() * 100}%`;
            el.style.top = `${Math.random() * 100}%`;
            container.appendChild(el);
        }

        // Animate them
        anime({
            targets: container.children,
            translateX: () => anime.random(-50, 50),
            translateY: () => anime.random(-50, 50),
            scale: () => anime.random(0.8, 1.2),
            opacity: [0.1, 0.3],
            duration: () => anime.random(2000, 4000),
            delay: () => anime.random(0, 1000),
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutQuad'
        });

    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden pointer-events-none z-0"
            aria-hidden="true"
        />
    );
}
