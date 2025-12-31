import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs, getDoc, where } from "firebase/firestore";
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
    mediaRepeticoes?: string;
    maiorStreak?: number;
    totalAcumulados?: number;
    totalConsecutivos?: number;
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
        // 1. Tentar Snapshot Estático para Frequência Global (Alta Eficiência)
        let staticHistory: any[] = [];
        let staticFreq: Record<string, number> = {};

        let staticData: any = null;
        try {
            const staticRes = await fetch(`/data/history/${slug}.json`);
            if (staticRes.ok) {
                staticData = await staticRes.json();
                staticFreq = staticData.stats?.frequency || {};
                staticHistory = (staticData.draws || []).map((h: any) => ({
                    concurso: h.c,
                    data: h.t,
                    dezenas: h.d,
                    acumulado: h.a || false
                }));
            }
        } catch (e) {
            console.warn(`[Stats] No static snapshot for ${slug}`);
        }

        // 2. Buscar o "Delta" ou Fallback Total no Firestore
        const lastStaticConcurso = staticHistory[0]?.concurso || 0;
        const drawsRef = collection(db, 'games', dbName, 'draws');

        // Se temos snapshot, buscamos apenas concursos novos (concurso > lastStatic)
        // Se não temos, buscamos o limitCount padrão
        const q = staticHistory.length > 0
            ? query(drawsRef, where('concurso', '>', lastStaticConcurso), orderBy('concurso', 'desc'))
            : query(drawsRef, orderBy('concurso', 'desc'), limit(limitCount));

        const snapshot = await getDocs(q);

        if (snapshot.empty && staticHistory.length === 0) return null;

        const frequenciaMap: Record<string, number> = { ...staticFreq };
        const ultimosResultados: StatsData['ultimosResultados'] = [];

        // Base counts from static data
        let totalPares = staticData?.stats?.evenOdd?.even || 0;
        let totalImpares = staticData?.stats?.evenOdd?.odd || 0;
        let totalNumbers = staticData?.stats?.totalNumbersAnalyzed || 0;

        const ultimaAparicao: Record<string, number> = {};
        let index = 0;

        // Processamos os do Firestore (são os mais recentes)
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const dezenas: string[] = data.dezenas || [];

            ultimosResultados.push({
                concurso: data.concurso,
                data: data.data,
                dezenas: dezenas,
                acumulado: data.acumulado || false
            });

            const isNew = data.concurso > (staticHistory[0]?.concurso || 0);

            dezenas.forEach((dRaw: string) => {
                const n = parseInt(dRaw);
                if (isNaN(n)) return;
                const d = n.toString().padStart(2, '0');

                if (isNew) {
                    frequenciaMap[d] = (frequenciaMap[d] || 0) + 1;
                    if (n % 2 === 0) totalPares++;
                    else totalImpares++;
                    totalNumbers++;
                }

                if (!ultimaAparicao[d]) {
                    ultimaAparicao[d] = index;
                }
            });
            index++;
        });

        // Se o Firestore não brought 100, mas temos staticHistory, completamos
        if (ultimosResultados.length < limitCount && staticHistory.length > 0) {
            const needed = limitCount - ultimosResultados.length;
            const lastConcurso = ultimosResultados[ultimosResultados.length - 1]?.concurso || 9999999;
            const extra = staticHistory.filter(h => h.concurso < lastConcurso).slice(0, needed);
            ultimosResultados.push(...extra);
        }

        const frequenciaArray: FrequencyData[] = Object.entries(frequenciaMap)
            .map(([number, frequency]) => ({ number, frequency }))
            .sort((a, b) => b.frequency - a.frequency);

        const maisFrequentes = frequenciaArray.slice(0, 15).map(f => f.number);
        const menosFrequentes = frequenciaArray.slice(-15).reverse().map(f => f.number);

        const mediaAtraso: Record<string, number> = {};
        Object.entries(ultimaAparicao).forEach(([num, pos]) => {
            mediaAtraso[num] = pos;
        });

        // Calculate total contests correctly: static count + ONLY the new ones from Firestore
        const newContestsCount = snapshot.docs.filter(d => d.data().concurso > (staticHistory[0]?.concurso || 0)).length;
        const totalConcursosTotal = (staticData?.count || staticHistory.length) + newContestsCount;

        return {
            frequencia: frequenciaArray,
            ultimosResultados,
            totalConcursos: totalConcursosTotal,
            maisFrequentes,
            menosFrequentes,
            mediaAtraso,
            parImpar: {
                pares: totalNumbers > 0 ? Math.round((totalPares / totalNumbers) * 100) : 0,
                impares: totalNumbers > 0 ? Math.round((totalImpares / totalNumbers) * 100) : 0
            },
            mediaRepeticoes: staticData?.stats?.mediaRepeticoes,
            maiorStreak: staticData?.stats?.maiorStreak,
            totalAcumulados: staticData?.stats?.totalAcumulados,
            totalConsecutivos: staticData?.stats?.totalConsecutivos
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
