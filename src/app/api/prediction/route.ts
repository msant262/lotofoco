import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'edge';

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "mock-key");

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, game, quantity, extraQuantity = 0, fixedNumbers = [] } = body;

        // Validation
        if (!userId) { // Minimal check
            // In a real app we would check auth token / session here
        }

        // Validate fixed vs quantity
        if (fixedNumbers.length >= quantity) {
            return NextResponse.json({
                numbers: fixedNumbers,
                explanation: "Seleção manual completa."
            });
        }

        const needed = quantity - fixedNumbers.length;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        Gere um palpite para loteria ${game}.
        O usuário já escolheu estes números fixos: [${fixedNumbers.join(', ')}].
        Preciso que você complete o jogo gerando mais ${needed} números principais (totalizando ${quantity}).
        ${extraQuantity > 0 ? `E também ${extraQuantity} números extras/trevos (se aplicável).` : ''}
        
        Os números gerados NÃO podem repetir os fixos [${fixedNumbers.join(', ')}].
        Os números devem ser estatisticamente plausíveis.
        
        Responda EXATAMENTE JSON:
        {
            "numbers": ["01", "02", ... (FIXOS + NOVOS ordenados)],
            "explanation": "Breve justificativa"
        }
        `;

        try {
            if (!apiKey) {
                console.warn("GOOGLE_API_KEY missing, using fallback.");
                throw new Error("Missing AI Key");
            }

            const result = await model.generateContent(prompt);
            const prediction = JSON.parse(result.response.text());
            return NextResponse.json(prediction);

        } catch (e: any) {
            console.error("AI Error:", e.message);
            // Fallback Mock with fixed included
            const pool = Array.from({ length: 60 }, (_, i) => String(i + 1).padStart(2, '0'))
                .filter(n => !fixedNumbers.includes(n));

            // Shuffle pool
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }

            const generated = pool.slice(0, needed);
            const finalNumbers = [...fixedNumbers, ...generated].sort((a, b) => parseInt(a) - parseInt(b));

            return NextResponse.json({
                numbers: finalNumbers,
                explanation: "Geração local (IA Indisponível)"
            });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
    }
}
