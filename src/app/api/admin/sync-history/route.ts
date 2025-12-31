import { NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

const DB_NAMES: Record<string, string> = {
    'mega-sena': 'Mega-Sena',
    'lotofacil': 'Lotofácil',
    'quina': 'Quina',
    'lotomania': 'Lotomania',
    'timemania': 'Timemania',
    'dupla-sena': 'Dupla-Sena',
    'dia-de-sorte': 'Dia-de-Sorte',
    'super-sete': 'Super-Sete',
    'mais-milionaria': '+Milionária'
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return NextResponse.json({ error: 'Slug necessário' }, { status: 400 });
    }

    const slugsToSync = slug === 'all' ? Object.keys(DB_NAMES) : [slug];
    const results: any[] = [];

    for (const currentSlug of slugsToSync) {
        try {
            const dbName = DB_NAMES[currentSlug];
            if (!dbName) continue;

            const drawsRef = collection(db, 'games', dbName, 'draws');
            const q = query(drawsRef, orderBy('concurso', 'desc'));
            const snapshot = await getDocs(q);

            const history = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    c: data.concurso,
                    d: data.dezenas,
                    t: data.data,
                    a: data.acumulado || false
                };
            });

            // 1. Frequency & Basic Metrics
            const freq: Record<string, number> = {};
            const pairFreq: Record<string, number> = {};
            let totalEven = 0;
            let totalOdd = 0;
            let totalPrimes = 0;
            let totalNumbersOverall = 0;
            const sums = { "0-50": 0, "51-100": 0, "101-150": 0, "151-200": 0, "201-250": 0, "250+": 0 };
            const quadrants = { q1: 0, q2: 0, q3: 0, q4: 0 };

            const isPrime = (num: number) => {
                for (let i = 2, s = Math.sqrt(num); i <= s; i++)
                    if (num % i === 0) return false;
                return num > 1;
            };

            const timeline: Record<string, number> = {};
            const positionalMap: Record<number, Record<string, number>> = {};
            const lastSeen: Record<string, number> = {};

            let totalSumGlobal = 0;
            let totalConsecutivePairs = 0;
            let totalAcumuladosGlobal = 0;
            let totalConsecutivosGlobal = 0; // Added based on instruction and output usage

            history.forEach(h => {
                let gameSum = 0;
                const dezenas = h.d.map(Number).sort((a: number, b: number) => a - b);

                if (h.a) totalAcumuladosGlobal++;

                // Monthly Timeline
                if (h.t) {
                    const date = new Date(h.t);
                    const tKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
                    timeline[tKey] = (timeline[tKey] || 0) + 1;
                }

                dezenas.forEach((n: number, idx: number) => {
                    const nKey = n.toString().padStart(2, '0');
                    freq[nKey] = (freq[nKey] || 0) + 1;
                    totalNumbersOverall++;
                    gameSum += n;

                    // Positional
                    if (!positionalMap[idx]) positionalMap[idx] = {};
                    positionalMap[idx][nKey] = (positionalMap[idx][nKey] || 0) + 1;

                    // Last Seen (Cycle)
                    if (lastSeen[nKey] === undefined) lastSeen[nKey] = h.c;

                    if (n % 2 === 0) totalEven++; else totalOdd++;
                    if (isPrime(n)) totalPrimes++;
                    if (idx > 0 && dezenas[idx] === dezenas[idx - 1] + 1) totalConsecutivePairs++;

                    // Quadrant Logic
                    const row = Math.ceil(n / 10);
                    const col = n % 10 || 10;
                    if (row <= 3 && col <= 5) quadrants.q1++;
                    else if (row <= 3 && col > 5) quadrants.q2++;
                    else if (row > 3 && col <= 5) quadrants.q3++;
                    else quadrants.q4++;

                    // Pair Frequency (limit to avoid exponential grow on huge lotteries like 50+ numbers)
                    // but for 6-20 numbers it's fine.
                    for (let j = idx + 1; j < dezenas.length; j++) {
                        const p1 = Math.min(dezenas[idx], dezenas[j]);
                        const p2 = Math.max(dezenas[idx], dezenas[j]);
                        const pairKey = `${p1}-${p2}`;
                        pairFreq[pairKey] = (pairFreq[pairKey] || 0) + 1;
                    }
                });

                totalSumGlobal += gameSum;

                if (gameSum <= 50) sums["0-50"]++;
                else if (gameSum <= 100) sums["51-100"]++;
                else if (gameSum <= 150) sums["101-150"]++;
                else if (gameSum <= 200) sums["151-200"]++;
                else if (gameSum <= 250) sums["201-250"]++;
                else sums["250+"]++;
            });

            // Advanced specifically for the public stats page
            let totalRepeticoes = 0;
            let currentStreak = 0;
            let maxStreak = 0;

            for (let i = 0; i < history.length - 1; i++) {
                const current = history[i].d;
                const prev = history[i + 1].d;
                totalRepeticoes += current.filter((d: string) => prev.includes(d)).length;
            }

            history.forEach(h => {
                if (h.a) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            });

            // Cycle: How many draws ago each number appeared
            const currentLatest = history[0]?.c || 0;
            const delayMap = Object.entries(lastSeen).map(([num, last]) => ({
                num: parseInt(num),
                delay: currentLatest - last
            })).sort((a, b) => b.delay - a.delay);

            // Sort Top Pairs
            const topPairs = Object.entries(pairFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 50)
                .map(([pair, count]) => ({ pair, count }));

            const output = {
                lastUpdate: new Date().toISOString(),
                count: history.length,
                stats: {
                    frequency: freq,
                    evenOdd: { even: totalEven, odd: totalOdd },
                    primes: totalPrimes,
                    sumDistribution: sums,
                    quadrants,
                    topPairs,
                    totalNumbersAnalyzed: totalNumbersOverall,
                    avgSum: Math.round(totalSumGlobal / history.length),
                    consecutivePairs: totalConsecutivePairs,
                    timeline: Object.entries(timeline).map(([x, y]) => ({ x, y })),
                    positionalMap,
                    delayMap,
                    mediaRepeticoes: history.length > 1 ? (totalRepeticoes / (history.length - 1)).toFixed(1) : "0",
                    maiorStreak: maxStreak,
                    totalAcumulados: totalAcumuladosGlobal,
                    totalConsecutivos: totalConsecutivePairs
                },
                draws: history
            };

            const filePath = path.join(process.cwd(), 'public', 'data', 'history', `${currentSlug}.json`);
            fs.writeFileSync(filePath, JSON.stringify(output));

            results.push({ slug: currentSlug, count: history.length });
        } catch (error: any) {
            console.error(`Sync Error for ${currentSlug}:`, error);
            results.push({ slug: currentSlug, error: error.message });
        }
    }

    return NextResponse.json({
        success: true,
        results
    });
}
