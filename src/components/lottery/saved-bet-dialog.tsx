'use client';

import { useState, useEffect } from "react";
import { LOTTERIES } from "@/lib/config/lotteries";
import { SavedBet } from "@/lib/firebase/bets-client";
import { DrawDetails } from "@/lib/firebase/games-client";
import { LotteryBallGrid } from "./lottery-ball-grid";
import { DownloadLotteryTicket, PrintLotteryTicket } from "./lottery-ticket-pdf";
import anime from "animejs/lib/anime.es.js";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Chip,
    Divider,
    Tooltip,
    Accordion,
    AccordionItem,
    Card,
    CardBody,
    CardHeader,
    Progress
} from "@heroui/react";

import {
    Printer,
    Mail,
    Copy,
    Check,
    Trophy,
    Sparkles,
    ChevronDown,
    Star,
    Download
} from "lucide-react";

// ==================== WHATSAPP ICON ====================
const WhatsAppIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

// ==================== PROPS ====================
interface SavedBetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bet: SavedBet | null;
    plan: string;
    result?: DrawDetails | null;
}

// ==================== MODAL ====================
export function SavedBetDialog({ open, onOpenChange, bet, plan, result }: SavedBetDialogProps) {
    const [copiedGameIndex, setCopiedGameIndex] = useState<number | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);

    // ========== ANIMAÇÃO DE ENTRADA (ANTES DO EARLY RETURN) ==========
    useEffect(() => {
        if (open && bet) {
            setTimeout(() => {
                anime({
                    targets: '.modal-game-card',
                    translateY: [20, 0],
                    opacity: [0, 1],
                    delay: anime.stagger(100),
                    duration: 500,
                    easing: 'easeOutCubic'
                });

                anime({
                    targets: '.modal-action-btn',
                    scale: [0.8, 1],
                    opacity: [0, 1],
                    delay: anime.stagger(50, { start: 300 }),
                    duration: 400,
                    easing: 'easeOutBack'
                });
            }, 100);
        }
    }, [open, bet]);

    if (!bet) return null;

    const lottery = Object.values(LOTTERIES).find(l => l.slug === bet.gameSlug);
    const color = lottery?.hexColor || '#10b981';
    const isPro = plan === 'pro';

    console.log('🔐 Modal - User Plan:', plan, '| isPro:', isPro);

    const games = bet.games || (bet.numbers ? [{ main: bet.numbers }] : []);
    const drawnNumbers = result?.dezenas || [];
    const hasResult = drawnNumbers.length > 0;

    // ========== CALCULAR ACERTOS TOTAIS ==========
    let totalHits = 0;
    let maxHitsInGame = 0;
    if (hasResult) {
        games.forEach(game => {
            const hits = game.main.filter(n =>
                drawnNumbers.some(d => parseInt(d) === parseInt(n))
            ).length;
            totalHits += hits;
            if (hits > maxHitsInGame) maxHitsInGame = hits;
        });
    }

    const winPercentage = hasResult ? Math.round((totalHits / (games.length * 5)) * 100) : 0;

    // ========== COPIAR JOGO ==========
    const copyGame = (gameNumbers: string[], index: number) => {
        const text = gameNumbers.join(', ');
        navigator.clipboard.writeText(text);
        setCopiedGameIndex(index);
        setTimeout(() => setCopiedGameIndex(null), 2000);
    };

    // ========== COPIAR TODOS ==========
    const copyAllGames = () => {
        const allText = games
            .map((g, i) => `Jogo ${i + 1}: ${g.main.join(', ')}`)
            .join('\n');
        navigator.clipboard.writeText(allText);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    // ========== AÇÕES ==========
    const handleEmail = () => {
        if (!isPro) {
            alert('⭐ Recurso exclusivo para assinantes PRO');
            return;
        }
        const subject = `${bet.gameName} - Concurso ${bet.concurso || 'Pendente'}`;
        const body = `Meus Jogos:\n\n${games.map((g, i) =>
            `Jogo ${i + 1}: ${g.main.join(', ')}`
        ).join('\n')}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleWhatsApp = () => {
        if (!isPro) {
            alert('⭐ Recurso exclusivo para assinantes PRO');
            return;
        }
        const text = `🎰 *${bet.gameName}*\n` +
            `${bet.concurso ? `Concurso: ${bet.concurso}` : 'Aguardando sorteio'}\n\n` +
            games.map((g, i) => `Jogo ${i + 1}: ${g.main.join(', ')}`).join('\n');
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    // ========== RENDER ==========
    return (
        <Modal
            isOpen={open}
            onOpenChange={onOpenChange}
            size="4xl"
            scrollBehavior="inside"
            backdrop="blur"
            classNames={{
                base: "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-3xl",
                backdrop: "bg-black/80 backdrop-blur-md",
                closeButton: "hover:bg-white/10 active:bg-white/20 text-white rounded-full"
            }}
        >
            <ModalContent className="border-2 border-white/10 shadow-2xl">
                {(onClose) => (
                    <>
                        {/* ========== HEADER ========== */}
                        <ModalHeader className="flex flex-col gap-0 pb-0 pt-8 px-8">
                            {/* Hero Section */}
                            <div className="relative overflow-hidden rounded-3xl p-6 mb-6"
                                style={{
                                    background: `linear-gradient(135deg, ${color}20, ${color}10)`
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div
                                            className="w-24 h-24 rounded-3xl flex items-center justify-center font-black text-white text-4xl shadow-2xl relative overflow-hidden ring-4 ring-white/10"
                                            style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
                                        >
                                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                            <span className="relative z-10">{bet.gameName.slice(0, 2).toUpperCase()}</span>
                                        </div>

                                        <div>
                                            <h2 className="text-4xl font-black text-white mb-2">{bet.gameName}</h2>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-white/10 text-white font-mono backdrop-blur-sm"
                                                    startContent={<Star className="w-3 h-3" />}
                                                >
                                                    {bet.id?.slice(0, 8).toUpperCase()}
                                                </Chip>
                                                {bet.concurso && (
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        className="bg-emerald-500/20 text-emerald-300 font-bold backdrop-blur-sm"
                                                    >
                                                        Concurso {bet.concurso}
                                                    </Chip>
                                                )}
                                                {games.length > 1 && (
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        className="bg-purple-500/20 text-purple-300 font-bold backdrop-blur-sm"
                                                    >
                                                        {games.length} Jogos
                                                    </Chip>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {hasResult && totalHits > 0 && (
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end mb-2">
                                                <Trophy className="w-6 h-6 text-yellow-400" />
                                                <span className="text-5xl font-black text-white">{totalHits}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 font-medium">Acertos Totais</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resultado Oficial */}
                            {result && (
                                <Card className="bg-gradient-to-br from-emerald-950/50 via-emerald-900/30 to-emerald-950/50 border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/10 mb-6">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-yellow-500/20 rounded-2xl backdrop-blur-sm">
                                                    <Trophy className="w-6 h-6 text-yellow-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                                                        Resultado Oficial
                                                    </p>
                                                    <p className="text-xl font-black text-white">Concurso {result.concurso}</p>
                                                </div>
                                            </div>

                                            {winPercentage > 0 && (
                                                <div className="text-right">
                                                    <p className="text-3xl font-black text-emerald-400">{winPercentage}%</p>
                                                    <p className="text-xs text-slate-400">Taxa de Acerto</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardBody className="pt-0">
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {result.dezenas.map((num, idx) => (
                                                <div
                                                    key={idx}
                                                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300/30"
                                                >
                                                    {num}
                                                </div>
                                            ))}
                                        </div>
                                        {winPercentage > 0 && (
                                            <Progress
                                                value={winPercentage}
                                                color="success"
                                                className="mt-2"
                                                classNames={{
                                                    indicator: "bg-gradient-to-r from-emerald-400 to-emerald-600"
                                                }}
                                            />
                                        )}
                                    </CardBody>
                                </Card>
                            )}
                        </ModalHeader>

                        {/* ========== BODY ========== */}
                        <ModalBody className="px-8 py-6">
                            <Accordion
                                variant="splitted"
                                selectionMode="multiple"
                                defaultExpandedKeys={games.length === 1 ? ["0"] : []}
                                className="px-0"
                            >
                                {games.map((game, idx) => {
                                    const gameNumbers = [...game.main, ...(game.extras || [])];
                                    const matchedNumbers = gameNumbers.filter(n =>
                                        drawnNumbers.some(d => parseInt(d) === parseInt(n))
                                    );
                                    const hits = matchedNumbers.length;

                                    return (
                                        <AccordionItem
                                            key={idx}
                                            aria-label={`Jogo ${idx + 1}`}
                                            className={`modal-game-card ${hits > 0
                                                ? 'bg-gradient-to-br from-emerald-950/30 to-emerald-900/20 border-2 border-emerald-500/40'
                                                : 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-2 border-slate-700/50'
                                                } rounded-3xl shadow-xl mb-3`}
                                            indicator={<ChevronDown className="w-5 h-5" />}
                                            title={
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-white text-lg backdrop-blur-sm">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-white">Jogo {idx + 1}</p>
                                                        {result && (
                                                            <Chip
                                                                size="sm"
                                                                className={`${hits > 0
                                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                                    : 'bg-slate-800 text-slate-600'
                                                                    } font-bold border-0 mt-1`}
                                                            >
                                                                {hits === 0 ? 'Nenhum acerto' : `${hits} Acertos`}
                                                            </Chip>
                                                        )}
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <div className="p-6 pt-2">
                                                <div className="flex justify-between items-center mb-4">
                                                    <p className="text-sm text-slate-400">Números do jogo {idx + 1}</p>
                                                    <Tooltip content={copiedGameIndex === idx ? "Copiado!" : "Copiar números"}>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="flat"
                                                            className="bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm rounded-xl"
                                                            onPress={() => copyGame(gameNumbers, idx)}
                                                        >
                                                            {copiedGameIndex === idx ? (
                                                                <Check className="w-4 h-4 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </Tooltip>
                                                </div>

                                                {lottery ? (
                                                    <LotteryBallGrid
                                                        config={lottery}
                                                        numbers={gameNumbers}
                                                        isRevealing={false}
                                                        matchedNumbers={matchedNumbers}
                                                    />
                                                ) : (
                                                    <p className="text-slate-500 text-center">Configuração não encontrada</p>
                                                )}
                                            </div>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        </ModalBody>

                        {/* ========== FOOTER ========== */}
                        <ModalFooter className="flex flex-col gap-4 px-8 pb-8">
                            {/* Botões de Ação */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                                {/* Botão Baixar PDF */}
                                <div className="modal-action-btn bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border-2 border-blue-500/30 backdrop-blur-sm rounded-2xl overflow-hidden">
                                    <DownloadLotteryTicket bet={bet} result={result} />
                                </div>

                                {/* Botão Imprimir */}
                                <div className="modal-action-btn bg-gradient-to-br from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border-2 border-purple-500/30 backdrop-blur-sm rounded-2xl overflow-hidden">
                                    <PrintLotteryTicket bet={bet} result={result} />
                                </div>

                                <Button
                                    className={`modal-action-btn font-bold border-2 backdrop-blur-sm rounded-2xl ${isPro
                                        ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 text-purple-400 border-purple-500/30'
                                        : 'bg-slate-800/50 text-slate-600 border-slate-700/50 cursor-not-allowed'
                                        }`}
                                    startContent={<Mail className="w-5 h-5" />}
                                    onPress={handleEmail}
                                    isDisabled={!isPro}
                                    size="lg"
                                >
                                    Email
                                </Button>

                                <Button
                                    className={`modal-action-btn font-bold border-2 backdrop-blur-sm rounded-2xl ${isPro
                                        ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 text-green-400 border-green-500/30'
                                        : 'bg-slate-800/50 text-slate-600 border-slate-700/50 cursor-not-allowed'
                                        }`}
                                    startContent={<WhatsAppIcon />}
                                    onPress={handleWhatsApp}
                                    isDisabled={!isPro}
                                    size="lg"
                                >
                                    WhatsApp
                                </Button>

                                {games.length > 1 && (
                                    <Button
                                        className="modal-action-btn bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 text-emerald-400 font-bold border-2 border-emerald-500/30 backdrop-blur-sm rounded-2xl"
                                        startContent={copiedAll ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        onPress={copyAllGames}
                                        size="lg"
                                    >
                                        {copiedAll ? 'Copiado!' : 'Copiar Todos'}
                                    </Button>
                                )}
                            </div>

                            {/* Aviso PRO */}
                            {!isPro && (
                                <Card className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-yellow-500/30 backdrop-blur-sm">
                                    <CardBody className="py-4">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="w-6 h-6 text-yellow-400" />
                                            <div>
                                                <p className="text-sm font-bold text-yellow-400">Upgrade para PRO</p>
                                                <p className="text-xs text-yellow-500/80">
                                                    Desbloqueie Email, WhatsApp e muito mais
                                                </p>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            )}

                            <Divider className="bg-white/10" />

                            {/* Fechar */}
                            <Button
                                color="danger"
                                variant="light"
                                size="lg"
                                className="w-full font-bold rounded-2xl"
                                onPress={onClose}
                            >
                                Fechar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
