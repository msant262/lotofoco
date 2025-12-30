'use server';

import axios from 'axios';
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

const API_BASE = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://loterias.caixa.gov.br',
    'Referer': 'https://loterias.caixa.gov.br/'
};

const API_SLUGS: Record<string, string> = {
    'mega-sena': 'megasena',
    'lotofacil': 'lotofacil',
    'quina': 'quina',
    'lotomania': 'lotomania',
    'timemania': 'timemania',
    'dupla-sena': 'duplasena',
    'dia-de-sorte': 'diadesorte',
    'super-sete': 'supersete',
    'mais-milionaria': 'maismilionaria',
    'federal': 'federal',
    'loteca': 'loteca'
};

const DB_NAMES: Record<string, string> = {
    'mega-sena': 'Mega-Sena',
    'lotofacil': 'Lotofácil',
    'quina': 'Quina',
    'lotomania': 'Lotomania',
    'timemania': 'Timemania',
    'dupla-sena': 'Dupla-Sena',
    'dia-de-sorte': 'Dia-de-Sorte',
    'super-sete': 'Super-Sete',
    'mais-milionaria': '+Milionária',
    'federal': 'Federal',
    'loteca': 'Loteca'
};

interface DrawData {
    concurso: number;
    data: string;
    dezenas: string[];
    acumulado: boolean;
    [key: string]: any;
}

// Buscar sorteio da Caixa
async function fetchDraw(slug: string, concurso?: number): Promise<DrawData | null> {
    const apiSlug = API_SLUGS[slug];
    if (!apiSlug) return null;

    try {
        const url = concurso ? `${API_BASE}/${apiSlug}/${concurso}` : `${API_BASE}/${apiSlug}`;
        const response = await axios.get(url, { headers: HEADERS, timeout: 15000 });
        const data = response.data;

        if (!data?.numero) return null;

        return {
            concurso: data.numero,
            data: data.dataApuracao,
            tipoJogo: data.tipoJogo,
            localSorteio: data.localSorteio,
            nomeMunicipioUFSorteio: data.nomeMunicipioUFSorteio,
            dezenas: data.listaDezenas || [],
            dezenasOrdemSorteio: data.dezenasSorteadasOrdemSorteio,
            dezenasSegundoSorteio: data.listaDezenasSegundoSorteio,
            acumulado: !!data.acumulado,
            valorAcumuladoProximoConcurso: data.valorAcumuladoProximoConcurso,
            valorAcumuladoConcursoEspecial: data.valorAcumuladoConcursoEspecial,
            numeroConcursoProximo: data.numeroConcursoProximo,
            dataProximoConcurso: data.dataProximoConcurso,
            valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso,
            valorArrecadado: data.valorArrecadado,
            listaRateioPremio: data.listaRateioPremio,
            listaMunicipioUFGanhadores: data.listaMunicipioUFGanhadores,
            valorTotalPremioFaixaUm: data.valorTotalPremioFaixaUm,
            indicadorConcursoEspecial: data.indicadorConcursoEspecial
        };
    } catch (e: any) {
        console.error(`[${slug}] Fetch error:`, e.message);
        return null;
    }
}

// Salvar no Firestore
async function saveDraw(slug: string, draw: DrawData): Promise<boolean> {
    const dbName = DB_NAMES[slug];
    if (!dbName) return false;

    try {
        const sanitize = (val: any) => val ?? null;

        const docData = {
            ...draw,
            updatedAt: Timestamp.now()
        };

        // Remove undefined values
        Object.keys(docData).forEach(key => {
            if (docData[key] === undefined) docData[key] = null;
        });

        const drawRef = doc(db, 'games', dbName, 'draws', String(draw.concurso));
        await setDoc(drawRef, docData, { merge: true });
        return true;
    } catch (e: any) {
        console.error(`[${slug}] Save error:`, e.message);
        return false;
    }
}

// Atualizar metadados
async function updateMetadata(slug: string, draw: DrawData): Promise<void> {
    const dbName = DB_NAMES[slug];
    if (!dbName) return;

    try {
        let premioPrincipal = draw.valorTotalPremioFaixaUm || 0;
        let ganhadores = 0;

        if (draw.listaRateioPremio?.length > 0) {
            const faixa1 = draw.listaRateioPremio.find((p: any) => p.faixa === 1);
            if (faixa1) {
                if (faixa1.valorPremio > 0) premioPrincipal = faixa1.valorPremio;
                ganhadores = faixa1.numeroDeGanhadores;
            }
        }

        const metaData = {
            latestConcurso: draw.concurso,
            latestDate: draw.data,
            latestDezenas: draw.dezenas,
            latestAcumulado: draw.acumulado,
            latestPremioPrincipal: premioPrincipal,
            latestGanhadores: ganhadores,
            nextConcurso: draw.numeroConcursoProximo ?? null,
            nextDate: draw.dataProximoConcurso ?? null,
            nextPrize: draw.valorEstimadoProximoConcurso ?? null,
            listaRateioPremio: draw.listaRateioPremio || [],
            updatedAt: Timestamp.now()
        };

        const metaRef = doc(db, 'games', dbName);
        await setDoc(metaRef, metaData, { merge: true });
    } catch (e: any) {
        console.error(`[${slug}] Metadata error:`, e.message);
    }
}

// Server Action: Sincronizar último sorteio
export async function syncLatestDraw(slug: string): Promise<{ success: boolean; concurso?: number; error?: string }> {
    const draw = await fetchDraw(slug);
    if (!draw) return { success: false, error: 'Failed to fetch' };

    const saved = await saveDraw(slug, draw);
    if (!saved) return { success: false, error: 'Failed to save' };

    await updateMetadata(slug, draw);
    return { success: true, concurso: draw.concurso };
}

// Server Action: Sincronizar histórico
export async function syncHistoryDraws(
    slug: string,
    count: number = 50
): Promise<{ success: boolean; saved: number; latestConcurso?: number; error?: string }> {
    const latest = await fetchDraw(slug);
    if (!latest) return { success: false, saved: 0, error: 'Failed to fetch latest' };

    const latestConcurso = latest.concurso;
    let saved = 0;

    // Salvar o mais recente
    if (await saveDraw(slug, latest)) saved++;
    await updateMetadata(slug, latest);

    // Buscar histórico em batches
    const concursos: number[] = [];
    for (let i = 1; i < count; i++) {
        if (latestConcurso - i > 0) concursos.push(latestConcurso - i);
    }

    const BATCH_SIZE = 3;
    for (let i = 0; i < concursos.length; i += BATCH_SIZE) {
        const batch = concursos.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
            batch.map(async (c) => {
                const draw = await fetchDraw(slug, c);
                if (draw) {
                    const ok = await saveDraw(slug, draw);
                    return ok;
                }
                return false;
            })
        );

        saved += results.filter(r => r.status === 'fulfilled' && r.value).length;

        // Delay entre batches
        await new Promise(r => setTimeout(r, 100));
    }

    return { success: true, saved, latestConcurso };
}

// Server Action: Listar jogos disponíveis
export async function getAvailableGames() {
    return Object.entries(DB_NAMES).map(([slug, name]) => ({ slug, name }));
}
