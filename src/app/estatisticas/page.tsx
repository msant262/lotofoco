'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveBar } from '@nivo/bar';
import { LOTTERIES } from '@/lib/config/lotteries';
import { Loader2, Database, TrendingUp, TrendingDown, Filter, BarChart3, Calendar, Hash, ChevronDown, ChevronUp, Lock, Sparkles, Crown, Flame, Snowflake, Percent, Sigma, Layers, Target, X, Zap, Clock, Repeat, Trophy, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/lottery-utils';
import Link from 'next/link';
import { getStatsClient, getDrawDetailsClient, StatsData, DrawDetails } from '@/lib/firebase/games-client';

const GAMES = [
    { slug: 'mega-sena', name: 'Mega-Sena', color: '#209869' },
    { slug: 'lotofacil', name: 'Lotofácil', color: '#930089' },
    { slug: 'quina', name: 'Quina', color: '#260085' },
    { slug: 'lotomania', name: 'Lotomania', color: '#F78100' },
    { slug: 'timemania', name: 'Timemania', color: '#00ACC1' },
    { slug: 'dupla-sena', name: 'Dupla Sena', color: '#A61317' },
    { slug: 'dia-de-sorte', name: 'Dia de Sorte', color: '#CB8322' },
    { slug: 'super-sete', name: 'Super Sete', color: '#BEDC00' },
    { slug: 'mais-milionaria', name: '+Milionária', color: '#003758' },
];

export default function EstatisticasPage() {
    const [selectedGame, setSelectedGame] = useState('mega-sena');
    const [period, setPeriod] = useState(100);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [expandedConcurso, setExpandedConcurso] = useState<number | null>(null);
    const [drawDetails, setDrawDetails] = useState<DrawDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [isPremium, setIsPremium] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

    const currentGame = GAMES.find(g => g.slug === selectedGame);
    const config = LOTTERIES[selectedGame];

    // Fetch stats
    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            setError(null);
            try {
                // Using client-side SDK directly instead of Edge API
                const data = await getStatsClient(selectedGame, period);

                if (!data) setError('Sem dados históricos. Execute o scraping primeiro.');
                else setStats(data);
            } catch (e) {
                setError('Erro ao carregar estatísticas');
            }
            setLoading(false);
        }
        fetchStats();
    }, [selectedGame, period]);

    // Advanced stats
    const advancedStats = useMemo(() => {
        if (!stats) return null;

        const somas = stats.ultimosResultados.map(r => r.dezenas.reduce((acc, d) => acc + parseInt(d), 0));
        const somaMedia = Math.round(somas.reduce((a, b) => a + b, 0) / somas.length);
        const somaMin = Math.min(...somas);
        const somaMax = Math.max(...somas);

        const faixas: Record<string, number> = {};
        stats.ultimosResultados.forEach(r => {
            r.dezenas.forEach(d => {
                const num = parseInt(d);
                const faixa = `${Math.floor((num - 1) / 10) * 10 + 1}-${Math.floor((num - 1) / 10) * 10 + 10}`;
                faixas[faixa] = (faixas[faixa] || 0) + 1;
            });
        });

        const acumulados = stats.ultimosResultados.filter(r => r.acumulado).length;
        const taxaAcumulacao = Math.round((acumulados / stats.totalConcursos) * 100);

        let consecutivos = 0;
        stats.ultimosResultados.forEach(r => {
            const nums = r.dezenas.map(d => parseInt(d)).sort((a, b) => a - b);
            for (let i = 0; i < nums.length - 1; i++) if (nums[i + 1] - nums[i] === 1) consecutivos++;
        });
        const mediaConsecutivos = (consecutivos / stats.totalConcursos).toFixed(1);

        const pares: Record<string, number> = {};
        stats.ultimosResultados.forEach(r => {
            const nums = r.dezenas.sort();
            for (let i = 0; i < nums.length; i++) {
                for (let j = i + 1; j < nums.length; j++) {
                    pares[`${nums[i]}-${nums[j]}`] = (pares[`${nums[i]}-${nums[j]}`] || 0) + 1;
                }
            }
        });
        const topPares = Object.entries(pares).sort((a, b) => b[1] - a[1]).slice(0, 5);

        let repeticoes = 0;
        for (let i = 1; i < stats.ultimosResultados.length; i++) {
            const atual = stats.ultimosResultados[i].dezenas;
            const anterior = stats.ultimosResultados[i - 1].dezenas;
            repeticoes += atual.filter(d => anterior.includes(d)).length;
        }
        const mediaRepeticoes = (repeticoes / (stats.totalConcursos - 1)).toFixed(1);

        let maiorStreak = 0, streakAtual = 0;
        stats.ultimosResultados.forEach(r => {
            if (r.acumulado) { streakAtual++; maiorStreak = Math.max(maiorStreak, streakAtual); }
            else streakAtual = 0;
        });

        return { somaMedia, somaMin, somaMax, faixas, taxaAcumulacao, mediaConsecutivos, topPares, mediaRepeticoes, maiorStreak };
    }, [stats]);

    // Expand concurso handler
    const handleExpandConcurso = async (concurso: number) => {
        if (expandedConcurso === concurso) {
            setExpandedConcurso(null);
            setDrawDetails(null);
            return;
        }
        setExpandedConcurso(concurso);
        setLoadingDetails(true);
        try {
            // Use client SDK directly
            const details = await getDrawDetailsClient(selectedGame, concurso);
            setDrawDetails(details);
        } catch (e) {
            console.error('Error fetching draw details', e);
        }
        setLoadingDetails(false);
    };

    // Number details
    const getNumberDetails = (num: string) => {
        if (!stats) return null;
        const freq = stats.frequencia.find(f => f.number === num);
        const ranking = stats.frequencia.findIndex(f => f.number === num) + 1;
        const percentage = freq ? ((freq.frequency / stats.totalConcursos) * 100).toFixed(1) : '0';
        const ultimasAparicoes = stats.ultimosResultados.filter(r => r.dezenas.includes(num)).slice(0, 5);
        const atraso = stats.ultimosResultados.findIndex(r => r.dezenas.includes(num));

        const paresComEsseNumero: Record<string, number> = {};
        stats.ultimosResultados.forEach(r => {
            if (r.dezenas.includes(num)) r.dezenas.forEach(d => { if (d !== num) paresComEsseNumero[d] = (paresComEsseNumero[d] || 0) + 1; });
        });
        const topPares = Object.entries(paresComEsseNumero).sort((a, b) => b[1] - a[1]).slice(0, 5);

        return {
            numero: num, frequencia: freq?.frequency || 0, ranking, percentage,
            atraso: atraso === -1 ? stats.totalConcursos : atraso,
            ultimasAparicoes, topPares,
            isTop10: stats.maisFrequentes.includes(num),
            isBottom10: stats.menosFrequentes.includes(num)
        };
    };

    const numberDetails = selectedNumber ? getNumberDetails(selectedNumber) : null;

    // Chart data
    const chartData = stats?.frequencia.slice(0, 15).map(f => ({ number: f.number, frequency: f.frequency })) || [];
    const leastFrequentData = stats?.frequencia.slice(-10).reverse().map(f => ({ number: f.number, frequency: f.frequency })) || [];
    const maxFreq = stats?.frequencia[0]?.frequency || 1;
    const minFreq = stats?.frequencia[stats.frequencia.length - 1]?.frequency || 0;

    // Número mais sorteado (ranking #1)
    const topNumber = stats?.maisFrequentes[0];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-16">
            <div className="max-w-7xl mx-auto px-4 md:px-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2">Estatísticas</h1>
                        <p className="text-slate-400">Análise completa baseada em dados reais dos sorteios</p>
                    </div>
                    <button
                        onClick={() => setIsPremium(!isPremium)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all",
                            isPremium ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        )}
                    >
                        <Crown className="w-4 h-4" />
                        {isPremium ? 'Modo Premium Ativo' : 'Ativar Premium (Demo)'}
                    </button>
                </div>

                {/* Filters */}
                <Card className="bg-slate-900/50 border-slate-800 p-4 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 font-bold uppercase mb-2 block"><Filter className="w-3 h-3 inline mr-1" /> Loteria</label>
                            <div className="flex flex-wrap gap-2">
                                {GAMES.map((game) => (
                                    <button key={game.slug} onClick={() => setSelectedGame(game.slug)}
                                        className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all", selectedGame === game.slug ? "text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}
                                        style={selectedGame === game.slug ? { backgroundColor: game.color } : {}}>
                                        {game.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase mb-2 block"><Calendar className="w-3 h-3 inline mr-1" /> Período</label>
                            <div className="flex gap-2">
                                {[50, 100, 200, 500].map((p) => (
                                    <button key={p} onClick={() => setPeriod(p)}
                                        className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all", period === p ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Loading / Error */}
                {loading && <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>}
                {error && !loading && (
                    <div className="text-center py-20 text-slate-500">
                        <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{error}</p>
                        <p className="text-xs mt-2">Acesse /admin para sincronizar dados</p>
                    </div>
                )}

                {stats && !loading && (
                    <div className="space-y-8">

                        {/* FREE SECTION */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-bold">
                                <Sparkles className="w-4 h-4 text-emerald-500" /> Estatísticas Básicas (Grátis)
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="bg-slate-900/50 border-slate-800 p-4">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Concursos Analisados</div>
                                    <div className="text-3xl font-black text-white">{stats.totalConcursos}</div>
                                    <div className="text-xs text-slate-500 mt-1">Período de análise selecionado</div>
                                </Card>
                                <Card className="bg-slate-900/50 border-slate-800 p-4">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> Mais Sorteado</div>
                                    <div className="text-3xl font-black" style={{ color: currentGame?.color }}>{stats.maisFrequentes[0] || '-'}</div>
                                    <div className="text-xs text-slate-500 mt-1">Saiu {stats.frequencia[0]?.frequency || 0}x no período</div>
                                </Card>
                                <Card className="bg-slate-900/50 border-slate-800 p-4">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Proporção Par/Ímpar</div>
                                    <div className="text-xl font-bold text-white">{stats.parImpar.pares}% / {stats.parImpar.impares}%</div>
                                    <div className="h-2 bg-slate-800 rounded-full mt-2 overflow-hidden flex">
                                        <div className="bg-blue-500" style={{ width: `${stats.parImpar.pares}%` }}></div>
                                        <div className="bg-pink-500" style={{ width: `${stats.parImpar.impares}%` }}></div>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">Distribuição de pares e ímpares</div>
                                </Card>
                                <Card className="bg-slate-900/50 border-slate-800 p-4">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Snowflake className="w-3 h-3 text-blue-400" /> Menos Sorteado</div>
                                    <div className="text-3xl font-black text-blue-400">{stats.menosFrequentes[0] || '-'}</div>
                                    <div className="text-xs text-slate-500 mt-1">Saiu apenas {stats.frequencia[stats.frequencia.length - 1]?.frequency || 0}x</div>
                                </Card>
                            </div>

                            {/* Hot Numbers Chart */}
                            <Card className="bg-slate-900/50 border-slate-800 p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500" /> Top 15 - Números Mais Sorteados</h2>
                                    <span className="text-xs text-emerald-500 flex items-center gap-1"><Database className="w-3 h-3" /> Dados reais</span>
                                </div>
                                <p className="text-sm text-slate-500 mb-4">Os 15 números que mais apareceram nos últimos {stats.totalConcursos} sorteios</p>
                                <div className="h-[300px]">
                                    {chartData.length > 0 ? (
                                        <ResponsiveBar data={chartData} keys={['frequency']} indexBy="number"
                                            margin={{ top: 10, right: 20, bottom: 50, left: 50 }} padding={0.25}
                                            colors={[currentGame?.color || '#10b981']} borderRadius={4}
                                            axisTop={null} axisRight={null}
                                            axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                                            enableGridY={true} gridYValues={5} enableLabel={false}
                                            tooltip={({ indexValue, value }) => (
                                                <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg border border-slate-700">
                                                    <span className="font-bold">Número {indexValue}:</span> {value}x
                                                </div>
                                            )}
                                            theme={{ text: { fill: '#64748b', fontSize: 12 }, grid: { line: { stroke: '#1e293b' } } }}
                                        />
                                    ) : <div className="h-full flex items-center justify-center text-slate-500">Sem dados</div>}
                                </div>
                            </Card>
                        </div>

                        {/* PREMIUM SECTION */}
                        <div className="space-y-6 relative">
                            <div className="flex items-center gap-2 text-xs uppercase font-bold">
                                <Crown className="w-4 h-4 text-yellow-500" />
                                <span className="text-yellow-500">Estatísticas Avançadas</span>
                                {!isPremium && <span className="text-slate-500">(Premium)</span>}
                            </div>

                            {!isPremium && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm rounded-xl">
                                    <div className="text-center p-8">
                                        <Lock className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                                        <h3 className="text-xl font-bold text-white mb-2">Conteúdo Premium</h3>
                                        <p className="text-slate-400 mb-4 max-w-sm">Análises avançadas, padrões estatísticos, pares frequentes e muito mais</p>
                                        <Link href="/pricing"><Button className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold">Ver Planos</Button></Link>
                                    </div>
                                </div>
                            )}

                            <div className={cn("space-y-6", !isPremium && "opacity-30 pointer-events-none")}>

                                {/* Premium Stats Grid */}
                                {advancedStats && (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <Card className="bg-slate-900/50 border-slate-800 p-4">
                                            <div className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1 mb-1"><Sigma className="w-3 h-3 text-purple-400" /> Soma Média</div>
                                            <div className="text-2xl font-black text-purple-400">{advancedStats.somaMedia}</div>
                                            <div className="text-xs text-slate-500 mt-1">Soma dos números sorteados</div>
                                        </Card>
                                        <Card className="bg-slate-900/50 border-slate-800 p-4">
                                            <div className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1 mb-1"><Percent className="w-3 h-3 text-amber-400" /> Taxa Acumulação</div>
                                            <div className="text-2xl font-black text-amber-400">{advancedStats.taxaAcumulacao}%</div>
                                            <div className="text-xs text-slate-500 mt-1">Sorteios sem ganhador</div>
                                        </Card>
                                        <Card className="bg-slate-900/50 border-slate-800 p-4">
                                            <div className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1 mb-1"><Layers className="w-3 h-3 text-cyan-400" /> Consecutivos</div>
                                            <div className="text-2xl font-black text-cyan-400">{advancedStats.mediaConsecutivos}</div>
                                            <div className="text-xs text-slate-500 mt-1">Números seguidos por sorteio</div>
                                        </Card>
                                        <Card className="bg-slate-900/50 border-slate-800 p-4">
                                            <div className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1 mb-1"><Repeat className="w-3 h-3 text-pink-400" /> Repetições</div>
                                            <div className="text-2xl font-black text-pink-400">{advancedStats.mediaRepeticoes}</div>
                                            <div className="text-xs text-slate-500 mt-1">Repetem do sorteio anterior</div>
                                        </Card>
                                        <Card className="bg-slate-900/50 border-slate-800 p-4">
                                            <div className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1 mb-1"><Zap className="w-3 h-3 text-red-400" /> Maior Seca</div>
                                            <div className="text-2xl font-black text-red-400">{advancedStats.maiorStreak}</div>
                                            <div className="text-xs text-slate-500 mt-1">Acumulados consecutivos</div>
                                        </Card>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                    {/* Frequency Heatmap */}
                                    <Card className="bg-slate-900/50 border-slate-800 p-5 lg:col-span-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                                <Hash className="w-5 h-5 text-purple-400" /> Mapa de Frequência
                                            </h2>
                                        </div>
                                        <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                                            <Info className="w-3 h-3" /> Clique em qualquer número para ver análise detalhada. Cores mais intensas = mais sorteados.
                                        </p>
                                        <div className="grid grid-cols-10 gap-2.5">
                                            {Array.from({ length: config?.range || 60 }, (_, i) => {
                                                const num = String(i + 1).padStart(2, '0');
                                                const freq = stats.frequencia.find(f => f.number === num)?.frequency || 0;
                                                const intensity = minFreq === maxFreq ? 0.5 : (freq - minFreq) / (maxFreq - minFreq);
                                                const isTop10 = stats.maisFrequentes.includes(num);
                                                const isBottom10 = stats.menosFrequentes.includes(num);
                                                const isTop1 = num === topNumber;

                                                // Cores específicas por loteria para melhor visibilidade
                                                const heatmapColors: Record<string, { bg: string; text: string }> = {
                                                    'mega-sena': { bg: '16, 185, 129', text: '#fff' },      // emerald-500
                                                    'lotofacil': { bg: '192, 38, 211', text: '#fff' },      // fuchsia-600
                                                    'quina': { bg: '99, 102, 241', text: '#fff' },          // indigo-500
                                                    'lotomania': { bg: '249, 115, 22', text: '#fff' },      // orange-500
                                                    'timemania': { bg: '6, 182, 212', text: '#000' },       // cyan-500
                                                    'dupla-sena': { bg: '244, 63, 94', text: '#fff' },      // rose-500
                                                    'dia-de-sorte': { bg: '245, 158, 11', text: '#000' },   // amber-500
                                                    'super-sete': { bg: '132, 204, 22', text: '#000' },     // lime-500
                                                    'mais-milionaria': { bg: '14, 165, 233', text: '#fff' } // sky-500
                                                };
                                                const colorConfig = heatmapColors[selectedGame] || { bg: '16, 185, 129', text: '#fff' };

                                                // #1 Ranking tem tratamento especial
                                                if (isTop1) {
                                                    return (
                                                        <div key={num} onClick={() => setSelectedNumber(num)}
                                                            className="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer relative bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 ring-4 ring-yellow-300 shadow-xl shadow-yellow-500/50 animate-pulse hover:animate-none hover:scale-110 transition-transform">
                                                            <Trophy className="absolute -top-2.5 -right-2.5 w-6 h-6 text-yellow-200 drop-shadow-lg" />
                                                            <span className="text-lg font-black text-white drop-shadow-md">{num}</span>
                                                            <span className="text-[10px] font-bold text-white/90">{freq}x</span>
                                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-black bg-yellow-600 text-white px-1.5 py-0.5 rounded-full">#1</span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={num} onClick={() => setSelectedNumber(num)}
                                                        className={cn(
                                                            "aspect-square rounded-lg flex flex-col items-center justify-center transition-all hover:scale-110 cursor-pointer relative",
                                                            isTop10 && "ring-[3px] ring-orange-400 shadow-md shadow-orange-500/30",
                                                            isBottom10 && "ring-[3px] ring-blue-400 shadow-md shadow-blue-500/30",
                                                            !isTop10 && !isBottom10 && "ring-1 ring-white/10",
                                                            selectedNumber === num && "ring-[3px] ring-white"
                                                        )}
                                                        style={{ backgroundColor: `rgba(${colorConfig.bg}, ${0.25 + intensity * 0.75})` }}>
                                                        <span className="text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{num}</span>
                                                        <span className="text-[9px] text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{freq}x</span>
                                                        {isTop10 && <Flame className="absolute -top-1 -right-1 w-3.5 h-3.5 text-orange-400" />}
                                                        {isBottom10 && <Snowflake className="absolute -top-1 -right-1 w-3.5 h-3.5 text-blue-400" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-6 mt-4 text-sm">
                                            <span className="flex items-center gap-2 text-yellow-400 font-bold"><Trophy className="w-4 h-4" /> #1 Mais Sorteado</span>
                                            <span className="flex items-center gap-2 text-orange-400"><Flame className="w-4 h-4" /> Top 10 Quentes</span>
                                            <span className="flex items-center gap-2 text-blue-400"><Snowflake className="w-4 h-4" /> Top 10 Frios</span>
                                        </div>
                                    </Card>

                                    {/* Distribution by Range */}
                                    {advancedStats && (
                                        <Card className="bg-slate-900/50 border-slate-800 p-5">
                                            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                                                <BarChart3 className="w-5 h-5 text-cyan-400" /> Faixas Numéricas
                                            </h2>
                                            <p className="text-sm text-slate-500 mb-4">
                                                Distribuição dos números por dezenas (1-10, 11-20, etc.)
                                            </p>
                                            <div className="space-y-3">
                                                {Object.entries(advancedStats.faixas).sort().map(([faixa, count]) => {
                                                    const total = Object.values(advancedStats.faixas).reduce((a, b) => a + b, 0);
                                                    const percentage = Math.round((count / total) * 100);
                                                    return (
                                                        <div key={faixa} className="flex items-center gap-3">
                                                            <span className="text-sm text-slate-400 w-14 font-medium">{faixa}</span>
                                                            <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                                                                <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: currentGame?.color }} />
                                                            </div>
                                                            <span className="text-sm font-bold text-white w-10 text-right">{percentage}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Card>
                                    )}
                                </div>

                                {/* Top Pairs + Cold Numbers */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="bg-slate-900/50 border-slate-800 p-5">
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2"><Target className="w-5 h-5 text-rose-400" /> Pares Mais Frequentes</h2>
                                        <p className="text-sm text-slate-500 mb-4">Números que mais aparecem juntos no mesmo sorteio</p>
                                        <div className="space-y-3">
                                            {advancedStats?.topPares.map(([par, count], i) => {
                                                const [n1, n2] = par.split('-');
                                                return (
                                                    <div key={par} className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg">
                                                        <span className="text-sm text-slate-500 w-5 font-bold">{i + 1}.</span>
                                                        <div className="flex gap-2">
                                                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: currentGame?.color + '40', color: currentGame?.color }}>{n1}</span>
                                                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: currentGame?.color + '40', color: currentGame?.color }}>{n2}</span>
                                                        </div>
                                                        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full" style={{ width: `${((count as number) / (advancedStats?.topPares[0]?.[1] as number)) * 100}%`, backgroundColor: currentGame?.color }} />
                                                        </div>
                                                        <span className="text-sm font-bold text-white">{count}x</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>

                                    <Card className="bg-slate-900/50 border-slate-800 p-5">
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2"><TrendingDown className="w-5 h-5 text-blue-400" /> Números Menos Sorteados</h2>
                                        <p className="text-sm text-slate-500 mb-4">Os 10 números com menor frequência no período</p>
                                        <div className="h-[200px]">
                                            {leastFrequentData.length > 0 ? (
                                                <ResponsiveBar data={leastFrequentData} keys={['frequency']} indexBy="number"
                                                    margin={{ top: 5, right: 15, bottom: 35, left: 45 }} padding={0.3}
                                                    colors={['#3b82f6']} borderRadius={4}
                                                    axisTop={null} axisRight={null}
                                                    axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                                                    enableGridY={true} enableLabel={false}
                                                    tooltip={({ indexValue, value }) => (
                                                        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg border border-slate-700">
                                                            <span className="font-bold">Número {indexValue}:</span> {value}x
                                                        </div>
                                                    )}
                                                    theme={{ text: { fill: '#64748b', fontSize: 11 }, grid: { line: { stroke: '#1e293b' } } }}
                                                />
                                            ) : <div className="h-full flex items-center justify-center text-slate-500">Sem dados</div>}
                                        </div>
                                    </Card>
                                </div>

                                {/* Historic Results */}
                                <Card className="bg-slate-900/50 border-slate-800 p-5">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-emerald-400" /> Histórico de Resultados</h2>
                                    <p className="text-sm text-slate-500 mb-4">Clique em qualquer concurso para ver detalhes como local, arrecadação e ganhadores</p>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                        {stats.ultimosResultados.slice(0, 20).map((r) => (
                                            <div key={r.concurso}>
                                                <button onClick={() => handleExpandConcurso(r.concurso)}
                                                    className="w-full flex items-center gap-4 p-3 bg-slate-950 rounded-lg hover:bg-slate-900 transition-colors text-left">
                                                    <span className="text-sm font-bold text-white w-20">#{r.concurso}</span>
                                                    <span className="text-xs text-slate-500 w-24">{r.data}</span>
                                                    <div className="flex gap-1.5 flex-1 flex-wrap">
                                                        {r.dezenas.slice(0, 6).map((d, i) => (
                                                            <span key={i} className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center"
                                                                style={{ backgroundColor: currentGame?.color + '30', color: currentGame?.color }}>{d}</span>
                                                        ))}
                                                        {r.dezenas.length > 6 && <span className="text-xs text-slate-500">+{r.dezenas.length - 6}</span>}
                                                    </div>
                                                    {r.acumulado && <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">ACUMULADO</span>}
                                                    {expandedConcurso === r.concurso ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                                </button>
                                                {expandedConcurso === r.concurso && (
                                                    <div className="mt-2 p-4 bg-slate-900 rounded-lg border border-slate-800">
                                                        {loadingDetails ? (
                                                            <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
                                                        ) : drawDetails ? (
                                                            <div className="space-y-3 text-sm">
                                                                {drawDetails.nomeMunicipioUFSorteio && (
                                                                    <div><span className="text-slate-500">Local do Sorteio:</span> <span className="text-slate-300 ml-2">{drawDetails.localSorteio}, {drawDetails.nomeMunicipioUFSorteio}</span></div>
                                                                )}
                                                                {drawDetails.valorArrecadado && (
                                                                    <div><span className="text-slate-500">Arrecadação Total:</span> <span className="text-emerald-400 font-bold ml-2">{formatCurrency(drawDetails.valorArrecadado)}</span></div>
                                                                )}
                                                                {drawDetails.listaMunicipioUFGanhadores && drawDetails.listaMunicipioUFGanhadores.length > 0 && (
                                                                    <div>
                                                                        <span className="text-slate-500">Cidades com Ganhadores:</span>
                                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                                            {drawDetails.listaMunicipioUFGanhadores.map((c, i) => (
                                                                                <span key={i} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                                                                                    {c.municipio}/{c.uf} ({c.ganhadores})
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {drawDetails.listaRateioPremio && drawDetails.listaRateioPremio.length > 0 && (
                                                                    <div>
                                                                        <span className="text-slate-500">Premiação:</span>
                                                                        <div className="grid gap-2 mt-2">
                                                                            {drawDetails.listaRateioPremio.map((p, i) => (
                                                                                <div key={i} className="flex justify-between items-center bg-slate-950 p-2 rounded text-xs">
                                                                                    <span className="text-slate-400">{p.descricaoFaixa}</span>
                                                                                    <div><span className="text-white font-bold">{p.numeroDeGanhadores} ganhadores</span> <span className="text-emerald-400 ml-2">{p.valorPremio > 0 ? formatCurrency(p.valorPremio) : '-'}</span></div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : <span className="text-slate-500">Detalhes não disponíveis</span>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Upgrade CTA */}
                        {!isPremium && (
                            <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30 p-8 text-center">
                                <Crown className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                                <h3 className="text-2xl font-bold text-white mb-2">Desbloqueie Todo o Potencial</h3>
                                <p className="text-slate-400 mb-6 max-w-lg mx-auto">Análises avançadas, padrões estatísticos, pares frequentes, repetições e muito mais.</p>
                                <Link href="/pricing"><Button size="lg" className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold px-8">Ver Planos</Button></Link>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            {/* NUMBER DETAILS MODAL */}
            {selectedNumber && numberDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={() => setSelectedNumber(null)}>
                    <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700 p-10 max-w-5xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black shadow-lg",
                                    numberDetails.isTop10 && "ring-4 ring-orange-500 shadow-orange-500/20",
                                    numberDetails.isBottom10 && "ring-4 ring-blue-500 shadow-blue-500/20"
                                )} style={{ backgroundColor: currentGame?.color, color: '#fff' }}>
                                    {numberDetails.numero}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white">Número {numberDetails.numero}</h3>
                                    <p className="text-slate-400 text-lg mt-1">Análise completa para {currentGame?.name}</p>
                                    <div className="flex gap-2 mt-3">
                                        {numberDetails.isTop10 && <span className="text-sm bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full flex items-center gap-1"><Flame className="w-4 h-4" /> Top 10 Quentes</span>}
                                        {numberDetails.isBottom10 && <span className="text-sm bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full flex items-center gap-1"><Snowflake className="w-4 h-4" /> Top 10 Frios</span>}
                                        {numberDetails.ranking === 1 && <span className="text-sm bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-full flex items-center gap-1"><Trophy className="w-4 h-4" /> #1 Ranking</span>}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedNumber(null)} className="text-slate-500 hover:text-white transition-colors p-3 hover:bg-slate-800 rounded-xl">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                            <div className="bg-slate-800/50 p-5 rounded-2xl">
                                <div className="text-sm text-slate-500 uppercase font-bold mb-2">Frequência</div>
                                <div className="text-4xl font-black" style={{ color: currentGame?.color }}>{numberDetails.frequencia}x</div>
                                <div className="text-sm text-slate-500 mt-2">{numberDetails.percentage}% dos sorteios</div>
                            </div>
                            <div className="bg-slate-800/50 p-5 rounded-2xl">
                                <div className="text-sm text-slate-500 uppercase font-bold mb-2">Ranking</div>
                                <div className="text-4xl font-black text-white">#{numberDetails.ranking}</div>
                                <div className="text-sm text-slate-500 mt-2">de {config?.range || 60} números</div>
                            </div>
                            <div className="bg-slate-800/50 p-5 rounded-2xl">
                                <div className="text-sm text-slate-500 uppercase font-bold mb-2">Atraso Atual</div>
                                <div className={cn("text-4xl font-black", numberDetails.atraso > 10 ? "text-red-400" : "text-emerald-400")}>{numberDetails.atraso}</div>
                                <div className="text-sm text-slate-500 mt-2">sorteios sem sair</div>
                            </div>
                            <div className="bg-slate-800/50 p-5 rounded-2xl">
                                <div className="text-sm text-slate-500 uppercase font-bold mb-2">Ciclo Médio</div>
                                <div className="text-4xl font-black text-purple-400">{numberDetails.frequencia > 0 ? (stats!.totalConcursos / numberDetails.frequencia).toFixed(1) : '∞'}</div>
                                <div className="text-sm text-slate-500 mt-2">sorteios entre aparições</div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Last appearances */}
                            <div>
                                <h4 className="text-base text-slate-400 uppercase font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Últimas 5 Aparições</h4>
                                {numberDetails.ultimasAparicoes.length > 0 ? (
                                    <div className="space-y-3">
                                        {numberDetails.ultimasAparicoes.map((r) => (
                                            <div key={r.concurso} className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl">
                                                <span className="text-base font-bold text-white">#{r.concurso}</span>
                                                <span className="text-sm text-slate-500">{r.data}</span>
                                                <div className="flex gap-1.5 flex-1 justify-end flex-wrap">
                                                    {r.dezenas.map((d, i) => (
                                                        <span key={i} className={cn(
                                                            "w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center",
                                                            d === selectedNumber ? "bg-yellow-500 text-black" : "bg-slate-700 text-slate-400"
                                                        )}>{d}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="text-base text-slate-500 bg-slate-800/50 p-5 rounded-xl">Não saiu nos últimos {stats?.totalConcursos} sorteios</div>}
                            </div>

                            {/* Pairs */}
                            <div>
                                <h4 className="text-base text-slate-400 uppercase font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5" /> Sai Junto Com</h4>
                                {numberDetails.topPares.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {numberDetails.topPares.map(([par, count]) => (
                                            <button key={par} onClick={() => setSelectedNumber(par)}
                                                className="flex items-center gap-4 bg-slate-800/50 hover:bg-slate-700/50 p-4 rounded-xl transition-colors">
                                                <span className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                                                    style={{ backgroundColor: currentGame?.color + '40', color: currentGame?.color }}>{par}</span>
                                                <div className="text-left flex-1">
                                                    <div className="text-base font-bold text-white">{count}x juntos</div>
                                                    <div className="text-sm text-slate-500">Clique para ver análise</div>
                                                </div>
                                                <ChevronDown className="w-5 h-5 text-slate-500 -rotate-90" />
                                            </button>
                                        ))}
                                    </div>
                                ) : <div className="text-base text-slate-500 bg-slate-800/50 p-5 rounded-xl">Sem dados de pares suficientes</div>}
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
