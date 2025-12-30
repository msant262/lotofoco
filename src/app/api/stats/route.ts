import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export const runtime = 'edge';

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

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const countParam = searchParams.get('count');
    const count = parseInt(countParam || '100');

    if (!slug) {
        return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    const dbName = DB_NAMES[slug];
    if (!dbName || !db) {
        return NextResponse.json({ error: 'Game not found or DB unavailable' }, { status: 404 });
    }

    try {
        const drawsRef = collection(db, 'games', dbName, 'draws');
        const q = query(drawsRef, orderBy('concurso', 'desc'), limit(count));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return NextResponse.json(null);
        }

        const frequencia: Record<string, number> = {};
        const ultimosResultados: any[] = [];
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
                frequencia[d] = (frequencia[d] || 0) + 1;
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

        const frequenciaArray = Object.entries(frequencia)
            .map(([number, frequency]) => ({ number, frequency }))
            .sort((a, b) => b.frequency - a.frequency);

        const maisFrequentes = frequenciaArray.slice(0, 10).map(f => f.number);
        const menosFrequentes = frequenciaArray.slice(-10).reverse().map(f => f.number);

        const mediaAtraso: Record<string, number> = {};
        Object.entries(ultimaAparicao).forEach(([num, pos]) => {
            mediaAtraso[num] = pos;
        });

        const stats = {
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

        return NextResponse.json(stats);

    } catch (e: any) {
        console.error('Error fetching stats:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
