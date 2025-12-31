#!/usr/bin/env node

/**
 * Build Script - Generate Static JSON Files
 * 
 * This script fetches lottery data from Firestore and generates
 * static JSON files in /public/data/history/ for CDN serving.
 * 
 * Run: node scripts/build-static-data.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require('../firebase-service-account.json'); // Fallback para desenvolvimento

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

const DB_NAMES = {
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

const isPrime = (num) => {
    for (let i = 2, s = Math.sqrt(num); i <= s; i++)
        if (num % i === 0) return false;
    return num > 1;
};

async function generateStaticData() {
    console.log('🚀 Starting static data generation...\n');

    for (const [slug, dbName] of Object.entries(DB_NAMES)) {
        try {
            console.log(`📊 Processing ${dbName} (${slug})...`);

            const drawsRef = db.collection('games').doc(dbName).collection('draws');
            const snapshot = await drawsRef.orderBy('concurso', 'desc').get();

            const history = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    c: data.concurso,
                    d: data.dezenas,
                    t: data.data,
                    a: data.acumulado || false
                };
            });

            // Calculate statistics
            const freq = {};
            const pairFreq = {};
            let totalEven = 0;
            let totalOdd = 0;
            let totalPrimes = 0;
            let totalNumbersOverall = 0;
            const sums = { "0-50": 0, "51-100": 0, "101-150": 0, "151-200": 0, "201-250": 0, "250+": 0 };
            const quadrants = { q1: 0, q2: 0, q3: 0, q4: 0 };
            const timeline = {};
            const positionalMap = {};
            const lastSeen = {};
            let totalSumGlobal = 0;
            let totalConsecutivePairs = 0;
            let totalAcumuladosGlobal = 0;

            history.forEach(h => {
                let gameSum = 0;
                const dezenas = h.d.map(Number).sort((a, b) => a - b);

                if (h.a) totalAcumuladosGlobal++;

                if (h.t) {
                    const date = new Date(h.t);
                    const tKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
                    timeline[tKey] = (timeline[tKey] || 0) + 1;
                }

                dezenas.forEach((n, idx) => {
                    const nKey = n.toString().padStart(2, '0');
                    freq[nKey] = (freq[nKey] || 0) + 1;
                    totalNumbersOverall++;
                    gameSum += n;

                    if (!positionalMap[idx]) positionalMap[idx] = {};
                    positionalMap[idx][nKey] = (positionalMap[idx][nKey] || 0) + 1;

                    if (lastSeen[nKey] === undefined) lastSeen[nKey] = h.c;

                    if (n % 2 === 0) totalEven++; else totalOdd++;
                    if (isPrime(n)) totalPrimes++;
                    if (idx > 0 && dezenas[idx] === dezenas[idx - 1] + 1) totalConsecutivePairs++;

                    const row = Math.ceil(n / 10);
                    const col = n % 10 || 10;
                    if (row <= 3 && col <= 5) quadrants.q1++;
                    else if (row <= 3 && col > 5) quadrants.q2++;
                    else if (row > 3 && col <= 5) quadrants.q3++;
                    else quadrants.q4++;

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

            let totalRepeticoes = 0;
            let currentStreak = 0;
            let maxStreak = 0;

            for (let i = 0; i < history.length - 1; i++) {
                const current = history[i].d;
                const prev = history[i + 1].d;
                totalRepeticoes += current.filter(d => prev.includes(d)).length;
            }

            history.forEach(h => {
                if (h.a) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            });

            const currentLatest = history[0]?.c || 0;
            const delayMap = Object.entries(lastSeen).map(([num, last]) => ({
                num: parseInt(num),
                delay: currentLatest - last
            })).sort((a, b) => b.delay - a.delay);

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

            // Save to file
            const outputDir = path.join(process.cwd(), 'public', 'data', 'history');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const filePath = path.join(outputDir, `${slug}.json`);
            fs.writeFileSync(filePath, JSON.stringify(output));

            console.log(`   ✅ Generated ${slug}.json (${history.length} draws)\n`);

        } catch (error) {
            console.error(`   ❌ Error processing ${slug}:`, error.message, '\n');
        }
    }

    console.log('🎉 Static data generation completed!\n');
    process.exit(0);
}

generateStaticData().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
