'use client';

import { LotteryConfig } from "@/lib/config/lotteries";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLotteryInfoClient } from "@/lib/firebase/games-client";

interface LotteryHeaderProps {
    config: LotteryConfig;
}

export function LotteryHeader({ config }: LotteryHeaderProps) {
    const [info, setInfo] = useState<{ prize: string; contest: string; date: string } | null>(null);

    useEffect(() => {
        getLotteryInfoClient(config.slug).then(data => {
            if (data) setInfo(data);
        });
    }, [config.slug]);

    const style = {
        '--lottery-color': config.hexColor,
    } as React.CSSProperties;

    return (
        <div
            className="relative w-full py-12 px-6 overflow-hidden shadow-2xl"
            style={{
                background: `linear-gradient(135deg, ${config.hexColor} 0%, #0f172a 100%)`
            }}
        >
            {/* Abstract Circles simulating Caixa identity */}
            <div className="absolute top-[-20%] right-[-10%] w-96 h-96 rounded-full opacity-10" style={{ background: config.hexColor }}></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 rounded-full opacity-10" style={{ background: config.hexColor }}></div>

            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-overlay"></div>

            <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link href="/" className="p-2 bg-black/20 rounded-full hover:bg-black/30 transition-colors backdrop-blur-sm border border-white/10">
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase drop-shadow-md flex items-center gap-3">
                            {/* Simulate Logo Ball */}
                            <span className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl bg-white text-[var(--lottery-color)] font-bold shadow-lg" style={style}>
                                {config.name.charAt(0)}
                            </span>
                            {config.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-3">
                            <Badge variant="outline" className="border-white/30 text-white bg-black/20 backdrop-blur-sm px-3 py-1">
                                Concurso {info ? info.contest : '...'}
                            </Badge>
                            <span className="text-white/80 text-sm font-medium">
                                {info ? `Sorteio: ${info.date}` : 'Carregando dados oficiais...'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-right w-full md:w-auto bg-black/20 p-5 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">
                        {info ? 'Prêmio Estimado' : 'Aguardando Caixa...'}
                    </p>
                    <p className="text-3xl md:text-5xl font-bold text-white tabular-nums drop-shadow-lg tracking-tight">
                        {info ? info.prize : '---'}
                    </p>
                </div>
            </div>
        </div>
    );
}
