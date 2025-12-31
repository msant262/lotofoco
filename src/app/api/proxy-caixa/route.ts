import { NextResponse } from 'next/server';
import { fetchLatestLottery, fetchLotteryByConcurso } from '@/lib/caixa/caixa-client';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const concurso = searchParams.get('concurso');

    if (!slug) {
        return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    try {
        // Optimization: Try Static Cache for historical contests
        if (concurso && concurso !== 'undefined' && concurso !== 'null') {
            const contestNum = parseInt(concurso);
            const filePath = path.join(process.cwd(), 'public', 'data', 'history', `${slug}.json`);

            if (fs.existsSync(filePath)) {
                try {
                    const staticData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    const drawings = staticData.draws || [];
                    const found = drawings.find((d: any) => d.c === contestNum);

                    if (found) {
                        return NextResponse.json({
                            concurso: found.c,
                            dezenas: found.d,
                            data: found.t,
                            _cached: true
                        });
                    }
                } catch (e) {
                    console.warn(`[Proxy] Error reading cache for ${slug}`, e);
                }
            }

            // Fallback to real API if not in cache
            const data = await fetchLotteryByConcurso(slug, contestNum);
            return NextResponse.json(data);
        } else {
            // HIGH PERFORMANCE: Check if static cache is fresh for latest
            const filePath = path.join(process.cwd(), 'public', 'data', 'history', `${slug}.json`);
            if (fs.existsSync(filePath)) {
                try {
                    const staticData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    const lastUpdate = new Date(staticData.lastUpdate || 0).getTime();
                    const now = new Date().getTime();

                    // If cache is less than 60 mins old, serve it as latest
                    if (now - lastUpdate < 3600000 && staticData.draws?.length > 0) {
                        const latest = staticData.draws[0];
                        return NextResponse.json({
                            concurso: latest.c,
                            dezenas: latest.d,
                            data: latest.t,
                            _cachedLatest: true
                        });
                    }
                } catch (e) {
                    console.warn(`[Proxy] Error reading latest cache for ${slug}`, e);
                }
            }

            // Fallback to real API for absolute freshness
            const data = await fetchLatestLottery(slug);
            return NextResponse.json(data);
        }
    } catch (error: any) {
        console.error('Proxy Caixa Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch' }, { status: 500 });
    }
}
