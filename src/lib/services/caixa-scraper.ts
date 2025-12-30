import axios from 'axios';
import { FirestoreRest } from '@/lib/firestore-rest';

// URL correta da API da Caixa
const API_BASE = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://loterias.caixa.gov.br',
    'Referer': 'https://loterias.caixa.gov.br/'
};

// Slugs internos -> Slugs da API (minúsculo, sem acentos, sem hífens)
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

// Nomes para o Firestore
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

export interface LotteryFullData {
    concurso: number;
    data: string;
    tipoJogo: string;
    localSorteio?: string;
    nomeMunicipioUFSorteio?: string;
    dezenas: string[];
    dezenasOrdemSorteio?: string[];
    dezenasSegundoSorteio?: string[];
    acumulado: boolean;
    valorAcumuladoProximoConcurso?: number;
    valorAcumuladoConcursoEspecial?: number;
    valorAcumuladoConcurso_0_5?: number;
    valorSaldoReservaGarantidora?: number;
    numeroConcursoProximo?: number;
    dataProximoConcurso?: string;
    valorEstimadoProximoConcurso?: number;
    valorArrecadado?: number;
    listaRateioPremio?: {
        faixa: number;
        descricaoFaixa: string;
        numeroDeGanhadores: number;
        valorPremio: number;
    }[];
    listaMunicipioUFGanhadores?: {
        ganhadores: number;
        municipio: string;
        uf: string;
    }[];
    valorTotalPremioFaixaUm?: number;
    timeCoracao?: string;
    mesSorte?: string;
    trevos?: string[];
    observacao?: string;
    indicadorConcursoEspecial?: number;
}

export class CaixaScraper {

    // Busca da API da Caixa
    static async fetchDraw(slug: string, concurso?: number): Promise<LotteryFullData | null> {
        const apiSlug = API_SLUGS[slug];
        if (!apiSlug) {
            console.error(`[${slug}] Unknown slug`);
            return null;
        }

        try {
            const url = concurso
                ? `${API_BASE}/${apiSlug}/${concurso}`
                : `${API_BASE}/${apiSlug}`;

            const response = await axios.get(url, { headers: HEADERS, timeout: 15000 });
            const data = response.data;

            if (!data || !data.numero) {
                console.warn(`[${slug}] Invalid response`);
                return null;
            }

            const result: LotteryFullData = {
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
                valorAcumuladoConcurso_0_5: data.valorAcumuladoConcurso_0_5,
                valorSaldoReservaGarantidora: data.valorSaldoReservaGarantidora,
                numeroConcursoProximo: data.numeroConcursoProximo,
                dataProximoConcurso: data.dataProximoConcurso,
                valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso,
                valorArrecadado: data.valorArrecadado,
                listaRateioPremio: data.listaRateioPremio?.map((p: any) => ({
                    faixa: p.faixa,
                    descricaoFaixa: p.descricaoFaixa,
                    numeroDeGanhadores: p.numeroDeGanhadores,
                    valorPremio: p.valorPremio
                })),
                listaMunicipioUFGanhadores: data.listaMunicipioUFGanhadores?.map((c: any) => ({
                    ganhadores: c.ganhadores || 1,
                    municipio: c.municipio || 'N/A',
                    uf: c.uf || 'N/A'
                })),
                valorTotalPremioFaixaUm: data.valorTotalPremioFaixaUm,
                timeCoracao: data.nomeTimeCoracaoMesSorte?.trim() || undefined,
                mesSorte: data.nomeTimeCoracaoMesSorte?.trim() || undefined,
                trevos: data.listaTrevosSorteados,
                observacao: data.observacao,
                indicadorConcursoEspecial: data.indicadorConcursoEspecial
            };

            return result;

        } catch (e: any) {
            console.error(`[${slug}] Fetch error: ${e.message}`);
            return null;
        }
    }

    // Salva sorteio no Firestore via REST API
    static async saveDraw(slug: string, draw: LotteryFullData): Promise<boolean> {
        try {
            const dbName = DB_NAMES[slug];
            if (!dbName) return false;

            const sanitize = (val: any) => (val === undefined || val === null || val === '') ? null : val;
            const cleanTimeCoracao = draw.timeCoracao?.replace(/\u0000/g, '').trim() || null;

            const docData = {
                concurso: draw.concurso,
                data: draw.data,
                tipoJogo: sanitize(draw.tipoJogo),
                localSorteio: sanitize(draw.localSorteio),
                nomeMunicipioUFSorteio: sanitize(draw.nomeMunicipioUFSorteio),
                dezenas: draw.dezenas || [],
                dezenasOrdemSorteio: sanitize(draw.dezenasOrdemSorteio),
                dezenasSegundoSorteio: sanitize(draw.dezenasSegundoSorteio),
                acumulado: draw.acumulado,
                valorAcumuladoProximoConcurso: sanitize(draw.valorAcumuladoProximoConcurso),
                valorAcumuladoConcursoEspecial: sanitize(draw.valorAcumuladoConcursoEspecial),
                valorAcumuladoConcurso_0_5: sanitize(draw.valorAcumuladoConcurso_0_5),
                valorSaldoReservaGarantidora: sanitize(draw.valorSaldoReservaGarantidora),
                numeroConcursoProximo: sanitize(draw.numeroConcursoProximo),
                dataProximoConcurso: sanitize(draw.dataProximoConcurso),
                valorEstimadoProximoConcurso: sanitize(draw.valorEstimadoProximoConcurso),
                valorArrecadado: sanitize(draw.valorArrecadado),
                listaRateioPremio: draw.listaRateioPremio || [],
                listaMunicipioUFGanhadores: draw.listaMunicipioUFGanhadores || [],
                valorTotalPremioFaixaUm: sanitize(draw.valorTotalPremioFaixaUm),
                timeCoracao: cleanTimeCoracao,
                mesSorte: cleanTimeCoracao,
                trevos: sanitize(draw.trevos),
                observacao: sanitize(draw.observacao),
                indicadorConcursoEspecial: sanitize(draw.indicadorConcursoEspecial)
            };

            const result = await FirestoreRest.setDocument(
                'games',
                dbName,
                docData,
                'draws',
                String(draw.concurso)
            );

            if (!result.success) {
                console.error(`[${slug}] Save failed: ${result.error}`);
                return false;
            }

            return true;
        } catch (e: any) {
            console.error(`[${slug}] Save error for concurso ${draw.concurso}: ${e.message}`);
            return false;
        }
    }

    // Atualiza metadados do jogo
    static async updateMetadata(slug: string, draw: LotteryFullData): Promise<void> {
        const dbName = DB_NAMES[slug];
        if (!dbName) return;

        try {
            const sanitize = (val: any) => (val === undefined || val === null) ? null : val;

            let premioPrincipal = draw.valorTotalPremioFaixaUm || 0;
            let ganhadores = 0;

            if (draw.listaRateioPremio && draw.listaRateioPremio.length > 0) {
                const faixa1 = draw.listaRateioPremio.find(p => p.faixa === 1);
                if (faixa1) {
                    if (faixa1.valorPremio > 0) premioPrincipal = faixa1.valorPremio;
                    ganhadores = faixa1.numeroDeGanhadores;
                }
            }

            const metaData = {
                latestConcurso: draw.concurso,
                latestDate: draw.data,
                latestDezenas: draw.dezenas,
                latestDezenasSegundoSorteio: sanitize(draw.dezenasSegundoSorteio),
                latestAcumulado: draw.acumulado,
                latestPremioPrincipal: premioPrincipal,
                latestGanhadores: ganhadores,
                latestArrecadacao: sanitize(draw.valorArrecadado),
                nextConcurso: sanitize(draw.numeroConcursoProximo),
                nextDate: sanitize(draw.dataProximoConcurso),
                nextPrize: sanitize(draw.valorEstimadoProximoConcurso),
                acumuladoProximo: sanitize(draw.valorAcumuladoProximoConcurso),
                acumuladoMegaVirada: sanitize(draw.valorAcumuladoConcursoEspecial),
                listaRateioPremio: draw.listaRateioPremio || []
            };

            await FirestoreRest.setDocument('games', dbName, metaData);

        } catch (e: any) {
            console.error(`[${slug}] Metadata error: ${e.message}`);
        }
    }

    // Sincroniza o último sorteio
    static async syncLatest(slug: string): Promise<{ success: boolean; concurso?: number; error?: string }> {
        const draw = await this.fetchDraw(slug);

        if (!draw) {
            return { success: false, error: 'Failed to fetch draw' };
        }

        const saved = await this.saveDraw(slug, draw);
        if (!saved) {
            return { success: false, error: 'Failed to save draw' };
        }

        await this.updateMetadata(slug, draw);

        return { success: true, concurso: draw.concurso };
    }

    // Sincroniza histórico (últimos N concursos) - OTIMIZADO com batches paralelos
    static async syncHistory(slug: string, count: number = 100): Promise<{ success: boolean; saved: number; latestConcurso?: number; error?: string }> {
        const latest = await this.fetchDraw(slug);
        if (!latest) {
            return { success: false, saved: 0, error: 'Failed to fetch latest' };
        }

        const latestConcurso = latest.concurso;
        let saved = 0;

        // Salvar o mais recente
        const savedLatest = await this.saveDraw(slug, latest);
        if (savedLatest) {
            saved++;
            console.log(`[${slug}] Saved latest: ${latestConcurso}`);
        }
        await this.updateMetadata(slug, latest);

        // Criar lista de concursos para buscar
        const concursosToFetch: number[] = [];
        for (let i = 1; i < count; i++) {
            const concursoNum = latestConcurso - i;
            if (concursoNum > 0) {
                concursosToFetch.push(concursoNum);
            }
        }

        // Processar em batches de 5 requisições paralelas
        const BATCH_SIZE = 5;
        for (let i = 0; i < concursosToFetch.length; i += BATCH_SIZE) {
            const batch = concursosToFetch.slice(i, i + BATCH_SIZE);

            // Fetch em paralelo
            const fetchResults = await Promise.allSettled(
                batch.map(concursoNum => this.fetchDraw(slug, concursoNum))
            );

            // Salvar em paralelo
            const savePromises: Promise<boolean>[] = [];
            for (const result of fetchResults) {
                if (result.status === 'fulfilled' && result.value) {
                    savePromises.push(this.saveDraw(slug, result.value));
                }
            }

            const saveResults = await Promise.allSettled(savePromises);
            const savedCount = saveResults.filter(r => r.status === 'fulfilled' && r.value).length;
            saved += savedCount;

            // Log de progresso
            const progress = Math.min(i + BATCH_SIZE, concursosToFetch.length);
            console.log(`[${slug}] Progress: ${progress}/${concursosToFetch.length} (${saved} saved)`);

            // Pequeno delay entre batches
            if (i + BATCH_SIZE < concursosToFetch.length) {
                await new Promise(r => setTimeout(r, 50));
            }
        }

        console.log(`[${slug}] Completed: ${saved} total saved`);
        return { success: true, saved, latestConcurso };
    }
}

// Exportar constantes para uso externo
export { DB_NAMES, API_SLUGS };
