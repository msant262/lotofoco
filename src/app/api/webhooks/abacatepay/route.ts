import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, Timestamp, collection } from 'firebase/firestore';


export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        // 1. Ler o body como texto para validação
        const body = await req.text();

        // 2. Verificar assinatura HMAC (se configurado)
        const signature = req.headers.get('x-abacatepay-signature');

        if (process.env.ABACATEPAY_WEBHOOK_SECRET && signature) {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(process.env.ABACATEPAY_WEBHOOK_SECRET);
            const messageData = encoder.encode(body);

            const key = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );

            const signatureBuffer = await crypto.subtle.sign(
                'HMAC',
                key,
                messageData
            );

            const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            if (signature !== expectedSignature) {
                console.error('❌ Invalid webhook signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const webhook = JSON.parse(body);

        console.log('📥 Webhook received:', {
            event: webhook.event,
            id: webhook.id,
            devMode: webhook.devMode
        });

        // 3. Processar evento
        if (webhook.event === 'billing.paid') {
            await handleBillingPaid(webhook);
        }

        return NextResponse.json({ received: true, event: webhook.event });

    } catch (error) {
        console.error('❌ Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

async function handleBillingPaid(webhook: any) {
    try {
        const { billing, payment } = webhook.data;

        console.log('📦 Full webhook data:', JSON.stringify(webhook.data, null, 2));

        if (!billing || !billing.customer) {
            console.error('❌ Invalid webhook data structure');
            return;
        }

        // Tentar pegar userId do metadata (se vier da API)
        let userId = billing.customer.metadata?.userId;
        let plan = billing.customer.metadata?.plan;
        const duration = parseInt(billing.customer.metadata?.duration || '30');

        // Se não tem userId no metadata, buscar por email
        if (!userId) {
            const customerEmail = billing.customer.email;

            if (!customerEmail) {
                console.error('❌ No userId in metadata and no customer email');
                return;
            }

            console.log('🔍 No userId in metadata, searching by email:', customerEmail);

            // Buscar usuário por email no Firestore
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', customerEmail));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                console.error('❌ No user found with email:', customerEmail);
                return;
            }

            userId = snapshot.docs[0].id;
            console.log('✅ Found user by email:', userId);

            // Detectar plano pelo valor pago
            if (!plan) {
                const amount = billing.amount;
                if (amount === 990) {
                    plan = 'monthly';
                } else if (amount === 8990) {
                    plan = 'annual';
                } else {
                    console.error('❌ Cannot determine plan from amount:', amount);
                    return;
                }
                console.log('✅ Detected plan from amount:', plan);
            }
        }

        if (!userId || !plan) {
            console.error('❌ Missing userId or plan after all attempts');
            return;
        }

        console.log('💳 Processing payment for user:', userId, 'Plan:', plan);

        // Calcular datas
        const now = Timestamp.now();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        const nextBilling = new Date();
        nextBilling.setDate(nextBilling.getDate() + duration);

        // 1. Atualizar usuário para PRO
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            plan: plan,
            subscriptionStatus: 'active',
            subscriptionId: billing.id,
            subscriptionStartDate: now,
            subscriptionEndDate: Timestamp.fromDate(endDate),
            nextBillingDate: Timestamp.fromDate(nextBilling),
            subscriptionAmount: billing.amount,
            paymentMethod: payment.method.toLowerCase(),
            lastPaymentDate: now,
            updatedAt: now
        });

        console.log('✅ User updated to PRO:', userId);

        // 2. Criar registro de assinatura
        const subscriptionRef = doc(db, 'subscriptions', billing.id);
        await setDoc(subscriptionRef, {
            userId: userId,
            billingId: billing.id,
            plan: plan,
            status: 'active',
            amount: billing.amount,
            startDate: now,
            endDate: Timestamp.fromDate(endDate),
            nextBillingDate: Timestamp.fromDate(nextBilling),
            createdAt: now,
            updatedAt: now
        });

        console.log('✅ Subscription record created:', billing.id);

        // 3. Criar fatura
        const invoiceRef = doc(collection(db, 'invoices'));
        await setDoc(invoiceRef, {
            userId: userId,
            subscriptionId: billing.id,
            billingId: billing.id,
            amount: billing.amount,
            fee: payment.fee || 0,
            netAmount: billing.amount - (payment.fee || 0),
            status: 'paid',
            paymentMethod: payment.method.toLowerCase(),
            paidAt: now,
            createdAt: now,
            webhookData: webhook.data,
            plan: plan
        });

        console.log('✅ Invoice created for user:', userId);

        // Log sucesso completo
        console.log(`🎉 User ${userId} successfully upgraded to ${plan.toUpperCase()} plan!`);

    } catch (error) {
        console.error('❌ Error in handleBillingPaid:', error);
        throw error;
    }
}

// Permitir GET para verificação de saúde
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: 'abacatepay-webhook',
        timestamp: new Date().toISOString()
    });
}
