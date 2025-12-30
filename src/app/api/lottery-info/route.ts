import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const runtime = 'edge';

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

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const concurso = searchParams.get('concurso');

    if (!slug) {
        return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    try {
        // Mode 2: Draw Details (if concurso is provided)
        if (concurso) {
            const gameName = SCAPER_NAMES[slug];
            if (!gameName || !db) return NextResponse.json(null);

            const drawRef = doc(db, 'games', gameName, 'draws', String(concurso));
            const drawDoc = await getDoc(drawRef);

            if (drawDoc.exists()) {
                const data = drawDoc.data();
                return NextResponse.json({
                    concurso: data.concurso,
                    data: data.data,
                    dezenas: data.dezenas || [],
                    dezenasSegundoSorteio: data.dezenasSegundoSorteio || null,
                    acumulado: data.acumulado || false,
                    valorArrecadado: data.valorArrecadado || null,
                    listaRateioPremio: data.listaRateioPremio?.map((p: any) => ({
                        faixa: p.faixa,
                        descricaoFaixa: p.descricaoFaixa,
                        numeroDeGanhadores: p.numeroDeGanhadores,
                        valorPremio: p.valorPremio
                    })) || [],
                    listaMunicipioUFGanhadores: data.listaMunicipioUFGanhadores?.map((c: any) => ({
                        ganhadores: c.ganhadores || 1,
                        municipio: c.municipio || 'N/A',
                        uf: c.uf || 'N/A'
                    })) || [],
                    localSorteio: data.localSorteio || null,
                    nomeMunicipioUFSorteio: data.nomeMunicipioUFSorteio || null,
                    valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso || null,
                    valorAcumuladoProximoConcurso: data.valorAcumuladoProximoConcurso || null,
                    observacao: data.observacao || null
                });
            }
            return NextResponse.json(null);
        }

        // Mode 1: General Info (Mega da Virada or Standard)
        if (slug === 'mega-da-virada') {
            const currentYear = new Date().getFullYear();
            let result = {
                prize: formatCurrency(600_000_000),
                contest: "VIRADA",
                date: `31/12/${currentYear}`,
                isToday: false,
                acumulado: true,
                acumuladoVirada: formatCurrency(600_000_000)
            };

            try {
                // Try reading from Mega-Sena metadata
                // Note: db can be undefined if server-side init failed (but we have polyfill now!)
                if (db) {
                    const metaRef = doc(db, 'games', 'Mega-Sena');
                    const metaDoc = await getDoc(metaRef);
                    if (metaDoc.exists()) {
                        const data = metaDoc.data();
                        let viradaPrize = data.acumuladoMegaVirada || 0;
                        if (viradaPrize < 500_000_000) viradaPrize = 600_000_000; // Estimate

                        result.prize = formatCurrency(viradaPrize);
                        result.acumuladoVirada = formatCurrency(viradaPrize);
                    }
                }
            } catch (e) {
                console.error("Mega Virada fetch error", e);
            }
            return NextResponse.json(result);
        }

        // Standard Games
        let result = {
            prize: "Carregando...",
            contest: "...",
            date: "...",
            isToday: false,
            dezenas: [],
            acumulado: false,
            ganhadores: 0,
            arrecadacao: undefined as string | undefined,
            acumuladoVirada: undefined as string | undefined
        };

        const gameName = SCAPER_NAMES[slug];
        if (gameName && db) {
            const metaRef = doc(db, 'games', gameName);
            const metaDoc = await getDoc(metaRef);

            if (metaDoc.exists()) {
                const data = metaDoc.data();

                const nextPrize = data.nextPrize || data.valorEstimadoProximoConcurso || 0;
                const nextDate = data.nextDate || data.dataProximoConcurso;
                const nextConcurso = data.nextConcurso || (data.latestConcurso ? data.latestConcurso + 1 : null);

                // Check isToday
                let isToday = false;
                if (nextDate) {
                    try {
                        const [day, month, year] = nextDate.split('/');
                        const drawDate = new Date(Number(year), Number(month) - 1, Number(day));
                        // Simple check using UTC/Local might be off by timezone, but ok for now
                        isToday = drawDate.toDateString() === new Date().toDateString();
                    } catch { }
                }

                result = {
                    prize: nextPrize > 0 ? formatCurrency(nextPrize) : "Apurando...",
                    contest: nextConcurso ? String(nextConcurso) : String(data.latestConcurso || '...'),
                    date: nextDate || data.latestDate || '...',
                    isToday,
                    dezenas: data.latestDezenas || [],
                    acumulado: !!data.latestAcumulado,
                    ganhadores: data.latestGanhadores || 0,
                    arrecadacao: data.latestArrecadacao > 0 ? formatCurrency(data.latestArrecadacao) : undefined,
                    acumuladoVirada: data.acumuladoMegaVirada > 0 ? formatCurrency(data.acumuladoMegaVirada) : undefined
                };
            }
        }

        return NextResponse.json(result);

    } catch (e: any) {
        console.error("API Info Error", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
