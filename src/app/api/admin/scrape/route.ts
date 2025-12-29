import { NextResponse } from 'next/server';
import { CaixaScraper } from '@/lib/services/caixa-scraper';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'latest'; // 'latest' | 'history'
    const historyCount = parseInt(searchParams.get('count') || '100');

    try {
        const results: Record<string, any> = {};

        const games = [
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

        for (const slug of games) {
            try {
                if (mode === 'history') {
                    // Buscar histórico completo (pode demorar!)
                    console.log(`[${slug}] Syncing ${historyCount} historical draws...`);
                    const result = await CaixaScraper.syncHistory(slug, historyCount);
                    results[slug] = result;
                } else {
                    // Apenas o último sorteio
                    console.log(`[${slug}] Syncing latest draw...`);
                    const result = await CaixaScraper.syncLatest(slug);
                    results[slug] = result;
                }
            } catch (e: any) {
                results[slug] = { success: false, error: e.message };
            }
        }

        return NextResponse.json({
            message: mode === 'history'
                ? `Historical Scraping Completed (${historyCount} draws per game)`
                : 'Latest Draws Scraping Completed',
            mode,
            results
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
