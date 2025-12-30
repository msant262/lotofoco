'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";


const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "mock-key");

export async function generatePrediction(
    userId: string,
    game: string,
    quantity: number,
    extraQuantity: number = 0,
    fixedNumbers: string[] = [] // New Param
) {
    if (!userId) throw new Error("Unauthorized");

    // Validate fixed vs quantity
    if (fixedNumbers.length >= quantity) {
        // If user already picked all, just return them (AI validates maybe?)
        return { numbers: fixedNumbers, explanation: "Seleção manual completa." };
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
        if (!process.env.GOOGLE_API_KEY) {
            console.warn("GOOGLE_API_KEY missing, using fallback.");
            throw new Error("Missing AI Key");
        }

        const result = await model.generateContent(prompt);
        const prediction = JSON.parse(result.response.text());
        return prediction;
    } catch (e) {
        console.error("AI Error", e);
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

        return { numbers: finalNumbers, explanation: "AI Indisponível (Mock Híbrido)" };
    }
}
