'use client';

import { useState, useTransition } from 'react';
import { LotteryHeader } from '@/components/lottery/lottery-header';
import { LotteryBallGrid } from '@/components/lottery/lottery-ball-grid';
import { Button } from '@/components/ui/button';
import { generatePrediction } from '@/actions/generate-prediction';
import { Loader2, Save, Copy, Zap, Star } from 'lucide-react';

const MEGA_VIRADA_CONFIG = {
    slug: 'mega-sena', // Reusing mega logic
    name: 'Mega da Virada',
    range: 60,
    minBet: 6,
    maxBet: 20,
    color: 'from-yellow-400 to-yellow-600',
    accentColor: 'text-yellow-400',
    hexColor: '#D4AF37', // Gold
    layoutType: 'standard' as const
};

export default function MegaViradaPage() {
    const [quantity, setQuantity] = useState(6);
    const [prediction, setPrediction] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();
    const [hasRevealed, setHasRevealed] = useState(false);

    const handleGenerate = () => {
        setHasRevealed(false);
        setPrediction([]);
        startTransition(async () => {
            await new Promise(r => setTimeout(r, 1000));
            const result = await generatePrediction('demo-user', 'Mega da Virada', quantity, 0, []);
            if (result && result.numbers) {
                setPrediction(result.numbers);
                setHasRevealed(true);
            }
        });
    };

    return (
        <div className="min-h-screen bg-black text-yellow-50 font-sans pb-24 overflow-x-hidden">
            {/* Simple Navbar override or assume Layout provides one (but layout is global). Layout provides it. */}

            {/* Special Hero for Virada */}
            <div className="relative h-[60vh] flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center">
                <div className="absolute inset-0 bg-black/80"></div>
                <div className="relative z-10 text-center space-y-6 px-6">
                    <div className="inline-block p-4 rounded-full bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-md mb-4">
                        <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 animate-pulse" />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-700 tracking-tighter drop-shadow-2xl">
                        MEGA DA VIRADA
                    </h1>
                    <p className="text-2xl md:text-3xl font-light text-yellow-100/80">
                        O maior prêmio da história espera por você.
                    </p>
                    <div className="text-4xl md:text-6xl font-bold text-white mt-8 tabular-nums">
                        R$ 600.000.000,00
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto -mt-20 relative z-20 px-6">
                <div className="bg-zinc-900/90 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-8 shadow-2xl shadow-yellow-900/50">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white">Gerar Palpite Premium</h2>
                            <p className="text-zinc-400">Nossa IA analisou todos os sorteios de final de ano.</p>
                        </div>

                        <div className="flex items-center gap-4 bg-black/50 p-2 rounded-xl border border-zinc-800">
                            <button onClick={() => setQuantity(Math.max(6, quantity - 1))} className="w-10 h-10 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700">-</button>
                            <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                            <button onClick={() => setQuantity(Math.min(20, quantity + 1))} className="w-10 h-10 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700">+</button>
                        </div>
                    </div>

                    <div className="flex justify-center mb-12">
                        <Button
                            size="lg"
                            onClick={handleGenerate}
                            disabled={isPending}
                            className="w-full md:w-2/3 h-20 text-2xl font-bold rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:scale-105 transition-transform text-black shadow-[0_0_50px_-10px_rgba(234,179,8,0.5)] border-0"
                        >
                            {isPending ? 'Consultando Oráculo...' : 'Revelar Números da Sorte'}
                        </Button>
                    </div>

                    {/* Result Area */}
                    {(hasRevealed || isPending) && (
                        <div className="bg-black/40 rounded-2xl p-8 border border-yellow-500/10 min-h-[300px] flex flex-col items-center justify-center">
                            <LotteryBallGrid
                                config={MEGA_VIRADA_CONFIG}
                                numbers={prediction}
                                isRevealing={isPending}
                            />

                            {hasRevealed && (
                                <div className="mt-8 flex gap-4">
                                    <Button className="bg-zinc-800 hover:bg-zinc-700 text-white"><Copy className="mr-2 w-4 h-4" /> Copiar</Button>
                                    <Button className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/50"><Save className="mr-2 w-4 h-4" /> Salvar Palpite</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
