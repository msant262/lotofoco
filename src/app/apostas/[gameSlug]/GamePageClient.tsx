'use client';

import { useState, useTransition } from 'react';
import { LOTTERIES } from '@/lib/config/lotteries';
import { cn } from '@/lib/utils';
import { LotteryHeader } from '@/components/lottery/lottery-header';
import { LotteryBallGrid } from '@/components/lottery/lottery-ball-grid';
import { VolanteGrid } from '@/components/lottery/volante-grid';
import { LotecaGrid } from '@/components/lottery/loteca-grid';
import { LotteryStats } from '@/components/lottery/lottery-stats';
import { ResultsDialog } from '@/components/lottery/results-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Trash2, Plus, Minus, Layers, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { saveBet, GameItem } from '@/lib/firebase/bets-client';
import { SuccessModal } from '@/components/lottery/success-modal';

interface GamePageClientProps {
    gameSlug: string;
}

export default function GamePageClient({ gameSlug }: GamePageClientProps) {
    const slug = gameSlug;
    const config = LOTTERIES[slug];
    const { user } = useAuth();

    // Default Main Quantity & Games Count
    const [quantity, setQuantity] = useState(config?.minBet || 15);
    const [gamesCount, setGamesCount] = useState(1);

    const defaultExtra = config?.slug === 'mais-milionaria' ? 2
        : (config?.slug === 'dia-de-sorte' ? 1
            : (config?.slug === 'timemania' ? 1 : 0));

    const [extraQuantity, setExtraQuantity] = useState(defaultExtra);

    // Manual Selection State
    const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [lotecaOutcomes, setLotecaOutcomes] = useState<Record<number, string>>({});

    // Prediction Result
    const [predictions, setPredictions] = useState<GameItem[]>([]);
    const [isPending, startTransition] = useTransition();
    const [isRevealing, setIsRevealing] = useState(false);
    const [hasRevealed, setHasRevealed] = useState(false);

    // Modal State
    const [showResults, setShowResults] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    if (!config) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <h1 className="text-2xl">Loteria não encontrada: {slug}</h1>
            </div>
        );
    }

    // HANDLERS
    const handleNumberToggle = (num: string) => {
        if (selectedNumbers.includes(num)) {
            setSelectedNumbers(prev => prev.filter(n => n !== num));
        } else {
            if (selectedNumbers.length < quantity) {
                setSelectedNumbers(prev => [...prev, num]);
            }
        }
    };

    const handleExtraToggle = (num: string) => {
        if (selectedExtras.includes(num)) {
            setSelectedExtras(prev => prev.filter(n => n !== num));
        } else {
            if (selectedExtras.length < extraQuantity) {
                setSelectedExtras(prev => [...prev, num]);
            }
        }
    }

    const handleLotecaToggle = (matchIndex: number, outcome: string) => {
        setLotecaOutcomes(prev => ({ ...prev, [matchIndex]: outcome }));
    }

    const handleGenerate = () => {
        setIsRevealing(true);
        setHasRevealed(false);
        setPredictions([]);

        startTransition(async () => {
            await new Promise(r => setTimeout(r, 600));

            // Loteca Logic MOCK
            if (config.layoutType === 'soccer') {
                setHasRevealed(true);
                setIsRevealing(false);
                return;
            }

            const extrasNeeded = extraQuantity - selectedExtras.length;
            const generatedGames: GameItem[] = [];

            // GENERATE MULTIPLE GAMES LOOP
            for (let i = 0; i < gamesCount; i++) {
                try {
                    const response = await fetch('/api/prediction', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: user?.uid || 'demo',
                            game: config.name,
                            quantity,
                            extraQuantity: extrasNeeded,
                            fixedNumbers: selectedNumbers
                        })
                    });

                    if (!response.ok) throw new Error('Falha na API');

                    const result = await response.json();

                    if (result && result.numbers) {
                        const aiMain = result.numbers.slice(0, quantity);
                        const aiExtras = result.numbers.slice(quantity);
                        const finalExtras = [...selectedExtras, ...aiExtras].slice(0, extraQuantity);

                        generatedGames.push({
                            main: aiMain,
                            extras: finalExtras
                        });
                    }
                } catch (err) {
                    console.error("Prediction error", err);
                }
            }

            setPredictions(generatedGames);
            setHasRevealed(true);
            setIsRevealing(false);
            setShowResults(true); // TRIGGER MODAL
        });
    };

    const handleSaveGames = async () => {
        if (!user) {
            alert("Você precisa estar logado para salvar jogos.");
            return;
        }
        setIsSaving(true);
        try {
            // Save as BATCH (Single document with array of games)
            await saveBet(user.uid, slug, config.name, predictions);

            setIsSaving(false);
            setShowResults(false);
            setShowSuccess(true);
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar jogos.");
            setIsSaving(false);
        }
    };

    const handlePrintGames = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Impressão - ${config.name}</title>
                    <style>
                        body { font-family: monospace; padding: 20px; }
                        .ticket { border: 1px solid #000; padding: 10px; margin-bottom: 20px; page-break-inside: avoid; }
                        .header { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
                        .numbers { font-size: 16px; font-weight: bold; letter-spacing: 2px; }
                        .footer { font-size: 10px; color: #555; margin-top: 5px; }
                    </style>
                </head>
                <body>
                    <h1>${config.name} - Palpites LotoFoco</h1>
                    ${predictions.map((game, i) => {
                const allNumbers = [...game.main, ...(game.extras || [])].join(' - ');
                return `
                        <div class="ticket">
                            <div class="header">JOGO ${i + 1}</div>
                            <div class="numbers">${allNumbers}</div>
                            <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
                        </div>
                    `}).join('')}
                    <script>
                        window.onload = () => { window.print(); }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const remainingMain = quantity - selectedNumbers.length;
    const isReady = config.layoutType === 'soccer'
        ? Object.keys(lotecaOutcomes).length === 14
        : (remainingMain === 0 && (extraQuantity - selectedExtras.length) === 0);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
            <div className="pt-16">
                <LotteryHeader config={config} />

                <main className="max-w-[1600px] mx-auto px-4 md:px-6 mt-8 md:mt-12 grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12">

                    {/* LEFT COLUMN */}
                    <div className="xl:col-span-8 space-y-8 order-2 xl:order-1">
                        {config.layoutType === 'soccer' ? (
                            <LotecaGrid
                                config={config}
                                selectedOutcomes={lotecaOutcomes}
                                onToggle={handleLotecaToggle}
                            />
                        ) : (
                            <VolanteGrid
                                config={config}
                                selectedNumbers={selectedNumbers}
                                onToggle={handleNumberToggle}
                                maxSelection={quantity}
                                selectedExtras={selectedExtras}
                                onToggleExtra={handleExtraToggle}
                                maxExtra={extraQuantity}
                            />
                        )}

                        <div className="flex justify-end">
                            {(selectedNumbers.length > 0) && (
                                <Button
                                    variant="ghost"
                                    onClick={() => { setSelectedNumbers([]); setSelectedExtras([]); }}
                                    className="text-slate-400 hover:text-red-400"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Limpar Volante
                                </Button>
                            )}
                        </div>

                        {config.slug === 'dupla-sena' && (
                            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-start gap-4">
                                <div className="p-2 bg-red-500 rounded-full">
                                    <Layers className="w-5 h-5 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-red-100">Dupla Chance de Ganhar</h3>
                                    <p className="text-sm text-red-200/70 leading-relaxed">
                                        Na Dupla Sena, com o mesmo bilhete, você participa de 2 sorteios seguidos.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-8 border-t border-slate-800">
                            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                                <Sparkles className="text-yellow-500" /> Análise Estatística
                            </h2>
                            <LotteryStats config={config} quantity={quantity} />
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="xl:col-span-4 space-y-6 order-1 xl:order-2">
                        <Card className="bg-slate-900 border-slate-800 p-6 sticky top-24 z-30 shadow-2xl ring-1 ring-white/10">
                            <div className="space-y-6">
                                {/* QUANTITY SELECTOR */}
                                {config.layoutType !== 'soccer' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Quantidade de Números</label>
                                            <span className="text-[10px] font-bold text-emerald-500">{quantity} selecionados</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                                            <button
                                                onClick={() => quantity > config.minBet && setQuantity(q => q - 1)}
                                                className="w-10 h-10 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center disabled:opacity-50"
                                                disabled={quantity <= config.minBet}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <div className="flex-1 text-center font-bold text-xl text-white">
                                                {quantity}
                                            </div>
                                            <button
                                                onClick={() => quantity < config.maxBet && setQuantity(q => q + 1)}
                                                className="w-10 h-10 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center disabled:opacity-50"
                                                disabled={quantity >= config.maxBet}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* GAMES COUNT SELECTOR */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Quantidade de Jogos (Bilhetes)</label>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                                        <button
                                            onClick={() => gamesCount > 1 && setGamesCount(g => g - 1)}
                                            className="w-10 h-10 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center "
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1 text-center font-bold text-xl text-white">
                                            {gamesCount}
                                        </div>
                                        <button
                                            onClick={() => gamesCount < 20 && setGamesCount(g => g + 1)}
                                            className="w-10 h-10 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={isPending || isRevealing}
                                    className="w-full h-16 text-lg font-bold shadow-xl transition-all border-0 relative overflow-hidden group mt-4"
                                    style={{
                                        background: `linear-gradient(135deg, ${config.hexColor} 0%, #0f172a 100%)`,
                                        color: config.lightText ? '#000' : '#fff'
                                    }}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                    {isPending ? (
                                        <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Gerando {gamesCount} jogos...</span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 fill-white/20" />
                                            {isReady ? `Gerar ${gamesCount} Aposta(s)` : `Completar ${gamesCount} Jogo(s)`}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </main>

                {/* RESULTS DIALOG */}
                {/* Need to update ResultsDialog to accept GameItem[] */}
                <ResultsDialog
                    open={showResults}
                    onOpenChange={setShowResults}
                    config={config}
                    predictions={predictions}
                    onSave={handleSaveGames}
                    onPrint={handlePrintGames}
                    isSaving={isSaving}
                />

                <SuccessModal
                    open={showSuccess}
                    onOpenChange={setShowSuccess}
                    onPrint={handlePrintGames}
                    onClose={() => setShowSuccess(false)}
                />
            </div>
        </div>
    );
}
