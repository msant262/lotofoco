# Troubleshooting - 404 em Rotas de API

## 🐛 Problema: POST /api/subscription/create retorna 404

### Causa Comum:
O Next.js (especialmente com Turbopack) às vezes não detecta novos arquivos de API route automaticamente.

---

## ✅ Soluções:

### 1. Reiniciar o Servidor de Desenvolvimento

**Parar o servidor:**
```bash
# Ctrl+C no terminal onde está rodando npm run dev
# OU
pkill -f "next dev"
```

**Iniciar novamente:**
```bash
npm run dev
```

### 2. Limpar Cache do Next.js

```bash
# Parar o servidor
# Deletar cache
rm -rf .next

# Iniciar novamente
npm run dev
```

### 3. Verificar Estrutura de Arquivos

Certifique-se de que a estrutura está correta:

```
src/app/api/
├── subscription/
│   └── create/
│       └── route.ts          ✅ Correto
│
├── webhooks/
│   └── abacatepay/
│       └── route.ts          ✅ Correto
│
└── cron/
    └── check-subscriptions/
        └── route.ts          ✅ Correto
```

**❌ Errado:**
```
src/app/api/subscription/create.ts    ❌ Falta pasta "create"
src/app/api/subscription/route.ts     ❌ Nome errado
```

### 4. Verificar se o Arquivo Exporta Corretamente

O arquivo `route.ts` DEVE exportar funções HTTP:

```typescript
// ✅ Correto
export async function POST(req: NextRequest) { ... }
export async function GET(req: NextRequest) { ... }

// ❌ Errado
export default function handler() { ... }  // Não use default export
```

### 5. Verificar Runtime (Edge vs Node.js)

```typescript
// No topo do arquivo route.ts
export const runtime = 'edge';  // Para Cloudflare Pages
```

---

## 🧪 Testar se a Rota Funciona

### Teste 1: Verificar no Terminal

Quando você inicia `npm run dev`, deve ver:

```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
○ Environments: .env.local

Routes:
  ✓ /api/subscription/create
  ✓ /api/webhooks/abacatepay
  ✓ /api/cron/check-subscriptions
```

### Teste 2: Acessar Diretamente

Abra no navegador:
```
http://localhost:3000/api/subscription/create
```

**Resposta esperada:**
```json
{
  "error": "Missing required fields"
}
```

Se retornar 404, a rota não está sendo reconhecida.

### Teste 3: cURL

```bash
curl -X POST http://localhost:3000/api/subscription/create \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "monthly",
    "userId": "test123",
    "userEmail": "[email protected]",
    "userName": "Test User"
  }'
```

---

## 🔧 Checklist de Debug

- [ ] Servidor reiniciado
- [ ] Cache limpo (`.next` deletado)
- [ ] Estrutura de pastas correta
- [ ] Arquivo se chama `route.ts` (não `create.ts`)
- [ ] Exporta `POST` function (não default export)
- [ ] Tem `export const runtime = 'edge'`
- [ ] `.env.local` tem `ABACATEPAY_API_KEY`
- [ ] Nenhum erro no console do terminal

---

## 📝 Sobre o "Secret"

O webhook secret `https://billing.paid` que você mencionou **NÃO é um problema**.

**Explicação:**
- O secret do webhook é usado para **validar** requisições vindas do AbacatePay
- Ele NÃO afeta a criação de cobranças
- O que importa é a **API Key** (`abc_dev_2AsUXfMKtwhHwJQTGzsk45uH`)

**Para criar um secret melhor (opcional):**
```bash
# Gerar secret aleatório forte
openssl rand -hex 32

# Exemplo de output:
# 8f3d2a1b9c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
```

Mas para desenvolvimento, `https://billing.paid` funciona perfeitamente.

---

## 🚀 Próximos Passos

1. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

2. **Teste a rota:**
   ```bash
   curl http://localhost:3000/api/subscription/create
   ```

3. **Se funcionar, teste no navegador:**
   - Abra http://localhost:3000/dashboard/subscription
   - Clique em "ASSINAR MENSAL"
   - Veja os logs no console

4. **Se ainda der 404:**
   - Limpe o cache: `rm -rf .next`
   - Reinicie: `npm run dev`
   - Verifique se não tem erros de TypeScript no terminal

---

## ⚠️ Nota Importante

O erro 404 **NÃO tem nada a ver com:**
- ❌ Secret do webhook
- ❌ API Key do AbacatePay
- ❌ Configuração do Firebase
- ❌ Variáveis de ambiente

É simplesmente o Next.js não encontrando o arquivo de rota. Reiniciar o servidor resolve 99% dos casos.
