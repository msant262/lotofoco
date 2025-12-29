'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Play, Database, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

const GAMES = [
    { slug: 'mega-sena', name: 'Mega-Sena', color: '#209869' },
    { slug: 'lotofacil', name: 'Lotofácil', color: '#930089' },
    { slug: 'quina', name: 'Quina', color: '#260085' },
    { slug: 'lotomania', name: 'Lotomania', color: '#F78100' },
    { slug: 'timemania', name: 'Timemania', color: '#FFF100' },
    { slug: 'dupla-sena', name: 'Dupla Sena', color: '#A61317' },
    { slug: 'dia-de-sorte', name: 'Dia de Sorte', color: '#CB8322' },
    { slug: 'super-sete', name: 'Super Sete', color: '#BEDC00' },
    { slug: 'mais-milionaria', name: '+Milionária', color: '#003758' },
    { slug: 'federal', name: 'Federal', color: '#004381' },
    { slug: 'loteca', name: 'Loteca', color: '#CA502C' },
];

interface ApiResult {
    success?: boolean;
    concurso?: number;
    saved?: number;
    error?: string;
}

export default function AdminPage() {
    const [loading, setLoading] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, ApiResult>>({});
    const [historyCount, setHistoryCount] = useState(50);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [lastDuration, setLastDuration] = useState<number | null>(null);
    const [debugData, setDebugData] = useState<any>(null);

    const runScrape = async (mode: 'latest' | 'history', game?: string) => {
        const key = game || 'all';
        setLoading(key);
        setResults(prev => ({ ...prev, [key]: {} }));

        try {
            let url = `/api/admin/scrape?mode=${mode}`;
            if (mode === 'history') url += `&count=${historyCount}`;
            if (game) url += `&game=${game}`;

            const res = await fetch(url);
            const data = await res.json();

            if (game) {
                setResults(prev => ({ ...prev, [game]: data.results?.[game] || { error: 'No data' } }));
            } else {
                setResults(data.results || {});
            }
            setLastDuration(data.durationSeconds);
        } catch (e: any) {
            setResults(prev => ({ ...prev, [key]: { error: e.message } }));
        }

        setLoading(null);
    };

    const runAllLatest = async () => {
        setGlobalLoading(true);
        setResults({});
        await runScrape('latest');
        setGlobalLoading(false);
    };

    const runAllHistory = async () => {
        setGlobalLoading(true);
        setResults({});
        await runScrape('history');
        setGlobalLoading(false);
    };

    const runDebug = async (slug: string) => {
        setDebugData(null);
        try {
            const res = await fetch(`/api/admin/debug?slug=${slug}`);
            const data = await res.json();
            setDebugData(data);
        } catch (e: any) {
            setDebugData({ error: e.message });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">🎰 Painel Admin - Scraping</h1>
                        <p className="text-slate-400 mt-1">Gerencie a sincronização dos dados das loterias</p>
                    </div>
                    {lastDuration && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Clock className="w-4 h-4" />
                            Última execução: {lastDuration}s
                        </div>
                    )}
                </div>

                {/* Global Actions */}
                <Card className="bg-slate-900 border-slate-800 p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5 text-emerald-500" />
                        Ações Globais
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                            onClick={runAllLatest}
                            disabled={globalLoading}
                            className="h-16 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            {globalLoading && loading === 'all' ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
                            Sincronizar Últimos (Todas)
                        </Button>

                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={historyCount}
                                onChange={(e) => setHistoryCount(parseInt(e.target.value) || 50)}
                                className="w-24 bg-slate-800 border-slate-700"
                                min={10}
                                max={3000}
                            />
                            <Button
                                onClick={runAllHistory}
                                disabled={globalLoading}
                                className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white"
                            >
                                {globalLoading ? <Loader2 className="animate-spin mr-2" /> : <Database className="mr-2" />}
                                Histórico ({historyCount} cada)
                            </Button>
                        </div>

                        <div className="text-xs text-slate-500 flex items-center">
                            ⚠️ Histórico pode demorar vários minutos
                        </div>
                    </div>
                </Card>

                {/* Individual Games */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {GAMES.map((game) => {
                        const result = results[game.slug];
                        const isLoading = loading === game.slug;

                        return (
                            <Card
                                key={game.slug}
                                className="bg-slate-900 border-slate-800 p-4 hover:border-slate-700 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: game.color }}
                                        />
                                        <span className="font-bold">{game.name}</span>
                                    </div>

                                    {result && (
                                        <div>
                                            {result.success ? (
                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            ) : result.error ? (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            ) : null}
                                        </div>
                                    )}
                                </div>

                                {result && (
                                    <div className="text-xs text-slate-400 mb-3 bg-slate-950 p-2 rounded">
                                        {result.concurso && <div>Concurso: <span className="text-white">{result.concurso}</span></div>}
                                        {result.saved && <div>Salvos: <span className="text-emerald-400">{result.saved}</span></div>}
                                        {result.error && <div className="text-red-400 truncate">{result.error}</div>}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => runScrape('latest', game.slug)}
                                        disabled={isLoading}
                                        className="flex-1 border-slate-700 hover:bg-slate-800"
                                    >
                                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                                        Último
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => runScrape('history', game.slug)}
                                        disabled={isLoading}
                                        className="flex-1 border-slate-700 hover:bg-slate-800"
                                    >
                                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3 mr-1" />}
                                        Histórico
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => runDebug(game.slug)}
                                        className="text-slate-500 hover:text-white"
                                    >
                                        🔍
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Debug Panel */}
                {debugData && (
                    <Card className="bg-slate-900 border-slate-800 p-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold">Debug: {debugData.slug}</h3>
                            <Button size="sm" variant="ghost" onClick={() => setDebugData(null)}>✕</Button>
                        </div>
                        <pre className="text-xs bg-slate-950 p-4 rounded overflow-auto max-h-96">
                            {JSON.stringify(debugData.rawData || debugData, null, 2)}
                        </pre>
                    </Card>
                )}

                {/* API Reference */}
                <Card className="bg-slate-900/50 border-slate-800 p-6">
                    <h2 className="text-lg font-bold mb-4">📚 API Reference</h2>
                    <div className="grid gap-3 text-sm font-mono">
                        <div className="bg-slate-950 p-3 rounded flex justify-between items-center">
                            <code>GET /api/admin/scrape</code>
                            <span className="text-slate-500">Sincroniza último de todas</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded flex justify-between items-center">
                            <code>GET /api/admin/scrape?mode=history&count=100</code>
                            <span className="text-slate-500">Histórico (100 cada)</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded flex justify-between items-center">
                            <code>GET /api/admin/scrape?game=mega-sena</code>
                            <span className="text-slate-500">Apenas Mega-Sena</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded flex justify-between items-center">
                            <code>GET /api/admin/debug?slug=mega-sena</code>
                            <span className="text-slate-500">Ver JSON bruto da API</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
