# Índices Necessários do Firestore - LotoFoco

## 📋 Índices Compostos Obrigatórios

### 1. **Invoices (Faturas)**

**Coleção**: `invoices`  
**Campos**:
- `userId` (Ascending)
- `createdAt` (Descending)

**Query**: Buscar faturas de um usuário ordenadas por data

**Link de Criação Rápida**:
```
https://console.firebase.google.com/v1/r/project/lotofoco-001/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9sb3RvZm9jby0wMDEvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2ludm9pY2VzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI
```

**Criação Manual**:
1. Acesse: Firebase Console > Firestore > Indexes
2. Clique em "Create Index"
3. Collection ID: `invoices`
4. Fields:
   - `userId` → Ascending
   - `createdAt` → Descending
5. Query scope: Collection
6. Clique em "Create"

---

### 2. **Users - Subscription Status (Futuro)**

Se você precisar buscar usuários por status de assinatura:

**Coleção**: `users`  
**Campos**:
- `subscriptionStatus` (Ascending)
- `subscriptionEndDate` (Ascending)

**Query**: Buscar assinaturas ativas que venceram

**Criação Manual**:
1. Collection ID: `users`
2. Fields:
   - `subscriptionStatus` → Ascending
   - `subscriptionEndDate` → Ascending

---

## 🔍 Como Identificar Necessidade de Índice

Quando você vê este erro no console:
```
FirebaseError: The query requires an index. You can create it here: https://...
```

**Passos:**
1. ✅ Clique no link fornecido
2. ✅ Revise a configuração do índice
3. ✅ Clique em "Create Index"
4. ⏳ Aguarde alguns minutos (status: Building)
5. ✅ Quando ficar "Enabled", recarregue a página

---

## 📊 Índices Atuais Necessários

| Coleção | Campos | Status | Usado em |
|---------|--------|--------|----------|
| `invoices` | `userId` (ASC), `createdAt` (DESC) | ⏳ Criar | Página de assinatura |
| `users` | `subscriptionStatus` (ASC), `subscriptionEndDate` (ASC) | 📝 Futuro | Cron job de vencimentos |

---

## ⚠️ Notas Importantes

1. **Tempo de Criação**: Índices levam 2-5 minutos para serem criados
2. **Limite Gratuito**: Firebase permite até 200 índices compostos no plano gratuito
3. **Performance**: Índices melhoram drasticamente a velocidade de queries complexas
4. **Custo**: Índices não têm custo adicional, apenas melhoram performance

---

## 🚀 Verificar Índices Existentes

1. Acesse: https://console.firebase.google.com/project/lotofoco-001/firestore/indexes
2. Veja a lista de índices criados
3. Status:
   - 🟢 **Enabled** - Funcionando
   - 🟡 **Building** - Sendo criado
   - 🔴 **Error** - Erro na criação

---

## 📝 Checklist de Índices

- [ ] `invoices` (userId + createdAt) - Para histórico de faturas
- [ ] `users` (subscriptionStatus + subscriptionEndDate) - Para cron de vencimentos (opcional)

---

**Última atualização**: 31/12/2024
