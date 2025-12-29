import axios from 'axios';
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

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
    // Identificação
    concurso: number;
    data: string;
    tipoJogo: string;
    localSorteio?: string;
    nomeMunicipioUFSorteio?: string;

    // Números
    dezenas: string[];
    dezenasOrdemSorteio?: string[];
    dezenasSegundoSorteio?: string[]; // Dupla Sena

    // Acumulação
    acumulado: boolean;
    valorAcumuladoProximoConcurso?: number;
    valorAcumuladoConcursoEspecial?: number;
    valorAcumuladoConcurso_0_5?: number;
    valorSaldoReservaGarantidora?: number;

    // Próximo Concurso
    numeroConcursoProximo?: number;
    dataProximoConcurso?: string;
    valorEstimadoProximoConcurso?: number;

    // Arrecadação
    valorArrecadado?: number;

    // Premiações
    listaRateioPremio?: {
        faixa: number;
        descricaoFaixa: string;
        numeroDeGanhadores: number;
        valorPremio: number;
    }[];
    valorTotalPremioFaixaUm?: number;

    // Extras
    timeCoracao?: string;
    mesSorte?: string;
    trevos?: string[];

    // Outros
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
            // URL: /api/{modalidade} ou /api/{modalidade}/{concurso}
            const url = concurso
                ? `${API_BASE}/${apiSlug}/${concurso}`
                : `${API_BASE}/${apiSlug}`;

            console.log(`[${slug}] Fetching: ${url}`);

            const response = await axios.get(url, { headers: HEADERS, timeout: 15000 });
            const data = response.data;

            if (!data || !data.numero) {
                console.warn(`[${slug}] Invalid response`);
                return null;
            }

            // Mapear TODOS os campos disponíveis
            const result: LotteryFullData = {
                concurso: data.numero,
                data: data.dataApuracao,
                tipoJogo: data.tipoJogo,
                localSorteio: data.localSorteio,
                nomeMunicipioUFSorteio: data.nomeMunicipioUFSorteio,

                dezenas: data.listaDezenas || [],
                dezenasOrdemSorteio: data.dezenasSorteadasOrdemSorteio,
                dezenasSegundoSorteio: data.listaDezenasSegundoSorteio, // Dupla Sena

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
                valorTotalPremioFaixaUm: data.valorTotalPremioFaixaUm,

                // Extras específicos por jogo
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

    // Salva sorteio no Firestore
    static async saveDraw(slug: string, draw: LotteryFullData): Promise<boolean> {
        try {
            const dbName = DB_NAMES[slug];
            if (!dbName) return false;

            const sanitize = (val: any) => (val === undefined || val === null || val === '') ? null : val;

            // Limpar campo com caracteres null
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
                valorTotalPremioFaixaUm: sanitize(draw.valorTotalPremioFaixaUm),

                timeCoracao: cleanTimeCoracao,
                mesSorte: cleanTimeCoracao,
                trevos: sanitize(draw.trevos),

                observacao: sanitize(draw.observacao),
                indicadorConcursoEspecial: sanitize(draw.indicadorConcursoEspecial),

                updatedAt: Timestamp.now()
            };

            const drawRef = doc(db, 'games', dbName, 'draws', String(draw.concurso));
            await setDoc(drawRef, docData, { merge: true });

            return true;
        } catch (e: any) {
            console.error(`[${slug}] Save error: ${e.message}`);
            return false;
        }
    }

    // Atualiza metadados do jogo (para exibição rápida)
    static async updateMetadata(slug: string, draw: LotteryFullData): Promise<void> {
        const dbName = DB_NAMES[slug];
        if (!dbName) return;

        try {
            const sanitize = (val: any) => (val === undefined || val === null) ? null : val;

            // Calcular prêmio principal (faixa 1)
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
                // Último sorteio
                latestConcurso: draw.concurso,
                latestDate: draw.data,
                latestDezenas: draw.dezenas,
                latestDezenasSegundoSorteio: sanitize(draw.dezenasSegundoSorteio),
                latestAcumulado: draw.acumulado,
                latestPremioPrincipal: premioPrincipal,
                latestGanhadores: ganhadores,
                latestArrecadacao: sanitize(draw.valorArrecadado),

                // Próximo sorteio
                nextConcurso: sanitize(draw.numeroConcursoProximo),
                nextDate: sanitize(draw.dataProximoConcurso),
                nextPrize: sanitize(draw.valorEstimadoProximoConcurso),

                // Acumulados
                acumuladoProximo: sanitize(draw.valorAcumuladoProximoConcurso),
                acumuladoMegaVirada: sanitize(draw.valorAcumuladoConcursoEspecial),

                // Premiações completas
                listaRateioPremio: draw.listaRateioPremio || [],

                updatedAt: Timestamp.now()
            };

            const metaRef = doc(db, 'games', dbName);
            await setDoc(metaRef, metaData, { merge: true });

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

    // Sincroniza histórico (últimos N concursos)
    static async syncHistory(slug: string, count: number = 100): Promise<{ success: boolean; saved: number; error?: string }> {
        const latest = await this.fetchDraw(slug);
        if (!latest) {
            return { success: false, saved: 0, error: 'Failed to fetch latest' };
        }

        const latestConcurso = latest.concurso;
        let saved = 0;

        await this.saveDraw(slug, latest);
        await this.updateMetadata(slug, latest);
        saved++;

        for (let i = 1; i < count; i++) {
            const concursoNum = latestConcurso - i;
            if (concursoNum <= 0) break;

            const draw = await this.fetchDraw(slug, concursoNum);
            if (draw) {
                await this.saveDraw(slug, draw);
                saved++;
            }

            // Delay para não sobrecarregar a API
            await new Promise(r => setTimeout(r, 200));
        }

        return { success: true, saved };
    }

    // Buscar estatísticas do banco local
    static async getStats(slug: string, limit_count: number = 100): Promise<{
        frequencia: Record<string, number>;
        ultimosResultados: string[][];
    }> {
        const dbName = DB_NAMES[slug];
        if (!dbName) return { frequencia: {}, ultimosResultados: [] };

        try {
            const drawsRef = collection(db, 'games', dbName, 'draws');
            const q = query(drawsRef, orderBy('concurso', 'desc'), limit(limit_count));
            const snapshot = await getDocs(q);

            const frequencia: Record<string, number> = {};
            const ultimosResultados: string[][] = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                const dezenas = data.dezenas || [];

                ultimosResultados.push(dezenas);

                dezenas.forEach((d: string) => {
                    frequencia[d] = (frequencia[d] || 0) + 1;
                });
            });

            return { frequencia, ultimosResultados };

        } catch (e) {
            return { frequencia: {}, ultimosResultados: [] };
        }
    }
}
