# Plano de Integração AbacatePay - LotoFoco

## 📋 Resumo da Integração

### O que é AbacatePay?
- Gateway de pagamento brasileiro simplificado
- Suporta PIX e Cartão de Crédito
- API descomplicada e idempotente
- Webhooks para notificações em tempo real

---

## 🎯 Objetivos da Integração

1. **Criar cobranças** para planos Mensal (R$ 9,90) e Anual (R$ 89,90)
2. **Receber webhooks** quando pagamentos forem confirmados
3. **Atualizar usuários** para PRO automaticamente
4. **Gerenciar assinaturas** (renovação, cancelamento, vencimento)
5. **Exibir faturas** para os clientes

---

## 🔑 Eventos Webhook Disponíveis

### `billing.paid`
Disparado quando uma cobrança é paga (PIX ou Cartão)

```json
{
  "id": "log_12345abcdef",
  "event": "billing.paid",
  "devMode": false,
  "data": {
    "payment": {
      "amount": 990,
      "fee": 80,
      "method": "PIX"
    },
    "billing": {
      "id": "bill_QgW1BT3uzaDGR3ANKgmmmabZ",
      "amount": 990,
      "status": "PAID",
      "frequency": "ONE_TIME",
      "customer": {
        "id": "cust_4hnLDN3YfUWrwQBQKYMwL6Ar",
        "metadata": {
          "email": "[email protected]",
          "name": "João Silva",
          "taxId": "12345678901"
        }
      },
      "products": [
        {
          "externalId": "plan_monthly",
          "id": "prod_RGKGsjBWsJwRn1mHyGMFJNjP",
          "quantity": 1
        }
      ]
    }
  }
}
```

---

## 📊 Estrutura de Dados no Firestore

### Coleção `users/{userId}`

```typescript
{
  // Dados básicos
  uid: string;
  email: string;
  name: string;
  phone: string;
  
  // Assinatura
  plan: 'free' | 'monthly' | 'annual';
  subscriptionStatus: 'active' | 'canceled' | 'expired' | 'none';
  subscriptionId: string;              // ID da cobrança no AbacatePay
  
  // Datas
  subscriptionStartDate: Timestamp;
  subscriptionEndDate: Timestamp;
  nextBillingDate: Timestamp;
  
  // Pagamento
  subscriptionAmount: number;          // Valor em centavos (990 = R$ 9,90)
  paymentMethod: 'pix' | 'card';
  
  // Controle
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastPaymentDate: Timestamp;
}
```

### Coleção `subscriptions/{subscriptionId}`

```typescript
{
  userId: string;
  billingId: string;                   // ID do AbacatePay
  plan: 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'expired';
  amount: number;
  
  // Datas
  startDate: Timestamp;
  endDate: Timestamp;
  nextBillingDate: Timestamp;
  
  // Histórico
  createdAt: Timestamp;
  updatedAt: Timestamp;
  canceledAt?: Timestamp;
  cancelReason?: string;
}
```

### Coleção `invoices/{invoiceId}`

```typescript
{
  userId: string;
  subscriptionId: string;
  billingId: string;                   // ID do AbacatePay
  
  // Valores
  amount: number;                      // Em centavos
  fee: number;                         // Taxa do gateway
  netAmount: number;                   // amount - fee
  
  // Status
  status: 'paid' | 'pending' | 'failed';
  paymentMethod: 'pix' | 'card';
  
  // Datas
  dueDate: Timestamp;
  paidAt?: Timestamp;
  createdAt: Timestamp;
  
  // Dados do webhook
  webhookData: object;                 // Payload completo do webhook
  receiptUrl?: string;                 // URL do recibo
}
```

---

## 🔄 Fluxo de Integração

### 1. Criação de Cobrança (Frontend → Backend)

**Endpoint**: `POST /api/subscription/create`

```typescript
// Request
{
  plan: 'monthly' | 'annual',
  userId: string,
  userEmail: string,
  userName: string
}

// Response
{
  billingId: string,
  paymentUrl: string,
  amount: number
}
```

**Implementação**:
```typescript
// src/app/api/subscription/create/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { plan, userId, userEmail, userName } = await req.json();
  
  const amount = plan === 'monthly' ? 990 : 8990; // Em centavos
  
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
        externalId: `plan_${plan}`,
        name: `Plano ${plan === 'monthly' ? 'Mensal' : 'Anual'} - LotoFoco PRO`,
        description: `Assinatura ${plan === 'monthly' ? 'mensal' : 'anual'} com acesso total`,
        quantity: 1,
        price: amount
      }],
      customer: {
        email: userEmail,
        name: userName,
        metadata: {
          userId: userId,
          plan: plan
        }
      },
      returnUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/subscription`,
      completionUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/subscription?success=true`,
      metadata: {
        userId: userId,
        plan: plan,
        environment: 'production'
      }
    })
  });
  
  const data = await response.json();
  
  return NextResponse.json({
    billingId: data.data.id,
    paymentUrl: data.data.url,
    amount: amount
  });
}
```

### 2. Webhook Handler (AbacatePay → Backend)

**Endpoint**: `POST /api/webhooks/abacatepay`

```typescript
// src/app/api/webhooks/abacatepay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, Timestamp, collection } from 'firebase/firestore';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar assinatura HMAC
    const signature = req.headers.get('x-abacatepay-signature');
    const body = await req.text();
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.ABACATEPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const webhook = JSON.parse(body);
    
    // 2. Processar evento
    if (webhook.event === 'billing.paid') {
      await handleBillingPaid(webhook);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleBillingPaid(webhook: any) {
  const { billing, payment } = webhook.data;
  const userId = billing.customer.metadata.userId;
  const plan = billing.customer.metadata.plan;
  
  // Calcular datas
  const now = Timestamp.now();
  const duration = plan === 'monthly' ? 30 : 365;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + duration);
  
  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + duration);
  
  // 1. Atualizar usuário para PRO
  await updateDoc(doc(db, 'users', userId), {
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
  
  // 2. Criar registro de assinatura
  await setDoc(doc(db, 'subscriptions', billing.id), {
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
  
  // 3. Criar fatura
  await setDoc(doc(collection(db, 'invoices')), {
    userId: userId,
    subscriptionId: billing.id,
    billingId: billing.id,
    amount: billing.amount,
    fee: payment.fee,
    netAmount: billing.amount - payment.fee,
    status: 'paid',
    paymentMethod: payment.method.toLowerCase(),
    paidAt: now,
    createdAt: now,
    webhookData: webhook.data
  });
  
  console.log(`✅ User ${userId} upgraded to ${plan}`);
}
```

### 3. Verificação de Vencimento (Cron Job)

**Endpoint**: `GET /api/cron/check-subscriptions`

```typescript
// src/app/api/cron/check-subscriptions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

export async function GET() {
  try {
    const now = Timestamp.now();
    
    // Buscar assinaturas ativas que venceram
    const q = query(
      collection(db, 'users'),
      where('subscriptionStatus', '==', 'active'),
      where('subscriptionEndDate', '<=', now)
    );
    
    const snapshot = await getDocs(q);
    
    for (const userDoc of snapshot.docs) {
      const userId = userDoc.id;
      
      // Downgrade para FREE
      await updateDoc(doc(db, 'users', userId), {
        plan: 'free',
        subscriptionStatus: 'expired',
        updatedAt: now
      });
      
      console.log(`⏰ User ${userId} subscription expired`);
    }
    
    return NextResponse.json({ 
      checked: snapshot.size,
      expired: snapshot.size 
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

---

## 💾 O que Salvar no Banco vs API

### ✅ Salvar no Firestore:
- **Status da assinatura** (active/expired/canceled)
- **Datas** (início, fim, próxima cobrança)
- **Plano atual** (free/monthly/annual)
- **Faturas pagas** (histórico completo)
- **ID da cobrança** (para referência)

### ❌ NÃO Salvar (usar API):
- **Dados de cartão** (PCI compliance)
- **Tokens de pagamento**
- **Informações sensíveis**

### 🔄 Consultar API apenas quando:
- Listar todas as cobranças (raro)
- Verificar status em tempo real (opcional)
- Gerar novos links de pagamento

---

## 🚀 Próximos Passos

1. **Criar endpoints de API** (`/api/subscription/create`, `/api/webhooks/abacatepay`)
2. **Configurar webhook** no dashboard do AbacatePay
3. **Implementar botões** de assinatura na página
4. **Testar em dev mode** do AbacatePay
5. **Configurar cron job** para verificar vencimentos
6. **Adicionar cancelamento** de assinatura
7. **Exibir faturas** na página de gestão

---

## 🔐 Variáveis de Ambiente

```env
ABACATEPAY_API_KEY=your_api_key_here
ABACATEPAY_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_URL=https://lotofoco.com
```

---

## 📝 Notas Importantes

1. **Dev Mode**: AbacatePay tem modo de desenvolvimento para testes
2. **Idempotência**: Seguro executar mesma requisição múltiplas vezes
3. **Webhooks**: Sempre validar assinatura HMAC
4. **Retry**: Implementar retry logic para falhas temporárias
5. **Logs**: Manter logs detalhados de todos os eventos
