'use client';

import { useAuth } from "@/components/providers/auth-provider";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Spacer,
    Progress,
    Avatar,
    Link as HeroLink
} from "@heroui/react";
import Link from "next/link";
import {
    Gem, History, ArrowRight, Wallet, Target, Trophy, Plus, Calendar, Sparkles, TrendingUp,
    CheckCircle2, AlertTriangle, User as UserIcon
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { getUserBets, SavedBet } from "@/lib/firebase/bets-client";
import { LOTTERIES } from "@/lib/config/lotteries";
import { SavedBetDialog } from "@/components/lottery/saved-bet-dialog";

export const runtime = 'edge';

export default function DashboardPage() {
    const { user } = useAuth();
    const [plan, setPlan] = useState<string>('free');
    const [bets, setBets] = useState<SavedBet[]>([]);
    const [selectedBet, setSelectedBet] = useState<SavedBet | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (user && db) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        setPlan(userSnap.data().plan || 'free');
                    }

                    const userBets = await getUserBets(user.uid);
                    setBets(userBets);
                } catch (e) {
                    console.error("Error loading dashboard", e);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [user]);

    const recentBets = bets.slice(0, 5);
    const totalBets = bets.length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 min-h-screen">
            {/* Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Dashboard
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">
                        Bem-vindo de volta, <span className="text-emerald-400 font-bold">{user?.displayName?.split(' ')[0] || 'Apostador'}</span> 👋
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        as={Link}
                        href="/pricing"
                        variant="flat"
                        color={plan === 'pro' ? "secondary" : "warning"}
                        startContent={<Gem size={16} />}
                    >
                        {plan === 'pro' ? 'Gerenciar Plano' : 'Seja PRO'}
                    </Button>
                    <Button
                        as={Link}
                        href="/apostas/quina"
                        color="primary"
                        variant="shadow"
                        className="font-bold bg-gradient-to-r from-emerald-500 to-teal-500 border-none shadow-emerald-500/20"
                        endContent={<Plus size={16} />}
                    >
                        Novo Palpite
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none bg-gradient-to-br from-emerald-500/20 to-emerald-900/10 border border-emerald-500/20 backdrop-blur-md">
                    <CardBody className="flex flex-row items-center justify-between p-6">
                        <div>
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Total de Jogos</p>
                            <h2 className="text-4xl font-black text-white">{loading ? '...' : totalBets}</h2>
                        </div>
                        <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 shadow-lg shadow-emerald-900/20">
                            <Target size={24} />
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-none bg-gradient-to-br from-purple-500/20 to-purple-900/10 border border-purple-500/20 backdrop-blur-md">
                    <CardBody className="flex flex-row items-center justify-between p-6">
                        <div>
                            <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Seu Plano</p>
                            <h2 className="text-4xl font-black text-white uppercase">{loading ? '...' : plan}</h2>
                        </div>
                        <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400 shadow-lg shadow-purple-900/20">
                            <Gem size={24} />
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-none bg-gradient-to-br from-blue-500/20 to-blue-900/10 border border-blue-500/20 backdrop-blur-md">
                    <CardBody className="flex flex-row items-center justify-between p-6">
                        <div>
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Saldo</p>
                            <h2 className="text-4xl font-black text-white">R$ 0,00</h2>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 shadow-lg shadow-blue-900/20">
                            <Wallet size={24} />
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-none bg-gradient-to-br from-yellow-500/20 to-yellow-900/10 border border-yellow-500/20 backdrop-blur-md">
                    <CardBody className="flex flex-row items-center justify-between p-6">
                        <div>
                            <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1">Premiações</p>
                            <h2 className="text-4xl font-black text-white">0</h2>
                        </div>
                        <div className="p-3 bg-yellow-500/20 rounded-2xl text-yellow-400 shadow-lg shadow-yellow-900/20">
                            <Trophy size={24} />
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Bets */}
                <Card className="lg:col-span-2 border-none bg-slate-900/50 backdrop-blur-md">
                    <CardHeader className="flex justify-between items-center px-6 py-5 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <History className="text-emerald-500 w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Atividade Recente</h3>
                        </div>
                        <Button
                            as={Link}
                            href="/dashboard/bets"
                            variant="light"
                            color="primary"
                            size="sm"
                            endContent={<ArrowRight size={14} />}
                            className="font-medium"
                        >
                            Ver todos
                        </Button>
                    </CardHeader>
                    <CardBody className="px-6 py-4 gap-3">
                        {loading ? (
                            <div className="space-y-4 py-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />)}
                            </div>
                        ) : recentBets.length > 0 ? (
                            recentBets.map(bet => {
                                const gameConfig = Object.values(LOTTERIES).find(l => l.slug === bet.gameSlug);
                                const color = gameConfig?.hexColor || '#10b981';

                                return (
                                    <div
                                        key={bet.id}
                                        onClick={() => setSelectedBet(bet)}
                                        className="group cursor-pointer relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 transition-all" style={{ background: color }} />
                                        <div className="flex items-center justify-between p-4 pl-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-lg text-sm"
                                                    style={{ background: `linear-gradient(135deg, ${color}, ${color}80)` }}
                                                >
                                                    {bet.gameName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-base">{bet.gameName}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                        <Calendar size={12} />
                                                        {new Date(bet.createdAt?.seconds * 1000).toLocaleDateString()}
                                                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                                                        <span>{bet.games?.length || 1} jogos</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden sm:flex">
                                                <Chip size="sm" variant="flat" className="bg-slate-800 text-slate-400">Pendente</Chip>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-16 flex flex-col items-center">
                                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 ring-1 ring-white/10">
                                    <History className="text-slate-500 w-8 h-8" />
                                </div>
                                <p className="text-slate-300 font-medium mb-1">Nenhum jogo recente</p>
                                <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Seus jogos salvos aparecerão aqui. Comece criando seu primeiro palpite.</p>
                                <Button as={Link} href="/apostas/quina" color="primary" variant="solid" className="font-bold">Começar Agora</Button>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    {/* Featured */}
                    <Card className="bg-gradient-to-br from-yellow-600 to-orange-700 border-none shadow-2xl relative overflow-hidden h-[340px] group">
                        <CardBody className="p-8 flex flex-col justify-between relative z-10">
                            <div>
                                <Chip className="bg-white/20 text-white backdrop-blur-md border-none mb-4 font-bold shadow-lg">Destaque</Chip>
                                <h3 className="text-3xl font-black text-white mb-2 leading-tight">Mega da Virada</h3>
                                <p className="text-yellow-100 font-medium text-lg opacity-90">O maior prêmio da história.</p>

                                <div className="mt-6 p-4 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10">
                                    <p className="text-xs text-yellow-200 uppercase font-black tracking-widest mb-1">Estimativa</p>
                                    <p className="text-3xl font-black text-white">R$ 600M</p>
                                </div>
                            </div>

                            <Button as={Link} href="/mega-da-virada" className="w-full font-bold bg-white text-orange-900 border-none shadow-xl hover:bg-yellow-50">
                                Apostar Agora
                            </Button>
                        </CardBody>
                        <Trophy className="absolute -bottom-8 -right-8 w-48 h-48 text-white/10 rotate-12 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700" />
                    </Card>

                    {/* Tip */}
                    <Card className="bg-slate-900 border border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                        <CardBody className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <h4 className="text-lg font-bold text-white">Dica de Mestre</h4>
                            </div>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Jogadores que utilizam <strong>fechamentos matemáticos</strong> aumentam em até 500% suas chances de ganhar.
                            </p>
                            <Button as={Link} href="/pricing" variant="light" color="secondary" className="justify-start p-0 font-bold data-[hover=true]:bg-transparent">
                                Desbloquear Estratégias <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            </div>

            <SavedBetDialog
                open={!!selectedBet}
                onOpenChange={(open) => !open && setSelectedBet(null)}
                bet={selectedBet}
                plan={plan}
            />
        </div>
    );
}
