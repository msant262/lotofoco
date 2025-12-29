import { NextResponse } from 'next/server';
import axios from 'axios';

// Rota de debug para ver a resposta RAW da API da Caixa
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || 'mega-sena';

    // Formato correto: minúsculo, sem acentos, sem hífens
    const API_SLUGS: Record<string, string> = {
        'mega-sena': 'megasena',
        'lotofacil': 'lotofacil',
        'quina': 'quina',
        'lotomania': 'lotomania',
        'timemania': 'timemania',
        'dupla-sena': 'duplasena',
        'dia-de-sorte': 'diadesorte',
        'super-sete': 'supersete',
        'mais-milionaria': 'maismilionaria',
        'federal': 'federal',
        'loteca': 'loteca'
    };

    const HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://loterias.caixa.gov.br',
        'Referer': 'https://loterias.caixa.gov.br/'
    };

    const apiSlug = API_SLUGS[slug] || slug;

    try {
        // Formato correto: /api/{modalidade} para o último sorteio
        const url = `https://servicebus2.caixa.gov.br/portaldeloterias/api/${apiSlug}`;

        console.log(`Debug fetching: ${url}`);

        const response = await axios.get(url, { headers: HEADERS, timeout: 15000 });

        return NextResponse.json({
            slug,
            apiSlug,
            url,
            status: response.status,
            rawData: response.data,
            availableFields: Object.keys(response.data || {})
        });

    } catch (e: any) {
        return NextResponse.json({
            slug,
            apiSlug,
            error: e.message,
            responseData: e.response?.data
        }, { status: 500 });
    }
}
