'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';

interface ChartContainerProps {
    children: ReactNode;
    height: number;
    className?: string;
}

/**
 * A wrapper component that ensures Nivo charts only render when the container
 * has valid dimensions. This prevents react-spring animation errors caused by
 * undefined x,y values during the initial render when container size is 0.
 */
export function ChartContainer({ children, height, className = '' }: ChartContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Use requestAnimationFrame to ensure the container has been painted
        const checkSize = () => {
            if (containerRef.current) {
                const { width } = containerRef.current.getBoundingClientRect();
                if (width > 0) {
                    setIsReady(true);
                } else {
                    // If not ready, check again on next frame
                    requestAnimationFrame(checkSize);
                }
            }
        };

        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(() => {
            requestAnimationFrame(checkSize);
        }, 50);

        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ height, minHeight: height, width: '100%' }}
        >
            {isReady ? children : (
                <div className="h-full w-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
