const { GoogleGenerativeAI } = require("@google/generative-ai");

const keys = [
    "AIzaSyAVZTPI_AJJcMjI1OotURJBCbGa9g9-m0c",
    "AIzaSyAzOq9NnUUhoOg4AxKuejwAMa5qFxrl09U"
];

const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b"];

async function test() {
    console.log("Iniciando diagnótico do Gemini AI...\n");

    for (const key of keys) {
        console.log(`Testando Key: ${key.substring(0, 10)}...`);
        const genAI = new GoogleGenerativeAI(key);

        for (const modelName of models) {
            try {
                process.stdout.write(`  - Modelo ${modelName}: `);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Teste de conexão. Responda 'OK'.");
                const response = result.response.text();
                console.log(`✅ SUCESSO! Resposta: ${response.trim()}`);
            } catch (e) {
                console.log(`❌ FALHA (${e.message.split(' ')[0]}...)`);
                if (e.message.includes('404')) console.log("    -> Modelo não encontrado ou suporte encerrado.");
                if (e.message.includes('400')) console.log("    -> Chave inválida ou erro na requisição.");
                if (e.message.includes('403')) console.log("    -> Permissão negada / Chave expirada.");
            }
        }
        console.log("---");
    }
}

test();
