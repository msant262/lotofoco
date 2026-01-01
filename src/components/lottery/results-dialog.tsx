'use client';

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    CardBody,
    Chip,
    Divider
} from "@heroui/react";
import { LotteryBallGrid } from "./lottery-ball-grid";
import { LotteryConfig } from "@/lib/config/lotteries";
import { Copy, Save, Printer, Loader2, Sparkles, Wand2, X, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { GameItem } from "@/lib/firebase/bets-client";
import anime from "animejs";
import { cn } from "@/lib/utils";

interface ResultsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config: LotteryConfig;
    predictions: GameItem[];
    onSave: () => void;
    onPrint: () => void;
    isSaving?: boolean;
}

export function ResultsDialog({ open, onOpenChange, config, predictions, onSave, onPrint, isSaving }: ResultsDialogProps) {
    const [copied, setCopied] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // AnimeJS Animations when modal opens
    useEffect(() => {
        if (open && predictions.length > 0) {
            // Reset opacity needed for animation
            const items = document.querySelectorAll('.result-item');

            anime({
                targets: items,
                translateY: [20, 0],
                opacity: [0, 1],
                scale: [0.95, 1],
                delay: anime.stagger(150, { start: 200 }),
                duration: 600,
                easing: 'easeOutExpo'
            });

            // Animate spark on header
            anime({
                targets: '.header-sparkle',
                scale: [0, 1],
                opacity: [0, 1],
                rotate: '1turn',
                duration: 1000,
                delay: 100
            });
        }
    }, [open, predictions]);

    const handleCopyAll = () => {
        const text = predictions.map((p, i) => {
            const allNums = [...p.main, ...(p.extras || [])];
            return `Jogo ${i + 1}: ${allNums.join(', ')}`;
        }).join('\n');

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal
            isOpen={open}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="4xl"
            scrollBehavior="inside"
            classNames={{
                base: "bg-slate-950/90 border border-white/10 shadow-2xl",
                header: "border-b border-white/5 pb-4",
                body: "py-6",
                footer: "border-t border-white/5 pt-4 bg-slate-900/50",
                closeButton: "hover:bg-white/10 active:bg-white/20 text-white"
            }}
            motionProps={{
                variants: {
                    enter: {
                        scale: 1,
                        opacity: 1,
                        transition: {
                            duration: 0.3,
                            ease: "easeOut"
                        }
                    },
                    exit: {
                        scale: 0.95,
                        opacity: 0,
                        transition: {
                            duration: 0.2,
                            ease: "easeIn"
                        }
                    }
                }
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 relative overflow-hidden">
                            {/* Dynamic Background Glow */}
                            <div
                                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"
                                style={{ backgroundColor: config.hexColor }}
                            />

                            <div className="flex items-center gap-3 z-10">
                                <div
                                    className="p-2 rounded-xl border border-white/10 shadow-inner header-sparkle"
                                    style={{ background: `linear-gradient(135deg, ${config.hexColor}20, ${config.hexColor}05)` }}
                                >
                                    <Wand2 className="w-5 h-5" style={{ color: config.hexColor }} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        Palpites Gerados
                                        <Chip size="sm" variant="flat" className="border border-white/10 bg-black/40 text-slate-400">
                                            {predictions.length} Jogos
                                        </Chip>
                                    </h2>
                                    <p className="text-xs text-slate-400 font-medium tracking-wide">
                                        Inteligência Artificial + Estatísticas
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>

                        <ModalBody className="px-6 scrollbar-hide">
                            <div className="flex flex-col gap-6">
                                {predictions.map((game, idx) => {
                                    const displayNumbers = [...game.main, ...(game.extras || [])];
                                    return (
                                        <div
                                            key={idx}
                                            className="result-item opacity-0 group" // Initial opacity 0 for animejs
                                        >
                                            <Card
                                                className="bg-slate-900/50 border-white/5 hover:border-white/10 transition-colors"
                                                shadow="sm"
                                            >
                                                <CardBody className="p-0 overflow-hidden">
                                                    {/* Game Header Row */}
                                                    <div className="flex flex-col md:flex-row items-center gap-4 p-4">
                                                        {/* Badge Jogo X */}
                                                        <div className="flex items-center justify-center bg-slate-800/80 w-16 h-8 rounded-lg border border-white/5 shrink-0">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                Jogo {idx + 1}
                                                            </span>
                                                        </div>

                                                        {/* Ball Grid Container */}
                                                        <div className="flex-1 w-full overflow-x-auto scrollbar-hide flex justify-center md:justify-start py-2">
                                                            <div className="scale-[0.85] origin-center md:origin-left -my-3">
                                                                <LotteryBallGrid
                                                                    config={config}
                                                                    numbers={displayNumbers}
                                                                    isRevealing={false}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Quick Actions (Copy Single) */}
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            className="text-slate-500 hover:text-white shrink-0"
                                                            onPress={() => navigator.clipboard.writeText(displayNumbers.join(', '))}
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </Button>
                                                    </div>

                                                    {/* AI Insight Section */}
                                                    {game.explanation && (
                                                        <div className="bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-transparent border-t border-white/5 px-5 py-3 flex gap-3 items-start relative">
                                                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-purple-500 via-blue-500 to-transparent opacity-50" />
                                                            <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0 animate-pulse" />
                                                            <div className="flex-1">
                                                                <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mb-0.5">Análise da IA</p>
                                                                <p className="text-xs text-slate-300 leading-relaxed font-light italic">
                                                                    "{game.explanation}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardBody>
                                            </Card>
                                        </div>
                                    );
                                })}
                            </div>
                        </ModalBody>

                        <ModalFooter className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-950">
                            <div className="text-[10px] text-slate-500 text-center sm:text-left">
                                <span className="text-amber-500 font-bold">* Aviso:</span> Estatísticas não garantem prêmios. Jogue com responsabilidade.
                            </div>

                            <div className="flex w-full sm:w-auto gap-2">
                                <Button
                                    variant="bordered"
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex-1 sm:flex-none"
                                    onPress={handleCopyAll}
                                >
                                    {copied ? <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" /> : <Copy className="w-4 h-4 mr-1" />}
                                    {copied ? 'Copiado!' : 'Copiar'}
                                </Button>

                                <Button
                                    className="bg-slate-800 text-white hover:bg-slate-700 font-medium flex-1 sm:flex-none"
                                    onPress={onPrint}
                                >
                                    <Printer className="w-4 h-4 mr-1" />
                                    Imprimir
                                </Button>

                                <Button
                                    className="text-black font-bold shadow-lg shadow-white/10 flex-1 sm:flex-none transition-transform active:scale-95"
                                    style={{
                                        backgroundColor: config.hexColor,
                                        boxShadow: `0 0 20px ${config.hexColor}40`
                                    }}
                                    onPress={onSave}
                                    isLoading={isSaving}
                                >
                                    {!isSaving && <Save className="w-4 h-4 mr-1" />}
                                    {isSaving ? 'Salvando...' : 'Salvar Jogos'}
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
