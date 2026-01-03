import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getStatsClient } from "@/lib/firebase/games-client";

// Uso 'edge' para compatibilidade com Cloudflare Pages
export const runtime = 'edge';

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "mock-key");

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, game, slug, quantity, extraQuantity = 0, extraRange = 0, fixedNumbers = [] } = body;

        // Validation simple
        if (!userId) {
            // Em produção validaria sessão
        }

        // Validate fixed vs quantity
        if (fixedNumbers.length >= quantity) {
            return NextResponse.json({
                numbers: fixedNumbers,
                explanation: "Seleção manual já atinge a quantidade desejada."
            });
        }

        const needed = quantity - fixedNumbers.length;

        // 1. Buscar estatísticas reais
        let statsContext = "Utilize probabilidade matemática padrão e balanceamento de quadrantes.";

        if (slug) {
            try {
                const stats = await getStatsClient(slug, 100);
                if (stats) {
                    const topHot = stats.maisFrequentes.slice(0, 12).join(', ');
                    // Ordenar atraso corretamente
                    const topCold = Object.entries(stats.mediaAtraso)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 12)
                        .map(([n]) => n)
                        .join(', ');

                    statsContext = `
                    DADOS ESTATÍSTICOS REAIS (${stats.totalConcursos} concursos analisados):
                    - Números Quentes (Alta Frequência): [${topHot}]
                    - Números Frios (Mais Atrasados): [${topCold}]
                    - Balanceamento Par/Ímpar Histórico: ${stats.parImpar.pares}% Pares / ${stats.parImpar.impares}% Ímpares.
                    
                    ESTRATÉGIA SUGERIDA:
                    - Use cerca de 60% de números quentes ou neutros.
                    - Use cerca de 40% de números frios (Teoria do Atraso).
                    - Tente respeitar a proporção par/ímpar histórica.
                    `;
                }
            } catch (err) {
                console.warn("Falha ao buscar stats no backend:", err);
            }
        }

        // 2. Configurar Modelo
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite", // Modelo Lite para economia de custos
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7
            }
        });

        const prompt = `
        Aja como um Expert em Probabilidade e Estatística de Loterias.
        Seu objetivo é gerar um jogo de ${game} com ALTA probabilidade matemática, baseado nos dados fornecidos.

        ${statsContext}

        REQUISITOS DO JOGO:
        - TOTAL DE NÚMEROS: ${quantity}
        - NÚMEROS JÁ FIXOS (NÃO REPETIR): [${fixedNumbers.join(', ')}]
        - PREENCHER: Mais ${needed} números únicos.
        ${extraQuantity > 0 ? `- ADICIONAR TAMBÉM: ${extraQuantity} números EXTRAS (Trevos/Mês/Times). IMPORTANTE: Os extras devem ser números entre 1 e ${extraRange || 80}. Coloque-os no final da lista 'numbers'.` : ''}

        DIRETRIZES TÉCNICAS:
        1. Gere números que NÃO estejam na lista de fixos.
        2. Diversifique os quadrantes do volante.
        3. Evite sequências óbvias (ex: 1, 2, 3, 4, 5).
        4. O retorno "numbers" deve conter a união dos FIXOS + GERADOS, ordenados numericamente (mas mantenha os EXTRAS sempre no final da lista, após os números principais).

        FORMATO DE RESPOSTA (JSON PURO):
        {
            "numbers": ["01", "05", ...],
            "explanation": "Uma frase curta e persuasiva explicando a estratégia usada."
        }
        `;

        try {
            if (!apiKey) throw new Error("API Key missing");

            const result = await model.generateContent(prompt);
            const textResponse = result.response.text();

            // Tratamento de segurança para parse JSON
            let prediction;
            try {
                prediction = JSON.parse(textResponse);
            } catch (e) {
                // Tentar limpar markdown code blocks se houver
                const cleanText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                prediction = JSON.parse(cleanText);
            }

            return NextResponse.json(prediction);

        } catch (e: any) {
            console.error("AI Generation Error:", e.message);
            // Fallback: Random generator
            return fallbackGenerator(quantity, extraQuantity, fixedNumbers, needed, extraRange);
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
    }
}

function fallbackGenerator(quantity: number, extraQuantity: number, fixedNumbers: string[], needed: number, extraRange: number) {
    const maxNumber = 60; // Default fallback assumption
    const pool = Array.from({ length: maxNumber }, (_, i) => String(i + 1).padStart(2, '0'))
        .filter(n => !fixedNumbers.includes(n));

    // Fisher-Yates Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const generated = pool.slice(0, needed);
    // Sort numeric part
    const mainNumbers = [...fixedNumbers, ...generated].sort((a, b) => parseInt(a) - parseInt(b));

    // Add dummy extras if needed (mock implementation)
    const range = extraRange || (extraQuantity > 0 ? 12 : 0);
    const extras = extraQuantity > 0 ? Array.from({ length: extraQuantity }, () => String(Math.floor(Math.random() * range) + 1)) : [];

    return NextResponse.json({
        numbers: [...mainNumbers, ...extras],
        explanation: "Geração aleatória (Sistema de IA temporariamente indisponível). Boa sorte!"
    });
}
