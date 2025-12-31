import { NextResponse } from 'next/server';
import { fetchLatestLottery, fetchLotteryByConcurso } from '@/lib/caixa/caixa-client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const concurso = searchParams.get('concurso');

    if (!slug) {
        return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    try {
        // Se tem concurso específico, busca da API da Caixa
        if (concurso && concurso !== 'undefined' && concurso !== 'null') {
            const contestNum = parseInt(concurso);
            const data = await fetchLotteryByConcurso(slug, contestNum);
            return NextResponse.json(data);
        }

        // Para o último sorteio, busca da API da Caixa
        const data = await fetchLatestLottery(slug);
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Proxy Caixa Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch' }, { status: 500 });
    }
}
