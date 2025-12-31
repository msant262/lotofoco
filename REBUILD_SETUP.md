# Configuração de Rebuild Automático

## 📋 Setup Necessário

### 1. Firebase Service Account

Você precisa de uma service account do Firebase para o script de build.

**Passos:**
1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto (lotofoco-001)
3. Vá em: **Project Settings** > **Service Accounts**
4. Clique em **Generate New Private Key**
5. Baixe o arquivo JSON

**Para desenvolvimento local:**
- Salve como `firebase-service-account.json` na raiz do projeto
- Adicione ao `.gitignore` (já está)

**Para GitHub Actions:**
- Copie TODO o conteúdo do arquivo JSON
- Vá em: **GitHub Repo** > **Settings** > **Secrets and variables** > **Actions**
- Crie secret: `FIREBASE_SERVICE_ACCOUNT`
- Cole o conteúdo JSON completo

### 2. Cloudflare API Credentials

Para o rebuild automático funcionar, você precisa configurar:

**Secrets do GitHub:**

1. **CLOUDFLARE_ACCOUNT_ID**
   - Encontre em: Cloudflare Dashboard > URL (depois de /accounts/)
   - Exemplo: `1234567890abcdef`

2. **CLOUDFLARE_PROJECT_NAME**
   - Nome do seu projeto no Cloudflare Pages
   - Exemplo: `lotofoco`

3. **CLOUDFLARE_API_TOKEN**
   - Crie em: Cloudflare Dashboard > My Profile > API Tokens
   - Template: "Edit Cloudflare Workers"
   - Ou crie custom com permissões:
     - Account > Cloudflare Pages > Edit

---

## 🔄 Como Funciona

### Build Local (Desenvolvimento)
```bash
# Gerar dados estáticos manualmente
node scripts/build-static-data.js

# Build completo (inclui geração de dados)
npm run build
```

### Build Automático (Produção)

**Quando roda:**
- ✅ Todo dia às 3h da manhã (UTC)
- ✅ Manualmente via GitHub Actions

**O que faz:**
1. Busca dados do Firestore
2. Calcula estatísticas
3. Gera JSONs em `/public/data/history/`
4. Faz commit das mudanças
5. Trigger deploy no Cloudflare Pages

---

## 📊 Estrutura dos Dados

### Arquivos Gerados:
```
/public/data/history/
  ├── mega-sena.json
  ├── lotofacil.json
  ├── quina.json
  ├── lotomania.json
  ├── timemania.json
  ├── dupla-sena.json
  ├── dia-de-sorte.json
  ├── super-sete.json
  └── mais-milionaria.json
```

### Formato do JSON:
```json
{
  "lastUpdate": "2024-12-31T10:00:00.000Z",
  "count": 2500,
  "stats": {
    "frequency": { "01": 150, "02": 145, ... },
    "evenOdd": { "even": 7500, "odd": 7500 },
    "topPairs": [{ "pair": "01-02", "count": 50 }],
    ...
  },
  "draws": [
    { "c": 2500, "d": ["01", "05", "12", ...], "t": "2024-12-31", "a": false }
  ]
}
```

---

## 🚀 Vantagens dessa Abordagem

### Performance:
- ✅ **Zero reads do Firestore** em produção
- ✅ **CDN global** (Cloudflare)
- ✅ **Cache agressivo** (1 ano)
- ✅ **Latência < 50ms** em qualquer lugar do mundo

### Custo:
- ✅ **Grátis** (dentro do free tier do Cloudflare)
- ✅ **1 build/dia** = ~30 builds/mês
- ✅ **Sem custos de API** em runtime

### Confiabilidade:
- ✅ **Dados sempre disponíveis** (mesmo se Firestore cair)
- ✅ **Versionamento** (Git)
- ✅ **Rollback fácil** (Git)

---

## 🧪 Testando

### Teste Local:
```bash
# 1. Certifique-se de ter o firebase-service-account.json
# 2. Rode o script
node scripts/build-static-data.js

# 3. Verifique os arquivos gerados
ls -lh public/data/history/
```

### Teste GitHub Action:
1. Vá em: **Actions** > **Daily Data Rebuild**
2. Clique em **Run workflow**
3. Selecione branch `main`
4. Clique em **Run workflow**

---

## 📝 Notas Importantes

1. **Primeira execução:**
   - Rode manualmente: `node scripts/build-static-data.js`
   - Commit os JSONs gerados
   - Push para o repositório

2. **Service Account:**
   - NUNCA commite o arquivo JSON
   - Use apenas via environment variable

3. **Rate Limits:**
   - Firestore: 10k reads/dia (free tier)
   - GitHub Actions: 2000 minutos/mês (free tier)
   - Cloudflare: Ilimitado (free tier)

4. **Monitoramento:**
   - Verifique logs no GitHub Actions
   - Confirme que os JSONs foram atualizados
   - Teste a aplicação após rebuild

---

## 🔐 Checklist de Segurança

- [ ] `firebase-service-account.json` no `.gitignore`
- [ ] Secret `FIREBASE_SERVICE_ACCOUNT` configurado no GitHub
- [ ] Secrets do Cloudflare configurados
- [ ] Permissões mínimas na service account
- [ ] API token com escopo limitado

---

## 🆘 Troubleshooting

**Erro: "Cannot find module firebase-admin"**
```bash
npm install firebase-admin --save-dev
```

**Erro: "Permission denied"**
- Verifique permissões da service account
- Certifique-se de que tem acesso ao Firestore

**Erro: "Cloudflare API error"**
- Verifique se o API token está correto
- Confirme as permissões do token

**Dados não atualizando:**
- Verifique logs do GitHub Actions
- Confirme que o commit foi feito
- Verifique se o deploy foi triggered
