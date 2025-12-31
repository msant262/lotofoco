# Configuração do Webhook AbacatePay

## 📋 Passos para Configurar

### 1. Acesse o Dashboard do AbacatePay
- Vá para: https://www.abacatepay.com/app
- Faça login com suas credenciais

### 2. Navegue até Webhooks
- No menu lateral, clique em "Webhooks" ou "Configurações"
- Clique em "Criar Webhook" ou "Adicionar"

### 3. Configure o Webhook

**URL do Webhook:**
```
https://seu-dominio.com/api/webhooks/abacatepay
```

**Eventos para Escutar:**
- ✅ `billing.paid` (OBRIGATÓRIO)

**Método HTTP:**
- POST

**Segurança (Opcional mas Recomendado):**
- Gere um secret aleatório
- Adicione ao `.env.local`:
  ```
  ABACATEPAY_WEBHOOK_SECRET=seu_secret_aqui
  ```

### 4. Teste o Webhook

**Modo de Desenvolvimento:**
O AbacatePay tem um "Dev Mode" que permite testar sem pagamentos reais.

**Endpoint de Teste:**
```bash
curl -X GET https://seu-dominio.com/api/webhooks/abacatepay
```

Deve retornar:
```json
{
  "status": "ok",
  "endpoint": "abacatepay-webhook",
  "timestamp": "2024-12-31T10:00:00.000Z"
}
```

### 5. Simular Pagamento (Dev Mode)

Use o endpoint de simulação do AbacatePay:
```bash
POST https://api.abacatepay.com/billing/simulate-payment
Authorization: Bearer abc_dev_2AsUXfMKtwhHwJQTGzsk45uH
Content-Type: application/json

{
  "billingId": "bill_xxxxx"
}
```

### 6. Verificar Logs

Após um pagamento (real ou simulado), verifique os logs:

**Vercel:**
- Dashboard > Seu Projeto > Logs
- Procure por: "📥 Webhook received"

**Firestore:**
- Verifique se o usuário foi atualizado:
  - `users/{userId}` → `plan: 'monthly'` ou `'annual'`
  - `users/{userId}` → `subscriptionStatus: 'active'`
- Verifique se a fatura foi criada:
  - `invoices/{invoiceId}` → novo documento

---

## 🔐 Variáveis de Ambiente Necessárias

Adicione ao seu `.env.local`:

```env
# AbacatePay
ABACATEPAY_API_KEY=abc_dev_2AsUXfMKtwhHwJQTGzsk45uH
ABACATEPAY_WEBHOOK_SECRET=seu_secret_aqui

# URL da Aplicação
NEXT_PUBLIC_URL=https://seu-dominio.com

# Cron Secret (para proteger o endpoint de cron)
CRON_SECRET=algum_secret_aleatorio_aqui
```

---

## 🧪 Testando a Integração Completa

### Fluxo de Teste:

1. **Criar Cobrança:**
   - Acesse: `/dashboard/subscription`
   - Clique em "ASSINAR MENSAL" ou "GARANTIR VANTAGEM"
   - Você será redirecionado para a página de pagamento do AbacatePay

2. **Pagar (Dev Mode):**
   - Use o simulador de pagamento do AbacatePay
   - OU faça um pagamento real de teste

3. **Webhook Automático:**
   - AbacatePay envia webhook para `/api/webhooks/abacatepay`
   - Usuário é atualizado para PRO
   - Fatura é criada

4. **Verificar:**
   - Volte para `/dashboard/subscription`
   - Deve mostrar "Assinatura Ativa"
   - Histórico de faturas deve aparecer

---

## 🔄 Configurar Cron Job (Vercel)

O arquivo `vercel.json` já está configurado para rodar diariamente.

**Para testar manualmente:**
```bash
curl -X GET https://seu-dominio.com/api/cron/check-subscriptions \
  -H "Authorization: Bearer seu_cron_secret"
```

---

## 📊 Monitoramento

### Logs Importantes:

**Criação de Cobrança:**
```
✅ Billing created: { billingId: 'bill_xxx', plan: 'monthly', userId: 'xxx' }
```

**Webhook Recebido:**
```
📥 Webhook received: { event: 'billing.paid', id: 'log_xxx', devMode: false }
💳 Processing payment for user: xxx Plan: monthly
✅ User updated to PRO: xxx
✅ Subscription record created: bill_xxx
✅ Invoice created for user: xxx
🎉 User xxx successfully upgraded to MONTHLY plan!
```

**Cron Job:**
```
🔍 Starting subscription expiration check...
📊 Found X active subscriptions to check
⏰ Subscription expired for user: xxx
✅ User xxx downgraded to FREE
✅ Cron job completed: { checked: X, expired: Y }
```

---

## ⚠️ Troubleshooting

### Webhook não está sendo recebido:
1. Verifique se a URL está correta no dashboard do AbacatePay
2. Certifique-se de que a aplicação está em produção (não localhost)
3. Verifique os logs do Vercel

### Usuário não foi atualizado:
1. Verifique os logs do webhook
2. Confirme que o `userId` está correto no metadata
3. Verifique permissões do Firestore

### Erro de assinatura HMAC:
1. Verifique se o `ABACATEPAY_WEBHOOK_SECRET` está correto
2. Certifique-se de que está usando o mesmo secret no dashboard

---

## 🚀 Próximos Passos

1. ✅ Configurar webhook no dashboard do AbacatePay
2. ✅ Adicionar variáveis de ambiente
3. ✅ Fazer deploy na Vercel
4. ✅ Testar com Dev Mode
5. ✅ Ativar modo produção quando estiver pronto

---

## 📞 Suporte

Se precisar de ajuda:
- Documentação: https://docs.abacatepay.com
- Email: [email protected]
- Discord: https://discord.gg/abacatepay
