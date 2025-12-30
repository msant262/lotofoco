import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs, getDoc } from "firebase/firestore";
import type { LotteryFullData } from "@/lib/caixa/caixa-client";

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
    'loteca': 'Loteca',
    'mega-da-virada': 'Mega-Sena'
};

export interface FrequencyData {
    number: string;
    frequency: number;
}

export interface StatsData {
    frequencia: FrequencyData[];
    ultimosResultados: {
        concurso: number;
        data: string;
        dezenas: string[];
        acumulado: boolean;
    }[];
    totalConcursos: number;
    maisFrequentes: string[];
    menosFrequentes: string[];
    mediaAtraso: Record<string, number>;
    parImpar: { pares: number; impares: number };
}

export async function saveDrawClient(slug: string, draw: LotteryFullData): Promise<boolean> {
    const dbName = DB_NAMES[slug];
    if (!dbName || !db) return false;

    try {
        const docData: any = {
            ...draw,
            updatedAt: serverTimestamp()
        };

        Object.keys(docData).forEach(key => {
            if (docData[key] === undefined) delete docData[key];
        });

        const drawRef = doc(db, 'games', dbName, 'draws', String(draw.concurso));
        await setDoc(drawRef, docData, { merge: true });
        return true;
    } catch (e: any) {
        console.error(`[${slug}] Save error:`, e.message);
        return false;
    }
}

export async function updateMetadataClient(slug: string, draw: LotteryFullData): Promise<void> {
    const dbName = DB_NAMES[slug];
    if (!dbName || !db) return;

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
            updatedAt: serverTimestamp()
        };

        const metaRef = doc(db, 'games', dbName);
        await setDoc(metaRef, metaData, { merge: true });
    } catch (e: any) {
        console.error(`[${slug}] Metadata error:`, e.message);
    }
}

export async function getStatsClient(slug: string, limitCount: number = 100): Promise<StatsData | null> {
    const dbName = DB_NAMES[slug];
    if (!dbName || !db) return null;

    try {
        const drawsRef = collection(db, 'games', dbName, 'draws');
        const q = query(drawsRef, orderBy('concurso', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const frequenciaMap: Record<string, number> = {};
        const ultimosResultados: StatsData['ultimosResultados'] = [];
        let totalPares = 0;
        let totalImpares = 0;
        let totalNumeros = 0;
        const ultimaAparicao: Record<string, number> = {};
        let index = 0;

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const dezenas: string[] = data.dezenas || [];

            ultimosResultados.push({
                concurso: data.concurso,
                data: data.data,
                dezenas: dezenas,
                acumulado: data.acumulado
            });

            dezenas.forEach((d: string) => {
                frequenciaMap[d] = (frequenciaMap[d] || 0) + 1;

                if (!ultimaAparicao[d]) {
                    ultimaAparicao[d] = index;
                }

                const num = parseInt(d);
                if (!isNaN(num)) {
                    if (num % 2 === 0) totalPares++;
                    else totalImpares++;
                }
                totalNumeros++;
            });
            index++;
        });

        const frequenciaArray: FrequencyData[] = Object.entries(frequenciaMap)
            .map(([number, frequency]) => ({ number, frequency }))
            .sort((a, b) => b.frequency - a.frequency);

        const maisFrequentes = frequenciaArray.slice(0, 10).map(f => f.number);
        const menosFrequentes = frequenciaArray.slice(-10).reverse().map(f => f.number);

        const mediaAtraso: Record<string, number> = {};
        Object.entries(ultimaAparicao).forEach(([num, pos]) => {
            mediaAtraso[num] = pos;
        });

        return {
            frequencia: frequenciaArray,
            ultimosResultados,
            totalConcursos: snapshot.size,
            maisFrequentes,
            menosFrequentes,
            mediaAtraso,
            parImpar: {
                pares: totalNumeros > 0 ? Math.round((totalPares / totalNumeros) * 100) : 0,
                impares: totalNumeros > 0 ? Math.round((totalImpares / totalNumeros) * 100) : 0
            }
        };
    } catch (e) {
        console.error("Error fetching stats:", e);
        return null;
    }
}

export async function getLotteryInfoClient(slug: string) {
    const dbName = DB_NAMES[slug];
    if (!dbName || !db) return null;

    try {
        const metaRef = doc(db, 'games', dbName);
        const metaDoc = await getDoc(metaRef);

        if (metaDoc.exists()) {
            const data = metaDoc.data();
            const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

            const nextPrize = data.nextPrize || data.valorEstimadoProximoConcurso || 0;
            const nextDate = data.nextDate || data.dataProximoConcurso;
            const nextConcurso = data.nextConcurso || (data.latestConcurso ? data.latestConcurso + 1 : null);

            return {
                prize: nextPrize > 0 ? formatCurrency(nextPrize) : "Apurando...",
                contest: nextConcurso ? String(nextConcurso) : String(data.latestConcurso || '...'),
                date: nextDate || data.latestDate || '...',
                dezenas: data.latestDezenas || [],
                acumuladoVirada: data.acumuladoMegaVirada > 0 ? formatCurrency(data.acumuladoMegaVirada) : undefined
            };
        }
        return null;
    } catch (e) {
        console.error("Info client error", e);
        return null;
    }
}

export interface DrawDetails {
    concurso: number;
    data: string;
    dezenas: string[];
    acumulado: boolean;
    valorArrecadado?: number;
    listaRateioPremio?: { faixa: number; descricaoFaixa: string; numeroDeGanhadores: number; valorPremio: number; }[];
    localSorteio?: string;
    nomeMunicipioUFSorteio?: string;
    listaMunicipioUFGanhadores?: { ganhadores: number; municipio: string; uf: string; }[];
}

export async function getDrawDetailsClient(slug: string, concurso: number): Promise<DrawDetails | null> {
    const dbName = DB_NAMES[slug];
    if (!dbName || !db) return null;

    try {
        const drawRef = doc(db, 'games', dbName, 'draws', String(concurso));
        const drawDoc = await getDoc(drawRef);

        if (drawDoc.exists()) {
            const data = drawDoc.data();
            return {
                concurso: data.concurso,
                data: data.data,
                dezenas: data.dezenas || [],
                acumulado: data.acumulado || false,
                valorArrecadado: data.valorArrecadado,
                listaRateioPremio: data.listaRateioPremio || [],
                localSorteio: data.localSorteio,
                nomeMunicipioUFSorteio: data.nomeMunicipioUFSorteio,
                listaMunicipioUFGanhadores: data.listaMunicipioUFGanhadores
            };
        }
        return null;
    } catch (e) {
        console.error("Draw details error", e);
        return null;
    }
}
