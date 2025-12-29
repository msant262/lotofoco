'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';

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
    // Estatísticas calculadas
    maisFrequentes: string[];
    menosFrequentes: string[];
    mediaAtraso: Record<string, number>;
    parImpar: { pares: number; impares: number };
}

export async function getGameStats(slug: string, count: number = 100): Promise<StatsData | null> {
    const dbName = DB_NAMES[slug];
    if (!dbName) return null;

    try {
        const drawsRef = collection(db, 'games', dbName, 'draws');
        const q = query(drawsRef, orderBy('concurso', 'desc'), limit(count));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const frequencia: Record<string, number> = {};
        const ultimosResultados: StatsData['ultimosResultados'] = [];
        let totalPares = 0;
        let totalImpares = 0;
        let totalNumeros = 0;

        // Rastrear última aparição de cada número (para cálculo de atraso)
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

                // Rastrear posição da última aparição
                if (!ultimaAparicao[d]) {
                    ultimaAparicao[d] = index;
                }

                // Contar pares/ímpares
                const num = parseInt(d);
                if (num % 2 === 0) totalPares++;
                else totalImpares++;
                totalNumeros++;
            });

            index++;
        });

        // Converter frequência para array ordenado
        const frequenciaArray: FrequencyData[] = Object.entries(frequencia)
            .map(([number, frequency]) => ({ number, frequency }))
            .sort((a, b) => b.frequency - a.frequency);

        // Top 10 mais frequentes
        const maisFrequentes = frequenciaArray.slice(0, 10).map(f => f.number);

        // Top 10 menos frequentes (ou atrasados)
        const menosFrequentes = frequenciaArray.slice(-10).reverse().map(f => f.number);

        // Calcular atraso médio
        const mediaAtraso: Record<string, number> = {};
        Object.entries(ultimaAparicao).forEach(([num, pos]) => {
            mediaAtraso[num] = pos; // Posição = quantos sorteios atrás apareceu
        });

        return {
            frequencia: frequenciaArray,
            ultimosResultados,
            totalConcursos: snapshot.size,
            maisFrequentes,
            menosFrequentes,
            mediaAtraso,
            parImpar: {
                pares: Math.round((totalPares / totalNumeros) * 100),
                impares: Math.round((totalImpares / totalNumeros) * 100)
            }
        };

    } catch (e) {
        console.error('Error fetching stats:', e);
        return null;
    }
}

// Buscar números "quentes" (mais frequentes nos últimos N sorteios)
export async function getHotNumbers(slug: string, count: number = 50): Promise<string[]> {
    const stats = await getGameStats(slug, count);
    return stats?.maisFrequentes || [];
}

// Buscar números "frios" (menos frequentes / mais atrasados)
export async function getColdNumbers(slug: string, count: number = 50): Promise<string[]> {
    const stats = await getGameStats(slug, count);
    return stats?.menosFrequentes || [];
}
