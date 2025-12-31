'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LotteryBallGrid } from "./lottery-ball-grid";
import { LOTTERIES } from "@/lib/config/lotteries";
import { SavedBet, GameItem } from "@/lib/firebase/bets-client";
import { Copy, Mail, MessageSquare, Printer, Check, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface SavedBetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bet: SavedBet | null;
    plan: string; // 'free' | 'pro'
}

export function SavedBetDialog({ open, onOpenChange, bet, plan }: SavedBetDialogProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    if (!bet) return null;

    const gameConfig = Object.values(LOTTERIES).find(l => l.slug === bet.gameSlug);
    const isPro = plan === 'pro';

    // Normalize data to batch
    const games: GameItem[] = bet.games || (bet.numbers ? [{ main: bet.numbers }] : []);

    const handleCopy = (numbers: string[], index: number) => {
        navigator.clipboard.writeText(numbers.join(', '));
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handlePrint = (singleGameIndex?: number) => {
        const gamesToPrint = singleGameIndex !== undefined ? [games[singleGameIndex]] : games;

        const printWindow = window.open('', 'PrintWindow', 'width=400,height=600,top=100,left=100');

        if (printWindow) {
            // Helper to format extras based on game type
            const formatExtras = (extras: string[]) => {
                if (!extras || extras.length === 0) return '';
                if (bet.gameSlug === 'timemania') return `TIME DO CORAÇÃO: ${extras.join(', ')}`;
                if (bet.gameSlug === 'dia-de-sorte') return `MÊS DE SORTE: ${extras.join(', ')}`;
                if (bet.gameSlug === 'mais-milionaria') return `TREVOS: ${extras.join(', ')}`;
                return `EXTRAS: ${extras.join(', ')}`;
            };

            printWindow.document.write(`
                <html>
                <head>
                    <title>Comprovante - ${bet.gameName}</title>
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            background: white; 
                            color: black; 
                            width: 80mm; 
                            margin: 0 auto; 
                            padding: 10px;
                            box-sizing: border-box;
                        }
                        .ticket { 
                            width: 100%; 
                            border-bottom: 2px dashed #000;
                            padding-bottom: 20px;
                            margin-bottom: 20px;
                            text-align: center;
                        }
                        .ticket:last-child { border-bottom: none; }
                        .logo { 
                            font-size: 26px; 
                            font-weight: 900; 
                            border-bottom: 3px solid #000; 
                            padding-bottom: 5px; 
                            margin-bottom: 15px; 
                            letter-spacing: -1px;
                        }
                        .info-row {
                            display: flex;
                            justify-content: space-between;
                            font-size: 10px;
                            font-weight: bold;
                            margin-bottom: 2px;
                            text-transform: uppercase;
                        }
                        .game-title { 
                            font-size: 18px; 
                            font-weight: bold; 
                            margin: 15px 0 10px 0; 
                            text-transform: uppercase;
                            background: #000;
                            color: #fff;
                            padding: 5px;
                            border-radius: 4px;
                        }
                        .bet-block {
                            margin: 15px 0;
                            text-align: left;
                            border: 1px solid #000;
                            padding: 8px;
                            border-radius: 4px;
                        }
                        .bet-index {
                            font-size: 10px;
                            font-weight: bold;
                            border-bottom: 1px solid #000;
                            margin-bottom: 5px;
                            display: block;
                        }
                        .numbers { 
                            font-size: 16px; 
                            font-weight: bold; 
                            line-height: 1.4;
                            word-break: break-all;
                        }
                        .extras {
                            margin-top: 5px;
                            font-size: 12px;
                            font-weight: bold;
                            border-top: 1px dotted #000;
                            padding-top: 4px;
                        }
                        .barcode {
                             height: 40px;
                             background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px);
                             margin: 20px auto 5px auto;
                             width: 80%;
                        }
                        .footer { font-size: 10px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    ${gamesToPrint.map((g, i) => {
                const displayIndex = singleGameIndex !== undefined ? singleGameIndex + 1 : i + 1;
                const extraText = formatExtras(g.extras || []);

                return `
                        <div class="ticket">
                            <div class="logo">LOTOFOCO</div>
                            
                            <div class="info-row">
                                <span>DATA: ${new Date().toLocaleDateString('pt-BR')}</span>
                                <span>HORA: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div class="info-row">
                                <span>CONCURSO: ${bet.concurso || '-----'}</span>
                                <span>ID: ${bet.id?.substring(0, 6).toUpperCase()}</span>
                            </div>

                            <div class="game-title">${bet.gameName}</div>
                            
                            <div class="bet-block">
                                <span class="bet-index">JOGO ${displayIndex} DE ${games.length}</span>
                                <div class="numbers">
                                    ${g.main.map(n => n.toString().padStart(2, '0')).join(' ')}
                                </div>
                                ${extraText ? `<div class="extras">${extraText}</div>` : ''}
                            </div>
                            
                            <div class="footer">
                                <p>ESTE COMPROVANTE NÃO POSSUI VALOR COMERCIAL.</p>
                                <div class="barcode"></div>
                                <p>LOTERIAS CAIXA - SIMULAÇÃO</p>
                            </div>
                        </div>
                        `
            }).join('')}
                    <script>
                        window.onload = () => { setTimeout(() => window.print(), 500); }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleProAction = (action: string) => {
        if (!isPro) return;
        alert(`${action} enviado com sucesso! (Simulação)`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 bg-transparent border-0 shadow-none max-w-2xl text-slate-100 overflow-visible sm:rounded-3xl ring-0 focus:outline-none [&>button]:hidden">

                {/* Close Button placed outside or floating relative - RED */}
                <div className="absolute -top-12 right-0 sm:-right-12 z-50">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg border border-white/10"
                    >
                        <span className="text-xl font-bold">×</span>
                    </button>
                </div>

                {/* Main Card Container */}
                <div className="bg-slate-900 border border-white/5 shadow-2xl overflow-hidden sm:rounded-3xl flex flex-col max-h-[85vh] relative w-full">

                    {/* Artistic Background Blurs */}
                    <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-slate-800 to-transparent opacity-50 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-400/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" style={{ backgroundColor: gameConfig?.hexColor ? `${gameConfig.hexColor}20` : undefined }} />

                    {/* HEADER */}
                    <div className="relative p-6 sm:p-8 pb-4 z-10">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-400 backdrop-blur-md uppercase tracking-widest text-[10px]">
                                        Comprovante Digital
                                    </Badge>
                                    {games.length > 1 && (
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase text-[10px]">
                                            Lote • {games.length} Jogos
                                        </Badge>
                                    )}
                                </div>

                                <DialogTitle className="text-3xl sm:text-4xl font-black text-white tracking-tighter flex items-center gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg shadow-lg"
                                        style={{ background: `linear-gradient(135deg, ${gameConfig?.hexColor || '#333'}, ${gameConfig?.hexColor || '#333'}dd)` }}>
                                        {bet.gameName.substring(0, 2)}
                                    </div>
                                    {bet.gameName}
                                </DialogTitle>

                                <DialogDescription className="text-slate-400 font-medium flex items-center gap-2 pt-1">
                                    <span className="text-slate-500">Salve em:</span>
                                    {bet.createdAt?.seconds ? new Date(bet.createdAt.seconds * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Hoje'}
                                    <span className="text-slate-600">•</span>
                                    <span className="font-mono text-emerald-500/80 tracking-wide text-xs bg-emerald-950/30 px-2 py-0.5 rounded ml-1">
                                        ID: {bet.id?.slice(0, 8).toUpperCase() || '...'}
                                    </span>
                                </DialogDescription>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    size="lg"
                                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-black shadow-xl shadow-yellow-900/20 active:scale-95 transition-all w-full"
                                    onClick={() => handlePrint()}
                                >
                                    <Printer className="w-5 h-5 mr-2" />
                                    IMPRIMIR COMPROVANTE
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* SCROLLABLE CONTENT */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-2 space-y-4 custom-scrollbar">
                        {games.map((game, idx) => {
                            const displayNums = [...game.main, ...(game.extras || [])];
                            return (
                                <div
                                    key={idx}
                                    className="relative group bg-slate-950/50 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-300"
                                >
                                    {/* Decoration Line */}
                                    <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-slate-800 group-hover:bg-emerald-500/50 transition-colors" />

                                    <div className="flex items-center justify-between mb-4 pl-3">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                                            JOGO {idx + 1}
                                        </span>

                                        {/* Actions always visible now, with background */}
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" onClick={() => handleCopy(displayNums, idx)} className="h-8 px-3 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700">
                                                {copiedIndex === idx ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                                                {copiedIndex === idx ? 'Copiado' : 'Copiar'}
                                            </Button>
                                            <Button variant="secondary" size="sm" onClick={() => handlePrint(idx)} className="h-8 px-3 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700">
                                                <Printer className="w-3.5 h-3.5 mr-1.5" />
                                                Imprimir
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex justify-center pl-2">
                                        {gameConfig ? (
                                            <div className="w-full">
                                                <LotteryBallGrid
                                                    config={gameConfig}
                                                    numbers={displayNums}
                                                    isRevealing={false}
                                                />
                                            </div>
                                        ) : <div className="text-slate-500 text-sm">Dados indisponíveis</div>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* PRO ACTIONS FOOTER */}
                    <div className="p-4 sm:p-6 border-t border-white/5 bg-slate-950/50 grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="bg-transparent border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 h-12 rounded-xl"
                            disabled={!isPro}
                            onClick={() => handleProAction('Email')}
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar por Email
                            {!isPro && <Lock className="w-3 h-3 ml-2 text-yellow-500/50" />}
                        </Button>

                        <Button
                            variant="outline"
                            className="bg-transparent border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 h-12 rounded-xl"
                            disabled={!isPro}
                            onClick={() => handleProAction('SMS')}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Enviar por SMS
                            {!isPro && <Lock className="w-3 h-3 ml-2 text-yellow-500/50" />}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
