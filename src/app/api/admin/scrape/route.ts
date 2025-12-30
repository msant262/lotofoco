import { NextResponse } from 'next/server';
import { CaixaScraper } from '@/lib/services/caixa-scraper';

export const maxDuration = 300; // 5 minutos max

const allGames = [
    'mega-sena',
    'lotofacil',
    'quina',
    'lotomania',
    'timemania',
    'dupla-sena',
    'dia-de-sorte',
    'super-sete',
    'mais-milionaria',
    'federal',
    'loteca'
];

// GET - Sincronização simples (retorna só quando termina)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'latest';
    const historyCount = parseInt(searchParams.get('count') || '100');
    const targetGame = searchParams.get('game');

    const games = targetGame ? [targetGame] : allGames;

    try {
        const results: Record<string, any> = {};
        const startTime = Date.now();

        for (const slug of games) {
            if (!allGames.includes(slug)) {
                results[slug] = { success: false, error: 'Invalid game slug' };
                continue;
            }

            try {
                if (mode === 'history') {
                    console.log(`[${slug}] Starting history sync (${historyCount} draws)...`);
                    const result = await CaixaScraper.syncHistory(slug, historyCount);
                    results[slug] = result;
                    console.log(`[${slug}] Completed: ${result.saved} draws saved`);
                } else {
                    console.log(`[${slug}] Syncing latest draw...`);
                    const result = await CaixaScraper.syncLatest(slug);
                    results[slug] = result;
                }
            } catch (e: any) {
                console.error(`[${slug}] Error:`, e.message);
                results[slug] = { success: false, error: e.message };
            }
        }

        const duration = Math.round((Date.now() - startTime) / 1000);

        return NextResponse.json({
            message: mode === 'history'
                ? `Historical Scraping Completed (${historyCount} draws per game)`
                : 'Latest Draws Scraping Completed',
            mode,
            gamesProcessed: games.length,
            durationSeconds: duration,
            results
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// POST - Sincronização com streaming de progresso
export async function POST(request: Request) {
    const body = await request.json();
    const mode = body.mode || 'latest';
    const historyCount = parseInt(body.count || '100');
    const targetGame = body.game;

    const games = targetGame ? [targetGame] : allGames;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendProgress = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            const startTime = Date.now();
            const results: Record<string, any> = {};
            let completed = 0;

            sendProgress({
                type: 'start',
                totalGames: games.length,
                mode,
                historyCount: mode === 'history' ? historyCount : null
            });

            for (const slug of games) {
                if (!allGames.includes(slug)) {
                    results[slug] = { success: false, error: 'Invalid game slug' };
                    completed++;
                    sendProgress({
                        type: 'game_error',
                        game: slug,
                        error: 'Invalid game slug',
                        progress: completed,
                        total: games.length
                    });
                    continue;
                }

                sendProgress({
                    type: 'game_start',
                    game: slug,
                    progress: completed,
                    total: games.length
                });

                try {
                    if (mode === 'history') {
                        const result = await CaixaScraper.syncHistory(slug, historyCount);
                        results[slug] = result;

                        sendProgress({
                            type: 'game_complete',
                            game: slug,
                            success: result.success,
                            saved: result.saved,
                            latestConcurso: result.latestConcurso,
                            progress: ++completed,
                            total: games.length
                        });
                    } else {
                        const result = await CaixaScraper.syncLatest(slug);
                        results[slug] = result;

                        sendProgress({
                            type: 'game_complete',
                            game: slug,
                            success: result.success,
                            concurso: result.concurso,
                            progress: ++completed,
                            total: games.length
                        });
                    }
                } catch (e: any) {
                    results[slug] = { success: false, error: e.message };
                    completed++;
                    sendProgress({
                        type: 'game_error',
                        game: slug,
                        error: e.message,
                        progress: completed,
                        total: games.length
                    });
                }
            }

            const duration = Math.round((Date.now() - startTime) / 1000);

            sendProgress({
                type: 'complete',
                durationSeconds: duration,
                totalGames: games.length,
                results
            });

            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    });
}
