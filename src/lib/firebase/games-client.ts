import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
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
    'loteca': 'Loteca'
};

export async function saveDrawClient(slug: string, draw: LotteryFullData): Promise<boolean> {
    const dbName = DB_NAMES[slug];
    if (!dbName || !db) return false;

    try {
        const docData: any = {
            ...draw,
            updatedAt: serverTimestamp() // Client-side timestamp
        };

        // Remove undefined values to avoid Firestore errors
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

export async function getStatsClient(slug: string, limitCount: number = 100) {
    const dbName = DB_NAMES[slug];
    if (!dbName || !db) return { frequencia: {}, ultimosResultados: [] };

    try {
        const drawsRef = collection(db, 'games', dbName, 'draws');
        const q = query(drawsRef, orderBy('concurso', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);

        const frequencia: Record<string, number> = {};
        const ultimosResultados: any[] = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data() as LotteryFullData;
            ultimosResultados.push({
                concurso: data.concurso,
                dezenas: data.dezenas,
                data: data.data
            });

            data.dezenas.forEach(dezena => {
                frequencia[dezena] = (frequencia[dezena] || 0) + 1;
            });
        });

        // Ordenar frequencia
        const sortedFreq = Object.entries(frequencia)
            .sort(([, a], [, b]) => b - a)
            .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

        return { frequencia: sortedFreq, ultimosResultados };
    } catch (e) {
        console.error("Error fetching stats:", e);
        return { frequencia: {}, ultimosResultados: [] };
    }
}
