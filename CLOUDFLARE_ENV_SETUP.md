# Configuração de Variáveis de Ambiente - Cloudflare Pages

## 🔐 Variáveis Necessárias

### 1. ABACATEPAY_API_KEY
**Valor:** `abc_dev_2AsUXfMKtwhHwJQTGzsk45uH`

**Como configurar no Cloudflare Pages:**
1. Acesse: https://dash.cloudflare.com
2. Vá em: **Workers & Pages** > **lotofoco** (seu projeto)
3. Clique em: **Settings** > **Environment Variables**
4. Clique em: **Add variable**
5. Nome: `ABACATEPAY_API_KEY`
6. Valor: `abc_dev_2AsUXfMKtwhHwJQTGzsk45uH`
7. Environment: **Production** (e Preview se quiser testar)
8. Clique em: **Save**

### 2. ABACATEPAY_WEBHOOK_SECRET
**Valor:** `https://billing.paid`

**Como configurar:**
1. Mesmos passos acima
2. Nome: `ABACATEPAY_WEBHOOK_SECRET`
3. Valor: `https://billing.paid`
4. Salvar

### 3. NEXT_PUBLIC_URL
**Valor:** `https://lotofoco.com.br` ou `https://www.lotofoco.com.br`

**Como configurar:**
1. Mesmos passos acima
2. Nome: `NEXT_PUBLIC_URL`
3. Valor: `https://lotofoco.com.br`
4. Salvar

### 4. CRON_SECRET (Opcional)
**Valor:** Gere um secret aleatório

```bash
# Gerar secret aleatório
openssl rand -hex 32
```

**Como configurar:**
1. Mesmos passos acima
2. Nome: `CRON_SECRET`
3. Valor: (cole o secret gerado)
4. Salvar

---

## 🔄 Após Configurar

**IMPORTANTE:** Depois de adicionar as variáveis, você precisa fazer um **novo deploy** para que elas sejam aplicadas.

### Opção 1: Redeploy Manual
1. No Cloudflare Pages Dashboard
2. Vá em: **Deployments**
3. Clique nos 3 pontinhos do último deploy
4. Clique em: **Retry deployment**

### Opção 2: Push no Git
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

---

## ✅ Verificar se Funcionou

### Teste 1: Verificar Logs
1. Faça deploy
2. Tente criar uma assinatura
3. Vá em: **Deployments** > **View logs**
4. Procure por:
   - `✅ API Key found: abc_dev_2A...`
   - `📤 Sending request to AbacatePay`
   - `📥 AbacatePay response status: 200`

### Teste 2: Console do Navegador
1. Abra: https://lotofoco.com.br/dashboard/subscription
2. Abra o DevTools (F12)
3. Vá na aba **Console**
4. Clique em "ASSINAR MENSAL"
5. Veja os logs:
   - `🔄 Creating billing for plan: monthly`
   - `📥 API Response: { success: true, ... }`

---

## 🐛 Troubleshooting

### Erro: "Payment system not configured"
- ✅ Verifique se `ABACATEPAY_API_KEY` está configurada
- ✅ Verifique se fez redeploy após adicionar a variável
- ✅ Verifique se a variável está em "Production"

### Erro: "Failed to create billing"
- ✅ Verifique os logs do Cloudflare
- ✅ Veja a resposta da API do AbacatePay nos logs
- ✅ Confirme que a API key está correta

### Erro: "Erro de Conexão"
- ✅ Verifique se a URL da API está correta
- ✅ Teste a API do AbacatePay diretamente (Postman/Insomnia)

---

## 📊 Estrutura Completa

```
Cloudflare Pages Environment Variables:

Production:
  ├─ ABACATEPAY_API_KEY = abc_dev_2AsUXfMKtwhHwJQTGzsk45uH
  ├─ ABACATEPAY_WEBHOOK_SECRET = https://billing.paid
  ├─ NEXT_PUBLIC_URL = https://lotofoco.com.br
  └─ CRON_SECRET = (seu secret aleatório)

Preview (opcional):
  ├─ ABACATEPAY_API_KEY = abc_dev_2AsUXfMKtwhHwJQTGzsk45uH
  ├─ ABACATEPAY_WEBHOOK_SECRET = https://billing.paid
  ├─ NEXT_PUBLIC_URL = https://preview.lotofoco.com.br
  └─ CRON_SECRET = (mesmo secret)
```

---

## 🎯 Checklist Final

- [ ] `ABACATEPAY_API_KEY` configurada
- [ ] `ABACATEPAY_WEBHOOK_SECRET` configurada  
- [ ] `NEXT_PUBLIC_URL` configurada
- [ ] `CRON_SECRET` configurada (opcional)
- [ ] Redeploy feito
- [ ] Logs verificados
- [ ] Teste de assinatura funcionando
- [ ] Webhook configurado no AbacatePay

---

## 📝 Webhooks Configurados

Você já criou 2 webhooks no AbacatePay:

**Webhook 1:**
- Nome: LotoFoco
- URL: https://lotofoco.com.br/api/webhooks/abacatepay
- ID: webh_dev_NnS1TFpyHTpGAwzD6WekcDSu
- Secret: https://billing.paid

**Webhook 2:**
- Nome: lotofoco01
- URL: https://www.lotofoco.com.br/api/webhooks/abacatepay
- ID: webh_dev_Ws66yrzJRKKZLxdPDs01PjWu
- Secret: https://billing.paid

**Recomendação:** Use apenas 1 webhook (o primeiro). Delete o segundo para evitar duplicação.

---

## 🚀 Próximos Passos

1. ✅ Configurar variáveis de ambiente
2. ✅ Fazer redeploy
3. ✅ Testar criação de assinatura
4. ✅ Verificar logs
5. ✅ Testar webhook (simular pagamento)
6. ✅ Confirmar upgrade para PRO

Boa sorte! 🎉
