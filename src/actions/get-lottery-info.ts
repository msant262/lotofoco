'use server'

import { formatCurrency } from "@/lib/lottery-utils";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const SCAPER_NAMES: Record<string, string> = {
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

export interface LotteryInfo {
    prize: string;
    contest: string;
    date: string;
    isToday: boolean;
    // Dados extras agora disponíveis
    dezenas?: string[];
    acumulado?: boolean;
    ganhadores?: number;
    arrecadacao?: string;
    acumuladoVirada?: string;
}

export async function getLotteryInfo(slug: string): Promise<LotteryInfo> {
    // Override especial para Mega da Virada - Buscar dados reais do Firebase
    if (slug === 'mega-da-virada') {
        const currentYear = new Date().getFullYear();

        try {
            // Buscar metadados da Mega-Sena para pegar o acumulado da Virada
            const metaRef = doc(db, 'games', 'Mega-Sena');
            const metaDoc = await getDoc(metaRef);

            if (metaDoc.exists()) {
                const data = metaDoc.data();
                // O prêmio da Virada está em 'acumuladoMegaVirada' (valorAcumuladoConcursoEspecial da API)
                let viradaPrize = data.acumuladoMegaVirada || 0;

                // A Caixa divulga um prêmio estimado que geralmente é maior que o fundo acumulado
                // O prêmio real é calculado com base na arrecadação do concurso da Virada
                // Usamos um mínimo estimado se o valor do banco parecer muito baixo
                const ESTIMATED_VIRADA_2025 = 1_000_000_000; // Estimativa oficial da Caixa

                // Se o valor do banco for muito baixo (< 500M), usar a estimativa
                if (viradaPrize < 500_000_000) {
                    viradaPrize = ESTIMATED_VIRADA_2025;
                }

                return {
                    prize: formatCurrency(viradaPrize),
                    contest: "VIRADA",
                    date: `31/12/${currentYear}`,
                    isToday: new Date().getMonth() === 11 && new Date().getDate() === 31,
                    acumulado: true,
                    acumuladoVirada: formatCurrency(viradaPrize)
                };
            }
        } catch (e) {
            console.error("Error fetching Mega da Virada info", e);
        }

        // Fallback se não conseguir buscar do banco
        return {
            prize: formatCurrency(600_000_000),
            contest: "VIRADA",
            date: `31/12/${currentYear}`,
            isToday: false,
            acumulado: true
        };
    }

    // Default Fallback
    let result: LotteryInfo = {
        prize: "Carregando...",
        contest: "...",
        date: "...",
        isToday: false
    };

    try {
        const gameName = SCAPER_NAMES[slug];
        if (gameName) {
            const metaRef = doc(db, 'games', gameName);
            const metaDoc = await getDoc(metaRef);

            if (metaDoc.exists()) {
                const data = metaDoc.data();

                // Dados do próximo sorteio
                const nextPrize = data.nextPrize || data.valorEstimadoProximoConcurso || 0;
                const nextDate = data.nextDate || data.dataProximoConcurso;
                const nextConcurso = data.nextConcurso || (data.latestConcurso ? data.latestConcurso + 1 : null);

                // Dados do último sorteio
                const latestDezenas = data.latestDezenas || [];
                const latestAcumulado = data.latestAcumulado;
                const latestGanhadores = data.latestGanhadores || 0;
                const latestArrecadacao = data.latestArrecadacao || 0;
                const acumuladoVirada = data.acumuladoMegaVirada || 0;

                // Verificar se é hoje
                let isToday = false;
                if (nextDate) {
                    try {
                        const [day, month, year] = nextDate.split('/');
                        const drawDate = new Date(Number(year), Number(month) - 1, Number(day));
                        isToday = drawDate.toDateString() === new Date().toDateString();
                    } catch { }
                }

                result = {
                    prize: nextPrize > 0 ? formatCurrency(nextPrize) : "Apurando...",
                    contest: nextConcurso ? String(nextConcurso) : String(data.latestConcurso || '...'),
                    date: nextDate || data.latestDate || '...',
                    isToday,
                    dezenas: latestDezenas,
                    acumulado: latestAcumulado,
                    ganhadores: latestGanhadores,
                    arrecadacao: latestArrecadacao > 0 ? formatCurrency(latestArrecadacao) : undefined,
                    acumuladoVirada: acumuladoVirada > 0 ? formatCurrency(acumuladoVirada) : undefined
                };
            }
        }
    } catch (e) {
        console.error("Error reading lottery info", e);
    }

    return result;
}

// Nova função para buscar detalhes completos de um sorteio específico
export async function getDrawDetails(slug: string, concurso: number) {
    try {
        const gameName = SCAPER_NAMES[slug];
        if (!gameName) return null;

        const drawRef = doc(db, 'games', gameName, 'draws', String(concurso));
        const drawDoc = await getDoc(drawRef);

        if (drawDoc.exists()) {
            return drawDoc.data();
        }

        return null;
    } catch (e) {
        return null;
    }
}
