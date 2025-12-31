'use client';

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardBody,
    CardHeader,
    Input,
    Avatar,
    Chip,
    Progress,
    Divider,
    Skeleton
} from "@heroui/react";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import {
    User,
    Mail,
    Calendar,
    Trophy,
    Target,
    Zap,
    Shield,
    Crown,
    Sparkles,
    Save,
    Camera,
    TrendingUp,
    Activity
} from "lucide-react";
import { LotterySpinner } from "@/components/ui/lottery-spinner";
import { dataCache, CACHE_KEYS, CACHE_DURATION } from "@/lib/cache";
import { getUserLevel, getLevelProgress, getSubscriptionBadge } from "@/lib/user-levels";
import anime from 'animejs';
import { ResponsivePie } from '@nivo/pie';

interface UserStats {
    totalBets: number;
    totalWins: number;
    winRate: number;
    favoriteGame: string;
    memberSince: string;
    lastActivity: string;
}

export default function ProfilePage() {
    const { user } = useAuth();
    const [name, setName] = useState(user?.displayName || '');
    const [phone, setPhone] = useState('');
    const [userPlan, setUserPlan] = useState('free');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [userStats, setUserStats] = useState<UserStats>({
        totalBets: 0,
        totalWins: 0,
        winRate: 0,
        favoriteGame: 'Mega-Sena',
        memberSince: '',
        lastActivity: ''
    });
    const [activityData, setActivityData] = useState([
        { id: 'Mega-Sena', label: 'Mega-Sena', value: 45, color: '#10b981' },
        { id: 'Lotofácil', label: 'Lotofácil', value: 30, color: '#8b5cf6' },
        { id: 'Quina', label: 'Quina', value: 15, color: '#f59e0b' },
        { id: 'Outros', label: 'Outros', value: 10, color: '#64748b' }
    ]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadUserData();
        }
    }, [user]);

    useEffect(() => {
        if (!isLoading) {
            animateCards();
        }
    }, [isLoading]);

    // Animate progress bar when stats are loaded
    useEffect(() => {
        if (!isLoading && userStats.totalBets >= 0) {
            const progressBar = document.querySelector('.level-progress-fill');
            const progressText = document.querySelector('.level-progress-text');

            if (progressBar && progressText) {
                const levelInfo = getLevelProgress(userStats.totalBets);

                anime({
                    targets: progressBar,
                    width: [`0%`, `${levelInfo.progress}%`],
                    duration: 1500,
                    easing: 'easeOutExpo',
                    delay: 300
                });

                anime({
                    targets: progressText,
                    innerHTML: [0, levelInfo.progress],
                    round: 1,
                    duration: 1500,
                    easing: 'easeOutExpo',
                    delay: 300
                });
            }
        }
    }, [isLoading, userStats.totalBets]);

    const animateCards = () => {
        anime({
            targets: '.profile-card',
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 800,
            easing: 'easeOutCubic'
        });

        anime({
            targets: '.stat-number',
            innerHTML: [0, (el: any) => {
                const value = el.getAttribute('data-value');
                return value || 0;
            }],
            round: 1,
            duration: 2000,
            easing: 'easeOutExpo',
            delay: 500
        });
    };

    const loadUserData = async () => {
        if (!user) return;

        try {
            // Try to get cached data first
            const cachedStats = dataCache.get<UserStats>(CACHE_KEYS.USER_STATS(user.uid));
            const cachedProfile = dataCache.get<any>(CACHE_KEYS.USER_PROFILE(user.uid));

            if (cachedStats && cachedProfile) {
                console.log('📦 Using cached data');
                setUserStats(cachedStats);
                setPhone(cachedProfile.phone || '');

                if (cachedProfile.activityData) {
                    setActivityData(cachedProfile.activityData);
                }

                setIsLoading(false);
                return;
            }

            console.log('🔥 Fetching fresh data from Firebase');

            // Load user document
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            let profileData: any = { phone: '', activityData: [] };

            if (userDoc.exists()) {
                const data = userDoc.data();
                profileData.phone = data.phone || '';
                setPhone(data.phone || '');
                setUserPlan(data.plan || 'free');
            }

            // Load user bets for real statistics
            const { getUserBets } = await import('@/lib/firebase/bets-client');
            const bets = await getUserBets(user.uid);

            console.log('📊 Loaded bets:', bets.length);

            // Calculate real statistics
            const totalBets = bets.length;
            const wonBets = bets.filter(bet => bet.status === 'won').length;
            const winRate = totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0;

            // Find favorite game (most played)
            const gameCount: Record<string, number> = {};
            bets.forEach(bet => {
                gameCount[bet.gameName] = (gameCount[bet.gameName] || 0) + 1;
            });

            const favoriteGame = Object.keys(gameCount).length > 0
                ? Object.entries(gameCount).sort((a, b) => b[1] - a[1])[0][0]
                : 'Nenhum jogo ainda';

            // Calculate activity distribution for pie chart
            const totalGames = Object.values(gameCount).reduce((sum, count) => sum + count, 0);
            const activityDistribution = totalGames > 0
                ? Object.entries(gameCount)
                    .map(([name, count]) => ({
                        id: name,
                        label: name,
                        value: Math.round((count / totalGames) * 100),
                        color: getGameColor(name)
                    }))
                    .sort((a, b) => b.value - a.value)
                : [];

            // Get last activity date
            const lastActivity = bets.length > 0 && bets[0].createdAt
                ? new Date(bets[0].createdAt.toDate()).toLocaleDateString('pt-BR')
                : 'Nenhuma atividade';

            const stats: UserStats = {
                totalBets,
                totalWins: wonBets,
                winRate,
                favoriteGame,
                memberSince: user.metadata.creationTime || '',
                lastActivity
            };

            setUserStats(stats);

            // Update activity data for chart
            if (activityDistribution.length > 0) {
                setActivityData(activityDistribution);
                profileData = { ...profileData, activityData: activityDistribution };
            }

            // Cache the data for 5 minutes
            dataCache.set(CACHE_KEYS.USER_STATS(user.uid), stats, CACHE_DURATION.MEDIUM);
            dataCache.set(CACHE_KEYS.USER_PROFILE(user.uid), profileData, CACHE_DURATION.MEDIUM);

            console.log('💾 Data cached successfully');

            // Data loaded, hide loading state
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading user data:', error);
            setIsLoading(false); // Still hide loading even on error
        }
    };

    const getGameColor = (gameName: string): string => {
        const colorMap: Record<string, string> = {
            'Mega-Sena': '#10b981',
            'Lotofácil': '#8b5cf6',
            'Quina': '#f59e0b',
            'Lotomania': '#ef4444',
            'Timemania': '#06b6d4',
            '+Milionária': '#ec4899',
            'Dupla Sena': '#14b8a6',
            'Dia de Sorte': '#f97316',
            'Super Sete': '#3b82f6',
            'Federal': '#6366f1'
        };
        return colorMap[gameName] || '#64748b';
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setMsg('');

        try {
            if (name !== user.displayName) {
                await updateProfile(user, { displayName: name });
            }

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                name: name,
                displayName: name,
                phone: phone,
                updatedAt: new Date().toISOString()
            });

            // Invalidate cache after update
            dataCache.invalidate(CACHE_KEYS.USER_PROFILE(user.uid));
            console.log('🗑️ Cache invalidated after profile update');

            setMsg('✓ Perfil atualizado com sucesso!');
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            console.error(error);
            setMsg('✗ Erro ao atualizar perfil.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <LotterySpinner size={100} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header with Avatar */}
            <div className="relative group profile-card">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <Card className="relative bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Crown size={200} className="text-emerald-500" />
                    </div>
                    <CardBody className="p-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="relative group/avatar">
                                <Avatar
                                    src={user?.photoURL || undefined}
                                    name={user?.displayName || user?.email || 'U'}
                                    className="w-32 h-32 text-4xl ring-4 ring-emerald-500/20 group-hover/avatar:ring-emerald-500/40 transition-all"
                                    isBordered
                                    color="success"
                                />
                                <button className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full hover:bg-emerald-400 transition-colors shadow-lg">
                                    <Camera size={16} className="text-slate-950" />
                                </button>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                        {user?.displayName || 'Usuário'}
                                    </h1>
                                    <Chip
                                        size="sm"
                                        variant={getSubscriptionBadge(userPlan).variant}
                                        color={getSubscriptionBadge(userPlan).color}
                                        startContent={<Sparkles size={14} />}
                                        className="font-black"
                                    >
                                        {getSubscriptionBadge(userPlan).label}
                                    </Chip>
                                </div>
                                <p className="text-slate-400 text-lg mb-4 flex items-center gap-2 justify-center md:justify-start">
                                    <Mail size={16} />
                                    {user?.email}
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <Chip size="sm" variant="bordered" className="border-white/10">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            Membro desde {formatDate(userStats.memberSince)}
                                        </span>
                                    </Chip>
                                    <Chip size="sm" variant="bordered" className="border-white/10">
                                        <span className="flex items-center gap-1">
                                            <Activity size={12} />
                                            Última atividade: {userStats.lastActivity}
                                        </span>
                                    </Chip>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="profile-card bg-slate-900/40 border border-white/5 rounded-2xl hover:bg-slate-800/40 transition-all group">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                <Target className="text-emerald-500" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total de Jogos</p>
                                <p className="text-3xl font-black text-white stat-number" data-value={userStats.totalBets}>0</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="profile-card bg-slate-900/40 border border-white/5 rounded-2xl hover:bg-slate-800/40 transition-all group">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                <Trophy className="text-amber-500" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Acertos</p>
                                <p className="text-3xl font-black text-white stat-number" data-value={userStats.totalWins}>0</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="profile-card bg-slate-900/40 border border-white/5 rounded-2xl hover:bg-slate-800/40 transition-all group">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                <TrendingUp className="text-purple-500" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Taxa de Acerto</p>
                                <p className="text-3xl font-black text-white stat-number" data-value={userStats.winRate}>0</p>
                                <span className="text-lg font-black text-white">%</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="profile-card bg-slate-900/40 border border-white/5 rounded-2xl hover:bg-slate-800/40 transition-all group">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                <Zap className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Jogo Favorito</p>
                                <p className="text-lg font-black text-white">{userStats.favoriteGame}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="profile-card bg-slate-900/40 border border-white/5 rounded-3xl">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-xl">
                                    <User className="text-emerald-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Informações Pessoais</h3>
                                    <p className="text-sm text-slate-500 font-medium">Atualize seus dados de perfil</p>
                                </div>
                            </div>
                        </CardHeader>
                        <Divider className="bg-white/5" />
                        <CardBody className="p-6">
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Email</label>
                                    <Input
                                        isDisabled
                                        value={user?.email || ''}
                                        variant="bordered"
                                        classNames={{
                                            input: "text-slate-500",
                                            inputWrapper: "bg-slate-950/50 border-white/5"
                                        }}
                                        startContent={<Mail size={16} className="text-slate-600" />}
                                    />
                                    <p className="text-xs text-slate-600">O email não pode ser alterado</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Nome Completo</label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        variant="bordered"
                                        placeholder="Seu nome completo"
                                        classNames={{
                                            input: "text-white",
                                            inputWrapper: "bg-slate-950/50 border-white/10 hover:border-emerald-500/50 focus-within:border-emerald-500"
                                        }}
                                        startContent={<User size={16} className="text-slate-500" />}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Telefone</label>
                                    <Input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        variant="bordered"
                                        placeholder="(00) 00000-0000"
                                        classNames={{
                                            input: "text-white",
                                            inputWrapper: "bg-slate-950/50 border-white/10 hover:border-emerald-500/50 focus-within:border-emerald-500"
                                        }}
                                        startContent={<span className="text-slate-500">📱</span>}
                                    />
                                </div>

                                <Divider className="bg-white/5" />

                                <div className="flex items-center justify-between">
                                    {msg && (
                                        <p className={`text-sm font-bold ${msg.includes('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {msg}
                                        </p>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/20"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Salvando...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Save size={16} />
                                                Salvar Alterações
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>

                    {/* Account Level */}
                    <Card className="profile-card bg-slate-900/40 border border-white/5 rounded-3xl">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-xl">
                                    <Shield className="text-purple-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Nível da Conta</h3>
                                    <p className="text-sm text-slate-500 font-medium">Seu progresso no LotoFoco</p>
                                </div>
                            </div>
                        </CardHeader>
                        <Divider className="bg-white/5" />
                        <CardBody className="p-6">
                            <div className="space-y-4">
                                {(() => {
                                    const levelInfo = getLevelProgress(userStats.totalBets);
                                    const levelColor = levelInfo.currentLevel.color;

                                    return (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-300">Nível Atual</span>
                                                <Chip
                                                    variant="flat"
                                                    className="font-black"
                                                    style={{
                                                        backgroundColor: `${levelColor}20`,
                                                        color: levelColor,
                                                        borderColor: `${levelColor}40`
                                                    }}
                                                >
                                                    <span className="mr-1">{levelInfo.currentLevel.icon}</span>
                                                    {levelInfo.currentLevel.name}
                                                </Chip>
                                            </div>

                                            {/* Custom Animated Progress Bar */}
                                            <div className="relative h-4 rounded-full overflow-hidden bg-slate-800/50 border border-white/5">
                                                {/* Striped Background (unfilled portion) */}
                                                <div
                                                    className="absolute inset-0 opacity-30"
                                                    style={{
                                                        backgroundImage: `repeating-linear-gradient(
                                                            45deg,
                                                            rgba(148, 163, 184, 0.1),
                                                            rgba(148, 163, 184, 0.1) 10px,
                                                            rgba(255, 255, 255, 0.05) 10px,
                                                            rgba(255, 255, 255, 0.05) 20px
                                                        )`,
                                                        backgroundSize: '28px 28px',
                                                        animation: 'stripe-move 1s linear infinite'
                                                    }}
                                                />

                                                {/* Filled Progress Bar (animated by AnimeJS) - GREEN for evolution */}
                                                <div
                                                    className="level-progress-fill absolute inset-y-0 left-0 rounded-full"
                                                    style={{
                                                        width: '0%',
                                                        background: 'linear-gradient(90deg, #10b981, #059669)',
                                                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)'
                                                    }}
                                                >
                                                    {/* Shine effect on progress bar */}
                                                    <div
                                                        className="absolute inset-0 rounded-full"
                                                        style={{
                                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                                            animation: 'shine 2s ease-in-out infinite'
                                                        }}
                                                    />
                                                </div>

                                                {/* Progress percentage text */}
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="level-progress-text text-xs font-black text-white drop-shadow-lg">
                                                        0
                                                    </span>
                                                    <span className="text-xs font-black text-white drop-shadow-lg">%</span>
                                                </div>
                                            </div>

                                            {levelInfo.nextLevel ? (
                                                <p className="text-xs text-slate-500">
                                                    <span className="font-bold text-white">{levelInfo.betsToNext} jogos</span> para o próximo nível ({levelInfo.nextLevel.icon} {levelInfo.nextLevel.name})
                                                </p>
                                            ) : (
                                                <p className="text-xs text-emerald-400 font-bold">
                                                    🎉 Você atingiu o nível máximo!
                                                </p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* CSS Animations */}
                            <style jsx>{`
                                @keyframes stripe-move {
                                    0% {
                                        background-position: 0 0;
                                    }
                                    100% {
                                        background-position: 28px 0;
                                    }
                                }
                                
                                @keyframes shine {
                                    0% {
                                        transform: translateX(-100%);
                                    }
                                    50%, 100% {
                                        transform: translateX(200%);
                                    }
                                }
                            `}</style>
                        </CardBody>
                    </Card>
                </div>

                {/* Activity Chart */}
                <div className="space-y-6">
                    <Card className="profile-card bg-slate-900/40 border border-white/5 rounded-3xl">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Activity className="text-blue-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Atividade</h3>
                                    <p className="text-sm text-slate-500 font-medium">Distribuição de jogos</p>
                                </div>
                            </div>
                        </CardHeader>
                        <Divider className="bg-white/5" />
                        <CardBody className="p-6">
                            <div className="h-[280px]">
                                <ResponsivePie
                                    data={activityData}
                                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                    innerRadius={0.6}
                                    padAngle={2}
                                    cornerRadius={4}
                                    activeOuterRadiusOffset={8}
                                    colors={{ datum: 'data.color' }}
                                    borderWidth={0}
                                    enableArcLinkLabels={false}
                                    arcLabelsTextColor="#ffffff"
                                    arcLabelsSkipAngle={10}
                                    theme={{
                                        labels: {
                                            text: {
                                                fontSize: 12,
                                                fontWeight: 'bold'
                                            }
                                        },
                                        tooltip: {
                                            container: {
                                                background: '#0f172a',
                                                color: '#f1f5f9',
                                                fontSize: 12,
                                                borderRadius: 8,
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '8px 12px'
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div className="mt-4 space-y-2">
                                {activityData.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-slate-300 font-medium">{item.label}</span>
                                        </div>
                                        <span className="text-white font-bold">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
