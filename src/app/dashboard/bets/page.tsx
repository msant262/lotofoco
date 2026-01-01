'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { getUserBets, SavedBet, updateBetStatus } from "@/lib/firebase/bets-client";
import { getDrawDetailsClient, DrawDetails } from "@/lib/firebase/games-client";
import { LOTTERIES } from "@/lib/config/lotteries";
import { SavedBetDialog } from "@/components/lottery/saved-bet-dialog";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import anime from "animejs/lib/anime.es.js";

import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Chip,
    Tabs,
    Tab,
    Spinner
} from "@heroui/react";

import {
    Plus,
    RefreshCw,
    Trophy,
    XCircle,
    Clock,
    Target,
    CheckCircle2
} from "lucide-react";

// ==================== TIPOS ====================
interface BetWithResult extends SavedBet {
    result?: DrawDetails;
    maxHits?: number;
}

// ==================== COMPONENTES ====================

const LotteryBall = ({ number, isWinner }: { number: string; isWinner: boolean }) => (
    <div
        className={`
            w-14 h-14 md:w-16 md:h-16 
            rounded-full 
            flex items-center justify-center 
            font-black text-lg md:text-xl
            transition-all duration-300
            ${isWinner
                ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/50 scale-110 animate-pulse ring-4 ring-emerald-300/30'
                : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-slate-300 shadow-lg border-2 border-slate-600/50'
            }
        `}
    >
        {number.padStart(2, '0')}
    </div>
);

const OfficialDrawResult = ({ draw, userNumbers = [] }: { draw: DrawDetails; userNumbers?: string[] }) => {
    const isHit = (num: string) => userNumbers.some(n => parseInt(n) === parseInt(num));

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 border-2 border-emerald-500/30 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Sorteio Oficial</p>
                    <p className="text-sm font-black text-white">Concurso {draw.concurso}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {draw.dezenas.map((num, idx) => (
                    <div
                        key={idx}
                        className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg
                            ${isHit(num)
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black ring-4 ring-yellow-300/50 scale-110'
                                : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                            }
                        `}
                    >
                        {num}
                    </div>
                ))}
            </div>
            {userNumbers.length > 0 && (
                <div className="mt-3 text-xs text-slate-400 text-center">
                    <span className="inline-flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        Números que você acertou
                    </span>
                </div>
            )}
        </div>
    );
};

const BetCard = ({
    bet,
    onOpen,
    isChecked
}: {
    bet: BetWithResult;
    onOpen: () => void;
    isChecked: boolean;
}) => {
    const lottery = Object.values(LOTTERIES).find(l => l.slug === bet.gameSlug);
    const color = lottery?.hexColor || '#10b981';

    const firstGame = bet.games?.[0] || { main: bet.numbers || [] };
    const numbers = firstGame.main;
    const drawnNumbers = bet.result?.dezenas || [];

    const hits = bet.maxHits || 0;
    const isWinner = bet.status === 'won';
    const isLoser = bet.status === 'lost';

    const checkIfHit = (num: string) => {
        return drawnNumbers.some(d => parseInt(d) === parseInt(num));
    };

    return (
        <Card
            isPressable
            onPress={onOpen}
            className={`
                bet-card-item
                w-full 
                border-3 
                transition-all 
                duration-500 
                hover:scale-[1.02] 
                hover:shadow-2xl
                ${isWinner ? 'bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 border-emerald-500/50 shadow-emerald-500/20' : ''}
                ${isLoser ? 'bg-gradient-to-br from-red-950/40 to-red-900/20 border-red-500/50 shadow-red-500/20' : ''}
                ${!isChecked ? 'bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50' : ''}
            `}
            shadow="lg"
        >
            <CardHeader className="flex-col items-start gap-4 p-6">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-white text-3xl shadow-2xl relative overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${color}dd, ${color})` }}
                        >
                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                            <span className="relative z-10">{bet.gameName.slice(0, 2).toUpperCase()}</span>
                        </div>

                        <div>
                            <h3 className="text-2xl font-black text-white mb-1">{bet.gameName}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Clock className="w-4 h-4" />
                                <span>{bet.concurso ? `Concurso ${bet.concurso}` : 'Aguardando'}</span>
                                <span className="text-slate-600">•</span>
                                <span>
                                    {bet.createdAt?.seconds
                                        ? new Date(bet.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                                        : 'Hoje'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    {isChecked && (
                        <Chip
                            size="lg"
                            variant="flat"
                            className={`font-black text-base ${isWinner
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                                }`}
                            startContent={isWinner ? <Trophy className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        >
                            {hits > 0 ? `${hits} Acerto${hits > 1 ? 's' : ''}` : 'Sem Acertos'}
                        </Chip>
                    )}

                    {!isChecked && (
                        <Chip
                            size="lg"
                            variant="dot"
                            color="warning"
                            className="font-bold text-base"
                        >
                            Pendente
                        </Chip>
                    )}
                </div>
            </CardHeader>

            <CardBody className="px-6 pb-6 pt-0">
                {/* Resultado Oficial */}
                {bet.result && (
                    <div className="mb-5">
                        <OfficialDrawResult draw={bet.result} userNumbers={numbers} />
                    </div>
                )}

                {/* Aviso quando conferido mas sem resultado */}
                {isChecked && !bet.result && (
                    <div className="mb-5 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <p className="text-sm text-yellow-400 font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {bet.concurso
                                ? `Aguardando resultado do Concurso ${bet.concurso}`
                                : 'Nenhum concurso associado a este bilhete'
                            }
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {numbers.slice(0, 15).map((num, idx) => (
                        <LotteryBall
                            key={idx}
                            number={num}
                            isWinner={!!bet.result && checkIfHit(num)}
                        />
                    ))}

                    {(numbers.length > 15 || (bet.games?.length || 0) > 1) && (
                        <div className="w-16 h-16 rounded-full bg-slate-800/50 border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-500 font-bold text-sm">
                            +{bet.games?.length || 1}
                        </div>
                    )}
                </div>

                {bet.games && bet.games.length > 1 && (
                    <p className="text-sm text-slate-500 mt-4 text-center md:text-left font-medium">
                        📦 Bilhete com {bet.games.length} jogos • Toque para ver todos
                    </p>
                )}
            </CardBody>
        </Card>
    );
};

// ==================== PÁGINA PRINCIPAL ====================

export default function BetsPage() {
    const { user } = useAuth();

    const [allBets, setAllBets] = useState<BetWithResult[]>([]);
    const [results, setResults] = useState<Record<string, DrawDetails>>({});
    const [userPlan, setUserPlan] = useState('free');

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedBet, setSelectedBet] = useState<BetWithResult | null>(null);

    // ========== CARREGAR DADOS ==========
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            setLoading(true);

            try {
                const [betsData, userDoc] = await Promise.all([
                    getUserBets(user.uid),
                    getDoc(doc(db, 'users', user.uid))
                ]);

                const userData = userDoc.exists() ? userDoc.data() : null;
                const isProUser = userData?.isPro === true || userData?.subscriptionStatus === 'active';
                setUserPlan(isProUser ? 'pro' : 'free');

                await fetchResults(betsData);
            } catch (error) {
                console.error('Erro ao carregar:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // ========== BUSCAR RESULTADOS ==========
    const fetchResults = async (bets: SavedBet[]) => {
        const contestsToFetch = new Set<string>();

        bets.forEach(bet => {
            if (bet.concurso) {
                const key = `${bet.gameSlug}-${bet.concurso}`;
                if (!results[key]) {
                    contestsToFetch.add(key);
                }
            }
        });

        if (contestsToFetch.size === 0) {
            // Mesmo sem novos resultados, atualizar bets com resultados existentes
            await updateBetStatuses(bets, results);
            return;
        }

        const newResults: Record<string, DrawDetails> = { ...results };

        await Promise.all(
            Array.from(contestsToFetch).map(async (key) => {
                const [slug, contest] = key.split('-');
                try {
                    const data = await getDrawDetailsClient(slug, parseInt(contest));
                    if (data) {
                        newResults[key] = data;

                    }
                } catch (err) {
                    console.error(`Erro ao buscar ${key}:`, err);
                }
            })
        );

        setResults(newResults);
        await updateBetStatuses(bets, newResults);
    };

    // ========== ATUALIZAR STATUS ==========
    const updateBetStatuses = async (bets: SavedBet[], drawResults: Record<string, DrawDetails>) => {
        if (!user) return;

        const updated: BetWithResult[] = [];

        for (const bet of bets) {
            const betCopy: BetWithResult = { ...bet };

            if (bet.concurso) {
                const resultKey = `${bet.gameSlug}-${bet.concurso}`;
                const draw = drawResults[resultKey];

                if (draw) {
                    // SEMPRE anexar o resultado
                    betCopy.result = draw;

                    const games = bet.games || (bet.numbers ? [{ main: bet.numbers }] : []);
                    let maxHits = 0;
                    let hasWin = false;

                    games.forEach(game => {
                        const hits = game.main.filter(n =>
                            draw.dezenas.some(d => parseInt(d) === parseInt(n))
                        ).length;

                        if (hits > maxHits) maxHits = hits;

                        if (checkWinCondition(bet.gameSlug, hits)) {
                            hasWin = true;
                        }
                    });

                    betCopy.maxHits = maxHits;

                    // Atualizar status se ainda estiver pendente
                    if (bet.status === 'pending') {
                        const newStatus = hasWin ? 'won' : 'lost';
                        betCopy.status = newStatus;

                        updateBetStatus(user.uid, bet.id!, newStatus).catch(console.error);
                    }
                }
            }

            updated.push(betCopy);
        }


        setAllBets(updated);
    };

    // ========== VERIFICAR PRÊMIO ==========
    const checkWinCondition = (gameSlug: string, hits: number): boolean => {
        const conditions: Record<string, number> = {
            'mega-sena': 4,
            'lotofacil': 11,
            'quina': 2,
            'lotomania': 15,
            'dia-de-sorte': 4,
            'timemania': 3,
            'dupla-sena': 3
        };

        return hits >= (conditions[gameSlug] || 4);
    };

    // ========== ATUALIZAR MANUAL ==========
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchResults(allBets);
        setRefreshing(false);
    };

    // ========== ANIMAÇÃO ==========
    useEffect(() => {
        if (!loading && allBets.length > 0) {
            setTimeout(() => {
                anime({
                    targets: '.bet-card-item',
                    translateY: [30, 0],
                    opacity: [0, 1],
                    delay: anime.stagger(80),
                    duration: 600,
                    easing: 'easeOutCubic'
                });
            }, 100);
        }
    }, [loading, allBets.length]);

    // ========== FILTROS ==========
    const pendingBets = allBets.filter(b => b.status === 'pending');
    const checkedBets = allBets.filter(b => b.status === 'won' || b.status === 'lost');

    // ========== LOADING ==========
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <Spinner size="lg" color="success" />
                <p className="text-xl text-slate-400 animate-pulse font-medium">Carregando apostas...</p>
            </div>
        );
    }

    // ========== RENDER ==========
    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b-2 border-white/10">
                <div>
                    <h1 className="text-5xl font-black text-white mb-2 flex items-center gap-4">
                        Meus Jogos
                        {refreshing && <Spinner size="md" color="warning" />}
                    </h1>
                    <p className="text-lg text-slate-400">
                        Acompanhe e confira seus jogos salvos
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        isIconOnly
                        size="lg"
                        variant="flat"
                        className="bg-slate-800 hover:bg-slate-700 text-white"
                        onPress={handleRefresh}
                        isLoading={refreshing}
                    >
                        {!refreshing && <RefreshCw className="w-6 h-6" />}
                    </Button>

                    <Button
                        as={Link}
                        href="/apostas/quina"
                        size="lg"
                        color="primary"
                        className="font-bold shadow-xl shadow-emerald-500/30"
                        endContent={<Plus className="w-5 h-5" />}
                    >
                        Novo Jogo
                    </Button>
                </div>
            </div>

            {/* TABS */}
            <Tabs
                size="lg"
                color="primary"
                variant="underlined"
                classNames={{
                    tabList: "gap-10 border-b-2 border-white/10",
                    cursor: "bg-emerald-500 h-1",
                    tab: "h-16 px-0",
                    tabContent: "group-data-[selected=true]:text-emerald-400 font-black text-xl"
                }}
            >
                <Tab
                    key="pending"
                    title={
                        <div className="flex items-center gap-3">
                            <Clock className="w-6 h-6" />
                            <span>A Conferir</span>
                            <Chip size="md" className="bg-yellow-500/20 text-yellow-400 font-bold">
                                {pendingBets.length}
                            </Chip>
                        </div>
                    }
                >
                    <div className="grid grid-cols-1 gap-6 mt-8">
                        {pendingBets.length > 0 ? (
                            pendingBets.map(bet => (
                                <BetCard
                                    key={bet.id}
                                    bet={bet}
                                    onOpen={() => setSelectedBet(bet)}
                                    isChecked={false}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 bg-slate-900/30 rounded-3xl border-2 border-dashed border-white/10">
                                <CheckCircle2 className="w-24 h-24 text-slate-700 mb-6" />
                                <p className="text-2xl text-slate-500 font-bold mb-4">Nenhum jogo pendente</p>
                                <Button
                                    as={Link}
                                    href="/apostas/quina"
                                    color="primary"
                                    size="lg"
                                    className="font-bold"
                                >
                                    Fazer uma aposta
                                </Button>
                            </div>
                        )}
                    </div>
                </Tab>

                <Tab
                    key="checked"
                    title={
                        <div className="flex items-center gap-3">
                            <Target className="w-6 h-6" />
                            <span>Conferidos</span>
                            <Chip size="md" className="bg-emerald-500/20 text-emerald-400 font-bold">
                                {checkedBets.length}
                            </Chip>
                        </div>
                    }
                >
                    <div className="grid grid-cols-1 gap-6 mt-8">
                        {checkedBets.length > 0 ? (
                            checkedBets.map(bet => (
                                <BetCard
                                    key={bet.id}
                                    bet={bet}
                                    onOpen={() => setSelectedBet(bet)}
                                    isChecked={true}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 bg-slate-900/30 rounded-3xl border-2 border-dashed border-white/10">
                                <Trophy className="w-24 h-24 text-slate-700 mb-6" />
                                <p className="text-2xl text-slate-500 font-bold">Nenhum histórico</p>
                            </div>
                        )}
                    </div>
                </Tab>
            </Tabs>

            {/* MODAL */}
            <SavedBetDialog
                open={!!selectedBet}
                onOpenChange={(open) => !open && setSelectedBet(null)}
                bet={selectedBet}
                plan={userPlan}
                result={selectedBet?.result}
            />
        </div>
    );
}
