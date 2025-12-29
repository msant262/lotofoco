'use client';

import { ResponsiveBar } from '@nivo/bar';
import { Card } from '@/components/ui/card';
import { LotteryConfig } from '@/lib/config/lotteries';
import { cn } from '@/lib/utils';
import { TrendingUp, Award, AlertCircle } from 'lucide-react';

interface LotteryStatsProps {
    config: LotteryConfig;
    quantity: number; // Current bet size (e.g. 6 numbers)
}

export function LotteryStats({ config, quantity }: LotteryStatsProps) {
    // Mock Data based on config range - In real app, fetch from DB
    const range = config.range;
    const data = Array.from({ length: 10 }, (_, i) => ({
        number: String(Math.floor(Math.random() * range) + 1).padStart(2, '0'),
        frequency: Math.floor(Math.random() * 200) + 50
    })).sort((a, b) => b.frequency - a.frequency);

    const prob = calculateProbability(config.range, quantity, config.slug);

    return (
        <div className="space-y-6 animate-fade-in-up delay-100">
            {/* Probability Card */}
            <Card className="bg-slate-900/50 border-slate-800 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Award className="w-24 h-24 text-emerald-500" />
                </div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Suas Chances</h3>
                <div className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tight">
                    1 em {prob}
                </div>
                <p className="text-emerald-400 text-sm font-medium">
                    Jogando com {quantity} números
                </p>

                {quantity > config.minBet && (
                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex gap-3 items-center">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs text-emerald-200">
                            Sua chance aumentou em <strong>{calculateMultiplier(config.minBet, quantity)}x</strong> em relação à aposta simples!
                        </span>
                    </div>
                )}
            </Card>

            {/* Hot Numbers Chart */}
            <Card className="bg-slate-900/50 border-slate-800 p-6 h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Números Quentes (Últimos 100)
                    </h3>
                </div>

                <div className="flex-1 w-full min-h-0">
                    <ResponsiveBar
                        data={data}
                        keys={['frequency']}
                        indexBy="number"
                        margin={{ top: 10, right: 10, bottom: 40, left: 0 }}
                        padding={0.3}
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={[config.hexColor]} // Use lottery brand color
                        borderRadius={4}
                        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                            tickSize: 0,
                            tickPadding: 12,
                            tickRotation: 0,
                            legend: '',
                            legendPosition: 'middle',
                            legendOffset: 32
                        }}
                        axisLeft={null}
                        enableGridY={false}
                        enableLabel={true}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor="#ffffff"
                        role="application"
                        ariaLabel="Nivo bar chart demo"
                        theme={{
                            text: { fill: '#94a3b8', fontSize: 11, fontFamily: 'inherit' },
                            tooltip: {
                                container: {
                                    background: '#0f172a',
                                    color: '#fff',
                                    fontSize: '12px',
                                    borderRadius: '8px',
                                    padding: '8px'
                                }
                            }
                        }}
                    />
                </div>
            </Card>

            {/* Cold Numbers / Alerts */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-2">Mais Atrasados</div>
                    <div className="flex gap-2">
                        {[13, 42, 0o5].map(n => (
                            <div key={n} className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold">
                                {n}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-2">Par/Ímpar (Médio)</div>
                    <div className="flex items-center gap-2 h-8">
                        <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden flex">
                            <div className="w-[50%] bg-blue-500"></div>
                            <div className="w-[50%] bg-pink-500"></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>50% Par</span>
                        <span>50% Ímpar</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple Combination Formula C(n, k)
function combinations(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    if (k > n / 2) k = n - k;

    let res = 1;
    for (let i = 1; i <= k; i++) {
        res = res * (n - i + 1) / i;
    }
    return Math.round(res);
}

function calculateProbability(range: number, quantity: number, slug: string): string {
    // Base draw size varies
    let drawSize = 6;
    if (slug === 'lotofacil') drawSize = 15;
    if (slug === 'quina') drawSize = 5;
    if (slug === 'lotomania') drawSize = 20; // You pick 50, but draw is 20. Prob logic is complex here.
    if (slug === 'timemania') drawSize = 7;

    // For simple lotteries (Mega, Quina, Dupla), chance is Combinations(Total, Draw) / Combinations(Bet, Draw)
    // Actually chance is 1 in C(Total, DrawSize) / C(Quantity, DrawSize)

    if (quantity < drawSize) return "---";

    const totalCombos = combinations(range, drawSize);
    const playerCombos = combinations(quantity, drawSize);

    const chance = Math.round(totalCombos / playerCombos);
    return new Intl.NumberFormat('pt-BR').format(chance);
}

function calculateMultiplier(min: number, current: number): string {
    // Very rough approximation of cost/odds increase
    // Real math involves analyzing the cost table
    if (current === min) return "1";
    // Example: Mega Sena 6 = 1 game. 7 = 7 games. 8 = 28 games.
    // It follows Combinations(Current, Min).
    const multiplier = combinations(current, min);
    return new Intl.NumberFormat('pt-BR').format(multiplier);
}
