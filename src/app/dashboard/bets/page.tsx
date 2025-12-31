'use client';

import { useAuth } from "@/components/providers/auth-provider";
import { getUserBets, SavedBet } from "@/lib/firebase/bets-client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Target, Plus } from "lucide-react";
import Link from "next/link";
import { LOTTERIES } from "@/lib/config/lotteries";
import { SavedBetDialog } from "@/components/lottery/saved-bet-dialog";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SavedBetsPage() {
    const { user } = useAuth();
    const [bets, setBets] = useState<SavedBet[]>([]);
    const [selectedBet, setSelectedBet] = useState<SavedBet | null>(null);
    const [plan, setPlan] = useState<string>('free');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (user && db) {
                try {
                    const [data, userSnap] = await Promise.all([
                        getUserBets(user.uid),
                        getDoc(doc(db, 'users', user.uid))
                    ]);

                    setBets(data);
                    if (userSnap.exists()) {
                        setPlan(userSnap.data().plan || 'free');
                    }
                } catch (error) {
                    console.error("Error loading bets or plan:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        load();
    }, [user]);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Jogos Salvos</h1>
                    <p className="text-slate-400">Gerencie seus palpites e acompanhe os resultados.</p>
                </div>
                <Link href="/">
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Novo Jogo
                    </Button>
                </Link>
            </div>

            {bets.length === 0 ? (
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center h-64">
                        <Target className="w-12 h-12 text-slate-700 mb-4" />
                        <h3 className="text-lg font-medium text-white">Nenhum jogo salvo</h3>
                        <p className="text-slate-500 mb-4">Seus palpites aparecerão aqui.</p>
                        <Link href="/">
                            <Button variant="outline" className="border-slate-700 text-slate-300">
                                Explorar Loterias
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bets.map((bet) => {
                        const gameConfig = Object.values(LOTTERIES).find(l => l.slug === bet.gameSlug);
                        const colorWithOpacity = gameConfig?.hexColor ? `${gameConfig.hexColor}20` : '#10b98120'; // ~12% opacity
                        const hexColor = gameConfig?.hexColor || '#10b981';

                        const isBatch = (bet.games?.length || 0) > 1;
                        const gameCount = bet.games?.length || 1;
                        const firstGameNums = bet.games?.[0]
                            ? [...bet.games[0].main, ...(bet.games[0].extras || [])]
                            : (bet.numbers || []);

                        return (
                            <div key={bet.id} onClick={() => setSelectedBet(bet)} className="group cursor-pointer relative h-full">
                                {/* Glow Effect behind card */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500/20 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-500" style={{ '--tw-gradient-via': hexColor } as any} />

                                <Card className="relative h-full bg-slate-900/90 border-slate-800/50 hover:border-slate-700/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-xl">
                                    {/* Color Header Strip */}
                                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(90deg, ${hexColor}, transparent)` }} />

                                    {/* Background Tint */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" style={{ background: `radial-gradient(circle, ${hexColor}40 0%, transparent 70%)` }} />

                                    <CardHeader className="pb-3 relative z-10">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <Badge variant="outline" className="w-fit mb-1 border-white/10 text-[10px] text-slate-400 bg-slate-950/50 uppercase tracking-wider backdrop-blur-md">
                                                    {bet.createdAt?.seconds ? new Date(bet.createdAt.seconds * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Hoje'}
                                                </Badge>
                                                <CardTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                                                    {bet.gameName}
                                                </CardTitle>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {isBatch && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">LOTE {gameCount}</Badge>}
                                                <div className={`w-2 h-2 rounded-full ${bet.status === 'pending' ? 'bg-yellow-500' : 'bg-emerald-500'} shadow-[0_0_8px_currentColor]`} />
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="relative z-10">
                                        <div className="flex flex-wrap gap-1.5">
                                            {firstGameNums.slice(0, 12).map((num, i) => (
                                                <span
                                                    key={i}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg border border-white/10 relative overflow-hidden"
                                                    style={{
                                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                                        color: '#e2e8f0'
                                                    }}
                                                >
                                                    {num}
                                                </span>
                                            ))}
                                            {(firstGameNums.length > 12 || isBatch) && (
                                                <span className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-xs text-slate-400 border border-slate-700/50">
                                                    +
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                                            <span className="text-[10px] text-slate-500 font-mono">
                                                ID: {bet.id?.slice(0, 6).toUpperCase()}
                                            </span>
                                            <span className="text-xs font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                Ver Detalhes <Target className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}


            <SavedBetDialog
                open={!!selectedBet}
                onOpenChange={(open) => !open && setSelectedBet(null)}
                bet={selectedBet}
                plan={plan}
            />
        </div >
    );
}
