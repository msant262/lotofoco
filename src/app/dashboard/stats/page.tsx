'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Select,
    SelectItem,
    Spinner,
    Progress,
    Chip,
    Divider,
    Tab,
    Tabs,
    Tooltip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    useDisclosure,
    Pagination
} from "@heroui/react";
import { useAuth } from '@/components/providers/auth-provider';
import anime from 'animejs';
import { getUserBets, SavedBet } from '@/lib/firebase/bets-client';
import { LOTTERIES } from '@/lib/config/lotteries';
import {
    BarChart3,
    TrendingUp,
    Target,
    Hash,
    Trophy,
    Activity,
    Divide,
    Percent,
    Flame,
    Snowflake,
    Zap,
    History,
    FilePieChart,
    Layers,
    Binary,
    ArrowUpRight,
    Search,
    Link2,
    Download,
    Lightbulb,
    Sigma,
    Repeat,
    RotateCcw,
    LayoutDashboard,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveRadar } from '@nivo/radar';

export default function StatsPage() {
    const { user } = useAuth();
    const [bets, setBets] = useState<SavedBet[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState<string>("all");
    const [statsTab, setStatsTab] = useState("overview");
    const [historicalResults, setHistoricalResults] = useState<any[]>([]);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    const [historyCache, setHistoryCache] = useState<Record<string, { draws: any[], stats: any, count: number }>>({});
    const [viewMode, setViewMode] = useState<'personal' | 'global'>('personal');
    const { isOpen: isNumberModalOpen, onOpen: onNumberModalOpen, onOpenChange: onNumberModalOpenChange } = useDisclosure();
    const [selectedNumberDetail, setSelectedNumberDetail] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState(1);
    const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(true);

    useEffect(() => {
        if (user) { loadData(); }
    }, [user]);

    useEffect(() => {
        if (selectedGame !== 'all') {
            if (historyCache[selectedGame]) {
                setHistoricalResults(historyCache[selectedGame].draws);
                // If switching to global mode for a game that has cached stats, set viewMode to global
                if (historyCache[selectedGame].stats && viewMode === 'personal') {
                    setViewMode('global');
                }
            } else {
                fetchHistory(selectedGame);
            }
        } else {
            setHistoricalResults([]);
            setViewMode('personal'); // Always default to personal for 'all' games
        }
    }, [selectedGame]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getUserBets(user?.uid || '');
            setBets(data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchHistory = async (slug: string) => {
        setFetchingHistory(true);
        try {
            let fullHistory: any[] = [];
            let globalStats: any = null;

            try {
                const staticRes = await fetch(`/data/history/${slug}.json`);
                if (staticRes.ok) {
                    const staticData = await staticRes.json();
                    globalStats = staticData.stats || null;
                    const rawDraws = Array.isArray(staticData) ? staticData : (staticData.draws || []);

                    fullHistory = rawDraws.map((item: any) => ({
                        concurso: item.c,
                        dezenas: item.d,
                        data: item.t
                    }));
                }
            } catch (e) {
                console.warn(`Snapshot estático para ${slug} não encontrado. Usando modo fallback.`);
            }

            // 2. Buscar o último concurso real para verificar o "Gap"
            const latestRes = await fetch(`/api/proxy-caixa?slug=${slug}`);
            if (!latestRes.ok) {
                if (fullHistory.length > 0) {
                    setHistoricalResults(fullHistory);
                    setHistoryCache(prev => ({ ...prev, [slug]: { draws: fullHistory, stats: globalStats, count: fullHistory.length } }));
                    return;
                }
                return;
            }
            const latest = await latestRes.json();

            // 3. Calcular Delta (Sincronização Híbrida)
            const lastStoredConcurso = fullHistory.length > 0 ? fullHistory[0].concurso : 0;
            const gap = latest.concurso - lastStoredConcurso;

            if (gap > 0 && gap < 50) {
                const missingContests = Array.from({ length: gap }, (_, i) => latest.concurso - i);
                const missingResults = await Promise.all(
                    missingContests.map(async (num) => {
                        try {
                            const r = await fetch(`/api/proxy-caixa?slug=${slug}&concurso=${num}`);
                            return r.ok ? r.json() : null;
                        } catch { return null; }
                    })
                );

                const delta = missingResults.filter(Boolean);
                fullHistory = [...delta, ...fullHistory.filter(h => h.concurso < (delta[delta.length - 1]?.concurso || 0))];
            } else if (gap >= 50 || (fullHistory.length === 0 && gap !== 0)) {
                const prevContests = Array.from({ length: 19 }, (_, i) => latest.concurso - (i + 1));
                const prevResults = await Promise.all(
                    prevContests.map(async (num) => {
                        try {
                            const r = await fetch(`/api/proxy-caixa?slug=${slug}&concurso=${num}`);
                            return r.ok ? r.json() : null;
                        } catch { return null; }
                    })
                );
                fullHistory = [latest, ...prevResults.filter(Boolean)];
            }

            setHistoricalResults(fullHistory);
            setHistoryCache(prev => ({ ...prev, [slug]: { draws: fullHistory, stats: globalStats, count: fullHistory.length } }));
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setFetchingHistory(false);
        }
    };

    const isPrime = (num: number) => {
        for (let i = 2, s = Math.sqrt(num); i <= s; i++)
            if (num % i === 0) return false;
        return num > 1;
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `estatisticas_${selectedGame}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const nivoDarkTheme = {
        background: "transparent",
        text: { fill: "#94a3b8" },
        axis: {
            domain: { line: { stroke: "#334155" } },
            legend: { text: { fill: "#94a3b8", fontWeight: 'bold' } },
            ticks: { line: { stroke: "#334155" }, text: { fill: "#64748b" } }
        },
        grid: { line: { stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 } },
        tooltip: {
            container: {
                background: "#0f172a",
                color: "#f1f5f9",
                fontSize: 12,
                borderRadius: 8,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "8px 12px"
            }
        },
        crosshair: {
            line: { stroke: "#10b981", strokeWidth: 1, strokeOpacity: 0.75 }
        }
    };

    useEffect(() => {
        setHistoryPage(1);
    }, [selectedGame, viewMode]);

    const stats = useMemo(() => {
        const globalStats = historyCache[selectedGame]?.stats || null;

        // GLOBAL MODE: Usar inteligência pré-calculada do histórico
        if (viewMode === 'global' && selectedGame !== 'all' && globalStats) {
            const g = globalStats;

            const sortedNumbers = Object.entries(g.frequency)
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([num, count]) => ({ num: parseInt(num), count: count as number }));

            return {
                totalGames: historyCache[selectedGame].count,
                numberFreq: g.frequency,
                totalNumbersPicked: g.totalNumbersAnalyzed,
                evenCount: g.evenOdd.even,
                oddCount: g.evenOdd.odd,
                primeCount: g.primes,
                avgSum: g.avgSum || 0,
                consecutivePairs: g.consecutivePairs || 0,
                quadrants: g.quadrants || { q1: 0, q2: 0, q3: 0, q4: 0 },
                sums: Object.entries(g.sumDistribution || {}).map(([key, value]) => ({ range: key, count: value as number })),
                topNumbers: sortedNumbers.slice(0, 15),
                coldNumbers: sortedNumbers.slice(-15).reverse(),
                topPairs: g.topPairs || [],
                timelineData: g.timeline || [],
                sortedGames: [], // Global não separa por "jogos" individuais
                isGlobal: true,
                delayMap: g.delayMap || [],
                globalStats: g // Add globalStats here for easy access
            };
        }

        // PERSONAL MODE: Cálculos baseados nos jogos do usuário (últimos 12 meses)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const filterRecent = (b: SavedBet) => {
            const createdAt = b.createdAt?.seconds
                ? new Date(b.createdAt.seconds * 1000)
                : (b.createdAt instanceof Date ? b.createdAt : null);
            return !!(createdAt && createdAt >= twelveMonthsAgo);
        };

        const filtered = bets.filter(b => {
            const matchesGame = selectedGame === 'all' || b.gameSlug === selectedGame;
            return matchesGame && filterRecent(b);
        });

        const totalGames = filtered.reduce((acc, bet) => acc + (bet.games?.length || 1), 0);

        const gamesCount: Record<string, number> = {};
        bets.filter(filterRecent).forEach(b => {
            gamesCount[b.gameSlug] = (gamesCount[b.gameSlug] || 0) + (b.games?.length || 1);
        });

        const numberFreq: Record<number, number> = {};
        const pairFreq: Record<string, number> = {};
        let totalNumbersPicked = 0;
        let evenCount = 0;
        let oddCount = 0;
        let primeCount = 0;
        let totalSum = 0;
        let consecutivePairs = 0;

        const sums: Record<string, number> = { "0-50": 0, "51-100": 0, "101-150": 0, "151-200": 0, "201-250": 0, "250+": 0 };
        const quadrants = { q1: 0, q2: 0, q3: 0, q4: 0 };

        filtered.forEach(bet => {
            const games = bet.games || (bet.numbers ? [{ main: bet.numbers }] : []);
            games.forEach(g => {
                let gameSum = 0;
                const sorted = [...g.main].map(Number).sort((a, b) => a - b);

                sorted.forEach((n, idx) => {
                    numberFreq[n] = (numberFreq[n] || 0) + 1;
                    totalNumbersPicked++;
                    gameSum += n;

                    if (n % 2 === 0) evenCount++; else oddCount++;
                    if (isPrime(n)) primeCount++;
                    if (idx > 0 && sorted[idx] === sorted[idx - 1] + 1) consecutivePairs++;

                    const row = Math.ceil(n / 10);
                    const col = n % 10 || 10;
                    if (row <= 3 && col <= 5) quadrants.q1++;
                    else if (row <= 3 && col > 5) quadrants.q2++;
                    else if (row > 3 && col <= 5) quadrants.q3++;
                    else quadrants.q4++;

                    for (let j = idx + 1; j < sorted.length; j++) {
                        const p1 = sorted[idx];
                        const p2 = sorted[j];
                        const pairKey = `${p1}-${p2}`;
                        pairFreq[pairKey] = (pairFreq[pairKey] || 0) + 1;
                    }
                });

                totalSum += gameSum;
                if (gameSum <= 50) sums["0-50"]++;
                else if (gameSum <= 100) sums["51-100"]++;
                else if (gameSum <= 150) sums["101-150"]++;
                else if (gameSum <= 200) sums["151-200"]++;
                else if (gameSum <= 250) sums["201-250"]++;
                else sums["250+"]++;
            });
        });

        const sortedNumbers = Object.entries(numberFreq)
            .sort((a, b) => b[1] - a[1])
            .map(([num, count]) => ({ num: parseInt(num), count }));

        const sortedPairs = Object.entries(pairFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([pair, count]) => ({ pair, count }));

        return {
            totalGames,
            gamesCount,
            numberFreq,
            totalNumbersPicked,
            evenCount,
            oddCount,
            primeCount,
            avgSum: totalGames > 0 ? totalSum / totalGames : 0,
            consecutivePairs,
            quadrants,
            sums: Object.entries(sums).map(([key, value]) => ({ range: key, count: value })),
            topNumbers: sortedNumbers.slice(0, 15),
            coldNumbers: sortedNumbers.slice(-15).reverse(),
            topPairs: sortedPairs,
            timelineData: Object.entries(filtered.reduce((acc, bet) => {
                const date = bet.createdAt?.seconds
                    ? new Date(bet.createdAt.seconds * 1000)
                    : bet.createdAt instanceof Date ? bet.createdAt : new Date();
                const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
                acc[key] = (acc[key] || 0) + (bet.games?.length || 1);
                return acc;
            }, {} as Record<string, number>)).map(([x, y]) => ({ x, y })),
            sortedGames: Object.entries(gamesCount).sort((a, b) => b[1] - a[1]),
            globalStats: null,
            isGlobal: false
        };
    }, [bets, selectedGame, viewMode, historyCache]);

    // Derived analysis for the interactive modal
    const numberAnalysis = useMemo(() => {
        if (!selectedNumberDetail || !stats) return null;

        const nStr = selectedNumberDetail.padStart(2, '0');
        const freq = (viewMode === 'personal' ? (stats.numberFreq[parseInt(nStr)] || stats.numberFreq[nStr]) : (stats.globalStats?.frequency?.[nStr] || stats.globalStats?.frequency?.[parseInt(nStr)])) || 0;
        const total = viewMode === 'personal' ? stats.totalGames : (stats.globalStats?.totalHistoryCount || stats.totalGames);

        let delay = 0;
        if (stats.delayMap) {
            if (Array.isArray(stats.delayMap)) {
                // If it's an array of {num, delay} objects
                const found = (stats.delayMap as any[]).find(d =>
                    d.num === parseInt(nStr) || d.num.toString().padStart(2, '0') === nStr
                );
                delay = found ? found.delay : 0;
            } else {
                // If it's a direct lookup object { "01": 5 }
                delay = (stats.delayMap as any)?.[nStr] || (stats.delayMap as any)?.[parseInt(nStr)] || 0;
            }
        }

        let occurrences: any[] = [];
        if (viewMode === 'global' && historicalResults.length > 0) {
            occurrences = historicalResults.filter(h =>
                h.dezenas.some((d: any) => d.toString().padStart(2, '0') === nStr)
            ).slice(0, 10);
        }

        return {
            number: nStr,
            frequency: freq,
            percentage: total > 0 ? ((freq / total) * 100).toFixed(1) : '0',
            delay,
            occurrences,
            totalAnalyzed: total
        };
    }, [selectedNumberDetail, stats, viewMode, historicalResults]);

    useEffect(() => {
        if (statsTab === 'heatmap') {
            setTimeout(() => {
                anime({
                    targets: '.heatmap-cell',
                    scale: [0.9, 1],
                    opacity: [0, 1],
                    delay: anime.stagger(20, { grid: [15, 4], from: 'center' }),
                    easing: 'easeOutElastic(1, .8)'
                });
            }, 100);
        }
    }, [statsTab, selectedGame, viewMode]);

    const historyStats = useMemo(() => {
        if (!historicalResults.length || selectedGame === 'all') return null;

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const filterRecent = (b: SavedBet) => {
            const createdAt = b.createdAt?.seconds
                ? new Date(b.createdAt.seconds * 1000)
                : (b.createdAt instanceof Date ? b.createdAt : null);
            return !!(createdAt && createdAt >= twelveMonthsAgo);
        };

        const filteredResults = viewMode === 'global'
            ? historicalResults
            : historicalResults.filter(draw => {
                const drawDate = new Date(draw.data.split('/').reverse().join('-'));
                return drawDate >= twelveMonthsAgo;
            });

        const filtered = bets.filter(b => {
            const matchesGame = b.gameSlug === selectedGame;
            if (viewMode === 'global') return matchesGame;
            return matchesGame && filterRecent(b);
        });
        const userGames: number[][] = [];
        let consecutiveCount = 0;

        filtered.forEach(bet => {
            const games = bet.games || (bet.numbers ? [{ main: bet.numbers }] : []);
            games.forEach(g => {
                const numbers = [...g.main].map(Number);
                userGames.push(numbers);

                const sorted = [...numbers].sort((a, b) => a - b);
                sorted.forEach((n, idx) => {
                    if (idx > 0 && sorted[idx] === sorted[idx - 1] + 1) consecutiveCount++;
                });
            });
        });

        const userGamesCount = userGames.length;
        const userNumbers = new Set(userGames.flat());

        const globalFreq: Record<number, number> = {};
        const numberHits: Record<number, number> = {};
        const hitsCountMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 };
        let totalHitsFull = 0;
        let simulatedReturnFull = 0;
        let maxHitsEver = 0;
        let bestHitContest = 0;
        let bestHitDate = "";

        // Mocked pricing and prize tables for ROI
        const PRICES: Record<string, number> = { 'mega-sena': 5, 'lotofacil': 3, 'quina': 2.5 };
        const PRIZES: Record<string, Record<number, number>> = {
            'mega-sena': { 4: 1100, 5: 45000, 6: 50000000 },
            'lotofacil': { 11: 6, 12: 12, 13: 30, 14: 1500, 15: 1500000 },
            'quina': { 2: 3, 3: 150, 4: 8000, 5: 10000000 }
        };

        const drawStatsFull = filteredResults.map(draw => {
            const dezenas = (draw.dezenas || []).map((n: string) => Number(n));
            const prizeTable = PRIZES[selectedGame];

            let drawMaxHits = 0;
            let drawTotalPrize = 0;
            let drawTotalHits = 0;

            userGames.forEach(game => {
                const hits = dezenas.filter((n: number) => game.includes(n)).length;
                drawTotalHits += hits;
                if (hits > drawMaxHits) drawMaxHits = hits;

                // Historical counter per game
                hitsCountMap[hits] = (hitsCountMap[hits] || 0) + 1;

                if (prizeTable && prizeTable[hits]) {
                    drawTotalPrize += prizeTable[hits];
                }
            });

            totalHitsFull += drawTotalHits;
            simulatedReturnFull += drawTotalPrize;

            if (drawMaxHits > maxHitsEver) {
                maxHitsEver = drawMaxHits;
                bestHitContest = draw.concurso;
                bestHitDate = draw.data;
            }

            dezenas.forEach((n: number) => {
                globalFreq[n] = (globalFreq[n] || 0) + 1;
                if (userNumbers.has(n)) {
                    numberHits[n] = (numberHits[n] || 0) + 1;
                }
            });

            return {
                concurso: draw.concurso,
                hits: drawMaxHits, // Show the best result for this contest in the UI list
                dezenas,
                data: draw.data,
                totalPrize: drawTotalPrize
            };
        });

        const analyzedHistory = viewMode === 'global' ? drawStatsFull : drawStatsFull.slice(0, 20);
        const periodHits = analyzedHistory.reduce((acc, d) => acc + d.hits, 0);
        const periodReturn = analyzedHistory.reduce((acc, d) => acc + (d.totalPrize || 0), 0);

        // Delayed Numbers (Fantasmas) based on analyzed window
        const windowFreq: Record<number, number> = {};
        analyzedHistory.forEach(draw => {
            draw.dezenas.forEach((n: number) => {
                windowFreq[n] = (windowFreq[n] || 0) + 1;
            });
        });
        const delayedNumbers = Array.from(userNumbers).filter((n: number) => !windowFreq[n]);

        const sortedNumberHits = Object.entries(numberHits).sort((a, b) => b[1] - a[1]);
        const favoriteHit = sortedNumberHits.length > 0 ? { num: parseInt(sortedNumberHits[0][0]), count: sortedNumberHits[0][1] } : null;

        // Extract Highlights: Any game that had a winning hit count based on PRIZES
        const prizeTable = PRIZES[selectedGame];
        const highlights = drawStatsFull.filter(draw => {
            return prizeTable && prizeTable[draw.hits];
        }).sort((a, b) => b.hits - a.hits || b.concurso - a.concurso);

        // Sorting for UI display: recent first
        const sortedDraws = [...analyzedHistory].sort((a, b) => b.concurso - a.concurso);

        // Consistency score for UI progress (last 20)
        const consistencyHistory = drawStatsFull.slice(0, 20);
        const consistency = consistencyHistory.reduce((acc: number, d: any) => acc + (d.hits > 0 ? 1 : 0), 0) / (consistencyHistory.length || 1);
        // Metric 3: Symmetry (Balance Score)
        const qArr = Object.values(stats.quadrants) as number[];
        const maxQ = Math.max(...qArr);
        const minQ = Math.min(...qArr);
        const symmetryScore = 100 - ((maxQ - minQ) / (maxQ || 1) * 100);

        // Metric 4: Simulated ROI (Based on the analyzed window)
        const totalInvestment = userGamesCount * (PRICES[selectedGame] || 5) * analyzedHistory.length;
        const roi = totalInvestment > 0 ? ((periodReturn - totalInvestment) / totalInvestment) * 100 : 0;

        // Metric 5: Neighborhood Factor (Probability)
        const neighFactor = (consecutiveCount / userGamesCount) * 100;

        return {
            avgHits: periodHits / (analyzedHistory.length || 1),
            drawStats: sortedDraws,
            highlights,
            delayedNumbers,
            userNumbersCount: userNumbers.size,
            userNumbers,
            favoriteHit,
            consistency: consistency * 100,
            symmetryScore,
            roi,
            neighFactor,
            simulatedReturn: periodReturn,
            maxHitsEver,
            bestHitContest,
            bestHitDate,
            hitsCountMap,
            totalHistoryCount: filteredResults.length,
            analyzedCount: analyzedHistory.length
        };
    }, [historicalResults, bets, selectedGame, stats.quadrants]);

    const paginatedDraws = useMemo(() => {
        if (!historyStats) return [];
        const start = (historyPage - 1) * 20;
        return historyStats.drawStats.slice(start, start + 20);
    }, [historyStats, historyPage]);

    const radarData = useMemo(() => {
        const q = stats?.quadrants || { q1: 0, q2: 0, q3: 0, q4: 0 };
        return [
            { field: 'Q1 (Sup Esq)', value: (q as any).q1 || 0 },
            { field: 'Q2 (Sup Dir)', value: (q as any).q2 || 0 },
            { field: 'Q4 (Inf Dir)', value: (q as any).q4 || 0 },
            { field: 'Q3 (Inf Esq)', value: (q as any).q3 || 0 },
        ];
    }, [stats]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 w-full max-w-[1720px] mx-auto">
            {/* Header Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 p-6 md:p-8 rounded-3xl border border-white/5 backdrop-blur-2xl">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-0.5 bg-emerald-500 rounded-full"></div>
                            <span className="text-[10px] font-black text-emerald-500 tracking-[0.3em] uppercase">Painel de Inteligência</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
                            {viewMode === 'global' ? 'Tendências ' : 'Estatísticas '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                                {viewMode === 'global' ? 'do Histórico' : 'Personalizadas'}
                            </span>
                        </h1>
                        <p className="text-slate-400 text-sm mt-3 font-medium max-w-xl leading-relaxed">
                            {viewMode === 'global'
                                ? 'Visão abrangente extraída de todos os sorteios oficiais da história desta loteria.'
                                : 'Análise profunda baseada no seu histórico de escolhas e preferências de jogo nos últimos 12 meses.'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto">
                        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Filtrar por Loteria</span>
                            <Select
                                aria-label="Loteria Analisada"
                                selectedKeys={[selectedGame]}
                                onSelectionChange={(k) => setSelectedGame(Array.from(k)[0] as string)}
                                className="w-full sm:w-72"
                                variant="flat"
                                size="md"
                                radius="full"
                                classNames={{
                                    trigger: "bg-slate-950 border border-white/10 hover:border-emerald-500/50 h-14 shadow-2xl transition-all",
                                    value: "text-base font-black text-white px-2",
                                    popoverContent: "bg-slate-950 border border-white/10"
                                }}
                            >
                                {[
                                    <SelectItem key="all" textValue="Visão Global (Consolidada)" className="text-slate-200">
                                        Visão Global (Consolidada)
                                    </SelectItem>,
                                    ...Object.values(LOTTERIES).map(l => (
                                        <SelectItem
                                            key={l.slug}
                                            textValue={l.name}
                                            className="text-slate-200"
                                            startContent={
                                                <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: l.hexColor }} />
                                            }
                                        >
                                            {l.name}
                                        </SelectItem>
                                    ))
                                ]}
                            </Select>
                        </div>
                        {selectedGame !== 'all' && (
                            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Fonte de Dados</span>
                                <Tabs
                                    selectedKey={viewMode}
                                    onSelectionChange={(k) => setViewMode(k as any)}
                                    color="success"
                                    variant="bordered"
                                    radius="full"
                                    size="md"
                                    classNames={{
                                        tabList: "bg-slate-950 border border-white/10 h-14 p-1.5",
                                        cursor: "bg-emerald-500 shadow-lg shadow-emerald-500/30",
                                        tab: "h-full px-6 text-xs font-black uppercase tracking-widest text-slate-500 data-[selected=true]:text-white"
                                    }}
                                >
                                    <Tab key="personal" title="MEUS JOGOS" />
                                    <Tab key="global" title="HISTÓRICO" />
                                </Tabs>
                            </div>
                        )}

                        <div className="mt-5 sm:mt-0 flex items-end">
                            <Button
                                onPress={handleExport}
                                color="success"
                                variant="shadow"
                                radius="full"
                                size="lg"
                                className="h-14 font-black px-8 bg-emerald-500 text-slate-950 hover:scale-105 transition-transform shadow-emerald-500/30"
                                startContent={<Download size={20} />}
                            >
                                Exportar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiLux
                    title={viewMode === 'global' ? "Total Analisado" : "Soma Média"}
                    value={viewMode === 'global' ? stats.totalGames : Math.round(stats.avgSum)}
                    sub={viewMode === 'global' ? "Concursos Totais" : "Equilíbrio dos Bilhetes"}
                    icon={<Binary className="text-emerald-400" />}
                />
                <KpiLux
                    title="Pares Repetidos"
                    value={stats.consecutivePairs}
                    sub="Vizinhos nos Jogos"
                    icon={<Layers className="text-blue-400" />}
                />
                <KpiLux
                    title="Dezenas Primas"
                    value={`${Math.round((stats.primeCount / stats.totalNumbersPicked) * 100 || 0)}%`}
                    sub="Concentração Primária"
                    icon={<Zap className="text-yellow-400" />}
                />
                <KpiLux
                    title="Ratio Par/Ímpar"
                    value={`${Math.round((stats.evenCount / stats.totalNumbersPicked) * 100)}%`}
                    sub="Dominância de Pares"
                    icon={<Divide className="text-purple-400" />}
                />
            </div>

            {/* Sub-Navigation */}
            <div className="flex justify-center mt-4">
                <Tabs
                    selectedKey={statsTab}
                    onSelectionChange={(k) => setStatsTab(k as string)}
                    variant="light"
                    radius="full"
                    className="p-1 bg-slate-900/50 border border-white/5 backdrop-blur-xl"
                    classNames={{
                        tabList: "gap-1",
                        cursor: "bg-emerald-500 shadow-lg shadow-emerald-500/20",
                        tab: "h-10 px-6 text-xs font-black uppercase tracking-widest text-slate-400 data-[selected=true]:text-white"
                    }}
                >
                    <Tab key="overview" title="Resumo Analítico" />
                    <Tab key="numbers" title="Análise de Dezenas" />
                    <Tab key="pairs" title="Pares Frequentes" />
                    <Tab key="heatmap" title="Mapa de Calor" />
                    <Tab key="patterns" title="Tendências Globais" />
                    <Tab key="history" title="Cruzamento Histórico" />
                </Tabs>
            </div>

            {/* Dynamic Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {statsTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                            <Card className="xl:col-span-8 bg-slate-900/40 border border-white/5 p-6 rounded-3xl shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-white">Distribuição por Soma</h3>
                                        <p className="text-slate-500 text-xs font-medium">Equilíbrio volumétrico total por jogo.</p>
                                    </div>
                                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                        <TrendingUp className="text-emerald-500" size={20} />
                                    </div>
                                </div>
                                <div className="h-[300px]">
                                    {stats.sums.length > 0 ? (
                                        <ResponsiveBar
                                            data={stats.sums}
                                            keys={['count']}
                                            indexBy="range"
                                            margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
                                            padding={0.4}
                                            colors={['#10b981']}
                                            borderRadius={8}
                                            theme={nivoDarkTheme}
                                            axisLeft={{ tickSize: 0, tickPadding: 10 }}
                                            labelTextColor="#fff"
                                            enableGridY={true}
                                            animate={true}
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">Sem dados de soma.</div>
                                    )}
                                </div>
                            </Card>

                            <Card className="xl:col-span-4 bg-slate-900/40 border border-white/5 p-6 rounded-3xl shadow-xl">
                                <div className="flex flex-col items-center text-center mb-6">
                                    <h3 className="text-xl font-black text-white">Equilíbrio Lateral</h3>
                                    <p className="text-slate-500 text-xs mt-1">Concentração no volante.</p>
                                </div>
                                <div className="h-[300px]">
                                    {radarData.some(d => d.value > 0) ? (
                                        <ResponsiveRadar
                                            data={radarData}
                                            keys={['value']}
                                            indexBy="field"
                                            margin={{ top: 30, right: 50, bottom: 30, left: 50 }}
                                            borderColor={{ from: 'color' }}
                                            gridLabelOffset={15}
                                            dotSize={10}
                                            dotColor={{ theme: 'background' }}
                                            dotBorderWidth={2}
                                            colors={['#10b981']}
                                            blendMode="lighten"
                                            theme={nivoDarkTheme}
                                            animate={true}
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">Equilíbrio uniforme.</div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {stats.timelineData.length > 0 && (
                            <Card className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl shadow-xl">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-white">Histórico de Atividade</h3>
                                        <p className="text-slate-500 text-sm font-medium">Volume de sorteios analisados por período.</p>
                                    </div>
                                    <Activity className="text-blue-500" />
                                </div>
                                <div className="h-[300px]">
                                    <ResponsiveLine
                                        data={[{ id: 'Atividade', data: stats.timelineData }]}
                                        margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                                        xScale={{ type: 'point' }}
                                        yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false, reverse: false }}
                                        curve="monotoneX"
                                        axisTop={null}
                                        axisRight={null}
                                        axisBottom={{
                                            tickSize: 5,
                                            tickPadding: 5,
                                            tickRotation: -45,
                                        }}
                                        enablePoints={true}
                                        pointSize={8}
                                        pointColor="#10b981"
                                        pointBorderWidth={2}
                                        pointBorderColor={{ from: 'serieColor' }}
                                        enableArea={true}
                                        areaOpacity={0.1}
                                        useMesh={true}
                                        theme={nivoDarkTheme}
                                        colors={['#10b981']}
                                    />
                                </div>
                            </Card>
                        )}

                        {/* Sugestão de Tendência Card */}
                        {Object.keys(stats.delayMap || {}).length > 0 && (
                            <Card className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-white">Sugestão de Tendência</h3>
                                        <p className="text-slate-500 text-xs font-medium">Números com menor atraso histórico.</p>
                                    </div>
                                    <Lightbulb className="text-yellow-500" size={20} />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(stats.delayMap as any[])
                                        .sort((a, b) => a.delay - b.delay)
                                        .slice(0, 10) // Show top 10 "hot" numbers (recent)
                                        .map((item) => (
                                            <div key={item.num} className="flex items-center gap-2 p-2 bg-slate-950/50 rounded-xl border border-white/5">
                                                <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm font-black text-emerald-400">
                                                    {item.num}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400">{item.delay} concursos de atraso</span>
                                            </div>
                                        ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {statsTab === 'numbers' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ListCardPro title="Números Mais Escolhidos" items={stats.topNumbers} icon={<Flame className="text-orange-500" />} />
                        <ListCardPro title="Números Menos Escolhidos" items={stats.coldNumbers} icon={<Snowflake className="text-blue-400" />} />
                    </div>
                )}

                {statsTab === 'pairs' && (
                    <Card className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl">
                        <div className="flex items-center gap-4 mb-8 border-l-4 border-blue-500 pl-4">
                            <div>
                                <h3 className="text-2xl font-black text-white">Duplas Inseparáveis</h3>
                                <p className="text-slate-400 text-sm font-medium mt-1">Pares de números que você costuma escolher juntos.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.topPairs.length > 0 ? stats.topPairs.map((p: any, i: number) => (
                                <div key={p.pair} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all duration-500">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-black text-slate-700">0{i + 1}</span>
                                        <div className="flex gap-2">
                                            {p.pair.split('-').map((num: string) => (
                                                <div key={num} className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-lg font-black text-white group-hover:bg-emerald-500 transition-colors">
                                                    {num}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="h-6 w-[1px] bg-white/5 mx-1" />
                                        <div>
                                            <p className="text-sm font-black text-white leading-none">{p.count}x</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wider">Vezes</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Link2 size={14} className="text-blue-500" />
                                    </div>
                                </div>
                            )) : (
                                <p className="col-span-2 text-center text-slate-500 py-10 font-medium">Aguardando mais dados...</p>
                            )}
                        </div>
                    </Card>
                )}

                {statsTab === 'heatmap' && (
                    <Card className="bg-slate-900/40 border border-white/5 p-8 rounded-[32px] overflow-hidden relative shadow-xl">
                        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-5">
                            <Activity size={140} />
                        </div>
                        <div className="relative z-10 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
                            <div className="max-w-xl">
                                <h3 className="text-2xl font-black text-white">Mapa de Inteligência</h3>
                                <p className="text-slate-400 text-sm font-medium mt-1 leading-relaxed">
                                    Visualização geográfica da frequência dos números. {viewMode === 'personal' ? 'Baseado nos seus palpites salvos.' : 'Baseado em todo o histórico de sorteios reais.'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div className="bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                                    <Flame size={14} className="text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Quentes</span>
                                </div>
                                <div className="bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 flex items-center gap-2">
                                    <Snowflake size={14} className="text-blue-400" />
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Frios</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-3 relative z-10">
                            {Array.from({ length: selectedGame !== 'all' ? LOTTERIES[selectedGame]?.range : 60 }, (_, i) => i + 1).map(n => {
                                const nStr = n.toString().padStart(2, '0');
                                const freq = (viewMode === 'personal' ? stats.numberFreq[n] : (stats.globalStats?.frequency?.[n] || stats.globalStats?.frequency?.[nStr])) || 0;
                                const allFreqsMap = viewMode === 'personal' ? stats.numberFreq : (stats.globalStats?.frequency || {});
                                const maxFreq = Math.max(...Object.values(allFreqsMap) as number[]) || 1;
                                const intensity = freq / maxFreq;

                                // Top 10 and Bottom 10 markers
                                const allFreqs = Object.entries(allFreqsMap)
                                    .map(([num, f]) => ({ num: num.toString().padStart(2, '0'), f: f as number }))
                                    .sort((a, b) => b.f - a.f);

                                const isTop10 = allFreqs.slice(0, 10).some(f => f.num === nStr);
                                const isBottom10 = allFreqs.slice(-10).some(f => f.num === nStr);
                                const isFirst = allFreqs[0]?.num === nStr;

                                return (
                                    <Tooltip
                                        key={n}
                                        content={`Número ${nStr}: ${freq} ocorrências`}
                                        className="bg-slate-900 text-white rounded-lg border border-white/10 px-3 py-1 text-xs font-bold"
                                        closeDelay={0}
                                    >
                                        <div
                                            onClick={() => {
                                                setSelectedNumberDetail(nStr);
                                                onNumberModalOpen();
                                            }}
                                            className={`
                                                heatmap-cell aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border relative group cursor-pointer overflow-hidden
                                                ${freq > 0 ? 'hover:scale-110 shadow-lg' : 'opacity-20'}
                                                ${isFirst ? 'ring-4 ring-yellow-500 shadow-yellow-500/30 scale-105 z-20' : ''}
                                                ${isTop10 && !isFirst ? 'ring-2 ring-emerald-400/30 shadow-emerald-400/10' : ''}
                                            `}
                                            style={{
                                                backgroundColor: freq > 0 ? `rgba(${selectedGame === 'lotofacil' ? '192, 38, 211' : '16, 185, 129'}, ${0.1 + intensity * 0.65})` : 'rgba(255,255,255,0.02)',
                                                borderColor: isFirst ? 'rgba(234, 179, 8, 1)' : (freq > 0 ? `rgba(${selectedGame === 'lotofacil' ? '192, 38, 211' : '16, 185, 129'}, ${0.3 + intensity * 0.4})` : 'transparent')
                                            }}
                                        >
                                            <span className={`text-xl font-black transition-transform group-hover:scale-110 ${freq > 0 ? 'text-white' : 'text-slate-800'}`}>
                                                {nStr}
                                            </span>

                                            {isFirst && <Trophy size={14} className="absolute top-1 right-1 text-yellow-500 drop-shadow-md" />}
                                            {isTop10 && !isFirst && <Flame size={12} className="absolute top-1 right-1 text-emerald-400" />}
                                            {isBottom10 && <Snowflake size={12} className="absolute top-1 right-1 text-blue-400" />}

                                            {freq > 0 && (
                                                <span className="text-[7px] font-black text-slate-400 mt-0.5 uppercase tracking-tighter opacity-50">
                                                    {freq}x
                                                </span>
                                            )}
                                        </div>
                                    </Tooltip>
                                )
                            })}
                        </div>
                    </Card>
                )}

                {statsTab === 'patterns' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        {selectedGame === 'all' || !stats.globalStats ? (
                            <Card className="bg-slate-900/40 border border-white/5 p-20 rounded-3xl flex flex-col items-center text-center">
                                <Search className="text-emerald-500 mb-6" size={40} />
                                <h3 className="text-2xl font-black text-white">Análise Padrão Indisponível</h3>
                                <p className="text-slate-400">Escolha uma loteria específica para ver as tendências avançadas de rede.</p>
                            </Card>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <Card className="bg-slate-900/50 border border-white/5 p-6 rounded-[24px]">
                                        <div className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-2 mb-2"><Sigma className="w-3 h-3 text-purple-400" /> Soma Média</div>
                                        <div className="text-3xl font-black text-white">{stats.globalStats?.avgSum ? Math.round(stats.globalStats.avgSum) : '--'}</div>
                                        <div className="text-[10px] text-slate-500 font-medium mt-2 leading-tight">Média aritmética histórica</div>
                                    </Card>
                                    <Card className="bg-slate-900/50 border border-white/5 p-6 rounded-[24px]">
                                        <div className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-2 mb-2"><Percent className="w-3 h-3 text-amber-400" /> Acúmulos</div>
                                        <div className="text-3xl font-black text-white">{stats.globalStats?.totalAcumulados ? Math.round((stats.globalStats.totalAcumulados / (stats.globalStats.totalHistoryCount || stats.totalGames)) * 100) : '--'}%</div>
                                        <div className="text-[10px] text-slate-500 font-medium mt-2 leading-tight">Taxa de concursos sem ganhador</div>
                                    </Card>
                                    <Card className="bg-slate-900/50 border border-white/5 p-6 rounded-[24px]">
                                        <div className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-2 mb-2"><Repeat className="w-3 h-3 text-cyan-400" /> Repetições</div>
                                        <div className="text-3xl font-black text-white">{stats.globalStats?.mediaRepeticoes !== undefined ? stats.globalStats.mediaRepeticoes : '--'}</div>
                                        <div className="text-[10px] text-slate-500 font-medium mt-2 leading-tight">Média de dezenas repetidas</div>
                                    </Card>
                                    <Card className="bg-slate-900/50 border border-white/5 p-6 rounded-[24px]">
                                        <div className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-2 mb-2"><TrendingUp className="w-3 h-3 text-pink-400" /> Consecutivos</div>
                                        <div className="text-3xl font-black text-white">{stats.globalStats?.totalConsecutivos ? (stats.globalStats.totalConsecutivos / (stats.globalStats.totalHistoryCount || stats.totalGames)).toFixed(1) : '--'}</div>
                                        <div className="text-[10px] text-slate-500 font-medium mt-2 leading-tight">Vizinhos por sorteio</div>
                                    </Card>
                                    <Card className="bg-slate-900/50 border border-white/5 p-6 rounded-[24px]">
                                        <div className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-2 mb-2"><Zap className="w-3 h-3 text-red-400" /> Maior Seca</div>
                                        <div className="text-3xl font-black text-white">{stats.globalStats?.maiorStreak || '--'}</div>
                                        <div className="text-[10px] text-slate-500 font-medium mt-2 leading-tight">Máximo acúmulo histórico</div>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <Card className="md:col-span-8 bg-slate-900/40 border border-white/5 p-8 rounded-[32px]">
                                        <h3 className="text-xl font-black text-white mb-6">Distribuição por Faixas Numéricas</h3>
                                        <div className="h-[300px] w-full">
                                            {Object.keys(stats.globalStats?.sumDistribution || {}).length > 0 ? (
                                                <ResponsiveBar
                                                    data={Object.entries(stats.globalStats?.sumDistribution || {}).map(([faixa, count]) => ({
                                                        faixa,
                                                        frequencia: count as number
                                                    }))}
                                                    keys={['frequencia']}
                                                    indexBy="faixa"
                                                    margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                                                    padding={0.3}
                                                    valueScale={{ type: 'linear', min: 0 }}
                                                    indexScale={{ type: 'band', round: true }}
                                                    colors={['#10b981']}
                                                    borderRadius={8}
                                                    axisTop={null}
                                                    axisRight={null}
                                                    axisBottom={{
                                                        tickSize: 5,
                                                        tickPadding: 5,
                                                        tickRotation: 0,
                                                        legend: 'Faixas de Soma',
                                                        legendPosition: 'middle',
                                                        legendOffset: 40
                                                    }}
                                                    theme={{
                                                        axis: {
                                                            ticks: { text: { fill: "#64748b", fontWeight: 900, fontSize: 10 } },
                                                            legend: { text: { fill: "#94a3b8", fontWeight: 900, fontSize: 10, textTransform: 'uppercase' } }
                                                        },
                                                        grid: { line: { stroke: "#1e293b" } },
                                                        tooltip: nivoDarkTheme.tooltip
                                                    }}
                                                    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                                                    animate={true}
                                                />
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">Dados de distribuição indisponíveis.</div>
                                            )}
                                        </div>
                                    </Card>

                                    <Card className="md:col-span-4 bg-slate-900/40 border border-white/5 p-8 rounded-[32px] flex flex-col justify-center text-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                                        <div className="relative z-10">
                                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                                                <Lightbulb className="text-emerald-500" size={32} />
                                            </div>
                                            <h4 className="text-xl font-black text-white mb-4">Dica de Especialista</h4>
                                            <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                                                Baseado no <span className="text-white">Fator de Repetição</span> de {stats.globalStats?.mediaRepeticoes || '--'}, sugerimos manter pelo menos {Math.floor(parseFloat(stats.globalStats?.mediaRepeticoes?.toString() || "0"))} números do último sorteio em seus jogos.
                                            </p>
                                            <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 italic text-xs text-slate-500">
                                                "O segredo das grandes premiações está no equilíbrio estatístico, não apenas na sorte."
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {statsTab === 'history' && (
                    <div className="xl:col-span-12 animate-in fade-in slide-in-from-right-4 duration-500">
                        {selectedGame === 'all' ? (
                            <Card className="bg-slate-900/40 border border-white/5 p-20 rounded-3xl flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                                    <Search className="text-emerald-500" size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Selecione uma Loteria</h3>
                                <p className="text-slate-400 max-w-md">Para realizar o cruzamento histórico, precisamos comparar seus números com sorteios reais. Por favor, escolha uma loteria específica no filtro acima.</p>
                            </Card>
                        ) : historyStats ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <KpiLux title="Média de Acertos" value={historyStats.avgHits.toFixed(1)} sub={viewMode === 'personal' ? "Últimos 20 sorteios" : `Base (${historyStats.analyzedCount})`} icon={<Target className="text-emerald-400" />} />
                                    <KpiLux title="Eficácia" value={`${Math.round((historyStats.avgHits / (LOTTERIES[selectedGame]?.minBet || 6)) * 100)}%`} sub="Aproveitamento" icon={<Zap className="text-yellow-400" />} />
                                    <KpiLux title="Consistência" value={`${Math.round(historyStats.consistency)}%`} sub="Jogos com Acerto" icon={<TrendingUp className="text-purple-400" />} />
                                    <KpiLux title="Hit Favorito" value={historyStats.favoriteHit ? historyStats.favoriteHit.num : '--'} sub={`Sorteado ${historyStats.favoriteHit?.count || 0}x`} icon={<Flame className="text-orange-500" />} />
                                    <KpiLux title="Fantasmas" value={historyStats.delayedNumbers.length} sub={viewMode === 'personal' ? "Zero saída (20 jgs)" : `Zero na Base`} icon={<Snowflake className="text-blue-400" />} />
                                </div>

                                {/* Advanced Intelligence Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl shadow-xl hover:bg-slate-800/40 transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                                                <TrendingUp className="text-emerald-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white">ROI Simulado</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Retorno sobre Investimento</p>
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-3xl font-black ${historyStats.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {historyStats.roi > 0 ? '+' : ''}{Math.round(historyStats.roi)}%
                                            </span>
                                            <span className="text-xs text-slate-500 font-bold">est. histórico</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-4 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-white/5">
                                            Se você tivesse jogado estes números {viewMode === 'personal' ? 'nos últimos 20 concursos' : `em todo o histórico (${historyStats.analyzedCount} jgs)`}, seu retorno teórico seria de <span className="text-emerald-400 font-black">R$ {historyStats.simulatedReturn.toLocaleString()}</span>.
                                        </p>
                                    </Card>

                                    <Card className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl shadow-xl hover:bg-slate-800/40 transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                                                <Activity className="text-blue-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white">Simetria de Jogo</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Equilíbrio Lateral</p>
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-blue-500">{Math.round(historyStats.symmetryScore)}%</span>
                                            <span className="text-xs text-slate-500 font-bold">score geométrico</span>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <Progress
                                                value={historyStats.symmetryScore}
                                                size="sm"
                                                color={historyStats.symmetryScore > 70 ? 'success' : 'warning'}
                                                className="bg-slate-950"
                                            />
                                            <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                                {historyStats.symmetryScore > 70 ? 'Seu padrão de escolha é altamente equilibrado no volante.' : 'Seus números estão concentrados em áreas específicas do volante.'}
                                            </p>
                                        </div>
                                    </Card>

                                    <Card className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl shadow-xl hover:bg-slate-800/40 transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                                                <Layers className="text-purple-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white">Prob. de Sequência</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fator de Vizinhança</p>
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-purple-500">{Math.round(historyStats.neighFactor)}%</span>
                                            <span className="text-xs text-slate-500 font-bold">chance de saída</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-4 leading-relaxed border-l-2 border-purple-500/30 pl-3">
                                            A ocorrência de números em sequência (vizinhança) nas suas apostas é de <span className="text-purple-400 font-black">{Math.round(historyStats.neighFactor)}%</span>, o que afeta diretamente a diversificação do jogo.
                                        </p>
                                    </Card>
                                </div>

                                {/* Fator de Recorrência Histórica (Backtesting Total) */}
                                <Card className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Trophy size={140} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Trophy className="text-yellow-500" size={20} />
                                                    <h3 className="text-xl font-black text-white">Fator de Recorrência {viewMode === 'personal' ? 'Recente' : 'Histórica'}</h3>
                                                </div>
                                                <p className="text-slate-400 text-sm font-medium">
                                                    Análise de performance {viewMode === 'personal' ? 'nos últimos 12 meses' : `em todos os ${historyStats.totalHistoryCount} sorteios`}.
                                                </p>
                                            </div>
                                            <div className="bg-slate-950/80 px-6 py-4 rounded-2xl border border-white/5 text-right">
                                                <p className="text-[10px] font-black text-slate-500 uppercase">Melhor Resultado</p>
                                                <p className="text-2xl font-black text-yellow-500">{historyStats.maxHitsEver} Acertos</p>
                                                <p className="text-[10px] text-slate-500 font-bold">Concurso {historyStats.bestHitContest} ({historyStats.bestHitDate})</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[6, 5, 4, 3].map(hit => {
                                                const count = historyStats.hitsCountMap[hit] || 0;
                                                const label = hit === 6 ? 'Sena' : hit === 5 ? 'Quina' : hit === 4 ? 'Quadra' : 'Terno';
                                                // Adjust labels for Lotofácil
                                                const lofLabel = hit === 15 ? '15 Pontos' : hit === 14 ? '14 Pontos' : hit === 13 ? '13 Pontos' : '12 Pontos';
                                                const isLof = selectedGame === 'lotofacil';
                                                const displayHit = isLof ? hit + 9 : hit; // 15, 14, 13, 12 for Lotofacil
                                                const finalLabel = isLof ? (displayHit === 15 ? '15 Pontos' : displayHit === 14 ? '14 Pontos' : displayHit === 13 ? '13 Pontos' : '12 Pontos') : label;
                                                const finalCount = historyStats.hitsCountMap[isLof ? displayHit : hit] || 0;

                                                if (hit === 3 && selectedGame === 'mega-sena') return null; // No Terno in MS prize simulation here

                                                return (
                                                    <div key={hit} className={`p-5 rounded-2xl border transition-all ${finalCount > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950/50 border-white/5 opacity-50'}`}>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{isLof ? `${displayHit} Pontos` : finalLabel}</p>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-2xl font-black ${finalCount > 0 ? 'text-emerald-500' : 'text-slate-600'}`}>{finalCount}</span>
                                                            <span className="text-[10px] text-slate-500 font-medium">vezes</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Card>

                                <Card className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl shadow-2xl">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-purple-500/10 rounded-2xl">
                                            <History className="text-purple-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white">Confronto com Sorteios Reais</h3>
                                            <p className="text-slate-500 text-xs font-medium">Como seus números se comportaram nos últimos concursos da Caixa.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Highlights Section */}
                                        {historyStats.highlights.length > 0 && (
                                            <div className="mb-10">
                                                <button
                                                    onClick={() => setIsHallOfFameOpen(!isHallOfFameOpen)}
                                                    className="flex items-center justify-between w-full group mb-4"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Trophy className="text-yellow-500" size={16} />
                                                        <span className="text-xs font-black text-yellow-500 uppercase tracking-widest">Hall da Fama (Seus Prêmios)</span>
                                                        <div className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-[9px] font-black text-yellow-500 border border-yellow-500/20">
                                                            {historyStats.highlights.length}
                                                        </div>
                                                    </div>
                                                    <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                                        {isHallOfFameOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                                    </div>
                                                </button>

                                                {isHallOfFameOpen && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        {historyStats.highlights.map((draw: any) => (
                                                            <div key={`high-${draw.concurso}`} className="flex flex-col lg:flex-row lg:items-center justify-between p-5 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-2xl border border-emerald-500/30 gap-6 group">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex flex-col min-w-[80px]">
                                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Concurso</span>
                                                                        <span className="text-lg font-black text-emerald-400 leading-none">{draw.concurso}</span>
                                                                    </div>
                                                                    <div className="w-[1px] h-8 bg-emerald-500/20 mx-2 hidden lg:block" />
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {draw.dezenas.map((n: number) => {
                                                                            const nStr = n.toString().padStart(2, '0');
                                                                            const isHit = historyStats.userNumbers.has(n);
                                                                            return (
                                                                                <div key={n} className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-all ${isHit ? 'bg-emerald-500 text-slate-950 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-900 text-slate-600 border border-white/5'}`}>
                                                                                    {nStr}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4 bg-emerald-500/20 px-6 py-3 rounded-2xl border border-emerald-500/30">
                                                                    <div className="text-right">
                                                                        <p className="text-[10px] font-black text-emerald-400 uppercase">PRÊMIO TEÓRICO</p>
                                                                        <p className="text-2xl font-black text-emerald-400">{draw.hits} Acertos</p>
                                                                    </div>
                                                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                                        <Trophy size={20} className="text-emerald-400" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="h-[1px] w-full bg-white/5 my-8" />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 mb-4">
                                            <History className="text-slate-500" size={16} />
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Lista de Sorteios</span>
                                        </div>

                                        {paginatedDraws.map((draw: any) => (
                                            <div key={draw.concurso} className="flex flex-col lg:flex-row lg:items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-white/10 gap-6 group hover:border-emerald-500/30 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col min-w-[80px]">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Concurso</span>
                                                        <span className="text-lg font-black text-white leading-none">{draw.concurso}</span>
                                                    </div>
                                                    <div className="w-[1px] h-8 bg-white/10 mx-2 hidden lg:block" />
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {draw.dezenas.map((n: number) => {
                                                            const nStr = n.toString().padStart(2, '0');
                                                            const isHit = historyStats.userNumbers.has(n);
                                                            return (
                                                                <div key={n} className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-all ${isHit ? 'bg-emerald-500 text-slate-950 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-900 text-slate-600 border border-white/5'}`}>
                                                                    {nStr}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 bg-slate-900/80 px-6 py-3 rounded-2xl border border-white/5 group-hover:bg-emerald-500/5 transition-colors">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-500 uppercase">Seus Acertos</p>
                                                        <p className="text-2xl font-black text-emerald-500">{draw.hits}</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                        <Target size={20} className="text-emerald-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {historyStats.drawStats.length > 20 && (
                                            <div className="flex justify-center mt-10">
                                                <Pagination
                                                    total={Math.ceil(historyStats.drawStats.length / 20)}
                                                    page={historyPage}
                                                    onChange={setHistoryPage}
                                                    showControls
                                                    variant="flat"
                                                    color="success"
                                                    classNames={{
                                                        cursor: "bg-emerald-500 text-slate-950 font-bold",
                                                        wrapper: "bg-slate-950/50 border border-white/10 p-2 rounded-2xl",
                                                        item: "text-slate-400 font-bold hover:bg-white/5"
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                <Card className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl shadow-xl overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Snowflake size={120} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="p-3 bg-blue-500/10 rounded-2xl">
                                                <Snowflake className="text-blue-400" />
                                            </div>
                                            <h3 className="text-xl font-black text-white">Dezenas 'Em Atraso' (Fantasmas)</h3>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-8 max-w-2xl leading-relaxed">
                                            Estes são números que fazem parte dos seus palpites salvos, mas que **não foram sorteados nenhuma vez** em todos os sorteios analisados ({historyStats.totalHistoryCount}). Matematicamente, estas dezenas são as mais raras na sua estratégia atual.
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            {historyStats.delayedNumbers.map(n => (
                                                <div key={n} className="w-14 h-14 rounded-2xl bg-slate-950 border border-blue-500/30 flex items-center justify-center text-xl font-black text-blue-400 shadow-lg hover:border-blue-400 transition-colors">
                                                    {n.toString().padStart(2, '0')}
                                                </div>
                                            ))}
                                            {historyStats.delayedNumbers.length === 0 && (
                                                <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 w-full text-center">
                                                    <p className="text-emerald-500 font-bold">Incrível! Todos os seus números escolhidos apareceram pelo menos uma vez nos últimos sorteios.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <Card className="bg-slate-900/40 border border-white/5 p-20 rounded-3xl flex flex-col items-center text-center">
                                <Spinner color="success" />
                                <p className="text-slate-400 mt-4">Carregando dados históricos da Caixa...</p>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center py-6 opacity-40 hover:opacity-100 transition-opacity duration-500">
                <div className="flex items-center gap-3">
                    <Activity className="text-emerald-500" size={16} />
                    <span className="font-bold tracking-[0.2em] uppercase text-[9px] text-white">LotoFoco Engine v3.1</span>
                </div>
            </div>

            {/* DETAIL MODAL */}
            <Modal
                isOpen={isNumberModalOpen}
                onOpenChange={onNumberModalOpenChange}
                size="4xl"
                className="bg-slate-950 border border-white/10"
                backdrop="blur"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 text-xl font-black">
                                        {numberAnalysis?.number}
                                    </div>
                                    Análise Detalhada do Número
                                </h2>
                            </ModalHeader>
                            <ModalBody className="pb-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="bg-slate-900/40 p-6 border border-white/5 flex flex-col justify-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-4">Frequência Relativa</p>
                                        <div className="text-4xl font-black text-emerald-500 mb-1">{numberAnalysis?.frequency}x</div>
                                        <p className="text-xs text-slate-400">Apareceu em {numberAnalysis?.percentage}% dos concursos</p>
                                    </Card>
                                    <Card className="bg-slate-900/40 p-6 border border-white/5 flex flex-col justify-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-4">Atraso Atual</p>
                                        <div className="text-4xl font-black text-amber-500 mb-1">{numberAnalysis?.delay}</div>
                                        <p className="text-xs text-slate-400">Concursos desde a última aparição</p>
                                    </Card>
                                    <Card className="bg-emerald-500/10 p-6 border border-emerald-500/20 flex flex-col justify-center text-center">
                                        <TrendingUp className="mx-auto text-emerald-500 mb-2" size={24} />
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Tendência</h4>
                                        <p className="text-xs text-emerald-400 font-bold mt-1">Alta Probabilidade</p>
                                    </Card>
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <History size={16} className="text-slate-500" /> Últimas Ocorrências Reais
                                    </h3>
                                    <div className="space-y-3">
                                        {numberAnalysis?.occurrences.map((occ: any) => (
                                            <div key={occ.concurso} className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-black text-emerald-500">Concurso {occ.concurso}</span>
                                                    <p className="text-[10px] text-slate-500">{occ.data}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    {occ.dezenas.map((d: any) => {
                                                        const isTarget = d.toString().padStart(2, '0') === numberAnalysis?.number;
                                                        return (
                                                            <div key={d} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${isTarget ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-600'}`}>
                                                                {d.toString().padStart(2, '0')}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                        {numberAnalysis?.occurrences.length === 0 && (
                                            <p className="text-center text-slate-500 py-8 italic text-sm">Nenhuma ocorrência encontrada nos últimos registros.</p>
                                        )}
                                    </div>
                                </div>
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>

            <style jsx global>{`
                .text-shadow-glow {
                    text-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
                }
            `}</style>
        </div>
    );
}

function KpiLux({ title, value, sub, icon }: any) {
    return (
        <Card className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl hover:bg-slate-800/40 transition-all duration-500 group relative overflow-hidden h-full shadow-lg">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-slate-950 rounded-xl border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                        {icon}
                    </div>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{title}</p>
                <h4 className="text-2xl lg:text-3xl font-black text-white group-hover:text-emerald-400 transition-colors leading-none tracking-tight">
                    {value}
                </h4>
                <p className="text-[10px] text-slate-400 mt-3 font-bold tracking-wide">{sub}</p>
            </div>
        </Card>
    );
}

function ListCardPro({ title, items, icon }: any) {
    return (
        <Card className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl h-full shadow-xl">
            <CardHeader className="px-0 flex items-center gap-4 pb-6 border-b border-white/5 mb-6">
                <div className="p-3 bg-slate-950 rounded-xl border border-white/5">{icon}</div>
                <h3 className="text-lg font-black text-white">{title}</h3>
            </CardHeader>
            <div className="space-y-4">
                {items.length > 0 ? items.map((item: any, idx: number) => (
                    <div key={item.num} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-slate-800 w-6">{idx < 9 ? `0${idx + 1}` : idx + 1}</span>
                            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center font-black text-white group-hover:border-emerald-500 transition-all shadow-lg text-lg">
                                {item.num}
                            </div>
                            <div>
                                <p className="text-base font-black text-white leading-none">{item.count} Vezes</p>
                                <p className="text-[9px] text-slate-500 mt-1 font-black uppercase tracking-widest text-[8px]">Frequência</p>
                            </div>
                        </div>
                        <Progress
                            value={(item.count / items[0].count) * 100}
                            size="sm"
                            color="success"
                            className="w-24 md:w-32"
                            classNames={{
                                indicator: "bg-gradient-to-r from-emerald-600 to-teal-400",
                                track: "bg-slate-950"
                            }}
                        />
                    </div>
                )) : <p className="text-slate-600 text-sm text-center py-10">Sem dados.</p>}
            </div>
        </Card>
    );
}
