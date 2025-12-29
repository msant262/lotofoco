import { NextResponse } from 'next/server';
import { CaixaScraper } from '@/lib/services/caixa-scraper';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'latest'; // 'latest' | 'history'
    const historyCount = parseInt(searchParams.get('count') || '100');
    const targetGame = searchParams.get('game'); // Optional: sync only one game

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

    // If specific game requested, only sync that one
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
