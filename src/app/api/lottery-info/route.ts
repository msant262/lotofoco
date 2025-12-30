import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(req: Request) {
    // This API returns a fallback structure. Real data is loaded by client components.
    // This prevents 500 errors if this route is called.
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    // Default structure expectations
    return NextResponse.json({
        prize: "Carregando...",
        contest: "...",
        date: "...",
        isToday: false,
        dezenas: [],
        acumulado: false,
        ganhadores: 0,
        // Indicate to client that it should try to fetch real data
        source: 'edge-fallback'
    });
}
