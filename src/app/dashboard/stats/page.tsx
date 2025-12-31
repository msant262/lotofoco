'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
    ChevronUp,
    Crown,
    Lock,
    Users,
    Clock,
    AlertCircle,
    CheckCircle2
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

    // PRO Features State
    const [isPro, setIsPro] = useState(false);
    const [showProModal, setShowProModal] = useState(false);
    const [modalPage, setModalPage] = useState(1);

    // Custom Tabs Animation
    const cursorRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    useEffect(() => {
        const target = tabRefs.current[statsTab];
        if (target && cursorRef.current) {
            anime({
                targets: cursorRef.current,
                left: target.offsetLeft,
                width: target.offsetWidth,
                opacity: 1,
                duration: 500,
                easing: 'spring(1, 80, 12, 0)'
            });
        }
    }, [statsTab]);

    useEffect(() => {
        if (user) {
            loadData();
            checkSubscription();
        }
    }, [user]);

    const checkSubscription = async () => {
        if (!user) return;
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                // Consider active if plan is monthly/annual OR status is explicitly active
                const isActive = data.plan === 'monthly' || data.plan === 'annual' || data.subscriptionStatus === 'active';
                setIsPro(isActive);
            }
        } catch (error) {
            console.error("Error checking subscription:", error);
        }
    };

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

    // Derived analysis for the interactive modal (Real-time Last 12 Months)
    const numberAnalysis = useMemo(() => {
        if (!selectedNumberDetail || !historicalResults.length) return null;

        const nStr = selectedNumberDetail.padStart(2, '0');

        // 1. Sort History Descending
        const sortedHistory = [...historicalResults].sort((a, b) => {
            const dateA = new Date(a.data.split('/').reverse().join('-'));
            const dateB = new Date(b.data.split('/').reverse().join('-'));
            return dateB.getTime() - dateA.getTime();
        });

        // 2. Filter Last 12 Months
        const now = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(now.getMonth() - 12);

        const last12MonthsData = sortedHistory.filter(draw => {
            const drawDate = new Date(draw.data.split('/').reverse().join('-'));
            return drawDate >= twelveMonthsAgo;
        });

        // 3. Calculate Stats
        const occurrences12m = last12MonthsData.filter(d =>
            d.dezenas.some((dez: any) => dez.toString().padStart(2, '0') === nStr)
        );
        const freq12m = occurrences12m.length;
        const total12m = last12MonthsData.length;
        const percentage12m = total12m > 0 ? ((freq12m / total12m) * 100).toFixed(1) : '0';

        // 4. Real Delay (Global Scan)
        let currentDelay = sortedHistory.length;
        for (let i = 0; i < sortedHistory.length; i++) {
            if (sortedHistory[i].dezenas.some((dez: any) => dez.toString().padStart(2, '0') === nStr)) {
                currentDelay = i;
                break;
            }
        }

        // 5. Trend Calculation (vs Theoretical)
        const DRAW_COUNTS: Record<string, number> = {
            'lotofacil': 15, 'mega-sena': 6, 'quina': 5, 'lotomania': 20,
            'timemania': 7, 'dupla-sena': 6, 'dia-de-sorte': 7,
            'super-sete': 7, 'mais-milionaria': 6
        };
        const drawCount = DRAW_COUNTS[selectedGame] || 6;

        let trend = "Normal";
        let trendColor = "text-emerald-400";
        const gameConfig = LOTTERIES[selectedGame];

        if (gameConfig) {
            const theoreticalProb = drawCount / gameConfig.range;
            const actualProb = freq12m / (total12m || 1);

            if (actualProb > theoreticalProb * 1.3) {
                trend = "Muito Alta";
                trendColor = "text-amber-500";
            } else if (actualProb > theoreticalProb * 1.1) {
                trend = "Alta";
                trendColor = "text-emerald-400";
            } else if (actualProb < theoreticalProb * 0.7) {
                trend = "Baixa";
                trendColor = "text-blue-400";
            }
        }

        // 6. Top Partners (Numbers that appear together frequently in 12m)
        const partnersMap: Record<string, number> = {};
        occurrences12m.forEach(draw => {
            draw.dezenas.forEach((d: any) => {
                const dStr = d.toString().padStart(2, '0');
                if (dStr !== nStr) {
                    partnersMap[dStr] = (partnersMap[dStr] || 0) + 1;
                }
            });
        });
        const topPartners = Object.entries(partnersMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([num, count]) => ({ num, count }));

        // 7. Average Delay (Full History Analysis)
        let totalDelays = 0;
        let delayCount = 0;
        let lastConcursoFound = -1;

        for (let i = sortedHistory.length - 1; i >= 0; i--) {
            const draw = sortedHistory[i];
            const hasNumber = draw.dezenas.some((d: any) => d.toString().padStart(2, '0') === nStr);
            if (hasNumber) {
                if (lastConcursoFound !== -1) {
                    const diff = draw.concurso - lastConcursoFound;
                    totalDelays += diff;
                    delayCount++;
                }
                lastConcursoFound = draw.concurso;
            }
        }
        const avgDelay = delayCount > 0 ? (totalDelays / delayCount).toFixed(1) : "0";

        return {
            number: nStr,
            frequency: freq12m,
            percentage: percentage12m,
            delay: currentDelay,
            occurrences: occurrences12m,
            totalAnalyzed: total12m,
            trend,
            trendColor,
            topPartners,
            avgDelay
        };
    }, [selectedNumberDetail, historicalResults, selectedGame]);

    // Animation for Modal Cards
    useEffect(() => {
        if (isNumberModalOpen && numberAnalysis) {
            anime({
                targets: '.stats-card',
                translateY: [20, 0],
                opacity: [0, 1],
                scale: [0.95, 1],
                delay: anime.stagger(100, { start: 100 }),
                easing: 'easeOutElastic(1, .6)',
                duration: 800
            });
        }
    }, [isNumberModalOpen, numberAnalysis]);

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

    const handleTabChange = (key: string) => {
        if (key === 'global' && !isPro) {
            setShowProModal(true);
            return;
        }
        setViewMode(key as any);
    };

    const handleExportClick = () => {
        if (!isPro) {
            setShowProModal(true);
            return;
        }
        handleExport();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 w-full max-w-[1720px] mx-auto">
            {/* Header Section */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 rounded-3xl blur-xl"></div>

                <div className="relative bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl p-6 md:p-8 flex flex-col xl:flex-row items-center justify-between gap-8">

                    {/* Title Section */}
                    <div className="flex-1 w-full text-center xl:text-left space-y-3">
                        <div className="flex items-center justify-center xl:justify-start gap-3">
                            <div className="h-8 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></div>
                            <span className="text-[10px] font-black text-emerald-500 tracking-[0.3em] uppercase">
                                Painel de Inteligência
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                            {viewMode === 'global' ? 'Análise ' : 'Estatísticas '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                                {viewMode === 'global' ? 'Global' : 'Pessoais'}
                            </span>
                        </h1>

                        <p className="text-slate-400 font-medium max-w-2xl mx-auto xl:mx-0 leading-relaxed text-sm md:text-base">
                            {viewMode === 'global'
                                ? 'Insights profundos extraídos de toda a base histórica oficial de sorteios.'
                                : 'Métricas detalhadas sobre seu desempenho, padrões de aposta e evolução.'}
                        </p>
                    </div>

                    {/* Controls Section */}
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto bg-slate-950/50 p-2 rounded-2xl border border-white/5">

                        {/* Game Selector */}
                        <Select
                            aria-label="Selecionar Loteria"
                            selectedKeys={[selectedGame]}
                            onSelectionChange={(k) => setSelectedGame(Array.from(k)[0] as string)}
                            className="w-full md:w-64"
                            classNames={{
                                trigger: "bg-slate-900 border-white/10 h-12",
                                value: "font-bold text-white",
                                popoverContent: "bg-slate-900 border-white/10"
                            }}
                            renderValue={(items) => items.map(item => (
                                <div key={item.key} className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider mr-2">JOGO:</span>
                                    {item.textValue}
                                </div>
                            ))}
                        >
                            {[
                                <SelectItem key="all" textValue="Todas" className="text-slate-200">
                                    Visão Geral
                                </SelectItem>,
                                ...Object.values(LOTTERIES).map(l => (
                                    <SelectItem key={l.slug} textValue={l.name} className="text-slate-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.hexColor }} />
                                            {l.name}
                                        </div>
                                    </SelectItem>
                                ))
                            ]}
                        </Select>

                        <div className="w-px h-10 bg-white/10 hidden md:block"></div>

                        {/* View Mode Tabs */}
                        {selectedGame !== 'all' && (
                            <div className="flex bg-slate-900 rounded-xl p-1 border border-white/10 w-full md:w-auto">
                                <button
                                    onClick={() => setViewMode('personal')}
                                    className={`flex-1 md:flex-none px-6 h-10 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'personal'
                                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    Meus Jogos
                                </button>
                                <button
                                    onClick={() => handleTabChange('global')}
                                    className={`flex-1 md:flex-none px-6 h-10 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${viewMode === 'global'
                                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    Histórico
                                    {!isPro && <Lock size={12} className="opacity-70" />}
                                </button>
                            </div>
                        )}

                        <div className="w-px h-10 bg-white/10 hidden md:block"></div>

                        {/* Actions */}
                        <Button
                            onPress={handleExportClick}
                            className="bg-slate-900 border border-white/10 hover:border-emerald-500/50 text-white font-black h-12 w-full md:w-12 min-w-0 px-0 rounded-xl min-w-[3rem]"
                        >
                            <Download size={18} />
                        </Button>
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

            {/* Sub-Navigation (Custom AnimeJS) */}
            <div className="w-full flex justify-center mt-6 mb-8">
                <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl">
                    {/* Animated Cursor */}
                    <div
                        ref={cursorRef}
                        className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-lg shadow-emerald-500/20 z-0 pointer-events-none opacity-0"
                    />

                    {[
                        { id: 'overview', label: 'Resumo' },
                        { id: 'heatmap', label: 'Mapa de Calor' },
                        { id: 'numbers', label: 'Rankings' },
                        { id: 'pairs', label: 'Pares' },
                        { id: 'patterns', label: 'Tendências' },
                        { id: 'history', label: 'Cruzamento' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            ref={el => { tabRefs.current[tab.id] = el }}
                            onClick={() => setStatsTab(tab.id)}
                            className={`
                                relative z-10 px-5 h-9 flex items-center justify-center 
                                text-[10px] md:text-xs font-black uppercase tracking-widest 
                                transition-colors duration-300
                                ${statsTab === tab.id ? 'text-slate-950' : 'text-slate-500 hover:text-slate-300'}
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
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

                                // Calculate Ranks
                                const allFreqs = Object.entries(allFreqsMap)
                                    .map(([num, f]) => ({ num: num.toString().padStart(2, '0'), f: f as number }))
                                    .sort((a, b) => b.f - a.f);

                                const rankIndex = allFreqs.findIndex(f => f.num === nStr);
                                const isFirst = rankIndex === 0 && freq > 0;
                                const isTop10 = rankIndex < 10 && freq > 0;
                                const isBottom10 = allFreqs.length > 20 && rankIndex >= allFreqs.length - 10;
                                const isCold = !isTop10 && !isFirst && (freq === 0 || isBottom10);

                                // Intensity for opacity (0.2 to 1.0)
                                const maxFreq = allFreqs[0]?.f || 1;
                                const minFreq = allFreqs[allFreqs.length - 1]?.f || 0;
                                const intensity = maxFreq === minFreq ? 0.5 : (freq - minFreq) / (maxFreq - minFreq);

                                // Theme Colors based on game
                                const themeRgbMap: Record<string, string> = {
                                    lotofacil: '168, 85, 247', // Purple
                                    megasena: '16, 185, 129', // Emerald
                                    quina: '59, 130, 246', // Blue
                                    lotomania: '249, 115, 22', // Orange
                                    timemania: '234, 179, 8', // Yellow
                                    duplasena: '220, 38, 38', // Red
                                    diadesorte: '217, 119, 6', // Amber
                                };
                                const themeRgb = themeRgbMap[selectedGame] || '16, 185, 129';

                                return (
                                    <Tooltip
                                        key={n}
                                        content={
                                            <div className="px-1 py-1">
                                                <div className="text-xs font-bold text-white mb-1">Número {nStr}</div>
                                                <div className="text-[10px] text-slate-400">{freq} ocorrências ({((freq / (stats.totalGames || 1)) * 100).toFixed(1)}%)</div>
                                                {isFirst && <div className="text-[10px] text-yellow-400 font-black mt-1 uppercase">★ Mais Sorteado</div>}
                                            </div>
                                        }
                                        className="bg-slate-950 border border-white/10"
                                        closeDelay={0}
                                    >
                                        <div
                                            onClick={() => {
                                                setSelectedNumberDetail(nStr);
                                                setModalPage(1);
                                                onNumberModalOpen();
                                            }}
                                            className={`
                                                relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden group
                                                ${isFirst ? 'scale-110 z-20 shadow-[0_0_20px_rgba(234,179,8,0.3)] ring-2 ring-yellow-500' : 'hover:scale-105 hover:z-10 hover:shadow-lg'}
                                            `}
                                            style={{
                                                backgroundColor: freq > 0 ? (
                                                    isFirst ? 'rgba(234, 179, 8, 0.25)' :
                                                        `rgba(${themeRgb}, ${0.1 + (intensity * 0.65)})`
                                                ) : 'rgba(30, 41, 59, 0.25)',
                                                borderColor: freq > 0 ? (
                                                    isFirst ? 'rgba(234, 179, 8, 1)' :
                                                        `rgba(${themeRgb}, ${0.2 + (intensity * 0.5)})`
                                                ) : 'rgba(255, 255, 255, 0.05)',
                                                borderWidth: isFirst ? '2px' : '1px'
                                            }}
                                        >
                                            {/* Number */}
                                            <span className={`text-xl font-black transition-transform group-hover:scale-110 z-10 ${isFirst ? 'text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' :
                                                isTop10 ? 'text-white' :
                                                    isCold ? 'text-slate-500 group-hover:text-blue-300' :
                                                        'text-slate-400 group-hover:text-white'
                                                }`}>
                                                {nStr}
                                            </span>

                                            {/* Badge Layout */}
                                            {isFirst && (
                                                <>
                                                    <div className="absolute -inset-1 bg-yellow-500/20 blur animate-pulse"></div>
                                                    <Trophy size={14} className="absolute top-1.5 right-1.5 text-yellow-500 drop-shadow-md" />
                                                </>
                                            )}

                                            {isTop10 && !isFirst && (
                                                <Flame size={12} className="absolute top-1.5 right-1.5 text-red-500 drop-shadow-sm" />
                                            )}

                                            {isCold && (
                                                <div className="absolute top-1.5 right-1.5">
                                                    <Snowflake size={12} className={['quina', 'megasena', 'duplasena', 'lotofacil'].includes(selectedGame) ? "text-white drop-shadow-md" : "text-cyan-400"} />
                                                </div>
                                            )}

                                            {/* Frequency Bar/Indicator (Subtle) */}
                                            {freq > 0 && !isFirst && !isCold && (
                                                <div
                                                    className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/20"
                                                    style={{ width: `${intensity * 100}%` }}
                                                ></div>
                                            )}

                                            {isFirst && (
                                                <div className="absolute bottom-2 text-[8px] font-black text-yellow-500 uppercase tracking-wider">LÍDER</div>
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
                                {!numberAnalysis ? (
                                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 text-xl font-black border border-white/5">
                                            ?
                                        </div>
                                        Detalhes do Número
                                    </h2>
                                ) : (
                                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 text-xl font-black">
                                            {numberAnalysis.number}
                                        </div>
                                        Análise Detalhada
                                        <span className="ml-3 px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-[10px] uppercase font-bold text-slate-400">
                                            Últimos 12 Meses
                                        </span>
                                    </h2>
                                )}
                            </ModalHeader>
                            <ModalBody className="pb-8">
                                {!numberAnalysis ? (
                                    <div className="py-20 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                                        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 text-slate-500 shadow-inner border border-white/5">
                                            <Search size={40} />
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-2">Selecione uma Loteria</h3>
                                        <p className="text-slate-400 max-w-xs mb-8 text-sm leading-relaxed font-medium">
                                            Para ver a análise detalhada de tendência e histórico real, selecione um jogo específico no menu superior (ex: Lotofácil).
                                        </p>
                                        <Button
                                            variant="flat"
                                            color="primary"
                                            onPress={onClose}
                                            className="font-bold bg-slate-800 text-white"
                                        >
                                            Entendi, vou selecionar
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            {/* Frequency Card */}
                                            <Card className="stats-card opacity-0 bg-slate-900/60 p-5 border border-white/5 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
                                                <div className="absolute -right-4 -top-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors">
                                                    <Target size={80} />
                                                </div>
                                                <div className="relative z-10">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Frequência</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-3xl font-black text-white">{numberAnalysis.frequency}</span>
                                                        <span className="text-sm font-bold text-emerald-500">ocorrências</span>
                                                    </div>
                                                    <div className="mt-4">
                                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-medium">
                                                            <span>Presença (12m)</span>
                                                            <span className="text-emerald-400">{numberAnalysis.percentage}%</span>
                                                        </div>
                                                        <Progress
                                                            aria-label="Frequência Relativa"
                                                            value={parseFloat(numberAnalysis.percentage)}
                                                            color="success"
                                                            size="sm"
                                                            classNames={{ indicator: "bg-emerald-500", track: "bg-slate-800" }}
                                                        />
                                                    </div>
                                                </div>
                                            </Card>

                                            {/* Delay Card */}
                                            <Card className="stats-card opacity-0 bg-slate-900/60 p-5 border border-white/5 relative overflow-hidden group hover:border-amber-500/20 transition-all">
                                                <div className="absolute -right-4 -top-4 text-amber-500/5 group-hover:text-amber-500/10 transition-colors">
                                                    <Clock size={80} />
                                                </div>
                                                <div className="relative z-10">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Atraso Atual</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className={`text-3xl font-black ${numberAnalysis.delay > parseFloat(numberAnalysis.avgDelay) ? 'text-amber-500' : 'text-white'}`}>{numberAnalysis.delay}</span>
                                                        <span className="text-sm font-bold text-slate-500">concursos</span>
                                                    </div>
                                                    <div className="mt-4 bg-slate-950/50 rounded-lg p-2 flex items-center justify-between border border-white/5">
                                                        <span className="text-[10px] text-slate-500 font-bold">MÉDIA HISTÓRICA</span>
                                                        <span className="text-xs font-black text-slate-300">{numberAnalysis.avgDelay}</span>
                                                    </div>
                                                </div>
                                            </Card>

                                            {/* Trend Card */}
                                            <Card className="stats-card opacity-0 bg-slate-900/60 p-5 border border-white/5 relative overflow-hidden flex flex-col items-center justify-center text-center group hover:border-blue-500/20 transition-all">
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/50 pointer-events-none"></div>
                                                <TrendingUp className={`mb-3 ${numberAnalysis.trendColor || 'text-slate-500'}`} size={32} />
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tendência Estatística</p>
                                                <p className={`text-xl font-black ${numberAnalysis.trendColor || 'text-white'}`}>
                                                    {numberAnalysis.trend || 'Calculando...'}
                                                </p>
                                            </Card>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
                                            {/* Partners Card (Wider) */}
                                            <Card className="stats-card opacity-0 col-span-1 md:col-span-4 bg-slate-900/60 p-5 border border-white/5 relative overflow-hidden">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Users size={16} className="text-blue-400" />
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Melhores Parceiros (12m)</p>
                                                </div>
                                                <div className="flex items-center justify-around">
                                                    {numberAnalysis.topPartners && numberAnalysis.topPartners.length > 0 ? numberAnalysis.topPartners.map((p: any, idx: number) => (
                                                        <div key={p.num} className="flex flex-col items-center group/partner cursor-pointer">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black mb-2 transition-all 
                                                                ${idx === 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 scale-110' : 'bg-slate-800 text-slate-400 border border-white/10 group-hover/partner:bg-slate-700'}
                                                            `}>
                                                                {p.num}
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-xs font-bold text-white">{p.count}x</span>
                                                                <span className="text-[9px] text-slate-500 uppercase">Juntos</span>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <span className="text-xs text-slate-600 italic">Sem dados suficientes.</span>
                                                    )}
                                                </div>
                                            </Card>

                                            {/* Status Summary (Narrower) */}
                                            <Card className="stats-card opacity-0 col-span-1 md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 p-5 border border-white/5 flex flex-col justify-center items-center text-center relative overflow-hidden">
                                                {(() => {
                                                    const delay = numberAnalysis.delay;
                                                    const avg = parseFloat(numberAnalysis.avgDelay);

                                                    if (delay > avg * 1.5) {
                                                        return (
                                                            <>
                                                                <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse"></div>
                                                                <AlertCircle size={32} className="text-red-500 mb-2" />
                                                                <p className="text-red-500 font-bold text-sm">Atraso Crítico</p>
                                                                <p className="text-[10px] text-slate-500 mt-1">Muito acima da média</p>
                                                            </>
                                                        );
                                                    } else if (delay > avg) {
                                                        return (
                                                            <>
                                                                <div className="absolute inset-0 bg-amber-500/5 pointer-events-none"></div>
                                                                <AlertCircle size={32} className="text-amber-500 mb-2" />
                                                                <p className="text-amber-500 font-bold text-sm">Atrasado</p>
                                                                <p className="text-[10px] text-slate-500 mt-1">Acima da média</p>
                                                            </>
                                                        );
                                                    } else if (delay > avg * 0.7) {
                                                        return (
                                                            <>
                                                                <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none"></div>
                                                                <AlertCircle size={32} className="text-yellow-500 mb-2" />
                                                                <p className="text-yellow-500 font-bold text-sm">Atenção</p>
                                                                <p className="text-[10px] text-slate-500 mt-1">Próximo da média</p>
                                                            </>
                                                        );
                                                    } else {
                                                        return (
                                                            <>
                                                                <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none"></div>
                                                                <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                                                                <p className="text-emerald-500 font-bold text-sm">Em Dia</p>
                                                                <p className="text-[10px] text-slate-500 mt-1">Dentro do esperado</p>
                                                            </>
                                                        );
                                                    }
                                                })()}
                                            </Card>
                                        </div>

                                        <div className="mt-8 stats-card opacity-0">
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <History size={16} className="text-slate-500" /> Últimas Ocorrências Reais
                                            </h3>
                                            <div className="space-y-3 min-h-[300px]">
                                                {numberAnalysis.occurrences
                                                    .slice((modalPage - 1) * 5, modalPage * 5)
                                                    .map((occ: any) => (
                                                        <div key={occ.concurso} className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex items-center justify-between hover:bg-slate-900 transition-colors">
                                                            <div>
                                                                <span className="text-xs font-black text-emerald-500">Concurso {occ.concurso}</span>
                                                                <p className="text-[10px] text-slate-500 font-bold">{occ.data}</p>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {occ.dezenas.map((d: any) => {
                                                                    const isTarget = d.toString().padStart(2, '0') === numberAnalysis.number;
                                                                    return (
                                                                        <div key={d} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${isTarget ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-950 text-slate-600'}`}>
                                                                            {d.toString().padStart(2, '0')}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                {numberAnalysis.occurrences.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center h-[200px] text-slate-500 italic text-sm border border-dashed border-white/5 rounded-2xl">
                                                        <p>Nenhuma ocorrência encontrada nos últimos 12 meses.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {numberAnalysis.occurrences.length > 5 && (
                                                <div className="flex justify-center mt-8">
                                                    <Pagination
                                                        total={Math.ceil(numberAnalysis.occurrences.length / 5)}
                                                        page={modalPage}
                                                        onChange={setModalPage}
                                                        size="sm" // Compact size
                                                        variant="light"
                                                        classNames={{
                                                            cursor: "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20",
                                                            item: "text-slate-500 font-bold hover:bg-white/5 data-[disabled=true]:text-slate-800"
                                                        }}
                                                        showControls
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* PRO UPGRADE MODAL */}
            <Modal
                isOpen={showProModal}
                onOpenChange={setShowProModal}
                backdrop="blur"
                classNames={{
                    base: "bg-slate-950 border border-amber-500/20",
                    header: "border-b border-white/5",
                    footer: "border-t border-white/5",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 items-center text-center pt-8">
                                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                    <Crown className="text-amber-500" size={32} />
                                </div>
                                <h2 className="text-2xl font-black text-white">Recurso Exclusivo PRO</h2>
                            </ModalHeader>
                            <ModalBody className="text-center px-8 pb-8">
                                <p className="text-slate-400 mb-6">
                                    Esta análise avançada faz parte do pacote de inteligência PRO. Desbloqueie o acesso completo ao histórico global, filtros avançados e exportação de dados.
                                </p>
                                <ul className="text-left space-y-3 mb-6 bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                                    <li className="flex items-center gap-3 text-sm text-slate-300">
                                        <Lock size={14} className="text-amber-500" />
                                        <span>Acesso ilimitado ao Histórico Global</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-slate-300">
                                        <Lock size={14} className="text-amber-500" />
                                        <span>Análise de Tendências de Longo Prazo</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-slate-300">
                                        <Lock size={14} className="text-amber-500" />
                                        <span>Exportação de Dados em CSV</span>
                                    </li>
                                </ul>
                                <Button
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                                    size="lg"
                                    onPress={() => window.location.href = '/dashboard/subscription'}
                                >
                                    DESBLOQUEAR AGORA
                                </Button>
                                <Button
                                    variant="light"
                                    className="w-full text-slate-500 font-bold mt-2"
                                    onPress={onClose}
                                >
                                    Talvez depois
                                </Button>
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
