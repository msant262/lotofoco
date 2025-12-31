'use client';

import { useEffect, useState, useRef } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Skeleton,
    Avatar,
    Divider,
    Tabs,
    Tab,
    Link as HeroLink
} from "@heroui/react";
import { useAuth } from '@/components/providers/auth-provider';
import { getUserBets, SavedBet } from '@/lib/firebase/bets-client';
import {
    CheckCircle2,
    Trophy,
    Sparkles,
    Zap,
    History,
    Calendar,
    Ticket,
    ArrowRight
} from "lucide-react";
import { LOTTERIES } from '@/lib/config/lotteries';
import anime from 'animejs';
import confetti from 'canvas-confetti';

interface GameResult {
    concurso: number;
    dezenas: string[];
    data: string; // DD/MM/YYYY
    [key: string]: any;
}

export default function CheckerPage() {
    const { user } = useAuth();
    const [bets, setBets] = useState<SavedBet[]>([]);
    const [results, setResults] = useState<Record<string, GameResult>>({});
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);

    // Default Tab
    const [selectedTab, setSelectedTab] = useState("pending");

    useEffect(() => {
        if (user) { loadBets(); }
    }, [user]);

    // Entry Animations
    useEffect(() => {
        if (!loading && bets.length > 0) {
            anime({
                targets: '.bet-card',
                translateY: [20, 0],
                opacity: [0, 1],
                delay: anime.stagger(100),
                easing: 'easeOutQuad'
            });
        }
    }, [loading, bets, selectedTab]);

    const loadBets = async () => {
        setLoading(true);
        try {
            const userBets = await getUserBets(user?.uid || '');
            setBets(userBets);

            // Initial fetch of "Latest" for all types 
            const gameSlugs = new Set(userBets.map(b => b.gameSlug));
            const initialResults: Record<string, GameResult> = {};

            await Promise.all(Array.from(gameSlugs).map(async (slug) => {
                try {
                    const res = await fetch(`/api/proxy-caixa?slug=${slug}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.concurso) {
                            initialResults[`${slug}-latest`] = data;
                        }
                    }
                } catch (e) { console.error("Initial fetch error", e) }
            }));

            setResults(prev => ({ ...prev, ...initialResults }));

        } catch (error) { console.error("Error loading bets:", error); }
        finally { setLoading(false); }
    };

    const handleCheckAll = async () => {
        setChecking(true);

        const tasks: { slug: string, concurso?: number }[] = [];
        const seen = new Set<string>();

        bets.forEach(bet => {
            // Always fetch based on assigned contest if present
            if (bet.concurso) {
                const key = `${bet.gameSlug}-${bet.concurso}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    tasks.push({ slug: bet.gameSlug, concurso: bet.concurso });
                }
            }
            // Ensure we always have latest for "Future" projection logic
            const latestKey = `${bet.gameSlug}-latest`;
            if (!seen.has(latestKey)) {
                seen.add(latestKey);
                tasks.push({ slug: bet.gameSlug });
            }
        });

        const newResults: Record<string, GameResult> = {};
        await Promise.all(tasks.map(async (task) => {
            try {
                const url = `/api/proxy-caixa?slug=${task.slug}${task.concurso ? `&concurso=${task.concurso}` : ''}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.dezenas) {
                        const key = `${task.slug}-${task.concurso || 'latest'}`;
                        newResults[key] = data;
                    }
                }
            } catch (e) { console.error(e); }
        }));

        setResults(prev => ({ ...prev, ...newResults }));
        setChecking(false);

        // Trigger WIN Animations
        setTimeout(() => triggerWinAnimations(), 100);
    };

    const triggerWinAnimations = () => {
        const matches = document.querySelectorAll('.match-ball-pending');
        if (matches.length > 0) {
            anime({
                targets: matches,
                scale: [0.8, 1.3, 1],
                backgroundColor: '#10b981',
                color: '#ffffff',
                duration: 800,
                delay: anime.stagger(50),
                easing: 'spring(1, 80, 10, 0)'
            });

            const winners = document.querySelectorAll('.winner-glow');
            if (winners.length > 0) {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#F0E68C', '#FFA500']
                });
            }
        }
    };

    const getMatchInfo = (mainNums: string[], resultNums: string[]) => {
        const main = mainNums.map(n => parseInt(n).toString());
        const res = resultNums.map(n => parseInt(n).toString());
        const matches = main.filter(n => res.includes(n));
        return { count: matches.length, matchedNums: matches };
    };

    const getPrizeStatus = (slug: string, count: number) => {
        if (slug === 'mega-sena') {
            if (count === 6) return { label: 'SENA', isWin: true };
            if (count === 5) return { label: 'QUINA', isWin: true };
            if (count === 4) return { label: 'QUADRA', isWin: true };
        }
        if (slug === 'lotofacil') {
            if (count >= 15) return { label: '15 PONTOS', isWin: true };
            if (count >= 14) return { label: '14 PONTOS', isWin: true };
            if (count >= 13) return { label: '13 PONTOS', isWin: true };
            if (count >= 12) return { label: '12 PONTOS', isWin: true };
            if (count >= 11) return { label: '11 PONTOS', isWin: true };
        }
        if (slug === 'quina') {
            if (count === 5) return { label: 'QUINA', isWin: true };
            if (count === 4) return { label: 'QUADRA', isWin: true };
            if (count === 3) return { label: 'TERNO', isWin: true };
            if (count === 2) return { label: 'DUQUE', isWin: true };
        }
        if (slug === 'lotomania' && (count >= 15 || count === 0)) return { label: `${count} PTS`, isWin: true };
        if (slug === 'dia-de-sorte' && count >= 4) return { label: `${count} PTS`, isWin: true };
        if (slug === 'timemania' && count >= 3) return { label: `${count} PTS`, isWin: true };

        return { label: '', isWin: false };
    };

    const parseDateValues = (dateStr: string) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day, 23, 59, 59); // Assume end of the draw day
    };

    const filteredBets = bets.filter(bet => {
        if (selectedTab === 'all') return true;
        return true;
    });

    return (
        <div className="min-h-screen pb-40 relative overflow-hidden animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 relative z-10 space-y-12">

                {/* Header & Button */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/5 pb-8">
                    <div className="space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-widest">
                            <Sparkles size={12} className="text-emerald-400" />
                            Validar Jogos
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                            Conferência <span className="text-emerald-400">Inteligente</span>
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Selecione seus jogos e descubra instantaneamente se você é o mais novo milionário.
                        </p>
                    </div>

                    <div className="w-full md:w-auto">
                        <Button
                            size="lg"
                            className={`w-full md:w-auto font-bold text-lg h-14 px-8 rounded-2xl shadow-xl transition-all duration-300 ${checking ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500 text-white hover:bg-emerald-400 hover:scale-105 shadow-emerald-500/20'}`}
                            startContent={!checking && <Zap size={24} className="fill-white" />}
                            isLoading={checking}
                            onPress={handleCheckAll}
                        >
                            {checking ? 'PROCESSANDO...' : 'CONFERIR AGORA'}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div>
                    <Tabs
                        aria-label="Filter"
                        color="success"
                        variant="light"
                        classNames={{
                            tabList: "gap-2",
                            cursor: "bg-emerald-500/20 rounded-xl",
                            tab: "h-10 px-4 text-slate-400 data-[selected=true]:text-emerald-400 font-bold uppercase tracking-wider text-sm",
                        }}
                        selectedKey={selectedTab}
                        onSelectionChange={(k) => setSelectedTab(k as string)}
                    >
                        <Tab key="pending" title="Pendentes" />
                        <Tab key="finished" title="Concluídos" />
                        <Tab key="all" title="Todos" />
                    </Tabs>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-8">
                    {loading ? (
                        // Skeleton UI
                        [1, 2].map(i => (
                            <Card key={i} className="w-full bg-slate-900/50 border border-white/5 p-6 space-y-4">
                                <div className="flex gap-4">
                                    <Skeleton className="w-16 h-16 rounded-2xl bg-slate-800" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="w-1/3 h-6 rounded-lg bg-slate-800" />
                                        <Skeleton className="w-1/4 h-4 rounded-lg bg-slate-800" />
                                    </div>
                                </div>
                                <Skeleton className="w-full h-32 rounded-2xl bg-slate-800" />
                            </Card>
                        ))
                    ) : bets.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center text-center opacity-70">
                            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                                <Ticket size={40} className="text-slate-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Nenhum palpite encontrado</h3>
                            <p className="text-slate-400 mt-2 max-w-sm mx-auto">Salve seus primeiros jogos no gerador para que eles apareçam aqui.</p>
                        </div>
                    ) : (
                        filteredBets.map((bet) => {
                            const latestResultKey = `${bet.gameSlug}-latest`;
                            const latestResult = results[latestResultKey];

                            const gameConfig = Object.values(LOTTERIES).find(l => l.slug === bet.gameSlug);
                            const hexColor = gameConfig?.hexColor || '#10b981';

                            // -------------------------------------------------------------
                            // CORE LOGIC REFACTOR (Date based)
                            // -------------------------------------------------------------

                            let displayedContest = '???';
                            let isFutureBet = false;

                            // Reference time: Bet Creation
                            const betDate = new Date(bet.createdAt?.seconds * 1000);

                            // We need 'latestResult' to perform the date math
                            if (latestResult && latestResult.data) {
                                const drawDate = parseDateValues(latestResult.data);

                                if (drawDate) {
                                    if (betDate > drawDate) {
                                        // User bought AFTER the draw date -> It's for the NEXT contest
                                        displayedContest = (latestResult.concurso + 1).toString();
                                        isFutureBet = true; // Use this to force Pending status
                                    } else {
                                        // User bought BEFORE or ON draw date -> It's for THIS (latest) contest
                                        displayedContest = latestResult.concurso.toString();
                                        isFutureBet = false;
                                    }
                                }
                            } else if (bet.concurso) {
                                displayedContest = bet.concurso.toString();
                            }

                            // Determine which result (if any) to check against
                            let validResult = null;
                            if (!isFutureBet) {
                                const key = `${bet.gameSlug}-${displayedContest}`;
                                if (results[key]) {
                                    validResult = results[key];
                                } else if (latestResult && latestResult.concurso.toString() === displayedContest) {
                                    validResult = latestResult;
                                }
                            }

                            const resultDezenas = validResult ? validResult.dezenas : [];
                            const gamesToCheck = bet.games?.length ? bet.games : (bet.numbers ? [{ main: bet.numbers, extras: [] }] : []);

                            let isWinner = false;
                            if (validResult) {
                                gamesToCheck.forEach(g => {
                                    const { count } = getMatchInfo(g.main, resultDezenas);
                                    if (getPrizeStatus(bet.gameSlug, count).isWin) isWinner = true;
                                });
                            }

                            return (
                                <Card
                                    key={bet.id}
                                    className={`
                                        bet-card w-full border-none overflow-visible transition-all duration-500 rounded-3xl group
                                        ${isWinner ? 'winner-glow shadow-[0_0_50px_rgba(234,179,8,0.2)] transform scale-[1.01]' : 'shadow-xl hover:shadow-2xl hover:scale-[1.01]'}
                                    `}
                                    style={{
                                        background: `linear-gradient(145deg, ${hexColor}15 0%, #1e293b 100%)`,
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    shadow="none"
                                >
                                    {/* Scanning Beam */}
                                    {checking && (
                                        <div className="absolute inset-0 z-50 pointer-events-none rounded-3xl overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_25px_#34d399] animate-[scan_1.5s_ease-in-out_infinite]" />
                                        </div>
                                    )}

                                    <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 pb-4 gap-6 relative z-10">
                                        <div className="flex items-center gap-6">
                                            {/* Lottery Icon */}
                                            <div
                                                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-2xl ring-1 ring-white/10 relative overflow-hidden"
                                                style={{ backgroundColor: hexColor }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                                                <span className="relative z-10 drop-shadow-md">{bet.gameName.substring(0, 2).toUpperCase()}</span>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-3xl font-black text-white">{bet.gameName}</h3>
                                                    {isWinner && (
                                                        <Chip className="bg-yellow-400 text-black font-black uppercase tracking-wider animate-pulse shadow-lg">
                                                            PREMIADO
                                                        </Chip>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 mt-3 text-slate-400 font-medium">
                                                    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-xl border border-white/5">
                                                        <Ticket size={14} className="text-slate-300" />
                                                        <span>{bet.games?.length || 1} Jogo(s)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-xl border border-white/5">
                                                        <History size={14} className="text-slate-300" />
                                                        <span>Conc. <strong className="text-emerald-400">{displayedContest}</strong> {isFutureBet && '(Próximo)'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-xl border border-white/5">
                                                        <Calendar size={14} className="text-slate-300" />
                                                        <span>{new Date(bet.createdAt?.seconds * 1000).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 self-start md:self-center">
                                            {validResult ? (
                                                <div className="flex items-center gap-2 text-emerald-300 bg-emerald-500/20 px-4 py-2 rounded-xl border border-emerald-500/20 font-bold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                                    <CheckCircle2 size={16} /> Verificado
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400 bg-black/20 px-4 py-2 rounded-xl border border-white/5 font-bold uppercase tracking-wider text-xs">
                                                    Pendente
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <Divider className="bg-white/5 my-2 w-[95%] mx-auto" />

                                    <CardBody className="p-8 pt-4 relative z-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {gamesToCheck.map((game, idx) => {
                                                const matchInfo = validResult ? getMatchInfo(game.main, resultDezenas) : null;
                                                const status = validResult ? getPrizeStatus(bet.gameSlug, matchInfo!.count) : { label: '', isWin: false };

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`
                                                            relative p-5 rounded-2xl border transition-all duration-300
                                                            ${status.isWin
                                                                ? 'bg-yellow-500/10 border-yellow-500/40 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)]'
                                                                : 'bg-black/20 border-white/5 hover:bg-black/30 group-hover:border-white/10'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                                                                Jogo {idx + 1}
                                                            </span>
                                                            {status.isWin && (
                                                                <div className="flex items-center gap-1.5 text-yellow-400 font-black text-xs uppercase tracking-wider bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/20">
                                                                    <Trophy size={11} className="fill-yellow-400" />
                                                                    {status.label}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap gap-2.5">
                                                            {game.main.map((num, i) => {
                                                                const isMatched = matchInfo?.matchedNums.includes(parseInt(num).toString());
                                                                return (
                                                                    <div
                                                                        key={i}
                                                                        className={`
                                                                            w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 border
                                                                            ${isMatched
                                                                                ? 'match-ball-pending bg-emerald-500 text-white border-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                                                                                : 'bg-slate-800/40 text-slate-400 border-white/5'
                                                                            }
                                                                        `}
                                                                    >
                                                                        {num}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
             `}</style>
        </div>
    );
}
