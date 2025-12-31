import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

export async function GET(req: NextRequest) {
    try {
        // Verificar autorização (opcional - adicionar secret)
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = Timestamp.now();
        let expiredCount = 0;
        let checkedCount = 0;

        console.log('🔍 Starting subscription expiration check...');

        // Buscar assinaturas ativas
        const q = query(
            collection(db, 'users'),
            where('subscriptionStatus', '==', 'active')
        );

        const snapshot = await getDocs(q);
        checkedCount = snapshot.size;

        console.log(`📊 Found ${checkedCount} active subscriptions to check`);

        // Verificar cada assinatura
        for (const userDoc of snapshot.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;

            // Verificar se a assinatura venceu
            if (userData.subscriptionEndDate && userData.subscriptionEndDate.toMillis() <= now.toMillis()) {
                console.log(`⏰ Subscription expired for user: ${userId}`);

                // Downgrade para FREE
                await updateDoc(doc(db, 'users', userId), {
                    plan: 'free',
                    subscriptionStatus: 'expired',
                    updatedAt: now
                });

                // Atualizar registro de assinatura
                if (userData.subscriptionId) {
                    const subscriptionRef = doc(db, 'subscriptions', userData.subscriptionId);
                    await updateDoc(subscriptionRef, {
                        status: 'expired',
                        updatedAt: now
                    });
                }

                expiredCount++;
                console.log(`✅ User ${userId} downgraded to FREE`);
            }
        }

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            checked: checkedCount,
            expired: expiredCount,
            message: `Checked ${checkedCount} subscriptions, ${expiredCount} expired`
        };

        console.log('✅ Cron job completed:', result);

        return NextResponse.json(result);

    } catch (error) {
        console.error('❌ Cron job error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Cron job failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
