'use client';

import { useEffect, useState, useRef } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ChartContainer } from '@/components/ui/chart-container';
import { LotteryConfig } from '@/lib/config/lotteries';
import { cn } from '@/lib/utils';
import { TrendingUp, Award, Loader2, Database, Flame, Snowflake, Hash, BarChart3, PieChart, History, Zap } from 'lucide-react';
import { getStatsClient, StatsData } from '@/lib/firebase/games-client';
import { Card, CardBody, CardHeader, Chip, Progress, Skeleton, Tabs, Tab, Tooltip } from '@heroui/react';
import anime from 'animejs';

interface LotteryStatsProps {
    config: LotteryConfig;
    quantity: number;
}

export function LotteryStats({ config, quantity }: LotteryStatsProps) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState('hot');
    const containerRef = useRef<HTMLDivElement>(null);
    const numbersRef = useRef<HTMLDivElement>(null);

    // Fetch data from Firebase
    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            setError(null);
            try {
                const data = await getStatsClient(config.slug, 100);
                setStats(data);
                if (!data) {
                    setError('Sem dados históricos. Execute o scraping primeiro.');
                }
            } catch {
                setError('Erro ao carregar estatísticas');
            }
            setLoading(false);
        }
        fetchStats();
    }, [config.slug]);

    // Animation on mount
    useEffect(() => {
        if (!loading && containerRef.current) {
            anime({
                targets: containerRef.current.querySelectorAll('.stat-card'),
                translateY: [30, 0],
                opacity: [0, 1],
                delay: anime.stagger(100),
                duration: 600,
                easing: 'easeOutExpo'
            });
        }
    }, [loading]);

    // Animate numbers when tab changes
    useEffect(() => {
        if (numbersRef.current) {
            anime({
                targets: numbersRef.current.querySelectorAll('.number-ball'),
                scale: [0, 1],
                opacity: [0, 1],
                delay: anime.stagger(30),
                duration: 400,
                easing: 'easeOutBack'
            });
        }
    }, [selectedTab, stats]);

    const prob = calculateProbability(config.range, quantity, config.slug);

    // Chart data - with validation to prevent react-spring errors
    const hotChartData = (stats?.frequencia || [])
        .slice(0, 10)
        .filter(f => f && f.number && typeof f.frequency === 'number' && !isNaN(f.frequency))
        .map(f => ({
            number: String(f.number),
            frequency: f.frequency
        }));

    const coldChartData = (stats?.menosFrequentes || [])
        .slice(0, 10)
        .filter(n => n !== undefined && n !== null)
        .map((n, i) => ({
            number: String(n),
            delay: i + 1
        }));

    // Pie chart data for par/impar - ensure values are valid numbers
    const paresValue = typeof stats?.parImpar?.pares === 'number' && !isNaN(stats.parImpar.pares)
        ? stats.parImpar.pares
        : 50;
    const imparesValue = typeof stats?.parImpar?.impares === 'number' && !isNaN(stats.parImpar.impares)
        ? stats.parImpar.impares
        : 50;

    const parityData = [
        { id: 'Par', value: paresValue, color: '#3b82f6' },
        { id: 'Ímpar', value: imparesValue, color: '#ec4899' }
    ];

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 rounded-2xl" />
                    <Skeleton className="h-24 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="bg-red-500/10 border-red-500/30">
                <CardBody className="text-center py-8">
                    <p className="text-red-400">{error}</p>
                </CardBody>
            </Card>
        );
    }

    return (
        <div ref={containerRef} className="space-y-6">
            {/* ========== PROBABILITY HERO CARD ========== */}
            <Card className="stat-card bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-white/10 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl"
                        style={{ background: config.hexColor }}
                    />
                </div>
                <CardBody className="relative z-10 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: `${config.hexColor}30` }}
                                >
                                    <Award className="w-5 h-5" style={{ color: config.hexColor }} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Suas Chances</p>
                                    <p className="text-xs text-slate-400">com {quantity} números</p>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl md:text-5xl font-black text-white">1</span>
                                <span className="text-2xl text-slate-500">em</span>
                                <span
                                    className="text-4xl md:text-5xl font-black"
                                    style={{ color: config.hexColor }}
                                >
                                    {prob}
                                </span>
                            </div>
                        </div>

                        <Chip
                            size="lg"
                            variant="flat"
                            className="bg-emerald-500/20 text-emerald-400 font-bold"
                            startContent={<Database className="w-4 h-4" />}
                        >
                            {stats?.totalConcursos || 100} sorteios
                        </Chip>
                    </div>

                    {quantity > config.minBet && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-emerald-300 font-bold">
                                    {calculateMultiplier(config.minBet, quantity)}x mais chances!
                                </p>
                                <p className="text-xs text-emerald-400/70">
                                    Em relação à aposta simples de {config.minBet} números
                                </p>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* ========== STATS TABS ========== */}
            <Card className="stat-card bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-white/10">
                <CardHeader className="px-6 pt-6 pb-0">
                    <Tabs
                        selectedKey={selectedTab}
                        onSelectionChange={(key) => setSelectedTab(String(key))}
                        color="warning"
                        variant="underlined"
                        classNames={{
                            tabList: "gap-6",
                            cursor: "bg-gradient-to-r from-orange-500 to-red-500",
                            tab: "text-slate-400 data-[selected=true]:text-white font-bold",
                            tabContent: "group-data-[selected=true]:text-white"
                        }}
                    >
                        <Tab
                            key="hot"
                            title={
                                <div className="flex items-center gap-2">
                                    <Flame className="w-4 h-4" />
                                    <span>Quentes</span>
                                </div>
                            }
                        />
                        <Tab
                            key="cold"
                            title={
                                <div className="flex items-center gap-2">
                                    <Snowflake className="w-4 h-4" />
                                    <span>Frios</span>
                                </div>
                            }
                        />
                        <Tab
                            key="parity"
                            title={
                                <div className="flex items-center gap-2">
                                    <PieChart className="w-4 h-4" />
                                    <span>Par/Ímpar</span>
                                </div>
                            }
                        />
                    </Tabs>
                </CardHeader>

                <CardBody className="p-6">
                    <div ref={numbersRef}>
                        {/* Hot Numbers */}
                        {selectedTab === 'hot' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3 mb-6">
                                    {stats?.frequencia.slice(0, 10).map((f, i) => (
                                        <Tooltip
                                            key={f.number}
                                            content={`${f.frequency} aparições`}
                                            placement="top"
                                        >
                                            <div
                                                className="number-ball w-14 h-14 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110"
                                                style={{
                                                    background: `linear-gradient(135deg, ${config.hexColor} 0%, ${config.hexColor}80 100%)`,
                                                    boxShadow: `0 4px 20px ${config.hexColor}40`
                                                }}
                                            >
                                                <span className={cn(
                                                    "text-lg font-black",
                                                    config.lightText ? "text-black" : "text-white"
                                                )}>
                                                    {f.number}
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] font-bold opacity-70",
                                                    config.lightText ? "text-black" : "text-white"
                                                )}>
                                                    #{i + 1}
                                                </span>
                                            </div>
                                        </Tooltip>
                                    ))}
                                </div>

                                {hotChartData.length > 0 && (
                                    <ChartContainer height={200}>
                                        <ResponsiveBar
                                            data={hotChartData}
                                            keys={['frequency']}
                                            indexBy="number"
                                            margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
                                            padding={0.3}
                                            valueScale={{ type: 'linear' }}
                                            indexScale={{ type: 'band', round: true }}
                                            colors={[config.hexColor]}
                                            borderRadius={6}
                                            animate={true}
                                            motionConfig="gentle"
                                            axisTop={null}
                                            axisRight={null}
                                            axisBottom={{
                                                tickSize: 0,
                                                tickPadding: 12,
                                                legend: 'Número',
                                                legendPosition: 'middle',
                                                legendOffset: 32
                                            }}
                                            axisLeft={{
                                                tickSize: 0,
                                                tickPadding: 8,
                                                legend: 'Freq.',
                                                legendPosition: 'middle',
                                                legendOffset: -35
                                            }}
                                            enableGridY={true}
                                            gridYValues={5}
                                            enableLabel={false}
                                            theme={{
                                                text: { fill: '#64748b', fontSize: 11 },
                                                grid: { line: { stroke: '#1e293b' } },
                                                tooltip: {
                                                    container: {
                                                        background: '#0f172a',
                                                        color: '#fff',
                                                        borderRadius: '8px',
                                                        padding: '12px'
                                                    }
                                                }
                                            }}
                                        />
                                    </ChartContainer>
                                )}
                            </div>
                        )}

                        {/* Cold Numbers */}
                        {selectedTab === 'cold' && (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-400 mb-4">
                                    Números que não aparecem há mais tempo:
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {stats?.menosFrequentes?.slice(0, 10).map((n, i) => (
                                        <div
                                            key={n}
                                            className="number-ball w-14 h-14 rounded-2xl flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/50 to-slate-900 border-2 border-blue-500/30 cursor-pointer transition-transform hover:scale-110"
                                        >
                                            <span className="text-lg font-black text-blue-400">{n}</span>
                                            <span className="text-[10px] font-bold text-blue-500/70">
                                                Frio
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Snowflake className="w-5 h-5 text-blue-400" />
                                        <div>
                                            <p className="text-sm text-blue-300 font-medium">
                                                Teoria do Atraso
                                            </p>
                                            <p className="text-xs text-blue-400/70">
                                                Números frios podem estar "devendo" uma aparição
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Parity Analysis */}
                        {selectedTab === 'parity' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ChartContainer height={200}>
                                    <ResponsivePie
                                        data={parityData}
                                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                        innerRadius={0.6}
                                        padAngle={2}
                                        cornerRadius={4}
                                        colors={{ datum: 'data.color' }}
                                        borderWidth={0}
                                        animate={true}
                                        motionConfig="gentle"
                                        enableArcLinkLabels={false}
                                        arcLabelsSkipAngle={10}
                                        arcLabelsTextColor="#ffffff"
                                        theme={{
                                            tooltip: {
                                                container: {
                                                    background: '#0f172a',
                                                    color: '#fff',
                                                    borderRadius: '8px'
                                                }
                                            }
                                        }}
                                    />
                                </ChartContainer>

                                <div className="space-y-4 flex flex-col justify-center">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                <span className="text-sm text-slate-300">Números Pares</span>
                                            </div>
                                            <span className="text-lg font-bold text-blue-400">
                                                {stats?.parImpar.pares || 50}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={stats?.parImpar.pares || 50}
                                            color="primary"
                                            className="h-2"
                                            aria-label="Porcentagem de números pares"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-pink-500" />
                                                <span className="text-sm text-slate-300">Números Ímpares</span>
                                            </div>
                                            <span className="text-lg font-bold text-pink-400">
                                                {stats?.parImpar.impares || 50}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={stats?.parImpar.impares || 50}
                                            color="secondary"
                                            className="h-2"
                                            aria-label="Porcentagem de números ímpares"
                                        />
                                    </div>

                                    <p className="text-xs text-slate-500 mt-4">
                                        Média baseada nos últimos {stats?.totalConcursos || 100} sorteios
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* ========== LAST RESULTS ========== */}
            {stats && stats.ultimosResultados.length > 0 && (
                <Card className="stat-card bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-white/10">
                    <CardHeader className="flex justify-between items-center px-6 pt-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <History className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Últimos Resultados</p>
                                <p className="text-xs text-slate-500">Sorteios recentes</p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardBody className="px-6 pb-6 pt-0">
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {stats.ultimosResultados.slice(0, 5).map((resultado, idx) => (
                                <div
                                    key={resultado.concurso}
                                    className="flex items-center gap-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors"
                                    style={{
                                        animationDelay: `${idx * 100}ms`
                                    }}
                                >
                                    <div className="text-center min-w-[60px]">
                                        <p className="text-xs text-slate-500">Concurso</p>
                                        <p className="text-sm font-bold text-white">#{resultado.concurso}</p>
                                    </div>

                                    <div className="flex gap-1.5 flex-wrap flex-1">
                                        {resultado.dezenas.map((d, i) => (
                                            <span
                                                key={i}
                                                className="w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center"
                                                style={{
                                                    backgroundColor: `${config.hexColor}25`,
                                                    color: config.hexColor
                                                }}
                                            >
                                                {d}
                                            </span>
                                        ))}
                                    </div>

                                    {resultado.acumulado && (
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            className="bg-yellow-500/20 text-yellow-400 font-bold"
                                        >
                                            ACUM
                                        </Chip>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}

// Utility functions
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
    if (slug === 'dia-de-sorte') drawSize = 7;
    if (slug === 'super-sete') drawSize = 7;

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
