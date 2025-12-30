# Regras de Segurança do Firestore (LotoFoco)

Como a aplicação agora roda 100% no cliente (browser), a segurança do banco de dados deve ser garantida pelas **Firestore Security Rules**.

## Configuração Obrigatória

No console do Firebase (Firestore Database > Rules), cole as regras abaixo.

### 1. Regras
```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar para verificar se o usuário é admin
    function isAdmin() {
      // Verifica se o usuário está autenticado
      // E se existe um documento na coleção 'admins' com o ID do usuário
      return request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Coleção de Admins (Somente leitura para o próprio admin, ninguém pode escrever via cliente exceto console)
    match /admins/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Adicione admins manualmente pelo console do Firebase
    }

    // Jogos e Sorteios
    match /games/{game} {
      // Leitura pública (qualquer um pode ver os resultados)
      allow read: if true;
      
      // Escrita apenas para admins (para atualizar resultados)
      allow write: if isAdmin();

      // Sub-coleção de sorteios (draws)
      match /draws/{draw} {
        allow read: if true;
        allow write: if isAdmin();
      }
    }
    
    // Configurações e outros
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 2. Como criar um Admin

Para que sua conta Google possa gravar dados no banco, você precisa criar manualmente um registro na coleção `admins`.

1. Faça login na sua aplicação localmente.
2. Abra o console do navegador (F12) e digite:
   ```javascript
   // Se você expôs 'auth' no window ou apenas olhe no Network tab/Application tab
   // Ou, mais fácil:
   console.log("Meu UID:", firebase.auth().currentUser.uid) 
   ```
   *(Nota: Se não conseguir pegar pelo console, vá no Authentication do Firebase, busque seu email e cope o `User UID`).*

3. No **Firebase Console > Firestore Database**:
   - Clique em **Iniciar coleção**.
   - ID da coleção: `admins`
   - Adicione o primeiro documento:
     - ID do documento: **SEU_UID_AQUI** (ex: `AbC123...`)
     - Campo: `enabled` (boolean) -> `true`
     - Campo: `email` (string) -> `seu-email@gmail.com`

4. Salve. Agora sua conta tem permissão de escrita nas coleções `games`.

## Variáveis de Ambiente no Cloudflare Pages

Certifique-se de que as seguintes variáveis estão configuradas no painel do Cloudflare (Settings > Environment Variables):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

---
*Gerado automaticamente via migração client-side.*


