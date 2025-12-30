'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Loader2, Play, Database, RefreshCw, CheckCircle, XCircle, Clock,
    Zap, Terminal, Sparkles, TrendingUp, Activity,
    Server, Shield, ChevronRight, X, Info, ExternalLink, Code, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { syncLatestDraw, syncHistoryDraws } from '@/actions/scrape-actions';
import anime from 'animejs';
import { useAuth } from '@/components/providers/auth-provider';

const GAMES = [
    { slug: 'mega-sena', name: 'Mega-Sena', color: '#209869', icon: '🍀', range: 60, pick: 6 },
    { slug: 'lotofacil', name: 'Lotofácil', color: '#930089', icon: '🎯', range: 25, pick: 15 },
    { slug: 'quina', name: 'Quina', color: '#260085', icon: '⭐', range: 80, pick: 5 },
    { slug: 'lotomania', name: 'Lotomania', color: '#F78100', icon: '🎰', range: 100, pick: 50 },
    { slug: 'timemania', name: 'Timemania', color: '#00ACC1', icon: '⚽', range: 80, pick: 10 },
    { slug: 'dupla-sena', name: 'Dupla Sena', color: '#A61317', icon: '🎲', range: 50, pick: 6 },
    { slug: 'dia-de-sorte', name: 'Dia de Sorte', color: '#CB8322', icon: '☀️', range: 31, pick: 7 },
    { slug: 'super-sete', name: 'Super Sete', color: '#A8CF45', icon: '7️⃣', range: 10, pick: 7 },
    { slug: 'mais-milionaria', name: '+Milionária', color: '#003758', icon: '💎', range: 50, pick: 6 },
    { slug: 'federal', name: 'Federal', color: '#004381', icon: '🏛️', range: 0, pick: 0 },
    { slug: 'loteca', name: 'Loteca', color: '#CA502C', icon: '🏆', range: 0, pick: 14 },
];

const API_DOCS = [
    {
        category: 'Scraping',
        endpoints: [
            { method: 'GET', path: '/api/admin/scrape', description: 'Sincroniza último sorteio de todas as loterias' },
            { method: 'GET', path: '/api/admin/scrape?game=mega-sena', description: 'Sincroniza último sorteio de uma loteria' },
            { method: 'GET', path: '/api/admin/scrape?mode=history&count=100', description: 'Sincroniza histórico (100 sorteios)' },
            { method: 'GET', path: '/api/admin/debug?slug=mega-sena', description: 'Retorna dados brutos da API Caixa' },
        ]
    },
    {
        category: 'Estatísticas',
        endpoints: [
            { method: 'ACTION', path: 'getGameStats(slug, period)', description: 'Busca estatísticas de um jogo' },
            { method: 'ACTION', path: 'getDrawDetails(slug, concurso)', description: 'Busca detalhes de um sorteio' },
            { method: 'ACTION', path: 'getLotteryInfo(slug)', description: 'Busca informações atuais do jogo' },
        ]
    },
    {
        category: 'Gerador',
        endpoints: [
            { method: 'ACTION', path: 'generateNumbers(slug, strategy)', description: 'Gera números usando IA/estratégias' },
        ]
    }
];

interface GameStatus {
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    concurso?: number;
    lastUpdate?: string;
    lastUpdateTimestamp?: number;
    executionTime?: number;
    recordsSaved?: number;
    totalSyncs?: number;
    errorMessage?: string;
}

interface LogEntry {
    time: string;
    type: 'info' | 'success' | 'error' | 'start';
    message: string;
}

export default function AdminPage() {
    const { user, loading, isAdmin, signInWithGoogle, logout } = useAuth();
    const [isPending, startTransition] = useTransition();

    // ─────────────────────────────────────────────────────────────
    // HOOKS (Must be declared before any conditional return)
    // ─────────────────────────────────────────────────────────────
    const [gameStatuses, setGameStatuses] = useState<Record<string, GameStatus>>({});
    const [globalProgress, setGlobalProgress] = useState<{ current: number; total: number } | null>(null);
    const [currentGame, setCurrentGame] = useState<string | null>(null);
    const [historyCount, setHistoryCount] = useState(50);
    const [lastDuration, setLastDuration] = useState<number | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState({ synced: 0, errors: 0, total: 0 });
    const [selectedGame, setSelectedGame] = useState<typeof GAMES[0] | null>(null);
    const [showApiDocs, setShowApiDocs] = useState(false);

    const headerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    // Animação de entrada - Trigger when admin view is revealed
    useEffect(() => {
        if (isAdmin && headerRef.current) {
            // Reset opacity manually to ensure animation plays if re-rendering
            headerRef.current.querySelectorAll('.animate-in').forEach((el: any) => el.style.opacity = '0');

            anime({
                targets: headerRef.current.querySelectorAll('.animate-in'),
                translateY: [30, 0],
                opacity: [0, 1],
                delay: anime.stagger(100),
                duration: 800,
                easing: 'easeOutExpo'
            });
        }
        if (isAdmin && cardsRef.current) {
            cardsRef.current.querySelectorAll('.game-card').forEach((el: any) => el.style.opacity = '0');

            anime({
                targets: cardsRef.current.querySelectorAll('.game-card'),
                translateY: [50, 0],
                opacity: [0, 1],
                delay: anime.stagger(50, { start: 300 }),
                duration: 600,
                easing: 'easeOutExpo'
            });
        }
    }, [isAdmin, loading]); // Added dependencies

    useEffect(() => {
        const synced = Object.values(gameStatuses).filter(s => s.status === 'success').length;
        const errors = Object.values(gameStatuses).filter(s => s.status === 'error').length;
        setStats({ synced, errors, total: GAMES.length });
    }, [gameStatuses]);

    // ─────────────────────────────────────────────────────────────
    // AUTH VERIFICATION
    // ─────────────────────────────────────────────────────────────

    // Verification View
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-950 text-emerald-500">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin w-10 h-10" />
                <span className="text-sm font-medium tracking-widest uppercase opacity-70">Verificando Credenciais...</span>
            </div>
        </div>
    );

    if (!user || !isAdmin) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white space-y-8 p-6 animate-fade-in text-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                    <Shield className="w-24 h-24 text-red-500 relative z-10" />
                </div>

                <div className="space-y-4 max-w-md">
                    <h1 className="text-4xl font-bold tracking-tight">Área Restrita</h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Este painel é exclusivo para administração do sistema LotoFoco.
                    </p>
                </div>

                {!user ? (
                    <Button onClick={signInWithGoogle} size="lg" className="bg-white text-slate-950 hover:bg-slate-200 font-bold gap-3 h-14 px-8 shadow-xl shadow-white/10 transition-all hover:scale-105">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                        Acessar Painel
                    </Button>
                ) : (
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                        <div className="w-full bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center space-y-2">
                            <div className="text-red-400 font-semibold flex items-center justify-center gap-2">
                                <XCircle className="w-5 h-5" /> Acesso Negado
                            </div>
                            <p className="text-slate-300 text-sm">
                                A conta <span className="text-white font-mono bg-slate-900 px-1 py-0.5 rounded">{user.email}</span> não possui permissão de administrador.
                            </p>
                        </div>
                        <Button variant="outline" onClick={logout} className="w-full border-slate-700 hover:bg-slate-800 text-slate-300">
                            Sair e tentar outra conta
                        </Button>
                    </div>
                )}

                <div className="fixed bottom-8 text-xs text-slate-600">
                    ID de Segurança: {Math.random().toString(36).substring(7).toUpperCase()} • IP Registrado
                </div>
            </div>
        );
    }

    // Functions (Logic)

    const addLog = (type: LogEntry['type'], message: string) => {
        const time = new Date().toLocaleTimeString('pt-BR');
        setLogs(prev => [...prev.slice(-50), { time, type, message }]);
    };

    const clearLogs = () => setLogs([]);

    const syncLatest = async (game: string) => {
        setGameStatuses(prev => ({ ...prev, [game]: { ...prev[game], status: 'loading', message: 'Sincronizando...' } }));
        addLog('info', `[${game}] Iniciando...`);

        startTransition(async () => {
            const startTime = Date.now();
            const result = await syncLatestDraw(game);
            const duration = Math.round((Date.now() - startTime) / 1000);
            const timestamp = new Date().toLocaleString('pt-BR');
            const now = Date.now();

            if (result.success) {
                setGameStatuses(prev => ({
                    ...prev,
                    [game]: {
                        status: 'success',
                        concurso: result.concurso,
                        message: `Concurso #${result.concurso}`,
                        lastUpdate: timestamp,
                        lastUpdateTimestamp: now,
                        executionTime: duration,
                        recordsSaved: (prev[game]?.recordsSaved || 0) + 1,
                        totalSyncs: (prev[game]?.totalSyncs || 0) + 1
                    }
                }));
                addLog('success', `[${game}] ✓ #${result.concurso} (${duration}s)`);

                anime({
                    targets: `[data-game="${game}"]`,
                    scale: [1, 1.02, 1],
                    duration: 300,
                    easing: 'easeOutElastic(1, .5)'
                });
            } else {
                setGameStatuses(prev => ({
                    ...prev,
                    [game]: {
                        ...prev[game],
                        status: 'error',
                        message: result.error,
                        errorMessage: result.error,
                        lastUpdate: timestamp,
                        lastUpdateTimestamp: now,
                        executionTime: duration,
                        totalSyncs: (prev[game]?.totalSyncs || 0) + 1
                    }
                }));
                addLog('error', `[${game}] ✗ ${result.error}`);
            }
        });
    };

    const syncHistory = async (game: string) => {
        setGameStatuses(prev => ({ ...prev, [game]: { ...prev[game], status: 'loading', message: `Processando ${historyCount} registros...` } }));
        setCurrentGame(game);
        addLog('info', `[${game}] Histórico (${historyCount})...`);

        startTransition(async () => {
            const startTime = Date.now();
            const result = await syncHistoryDraws(game, historyCount);
            const duration = Math.round((Date.now() - startTime) / 1000);
            const timestamp = new Date().toLocaleString('pt-BR');
            const now = Date.now();

            if (result.success) {
                setGameStatuses(prev => ({
                    ...prev,
                    [game]: {
                        status: 'success',
                        concurso: result.latestConcurso,
                        message: `${result.saved} registros salvos`,
                        lastUpdate: timestamp,
                        lastUpdateTimestamp: now,
                        executionTime: duration,
                        recordsSaved: (prev[game]?.recordsSaved || 0) + result.saved,
                        totalSyncs: (prev[game]?.totalSyncs || 0) + 1
                    }
                }));
                addLog('success', `[${game}] ✓ ${result.saved} salvos (${duration}s)`);
            } else {
                setGameStatuses(prev => ({
                    ...prev,
                    [game]: {
                        ...prev[game],
                        status: 'error',
                        message: result.error,
                        errorMessage: result.error,
                        lastUpdate: timestamp,
                        lastUpdateTimestamp: now,
                        executionTime: duration,
                        totalSyncs: (prev[game]?.totalSyncs || 0) + 1
                    }
                }));
                addLog('error', `[${game}] ✗ ${result.error}`);
            }

            setCurrentGame(null);
            setLastDuration(duration);
        });
    };

    const syncAllLatest = async () => {
        addLog('start', '🚀 Sincronizando todos...');
        setGlobalProgress({ current: 0, total: GAMES.length });

        for (let i = 0; i < GAMES.length; i++) {
            const game = GAMES[i];
            setCurrentGame(game.slug);
            setGlobalProgress({ current: i, total: GAMES.length });
            setGameStatuses(prev => ({ ...prev, [game.slug]: { status: 'loading' } }));

            const result = await syncLatestDraw(game.slug);

            if (result.success) {
                setGameStatuses(prev => ({
                    ...prev,
                    [game.slug]: { status: 'success', concurso: result.concurso, message: `#${result.concurso}` }
                }));
                addLog('success', `[${game.name}] ✓ #${result.concurso}`);
            } else {
                setGameStatuses(prev => ({
                    ...prev,
                    [game.slug]: { status: 'error', message: result.error }
                }));
                addLog('error', `[${game.name}] ✗ ${result.error}`);
            }
        }

        setGlobalProgress({ current: GAMES.length, total: GAMES.length });
        setCurrentGame(null);
        addLog('success', '✓ Sincronização completa!');
    };

    const syncAllHistory = async () => {
        addLog('start', `🚀 Histórico de todos (${historyCount})...`);
        const startTime = Date.now();
        setGlobalProgress({ current: 0, total: GAMES.length });

        for (let i = 0; i < GAMES.length; i++) {
            const game = GAMES[i];
            setCurrentGame(game.slug);
            setGlobalProgress({ current: i, total: GAMES.length });
            setGameStatuses(prev => ({ ...prev, [game.slug]: { status: 'loading' } }));

            const result = await syncHistoryDraws(game.slug, historyCount);

            if (result.success) {
                setGameStatuses(prev => ({
                    ...prev,
                    [game.slug]: { status: 'success', saved: result.saved, message: `${result.saved} salvos` }
                }));
                addLog('success', `[${game.name}] ✓ ${result.saved}`);
            } else {
                setGameStatuses(prev => ({
                    ...prev,
                    [game.slug]: { status: 'error', message: result.error }
                }));
                addLog('error', `[${game.name}] ✗`);
            }
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        setGlobalProgress({ current: GAMES.length, total: GAMES.length });
        setCurrentGame(null);
        setLastDuration(duration);
        addLog('success', `✓ Completo em ${duration}s!`);
    };

    const progressPercent = globalProgress ? Math.round((globalProgress.current / globalProgress.total) * 100) : 0;
    const isRunning = isPending || currentGame !== null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-20 pb-12">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 space-y-8">

                {/* Header */}
                <div ref={headerRef} className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="animate-in">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
                                🎰
                            </div>
                            <div>
                                <h1 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                    Admin Panel
                                </h1>
                                <p className="text-slate-400 text-sm">Sincronização de dados da Caixa</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="animate-in flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowApiDocs(true)}
                            className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-2.5 transition-all"
                        >
                            <Code className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium">API Docs</span>
                        </button>
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-lg font-bold text-emerald-400">{stats.synced}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span className="text-lg font-bold text-red-400">{stats.errors}</span>
                        </div>
                        {lastDuration && (
                            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2.5">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-lg font-bold text-blue-400">{lastDuration}s</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                {isRunning && globalProgress && (
                    <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700/50 p-5 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                                    <span className="font-bold text-white">
                                        {currentGame ? GAMES.find(g => g.slug === currentGame)?.name : '...'}
                                    </span>
                                    <span className="text-sm text-slate-400">
                                        {globalProgress.current}/{globalProgress.total}
                                    </span>
                                </div>
                                <span className="text-2xl font-black text-emerald-400">{progressPercent}%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={syncAllLatest}
                        disabled={isRunning}
                        className={cn(
                            "relative overflow-hidden p-6 rounded-2xl border text-left transition-all group",
                            isRunning
                                ? "bg-slate-800/50 border-slate-700 cursor-not-allowed"
                                : "bg-gradient-to-br from-emerald-900/50 to-emerald-950/80 border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10"
                        )}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {isRunning ? <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /> : <RefreshCw className="w-6 h-6 text-emerald-400" />}
                                </div>
                                <Zap className="w-5 h-5 text-emerald-400/50" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">Sincronizar Últimos</h3>
                            <p className="text-slate-400 text-sm">Busca o último sorteio de cada loteria</p>
                        </div>
                    </button>

                    <div className={cn(
                        "relative overflow-hidden p-6 rounded-2xl border transition-all",
                        isRunning
                            ? "bg-slate-800/50 border-slate-700"
                            : "bg-gradient-to-br from-blue-900/50 to-blue-950/80 border-blue-500/30 hover:border-blue-400/50"
                    )}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    {isRunning ? <Loader2 className="w-6 h-6 text-blue-400 animate-spin" /> : <Database className="w-6 h-6 text-blue-400" />}
                                </div>
                                <TrendingUp className="w-5 h-5 text-blue-400/50" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">Sincronizar Histórico</h3>
                            <p className="text-slate-400 text-sm mb-4">Busca os últimos N sorteios de cada loteria</p>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={historyCount}
                                    onChange={(e) => setHistoryCount(parseInt(e.target.value) || 50)}
                                    className="w-20 bg-slate-800/80 border-blue-500/30 text-center font-bold"
                                    min={10}
                                    max={500}
                                    disabled={isRunning}
                                />
                                <Button
                                    onClick={syncAllHistory}
                                    disabled={isRunning}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold"
                                >
                                    Executar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Games Grid */}
                    <div className="lg:col-span-2" ref={cardsRef}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Server className="w-5 h-5 text-slate-400" />
                                Loterias ({GAMES.length})
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {GAMES.map((game) => {
                                const status = gameStatuses[game.slug];
                                const isLoading = status?.status === 'loading';
                                const isSuccess = status?.status === 'success';
                                const isError = status?.status === 'error';

                                // Calcular tempo desde última atualização
                                const getTimeSince = () => {
                                    if (!status?.lastUpdateTimestamp) return null;
                                    const diff = Math.floor((Date.now() - status.lastUpdateTimestamp) / 1000);
                                    if (diff < 60) return `${diff}s atrás`;
                                    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
                                    return `${Math.floor(diff / 3600)}h atrás`;
                                };
                                const timeSince = getTimeSince();

                                return (
                                    <div
                                        key={game.slug}
                                        data-game={game.slug}
                                        className={cn(
                                            "game-card group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]",
                                            isLoading && "bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/40",
                                            isSuccess && "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/40",
                                            isError && "bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/40",
                                            !status && "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-slate-600"
                                        )}
                                    >
                                        {/* Color accent bar */}
                                        <div className="h-1 w-full" style={{ backgroundColor: game.color }} />

                                        {/* Info button - top right */}
                                        <button
                                            onClick={() => setSelectedGame(game)}
                                            className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-all z-10 opacity-60 hover:opacity-100"
                                        >
                                            <Info className="w-3.5 h-3.5 text-slate-300" />
                                        </button>

                                        <div className="p-4">
                                            {/* Header */}
                                            <div className="flex items-center gap-3 mb-3 pr-8">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg shrink-0"
                                                    style={{ backgroundColor: game.color + '20' }}
                                                >
                                                    {game.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-white flex items-center gap-2">
                                                        {game.name}
                                                        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                                                        {isSuccess && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                                                        {isError && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-mono truncate">{game.slug}</div>
                                                </div>
                                            </div>

                                            {/* Status Info */}
                                            <div className="space-y-1.5 mb-4 text-sm">
                                                {status?.concurso ? (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-400">Concurso</span>
                                                        <span className="font-bold text-white">#{status.concurso}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-500 italic">Não sincronizado</div>
                                                )}

                                                {status?.recordsSaved !== undefined && status.recordsSaved > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-400">Registros</span>
                                                        <span className="font-medium text-emerald-400">{status.recordsSaved}</span>
                                                    </div>
                                                )}

                                                {timeSince && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-400">Atualizado</span>
                                                        <span className="font-medium text-slate-300">{timeSince}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => syncLatest(game.slug)}
                                                    disabled={isRunning}
                                                    className="flex-1 h-9 bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-40 font-medium"
                                                >
                                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
                                                    Sync
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => syncHistory(game.slug)}
                                                    disabled={isRunning}
                                                    className="flex-1 h-9 bg-blue-600/80 hover:bg-blue-500 disabled:opacity-40 font-medium"
                                                >
                                                    <Database className="w-3.5 h-3.5 mr-1.5" />
                                                    Histórico
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Log Panel */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-slate-400" />
                                Console
                            </h2>
                            <button onClick={clearLogs} className="text-xs text-slate-500 hover:text-white transition-colors">
                                Limpar
                            </button>
                        </div>
                        <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700/50 p-0 overflow-hidden">
                            <div className="bg-slate-950 p-2 border-b border-slate-800 flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            </div>
                            <div className="h-[400px] overflow-y-auto p-3 font-mono text-xs space-y-1 bg-slate-950/50">
                                {logs.length === 0 ? (
                                    <div className="text-slate-600 text-center py-12">
                                        <Terminal className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                        <p>Aguardando...</p>
                                    </div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className={cn(
                                            "flex items-start gap-2",
                                            log.type === 'success' && "text-emerald-400",
                                            log.type === 'error' && "text-red-400",
                                            log.type === 'info' && "text-slate-500",
                                            log.type === 'start' && "text-yellow-400"
                                        )}>
                                            <span className="text-slate-700 shrink-0">{log.time}</span>
                                            <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 opacity-50" />
                                            <span>{log.message}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Info Footer */}
                <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-5">
                    <div className="flex items-start gap-4">
                        <Shield className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-400 space-y-1">
                            <p>Dados obtidos da <strong className="text-white">API oficial da Caixa</strong>. Recomenda-se sincronizar 50-100 sorteios por vez.</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Game Details Modal */}
            {selectedGame && (() => {
                const status = gameStatuses[selectedGame.slug];
                const getTimeSince = () => {
                    if (!status?.lastUpdateTimestamp) return null;
                    const diff = Math.floor((Date.now() - status.lastUpdateTimestamp) / 1000);
                    if (diff < 60) return `${diff} segundos`;
                    if (diff < 3600) return `${Math.floor(diff / 60)} minutos`;
                    if (diff < 86400) return `${Math.floor(diff / 3600)} horas`;
                    return `${Math.floor(diff / 86400)} dias`;
                };

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedGame(null)}>
                        <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700 p-0 max-w-2xl w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            {/* Header with color */}
                            <div className="h-2" style={{ backgroundColor: selectedGame.color }} />
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg" style={{ backgroundColor: selectedGame.color + '25' }}>
                                            {selectedGame.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white">{selectedGame.name}</h3>
                                            <p className="text-slate-500 text-sm font-mono">{selectedGame.slug}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedGame(null)} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Status Banner */}
                                {status?.status && (
                                    <div className={cn(
                                        "p-4 rounded-xl mb-6 flex items-center gap-3",
                                        status.status === 'success' && "bg-emerald-500/10 border border-emerald-500/30",
                                        status.status === 'error' && "bg-red-500/10 border border-red-500/30",
                                        status.status === 'loading' && "bg-blue-500/10 border border-blue-500/30"
                                    )}>
                                        {status.status === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                                        {status.status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                                        {status.status === 'loading' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                                        <div>
                                            <div className={cn(
                                                "font-bold",
                                                status.status === 'success' && "text-emerald-400",
                                                status.status === 'error' && "text-red-400",
                                                status.status === 'loading' && "text-blue-400"
                                            )}>
                                                {status.status === 'success' && "Sincronizado"}
                                                {status.status === 'error' && "Erro"}
                                                {status.status === 'loading' && "Processando..."}
                                            </div>
                                            {status.message && <div className="text-sm text-slate-400">{status.message}</div>}
                                        </div>
                                    </div>
                                )}

                                {/* Technical Stats - Sync Data */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        Estatísticas de Sincronização
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-slate-800/40 p-4 rounded-xl">
                                            <div className="text-xs text-slate-500 uppercase mb-1">Último Concurso</div>
                                            <div className="text-2xl font-bold text-white">{status?.concurso ? `#${status.concurso}` : '-'}</div>
                                        </div>
                                        <div className="bg-slate-800/40 p-4 rounded-xl">
                                            <div className="text-xs text-slate-500 uppercase mb-1">Registros Salvos</div>
                                            <div className="text-2xl font-bold text-emerald-400">{status?.recordsSaved || 0}</div>
                                        </div>
                                        <div className="bg-slate-800/40 p-4 rounded-xl">
                                            <div className="text-xs text-slate-500 uppercase mb-1">Total Syncs</div>
                                            <div className="text-2xl font-bold text-blue-400">{status?.totalSyncs || 0}</div>
                                        </div>
                                        <div className="bg-slate-800/40 p-4 rounded-xl">
                                            <div className="text-xs text-slate-500 uppercase mb-1">Tempo Médio</div>
                                            <div className="text-2xl font-bold text-purple-400">
                                                {status?.totalSyncs && status?.executionTime
                                                    ? `${Math.round(status.executionTime / status.totalSyncs)}s`
                                                    : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Game Configuration */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Server className="w-4 h-4" />
                                        Configuração do Jogo
                                    </h4>
                                    <div className="bg-slate-800/40 rounded-xl p-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <div className="text-slate-500 text-xs uppercase mb-1">Slug/ID</div>
                                                <div className="text-white font-mono font-medium">{selectedGame.slug}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 text-xs uppercase mb-1">Range de Números</div>
                                                <div className="text-white font-medium">{selectedGame.range > 0 ? `1-${selectedGame.range}` : 'N/A'}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 text-xs uppercase mb-1">Qtd. Escolher</div>
                                                <div className="text-white font-medium">{selectedGame.pick > 0 ? `${selectedGame.pick} números` : 'N/A'}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 text-xs uppercase mb-1">API Endpoint</div>
                                                <div className="text-white font-mono text-xs truncate">/api/{selectedGame.slug}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Execution Details */}
                                {status?.lastUpdate && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Última Execução
                                        </h4>
                                        <div className="bg-slate-800/40 rounded-xl p-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <div className="text-slate-500 text-xs uppercase mb-1">Data/Hora</div>
                                                    <div className="text-white font-medium">{status.lastUpdate}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 text-xs uppercase mb-1">Tempo Execução</div>
                                                    <div className="text-white font-medium">{status.executionTime}s</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 text-xs uppercase mb-1">Tempo Desde Update</div>
                                                    <div className="text-white font-medium">{getTimeSince()}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 text-xs uppercase mb-1">Status</div>
                                                    <div className={cn(
                                                        "font-medium",
                                                        status.status === 'success' && "text-emerald-400",
                                                        status.status === 'error' && "text-red-400"
                                                    )}>
                                                        {status.status === 'success' ? 'OK' : status.status === 'error' ? 'Falha' : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error Details */}
                                {status?.errorMessage && (
                                    <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                        <div className="text-xs text-red-400 uppercase font-bold mb-2">Último Erro</div>
                                        <div className="text-sm text-red-300 font-mono">{status.errorMessage}</div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => syncLatest(selectedGame.slug)}
                                        disabled={isRunning}
                                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                    >
                                        {status?.status === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                                        Sync Último
                                    </Button>
                                    <Button
                                        onClick={() => syncHistory(selectedGame.slug)}
                                        disabled={isRunning}
                                        className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold"
                                    >
                                        <Database className="w-4 h-4 mr-2" />
                                        Histórico ({historyCount})
                                    </Button>
                                </div>

                                {/* Footer Link */}
                                <div className="mt-4 pt-4 border-t border-slate-800">
                                    <a
                                        href={`/loteria/${selectedGame.slug}`}
                                        className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Ver página da loteria
                                    </a>
                                </div>
                            </div>
                        </Card>
                    </div>
                );
            })()}

            {/* API Docs Modal */}
            {showApiDocs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowApiDocs(false)}>
                    <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                    <Code className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">API Documentation</h3>
                                    <p className="text-slate-400 text-sm">Endpoints e Server Actions disponíveis</p>
                                </div>
                            </div>
                            <button onClick={() => setShowApiDocs(false)} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {API_DOCS.map((category) => (
                                <div key={category.category}>
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{category.category}</h4>
                                    <div className="space-y-2">
                                        {category.endpoints.map((endpoint, i) => (
                                            <div key={i} className="bg-slate-800/50 p-3 rounded-lg flex items-start gap-3">
                                                <span className={cn(
                                                    "text-xs font-bold px-2 py-0.5 rounded shrink-0",
                                                    endpoint.method === 'GET' && "bg-emerald-500/20 text-emerald-400",
                                                    endpoint.method === 'POST' && "bg-blue-500/20 text-blue-400",
                                                    endpoint.method === 'ACTION' && "bg-purple-500/20 text-purple-400"
                                                )}>
                                                    {endpoint.method}
                                                </span>
                                                <div>
                                                    <code className="text-sm text-white font-mono">{endpoint.path}</code>
                                                    <p className="text-xs text-slate-500 mt-1">{endpoint.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-800">
                            <div className="flex items-start gap-2 text-sm text-slate-500">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                <p><strong className="text-white">Server Actions</strong> são funções que executam no servidor e podem ser chamadas diretamente de componentes React.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
