'use client';

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Chip } from "@heroui/react";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import {
    Crown,
    CreditCard,
    Calendar,
    FileText,
    AlertCircle,
    Check,
    Download,
    RefreshCw,
    Sparkles,
    Shield,
    Zap,
    Trophy,
    ChevronRight
} from "lucide-react";
import anime from 'animejs';

interface SubscriptionData {
    plan: string;
    status: 'active' | 'canceled' | 'expired' | 'none';
    startDate?: any;
    endDate?: any;
    nextBillingDate?: any;
    amount?: number;
    paymentMethod?: string;
    subscriptionId?: string;
}

interface Invoice {
    id: string;
    createdAt: any;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    paymentMethod: string;
    plan: string;
}

export default function SubscriptionPage() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionData>({
        plan: 'free',
        status: 'none'
    });
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [errorModal, setErrorModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        details?: string;
    }>({
        show: false,
        title: '',
        message: ''
    });

    useEffect(() => {
        if (user) {
            loadSubscriptionData();
        }
    }, [user]);

    useEffect(() => {
        if (!isLoading) {
            anime({
                targets: '.subscription-card',
                translateY: [20, 0],
                opacity: [0, 1],
                delay: anime.stagger(100),
                duration: 800,
                easing: 'easeOutCubic'
            });
        }
    }, [isLoading]);

    const loadSubscriptionData = async () => {
        if (!user) return;

        try {
            // Load user subscription data
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setSubscription({
                    plan: data.plan || 'free',
                    status: data.subscriptionStatus || 'none',
                    startDate: data.subscriptionStartDate,
                    endDate: data.subscriptionEndDate,
                    nextBillingDate: data.nextBillingDate,
                    amount: data.subscriptionAmount,
                    paymentMethod: data.paymentMethod,
                    subscriptionId: data.subscriptionId
                });
            }

            // Load invoices
            const invoicesQuery = query(
                collection(db, 'invoices'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const invoicesSnapshot = await getDocs(invoicesQuery);
            const invoicesData = invoicesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Invoice[];

            setInvoices(invoicesData);

            setIsLoading(false);
        } catch (error) {
            console.error('Error loading subscription:', error);
            setIsLoading(false);
        }
    };

    const handleSubscribe = async (plan: 'monthly' | 'annual') => {
        if (!user) return;

        // Links de pagamento fixos do AbacatePay
        const paymentLinks = {
            monthly: 'https://abacatepay.com/pay/bill_ktnu24HtuL1DWpAwkFB2wkD2',
            annual: 'https://abacatepay.com/pay/bill_3jpf35ayCGZfYp1EwrzE1F3j'
        };

        const paymentUrl = paymentLinks[plan];

        console.log('🔄 Redirecting to payment:', { plan, paymentUrl });
        console.log('📧 User:', user.email);
        console.log('👤 User ID:', user.uid);

        // Redirecionar diretamente para o link de pagamento
        window.location.href = paymentUrl;
    };

    const hasActiveSubscription = subscription.status === 'active';

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">Carregando assinatura...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="relative group subscription-card">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <Card className="relative bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Crown size={200} className="text-emerald-500" />
                    </div>
                    <CardBody className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <Crown className="text-emerald-500" size={24} />
                            </div>
                            <Chip variant="flat" color="success" className="font-black">
                                GESTÃO DE ASSINATURA
                            </Chip>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
                            {hasActiveSubscription ? 'Seu Plano ' : 'Desbloqueie o '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-purple-400">
                                {hasActiveSubscription ? 'Premium' : 'Poder da IA'}
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
                            {hasActiveSubscription
                                ? 'Gerencie sua assinatura, visualize faturas e atualize seus dados de pagamento.'
                                : 'Acesse ferramentas exclusivas de Inteligência Artificial e maximize suas chances.'}
                        </p>
                    </CardBody>
                </Card>
            </div>

            {/* Current Subscription Status */}
            {hasActiveSubscription ? (
                <div className="space-y-8">
                    {/* Hero PRO Card */}
                    <div className="subscription-card relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
                        <Card className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                            {/* Animated Background */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),transparent_50%)]"></div>
                            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl"></div>

                            <CardBody className="relative p-8 md:p-12">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/50">
                                                <Crown className="text-white" size={28} />
                                            </div>
                                            <Chip
                                                variant="flat"
                                                className="bg-gradient-to-r from-emerald-500/20 to-purple-500/20 border border-emerald-500/30 font-black text-emerald-400"
                                            >
                                                ✨ MEMBRO PRO
                                            </Chip>
                                        </div>

                                        <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                                            Você é <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-purple-400 to-pink-400">Premium</span>
                                        </h2>

                                        <p className="text-slate-300 text-lg font-medium max-w-xl">
                                            Aproveite todos os recursos exclusivos e maximize suas chances com nossa IA avançada.
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Plano Atual</p>
                                            <p className="text-2xl font-black text-white">
                                                {subscription.plan === 'monthly' ? 'Mensal' : 'Anual'}
                                            </p>
                                        </div>
                                        <Chip
                                            color="success"
                                            variant="shadow"
                                            className="font-black"
                                            startContent={<Check size={16} />}
                                        >
                                            ATIVO
                                        </Chip>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Vencimento */}
                        <div className="subscription-card">
                            <Card className="bg-slate-900/40 border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all duration-300">
                                <CardBody className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl">
                                            <Calendar className="text-blue-400" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Próximo Vencimento</p>
                                            <p className="text-2xl font-black text-white">
                                                {subscription.endDate
                                                    ? new Date(subscription.endDate.toDate()).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: 'short'
                                                    })
                                                    : 'N/A'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                                {subscription.endDate
                                                    ? Math.ceil((subscription.endDate.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                                    : '0'} dias restantes
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Valor */}
                        <div className="subscription-card">
                            <Card className="bg-slate-900/40 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all duration-300">
                                <CardBody className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl">
                                            <CreditCard className="text-emerald-400" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Valor Mensal</p>
                                            <p className="text-2xl font-black text-white">
                                                R$ {subscription.amount ? (subscription.amount / 100).toFixed(2) : '0,00'}
                                            </p>
                                            <p className="text-xs text-emerald-400 mt-1 font-bold">
                                                {subscription.paymentMethod?.toUpperCase() || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Status */}
                        <div className="subscription-card">
                            <Card className="bg-slate-900/40 border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all duration-300">
                                <CardBody className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl">
                                            <Trophy className="text-purple-400" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Membro Desde</p>
                                            <p className="text-2xl font-black text-white">
                                                {subscription.startDate
                                                    ? new Date(subscription.startDate.toDate()).toLocaleDateString('pt-BR', {
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })
                                                    : 'N/A'}
                                            </p>
                                            <p className="text-xs text-purple-400 mt-1 font-bold">
                                                ⭐ Status Premium
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </div>

                    {/* Benefits & Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Benefits */}
                        <div className="lg:col-span-2 subscription-card">
                            <Card className="bg-slate-900/40 border border-white/5 rounded-2xl">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-purple-500/20 rounded-xl">
                                            <Sparkles className="text-emerald-400" size={20} />
                                        </div>
                                        <h3 className="text-xl font-black text-white">Benefícios Ativos</h3>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { icon: Zap, text: 'IA Preditiva Avançada', color: 'text-yellow-400' },
                                            { icon: Shield, text: 'Análise de Padrões', color: 'text-blue-400' },
                                            { icon: Trophy, text: 'Estatísticas Exclusivas', color: 'text-purple-400' },
                                            { icon: Sparkles, text: 'Suporte Prioritário', color: 'text-emerald-400' },
                                        ].map((benefit, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                                                <benefit.icon className={benefit.color} size={20} />
                                                <span className="text-sm font-bold text-slate-300">{benefit.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Actions */}
                        <div className="subscription-card">
                            <Card className="bg-slate-900/40 border border-white/5 rounded-2xl">
                                <CardHeader className="pb-4">
                                    <h3 className="text-lg font-black text-white">Ações</h3>
                                </CardHeader>
                                <CardBody className="space-y-3">
                                    <Button
                                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30"
                                    >
                                        <Download size={16} className="mr-2" />
                                        Baixar Faturas
                                    </Button>
                                    <Button
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl"
                                    >
                                        <CreditCard size={16} className="mr-2" />
                                        Atualizar Pagamento
                                    </Button>
                                    <Button
                                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black rounded-xl border border-red-500/20"
                                        onClick={() => setShowCancelModal(true)}
                                    >
                                        <AlertCircle size={16} className="mr-2" />
                                        Cancelar Assinatura
                                    </Button>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </div>
            ) : (
                /* No Active Subscription - Show Plans */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Monthly Plan */}
                    <Card className="subscription-card group relative bg-slate-900 border border-emerald-500/20 rounded-3xl overflow-hidden hover:-translate-y-2 transition-all duration-500">
                        <div className="absolute top-0 right-6">
                            <Chip className="bg-emerald-500/10 text-emerald-400 font-black text-[9px] rounded-t-none border-x border-b border-emerald-500/20">
                                POPULAR
                            </Chip>
                        </div>
                        <CardHeader className="pb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-2">
                                <Zap className="text-emerald-500" size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-white">Mensal</h3>
                            <p className="text-emerald-500/50 font-black uppercase text-[10px] tracking-widest">
                                Para estrategistas
                            </p>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            <div className="flex items-baseline text-emerald-400">
                                <span className="text-4xl font-black">R$ 9,90</span>
                                <span className="text-xs font-bold text-slate-500 ml-2">/mês</span>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-300">
                                <li className="flex items-center gap-3 font-bold">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    Palpites IA Ilimitados
                                </li>
                                <li className="flex items-center gap-3 font-bold">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    Dashboard Estatístico
                                </li>
                                <li className="flex items-center gap-3 font-bold">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    Suporte Prioritário
                                </li>
                            </ul>
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 rounded-xl"
                                onClick={() => handleSubscribe('monthly')}
                            >
                                ASSINAR MENSAL
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardBody>
                    </Card>

                    {/* Annual Plan */}
                    <Card className="subscription-card group relative bg-slate-900 border-2 border-amber-500 rounded-3xl overflow-hidden hover:-translate-y-2 transition-all duration-500 shadow-[0_20px_50px_-10px_rgba(245,158,11,0.3)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                            <Chip className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black px-5 py-1 border-none shadow-xl text-[10px]">
                                MELHOR CUSTO-BENEFÍCIO
                            </Chip>
                        </div>
                        <CardHeader className="pb-4 mt-4">
                            <div className="w-14 h-14 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
                                <Trophy className="text-amber-500" size={28} />
                            </div>
                            <h3 className="text-3xl font-black text-white">Anual</h3>
                            <p className="text-amber-500/70 font-black uppercase text-[10px] tracking-widest">
                                A Escolha dos Profissionais
                            </p>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            <div>
                                <div className="flex items-baseline text-white">
                                    <span className="text-5xl font-black">R$ 89,90</span>
                                    <span className="text-sm font-bold text-slate-500 ml-2">/ano</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <Chip size="sm" className="bg-amber-500/10 text-amber-500 font-black text-[10px]">
                                        Economia de 25%
                                    </Chip>
                                    <span className="text-[9px] font-bold text-slate-500 line-through">R$ 118,80</span>
                                </div>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-200">
                                <li className="flex items-center gap-3 font-bold">
                                    <Check className="w-5 h-5 text-amber-500" />
                                    Acesso VIP Total
                                </li>
                                <li className="flex items-center gap-3 font-bold">
                                    <Check className="w-5 h-5 text-amber-500" />
                                    3 Meses de Bônus Grátis
                                </li>
                                <li className="flex items-center gap-3 font-bold">
                                    <Check className="w-5 h-5 text-amber-500" />
                                    Algoritmo Preditivo V3
                                </li>
                            </ul>
                            <Button
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black h-14 rounded-xl shadow-[0_10px_30px_-5px_rgba(245,158,11,0.5)]"
                                onClick={() => handleSubscribe('annual')}
                            >
                                GARANTIR VANTAGEM
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            )
            }

            {/* Invoices History */}
            {
                invoices.length > 0 && (
                    <div className="subscription-card">
                        <Card className="bg-slate-900/40 border border-white/5 rounded-3xl">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-xl">
                                            <FileText className="text-blue-400" size={20} />
                                        </div>
                                        <h3 className="text-xl font-black text-white">Histórico de Faturas</h3>
                                    </div>
                                    <Chip variant="bordered" className="font-black">
                                        {invoices.length} {invoices.length === 1 ? 'fatura' : 'faturas'}
                                    </Chip>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-3">
                                    {invoices.map((invoice) => (
                                        <div
                                            key={invoice.id}
                                            className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-white/5 hover:bg-slate-800/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-slate-700/50 rounded-lg">
                                                    <FileText className="text-slate-400" size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white">
                                                        Plano {invoice.plan === 'monthly' ? 'Mensal' : 'Anual'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-bold">
                                                        {invoice.createdAt && new Date(invoice.createdAt.toDate()).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-white">
                                                        R$ {(invoice.amount / 100).toFixed(2)}
                                                    </p>
                                                    <Chip
                                                        size="sm"
                                                        color="success"
                                                        variant="flat"
                                                        className="font-black text-[10px]"
                                                    >
                                                        PAGO
                                                    </Chip>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )
            }

            {/* Cancel Modal */}
            {
                showCancelModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <Card className="bg-slate-900 border border-red-500/20 rounded-3xl max-w-md w-full">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-red-500/10 rounded-xl">
                                        <AlertCircle className="text-red-500" size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-white">Cancelar Assinatura</h3>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-6">
                                <p className="text-slate-400 font-medium">
                                    Tem certeza que deseja cancelar sua assinatura? Você perderá acesso a todos os recursos PRO ao final do período pago.
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl"
                                        onClick={() => setShowCancelModal(false)}
                                    >
                                        Manter Plano
                                    </Button>
                                    <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl">
                                        Confirmar Cancelamento
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )
            }

            {/* Error Modal */}
            {
                errorModal.show && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <Card className="bg-slate-900 border border-red-500/20 rounded-3xl max-w-md w-full">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-red-500/10 rounded-xl">
                                        <AlertCircle className="text-red-500" size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-white">{errorModal.title}</h3>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-6">
                                <div className="space-y-3">
                                    <p className="text-slate-300 font-medium">
                                        {errorModal.message}
                                    </p>

                                    {errorModal.details && (
                                        <details className="mt-4">
                                            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 font-bold">
                                                Detalhes técnicos
                                            </summary>
                                            <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-white/5">
                                                <code className="text-xs text-red-400 font-mono break-all">
                                                    {errorModal.details}
                                                </code>
                                            </div>
                                        </details>
                                    )}

                                    <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                        <p className="text-sm text-blue-300 font-medium">
                                            💡 <strong>Precisa de ajuda?</strong>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            Entre em contato com nosso suporte através do email: <br />
                                            <a href="mailto:[email protected]" className="text-blue-400 hover:text-blue-300 font-bold">
                                                [email protected]
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl"
                                        onClick={() => setErrorModal({ show: false, title: '', message: '' })}
                                    >
                                        Fechar
                                    </Button>
                                    <Button
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl"
                                        onClick={() => {
                                            setErrorModal({ show: false, title: '', message: '' });
                                            window.location.reload();
                                        }}
                                    >
                                        Tentar Novamente
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )
            }
        </div >
    );
}
