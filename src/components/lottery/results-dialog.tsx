'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LotteryBallGrid } from "./lottery-ball-grid";
import { LotteryConfig } from "@/lib/config/lotteries";
import { Copy, Save, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ResultsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config: LotteryConfig;
    predictions: string[][];
}

export function ResultsDialog({ open, onOpenChange, config, predictions }: ResultsDialogProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyAll = () => {
        const text = predictions.map((p, i) => `Jogo ${i + 1}: ${p.join(', ')}`).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b border-slate-800 bg-slate-950">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <span className="w-3 h-3 rounded-full" style={{ background: config.hexColor }}></span>
                        {predictions.length} Palpites Gerados
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/50">
                    {predictions.map((game, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 group hover:border-slate-700 transition-colors">
                            <div className="text-xs font-bold text-slate-500 uppercase min-w-[60px]">
                                Jogo {idx + 1}
                            </div>

                            <div className="flex-1 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                                {/* Compact Grid Scale */}
                                <div className="scale-[0.8] origin-left -my-2">
                                    <LotteryBallGrid
                                        config={config}
                                        numbers={game}
                                        isRevealing={false}
                                    />
                                </div>
                            </div>

                            <Button size="icon" variant="ghost" className="text-slate-500 hover:text-white" onClick={() => navigator.clipboard.writeText(game.join(', '))}>
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <DialogFooter className="p-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row gap-4">
                    <p className="text-xs text-slate-500 flex-1 flex items-center">
                        * Os resultados são gerados baseados em estatísticas, mas não garantem prêmio.
                    </p>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 sm:flex-none border-slate-700 hover:bg-slate-800"
                            onClick={handleCopyAll}
                        >
                            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                            {copied ? 'Copiado!' : 'Copiar Todos'}
                        </Button>
                        <Button
                            className="flex-1 sm:flex-none text-white border-0"
                            style={{ background: config.hexColor }}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Jogos
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
