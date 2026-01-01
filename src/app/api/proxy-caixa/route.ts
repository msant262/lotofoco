import { NextResponse } from 'next/server';
import { fetchLatestLottery, fetchLotteryByConcurso } from '@/lib/caixa/caixa-client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const urlObj = new URL(request.url);
    const { searchParams, origin } = urlObj;
    const slug = searchParams.get('slug');
    const concurso = searchParams.get('concurso');

    if (!slug) {
        return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    try {
        let data;
        const contestNum = (concurso && concurso !== 'undefined' && concurso !== 'null')
            ? parseInt(concurso)
            : undefined;

        try {
            // 1. Tentar buscar da API oficial
            if (contestNum) {
                data = await fetchLotteryByConcurso(slug, contestNum);
            } else {
                data = await fetchLatestLottery(slug);
            }
        } catch (apiError) {
            console.warn(`⚠️ Caixa API failed for ${slug} (Concurso: ${contestNum || 'Latest'}). Attempting local backup...`);

            // 2. Fallback: Buscar do JSON local em /public/data/history
            data = await fetchLocalBackup(slug, origin, contestNum);

            // Se falhou em buscar o concurso específico no backup, tenta pegar o mais recente do backup
            if (!data && contestNum) {
                console.warn(`⚠️ Backup for contest ${contestNum} not found in ${slug}.json. Fetching latest from backup instead.`);
                data = await fetchLocalBackup(slug, origin);
            }

            if (!data) {
                // Se não achou no backup, lança o erro original
                throw apiError;
            }
            console.log(`✅ Served from local backup: ${slug} ${data.concurso} (Requested: ${contestNum || 'Latest'})`);
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('❌ Proxy Caixa Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch' }, { status: 500 });
    }
}

// --- Helpers para Backup Local ---

async function fetchLocalBackup(slug: string, origin: string, concurso?: number) {
    try {
        // Busca o arquivo JSON estático
        const jsonUrl = `${origin}/data/history/${slug}.json`;
        const res = await fetch(jsonUrl, { cache: 'no-store' });

        if (!res.ok) return null;

        const fileData = await res.json();
        if (!fileData || !Array.isArray(fileData.draws)) return null;

        let draw;
        if (concurso) {
            // Busca concurso específico
            draw = fileData.draws.find((d: any) => d.c === concurso);
        } else {
            // Pega o mais recente (primeiro da lista)
            draw = fileData.draws[0];
        }

        if (!draw) return null;

        return mapLocalToFull(draw, slug);
    } catch (e) {
        console.error("Local backup fetch error:", e);
        return null;
    }
}

function mapLocalToFull(local: any, slug: string) {
    // Mapeia o formato enxuto (c, d, t, a) para o formato completo da Caixa
    return {
        concurso: local.c,
        data: local.t,
        dezenas: local.d,
        acumulado: local.a,
        tipoJogo: slug.toUpperCase(),
        localSorteio: 'Dados Históricos (Offline)',
        nomeMunicipioUFSorteio: 'Caixa Econômica Federal',
        dezenasOrdemSorteio: local.d, // Fallback, ordem crescente
        valorAcumuladoProximoConcurso: 0,
        valorAcumuladoConcursoEspecial: 0,
        numeroConcursoProximo: local.c + 1,
        dataProximoConcurso: '',
        valorEstimadoProximoConcurso: 0,
        valorArrecadado: 0,
        listaRateioPremio: [],
        listaMunicipioUFGanhadores: [],
        valorTotalPremioFaixaUm: 0,
        indicadorConcursoEspecial: 0,
        // Flags para UI saber que é dado de backup
        isBackup: true
    };
}
