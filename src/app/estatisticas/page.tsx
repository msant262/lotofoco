'use client';

import { useState } from 'react';
import { FrequencyChart } from '@/components/dashboard/frequency-chart';
import { HeatmapChart } from '@/components/dashboard/heatmap-chart';
import { PredictionReveal } from '@/components/dashboard/prediction-reveal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileBarChart, Zap } from 'lucide-react';

const MOCK_FREQ_DATA = [
    { number: '10', frequency: 120 },
    { number: '53', frequency: 115 },
    { number: '05', frequency: 112 },
    { number: '23', frequency: 108 },
    { number: '42', frequency: 101 },
    { number: '04', frequency: 95 },
    { number: '33', frequency: 92 },
    { number: '11', frequency: 89 },
];

const MOCK_HEATMAP_DATA = Array.from({ length: 10 }, (_, i) => ({
    id: String(i + 1).padStart(2, '0'),
    data: Array.from({ length: 10 }, (_, j) => ({
        x: String(j + 11).padStart(2, '0'),
        y: Math.random() // Correlation 0-1
    }))
}));

export default function EstatisticasPage() {
    const [prediction, setPrediction] = useState<string[]>([]);
    const [isRevealing, setIsRevealing] = useState(false);

    const handleGenerate = () => {
        setIsRevealing(true);
        // Simulate API call
        setPrediction([]);
        setTimeout(() => {
            // Mock prediction result
            const result = ['05', '12', '31', '42', '53', '59'];
            setPrediction(result);
        }, 100);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                        LotoFoco <span className="text-emerald-500">Analytics</span>
                    </h1>
                    <p className="text-slate-400 mt-2">Visão estratégica impulsionada por IA.</p>
                </div>
                <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                    <FileBarChart className="mr-2 w-4 h-4" /> Exportar Relatório
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest pl-2">Frequência</p>
                    <FrequencyChart data={MOCK_FREQ_DATA} />
                </div>

                <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest pl-2">Correlações</p>
                    <HeatmapChart data={MOCK_HEATMAP_DATA} />
                </div>
            </div>

            <section className="mt-16">
                <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-900/30 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full mb-6 ring-1 ring-emerald-500/20">
                            <Zap className="w-6 h-6 text-emerald-400 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">IA Preditiva Gemini 1.5</h2>
                        <p className="text-slate-400 mb-8">Nossa IA analisa milhões de combinações para sugerir os números com maior probabilidade matemática.</p>

                        <Button
                            onClick={handleGenerate}
                            disabled={isRevealing && prediction.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg h-14 px-8 rounded-full shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all transform hover:-translate-y-1"
                        >
                            {isRevealing ? 'Analisando Padrões...' : 'Gerar Palpite Agora'}
                        </Button>
                    </div>

                    <div className="min-h-[140px] mt-8">
                        <PredictionReveal numbers={prediction} isRevealing={isRevealing} />
                    </div>
                </Card>
            </section>
        </div>
    )
}
