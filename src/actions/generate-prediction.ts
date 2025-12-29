'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb } from "@/lib/firebase-admin";

// Ensure API Key is present
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("GOOGLE_API_KEY is not set");
}
const genAI = new GoogleGenerativeAI(apiKey || "mock-key");

export async function generatePrediction(userId: string, game: string) {
    if (!userId) throw new Error("Unauthorized");

    // 1. Fetch User
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        // Logic for "New User" could be here or on Auth Trigger
        // For now, throw error or create default
        // Requirement: "Usuário Novo: Começa com credits: 2"
        // Let's create it if missing for demo purposes
        await userRef.set({
            credits: 2,
            plan: 'free',
            createdAt: new Date().toISOString()
        });
        // Re-read or just continue with default values
    }

    // Get fresh data
    const userData = (await userRef.get()).data()!;
    const plan = userData.plan || 'free';
    const credits = userData.credits !== undefined ? userData.credits : 0;

    const isPro = plan === 'pro-monthly' || plan === 'pro-annual';

    // 2. Check Credits
    if (!isPro && credits < 1) {
        throw new Error("Saldo insuficiente. Adquira mais créditos ou assine o Pro.");
    }

    // 3. Prepare Context (Fetch History)
    const limitCount = isPro ? 100 : 10;
    const drawsSnap = await adminDb.collection('games').doc(game).collection('draws')
        .orderBy('concurso', 'desc')
        .limit(limitCount)
        .get();

    if (drawsSnap.empty) {
        throw new Error(`Dados insuficientes para ${game}. O sistema pode estar sincronizando.`);
    }

    const history = drawsSnap.docs.map(doc => {
        const d = doc.data();
        return `Concurso ${d.concurso} (${d.data}): ${d.dezenas.join('-')}`;
    }).reverse().join('\n'); // Chronological order for sequence analysis

    // 4. Prompt Engineering
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    let prompt = "";
    if (isPro) {
        prompt = `
        Analise estatisticamente os últimos ${limitCount} resultados da loteria ${game} fornecidos abaixo.
        Identifique padrões como: frequência de dezenas, atrasos (dezenas que não saem há muito tempo), e sequências.
        Com base nisso, gere um palpite otimizado para o próximo concurso.
        
        Histórico:
        ${history}
        
        Responda EXATAMENTE neste formato JSON:
        {
          "numbers": ["01", "02", ...],
          "explanation": "Texto explicativo detalhado sobre os padrões encontrados e por que esses números foram escolhidos."
        }
        `;
    } else {
        prompt = `
        Com base nos últimos ${limitCount} resultados da loteria ${game} abaixo, gere um palpite de números prováveis.
        
        Histórico:
        ${history}
        
        Responda EXATAMENTE neste formato JSON:
        {
          "numbers": ["01", "02", ...]
        }
        `;
    }

    // 5. Generate
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const prediction = JSON.parse(text);

        // 6. Deduct Credit (Transaction safely)
        if (!isPro) {
            await adminDb.runTransaction(async (t) => {
                const doc = await t.get(userRef);
                const newCredits = (doc.data()?.credits || 0) - 1;
                if (newCredits < 0) throw new Error("Credits changed concurrently");
                t.update(userRef, { credits: newCredits });
            });
        }

        return prediction;
    } catch (e) {
        console.error("Prediction error:", e);
        throw new Error("Erro ao gerar palpite com IA.");
    }
}
