export const API_BASE = "https://servicebus2.caixa.gov.br/portaldeloterias/api";

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://loterias.caixa.gov.br',
    'Referer': 'https://loterias.caixa.gov.br/'
};

export const API_SLUGS: Record<string, string> = {
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

export interface LotteryFullData {
    concurso: number;
    data: string;
    dezenas: string[];
    acumulado: boolean;
    tipoJogo: string;
    localSorteio: string;
    nomeMunicipioUFSorteio: string;
    dezenasOrdemSorteio: string[];
    dezenasSegundoSorteio?: string[];
    valorAcumuladoProximoConcurso: number;
    valorAcumuladoConcursoEspecial: number;
    numeroConcursoProximo: number;
    dataProximoConcurso: string;
    valorEstimadoProximoConcurso: number;
    valorArrecadado: number;
    listaRateioPremio: any[];
    listaMunicipioUFGanhadores: any[];
    valorTotalPremioFaixaUm: number;
    indicadorConcursoEspecial: number;
    [key: string]: any;
}

// Helper to clean unicode nulls
const cleanString = (str: any) => {
    if (typeof str !== 'string') return str;
    return str.replace(/\u0000/g, '').trim();
};

export async function fetchCaixaDraw(slug: string, concurso?: number): Promise<any> {
    const apiSlug = API_SLUGS[slug];
    if (!apiSlug) throw new Error(`Jogo inválido: ${slug}`);

    const url = concurso
        ? `${API_BASE}/${apiSlug}/${concurso}`
        : `${API_BASE}/${apiSlug}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        const response = await fetch(url, {
            headers: HEADERS,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error('Timeout ao conectar com a Caixa');
        }
        throw error;
    }
}

export function mapCaixaToLotteryFullData(data: any): LotteryFullData {
    if (!data || !data.numero) {
        throw new Error("Dados inválidos recebidos da Caixa");
    }

    return {
        concurso: data.numero,
        data: cleanString(data.dataApuracao),
        tipoJogo: cleanString(data.tipoJogo),
        localSorteio: cleanString(data.localSorteio),
        nomeMunicipioUFSorteio: cleanString(data.nomeMunicipioUFSorteio),
        dezenas: data.listaDezenas || [],
        dezenasOrdemSorteio: data.dezenasSorteadasOrdemSorteio || [],
        dezenasSegundoSorteio: data.listaDezenasSegundoSorteio,
        acumulado: !!data.acumulado,
        valorAcumuladoProximoConcurso: data.valorAcumuladoProximoConcurso,
        valorAcumuladoConcursoEspecial: data.valorAcumuladoConcursoEspecial,
        numeroConcursoProximo: data.numeroConcursoProximo,
        dataProximoConcurso: cleanString(data.dataProximoConcurso),
        valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso,
        valorArrecadado: data.valorArrecadado,
        listaRateioPremio: data.listaRateioPremio || [],
        listaMunicipioUFGanhadores: data.listaMunicipioUFGanhadores || [],
        valorTotalPremioFaixaUm: data.valorTotalPremioFaixaUm,
        indicadorConcursoEspecial: data.indicadorConcursoEspecial,
        // Preserve other fields
        ...data
    };
}

export async function fetchLatestLottery(slug: string): Promise<LotteryFullData> {
    const raw = await fetchCaixaDraw(slug);
    return mapCaixaToLotteryFullData(raw);
}

export async function fetchLotteryByConcurso(slug: string, concurso: number): Promise<LotteryFullData> {
    const raw = await fetchCaixaDraw(slug, concurso);
    return mapCaixaToLotteryFullData(raw);
}
