import axios from 'axios';
import * as XLSX from 'xlsx';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';

const BASE_URL = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/resultados/download';

const GAMES = ['Mega-Sena', 'Lotofácil', 'Quina'];

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface LotteryDraw {
    game: string;
    concurso: number;
    data: string;
    dezenas: string[];
    acumulado: boolean;
}

export class CaixaScraper {
    static async fetchAndParse(game: string): Promise<LotteryDraw[]> {
        console.log(`Starting scrape for ${game}...`);
        try {
            const response = await axios.get(BASE_URL, {
                params: { modalidade: game },
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, */*',
                },
                timeout: 30000,
            });

            const buffer = response.data;
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

            // Parse logic specific to Caixa's typical layout
            // Usually columns: "Concurso", "Data Sorteio", "Bola1", "Bola2"...
            const draws: LotteryDraw[] = jsonData.map((row: any) => {
                // Normalize keys slightly if needed or just access directly
                // Caixa Xlsx usually has "Concurso", "Data Sorteio", "Bola1", ...

                // Dynamic ball extraction (Bola1, Bola2...)
                const dezenas: string[] = [];
                for (let i = 1; i <= 20; i++) { // Max 20 for Lotofacil
                    const key = `Bola${i}`;
                    if (row[key] !== undefined && row[key] !== null) {
                        dezenas.push(String(row[key]).padStart(2, '0'));
                    }
                }
                // Fallback if keys are different like "Bola 1" (space)
                if (dezenas.length === 0) {
                    for (let i = 1; i <= 20; i++) {
                        const key = `Bola ${i}`;
                        if (row[key] !== undefined && row[key] !== null) {
                            dezenas.push(String(row[key]).padStart(2, '0'));
                        }
                    }
                }

                return {
                    game,
                    concurso: row['Concurso'] || row['CONCURSO'],
                    data: row['Data Sorteio'] || row['DATA_SORTEIO'],
                    dezenas,
                    acumulado: (row['Acumulado'] === 'SIM' || row['Acumulado'] === true),
                };
            }).filter(d => d.concurso && d.dezenas.length > 0);

            return draws;
        } catch (error) {
            console.error(`Error scraping ${game}:`, error);
            throw error;
        }
    }

    static async syncToFirestore(game: string) {
        const draws = await this.fetchAndParse(game);
        console.log(`Parsed ${draws.length} draws for ${game}. Syncing to Firestore...`);

        // Batched writes (max 500 per batch)
        const batchSize = 400; // Safe margin
        const chunks = [];
        for (let i = 0; i < draws.length; i += batchSize) {
            chunks.push(draws.slice(i, i + batchSize));
        }

        let totalSaved = 0;

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(draw => {
                const docRef = doc(db, 'games', game, 'draws', String(draw.concurso));
                batch.set(docRef, {
                    ...draw,
                    updatedAt: Timestamp.now()
                }, { merge: true });
            });
            await batch.commit();
            totalSaved += chunk.length;
            console.log(`Saved batch of ${chunk.length} draws.`);
        }

        console.log(`Finished syncing ${totalSaved} draws for ${game}.`);
        return totalSaved;
    }
}
