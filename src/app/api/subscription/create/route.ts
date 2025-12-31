import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { plan, userId, userEmail, userName } = await req.json();

        if (!plan || !userId || !userEmail) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Definir produto e valor baseado no plano
        const productConfig = {
            monthly: {
                externalId: '001',
                name: 'Plano Mensal - LotoFoco PRO',
                description: 'Assinatura mensal com acesso total a IA e estatísticas avançadas',
                price: 990, // R$ 9,90 em centavos
                duration: 30
            },
            annual: {
                externalId: '002',
                name: 'Plano Anual - LotoFoco PRO',
                description: 'Assinatura anual com 25% de desconto e acesso vitalício',
                price: 8990, // R$ 89,90 em centavos
                duration: 365
            }
        };

        const config = productConfig[plan as keyof typeof productConfig];

        if (!config) {
            return NextResponse.json(
                { error: 'Invalid plan' },
                { status: 400 }
            );
        }

        // Criar cobrança no AbacatePay
        const response = await fetch('https://api.abacatepay.com/billing/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                frequency: 'ONE_TIME',
                methods: ['PIX', 'CARD'],
                products: [{
                    externalId: config.externalId,
                    name: config.name,
                    description: config.description,
                    quantity: 1,
                    price: config.price
                }],
                customer: {
                    email: userEmail,
                    name: userName || 'Cliente LotoFoco',
                    metadata: {
                        userId: userId,
                        plan: plan,
                        duration: config.duration.toString()
                    }
                },
                returnUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/subscription`,
                completionUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/subscription?success=true`,
                metadata: {
                    userId: userId,
                    plan: plan,
                    environment: process.env.NODE_ENV || 'development',
                    createdAt: new Date().toISOString()
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('AbacatePay API Error:', errorData);
            return NextResponse.json(
                { error: 'Failed to create billing', details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();

        console.log('✅ Billing created:', {
            billingId: data.data?.id,
            plan: plan,
            userId: userId
        });

        return NextResponse.json({
            success: true,
            billingId: data.data?.id,
            paymentUrl: data.data?.url,
            amount: config.price,
            plan: plan
        });

    } catch (error) {
        console.error('Create subscription error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
