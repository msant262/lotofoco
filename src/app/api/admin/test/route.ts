import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'read';

    try {
        const testRef = doc(db, 'test', 'connection-test');

        if (action === 'write') {
            console.log('[test] Writing to Firestore...');
            const startTime = Date.now();

            await setDoc(testRef, {
                timestamp: Timestamp.now(),
                message: 'Test write from API',
                random: Math.random()
            });

            const duration = Date.now() - startTime;
            console.log(`[test] Write completed in ${duration}ms`);

            return NextResponse.json({
                success: true,
                action: 'write',
                durationMs: duration,
                message: 'Successfully wrote to Firestore'
            });
        } else {
            console.log('[test] Reading from Firestore...');
            const startTime = Date.now();

            const docSnap = await getDoc(testRef);

            const duration = Date.now() - startTime;
            console.log(`[test] Read completed in ${duration}ms`);

            return NextResponse.json({
                success: true,
                action: 'read',
                durationMs: duration,
                exists: docSnap.exists(),
                data: docSnap.exists() ? docSnap.data() : null
            });
        }
    } catch (error: any) {
        console.error('[test] Firestore error:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
