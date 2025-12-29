'use client';

import { useEffect, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Card } from '@/components/ui/card';
import { LotteryConfig } from '@/lib/config/lotteries';
import { cn } from '@/lib/utils';
import { TrendingUp, Award, Loader2, Database } from 'lucide-react';
import { getGameStats, StatsData } from '@/actions/get-game-stats';

interface LotteryStatsProps {
    config: LotteryConfig;
    quantity: number;
}

export function LotteryStats({ config, quantity }: LotteryStatsProps) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Buscar dados reais do Firebase
    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            setError(null);
            try {
                const data = await getGameStats(config.slug, 100);
                setStats(data);
                if (!data) {
                    setError('Sem dados históricos. Execute o scraping primeiro.');
                }
            } catch (e) {
                setError('Erro ao carregar estatísticas');
            }
            setLoading(false);
        }
        fetchStats();
    }, [config.slug]);

    const prob = calculateProbability(config.range, quantity, config.slug);

    // Preparar dados para o gráfico
    const chartData = stats?.frequencia.slice(0, 10).map(f => ({
        number: f.number,
        frequency: f.frequency
    })) || [];

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
                        Números Quentes (Últimos {stats?.totalConcursos || 100})
                    </h3>
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                    {stats && (
                        <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            Dados reais
                        </span>
                    )}
                </div>

                {error ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                        {error}
                    </div>
                ) : loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                    </div>
                ) : chartData.length > 0 ? (
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveBar
                            data={chartData}
                            keys={['frequency']}
                            indexBy="number"
                            margin={{ top: 10, right: 10, bottom: 40, left: 0 }}
                            padding={0.3}
                            valueScale={{ type: 'linear' }}
                            indexScale={{ type: 'band', round: true }}
                            colors={[config.hexColor]}
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
                            ariaLabel="Frequência dos números mais sorteados"
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
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                        Nenhum dado disponível
                    </div>
                )}
            </Card>

            {/* Cold Numbers / Par-Ímpar */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-2">Mais Atrasados</div>
                    <div className="flex gap-2 flex-wrap">
                        {(stats?.menosFrequentes || []).slice(0, 5).map(n => (
                            <div key={n} className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold">
                                {n}
                            </div>
                        ))}
                        {!stats && (
                            <span className="text-xs text-slate-600">Carregando...</span>
                        )}
                    </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-2">Par/Ímpar (Médio)</div>
                    <div className="flex items-center gap-2 h-8">
                        <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                                className="bg-blue-500 transition-all"
                                style={{ width: `${stats?.parImpar.pares || 50}%` }}
                            ></div>
                            <div
                                className="bg-pink-500 transition-all"
                                style={{ width: `${stats?.parImpar.impares || 50}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>{stats?.parImpar.pares || 50}% Par</span>
                        <span>{stats?.parImpar.impares || 50}% Ímpar</span>
                    </div>
                </div>
            </div>

            {/* Últimos Resultados */}
            {stats && stats.ultimosResultados.length > 0 && (
                <Card className="bg-slate-900/50 border-slate-800 p-4">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
                        Últimos Resultados
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {stats.ultimosResultados.slice(0, 5).map((resultado) => (
                            <div
                                key={resultado.concurso}
                                className="flex items-center gap-3 p-2 bg-slate-950 rounded-lg"
                            >
                                <div className="text-xs text-slate-500 w-16">
                                    #{resultado.concurso}
                                </div>
                                <div className="flex gap-1 flex-wrap flex-1">
                                    {resultado.dezenas.map((d, i) => (
                                        <span
                                            key={i}
                                            className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center"
                                            style={{ backgroundColor: config.hexColor + '40', color: config.hexColor }}
                                        >
                                            {d}
                                        </span>
                                    ))}
                                </div>
                                {resultado.acumulado && (
                                    <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                                        ACUM
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
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
    let drawSize = 6;
    if (slug === 'lotofacil') drawSize = 15;
    if (slug === 'quina') drawSize = 5;
    if (slug === 'lotomania') drawSize = 20;
    if (slug === 'timemania') drawSize = 7;

    if (quantity < drawSize) return "---";

    const totalCombos = combinations(range, drawSize);
    const playerCombos = combinations(quantity, drawSize);

    const chance = Math.round(totalCombos / playerCombos);
    return new Intl.NumberFormat('pt-BR').format(chance);
}

function calculateMultiplier(min: number, current: number): string {
    if (current === min) return "1";
    const multiplier = combinations(current, min);
    return new Intl.NumberFormat('pt-BR').format(multiplier);
}
