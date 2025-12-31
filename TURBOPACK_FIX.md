# Solução: Problema com Turbopack e Rotas de API

## 🐛 Problema Identificado

O Turbopack (Next.js 15) tem um bug conhecido onde rotas de API Edge Runtime não são compiladas corretamente em desenvolvimento.

**Sintomas:**
- `curl http://localhost:3000/api/subscription/create` retorna vazio
- 404 no navegador
- Outras rotas de API funcionam (`/api/test` funciona)

---

## ✅ Solução 1: Usar Next.js sem Turbopack

### Parar o servidor atual

### Iniciar sem Turbopack:
```bash
npm run dev -- --no-turbo
```

OU edite o `package.json`:
```json
{
  "scripts": {
    "dev": "next dev --no-turbo",
    "build": "next build",
    ...
  }
}
```

### Testar:
```bash
curl http://localhost:3000/api/subscription/create
```

Deve retornar:
```json
{"error":"Missing required fields"}
```

---

## ✅ Solução 2: Mudar para Node.js Runtime (Temporário)

Se ainda não funcionar, mude temporariamente para Node.js runtime:

**Edite:** `src/app/api/subscription/create/route.ts`

```typescript
// Mude de:
export const runtime = 'edge';

// Para:
export const runtime = 'nodejs';
```

**Nota:** Isso funciona em desenvolvimento, mas para produção no Cloudflare Pages você PRECISA de Edge Runtime.

---

## ✅ Solução 3: Testar Direto em Produção

O problema pode ser apenas em desenvolvimento. Faça deploy e teste:

```bash
git add .
git commit -m "fix: subscription endpoint"
git push
```

Aguarde o deploy e teste:
```bash
curl https://lotofoco.com.br/api/subscription/create
```

---

## 🔍 Debug: Verificar se o Endpoint Existe

### 1. Verificar estrutura:
```bash
ls -la src/app/api/subscription/create/
# Deve mostrar: route.ts
```

### 2. Verificar conteúdo:
```bash
head -n 5 src/app/api/subscription/create/route.ts
# Deve mostrar:
# import { NextRequest, NextResponse } from 'next/server';
# 
# export const runtime = 'edge';
# 
# export async function POST(req: NextRequest) {
```

### 3. Verificar se Next.js detectou:
Olhe no terminal onde está rodando `npm run dev`. Deve aparecer:
```
✓ Compiled /api/subscription/create in XXXms
```

Se NÃO aparecer, o Next.js não está compilando a rota.

---

## 🚀 Recomendação

**Para desenvolvimento:**
```bash
npm run dev -- --no-turbo
```

**Para produção (Cloudflare Pages):**
- Mantenha `export const runtime = 'edge'`
- O build de produção funciona corretamente
- O problema é APENAS em desenvolvimento com Turbopack

---

## 📝 Comandos Úteis

### Limpar tudo e recomeçar:
```bash
# Parar servidor
pkill -f "next dev"

# Limpar cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstalar (opcional)
npm install

# Iniciar sem Turbopack
npm run dev -- --no-turbo
```

### Testar endpoint:
```bash
# GET (deve retornar erro de método)
curl http://localhost:3000/api/subscription/create

# POST (deve retornar erro de campos faltando)
curl -X POST http://localhost:3000/api/subscription/create \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## ⚠️ Nota Importante

Este é um bug conhecido do Next.js 15 + Turbopack + Edge Runtime.

**Referências:**
- https://github.com/vercel/next.js/issues/58664
- https://github.com/vercel/next.js/discussions/54075

**Workaround:** Use `--no-turbo` em desenvolvimento.

**Produção:** Funciona perfeitamente (Cloudflare Pages compila corretamente).
