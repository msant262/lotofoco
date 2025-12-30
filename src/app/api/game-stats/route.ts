import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET() {
    // This API route exists to satisfy the architecture requirement.
    // However, for performance and stability on Edge without valid Firestore SDK support,
    // the client fetches data directly using the Firebase Client SDK.
    return NextResponse.json({
        message: "Please use client-side fetching via getStatsClient in @/lib/firebase/games-client",
        data: null
    });
}
