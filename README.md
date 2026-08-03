# Picker Arena

Fantasy esportivo gratuito, evento a evento.

**Site:** https://luisjuniorawr1.github.io/pickerarena/

## Estado atual

- React + TypeScript + Vite
- login de demonstração com `localStorage`
- suporte preparado para Firebase Authentication
- escalações salvas no Firestore quando o Firebase estiver configurado
- fallback local automático enquanto as variáveis do Firebase estiverem vazias
- ranking por pontos, XP e medalhas virtuais sem valor em dinheiro
- deploy automático no GitHub Pages

## Rodar localmente

```bash
cd web
npm install
npm run dev
```

## Conectar o Firebase

1. Crie um projeto no Firebase Console.
2. Registre um aplicativo Web.
3. Ative os provedores desejados em **Authentication**:
   - Google
   - E-mail/senha
4. Crie o banco **Cloud Firestore**.
5. Copie `web/.env.example` para `web/.env.local` e preencha:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

6. Para o GitHub Pages, cadastre os mesmos nomes em **Settings → Secrets and variables → Actions**.
7. No Firebase Authentication, adicione `luisjuniorawr1.github.io` aos domínios autorizados.

## Publicar as regras do Firestore

Com a Firebase CLI autenticada e o projeto selecionado:

```bash
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes
```

As regras permitem que cada usuário leia e altere apenas o próprio perfil e as próprias escalações.

## Fluxo do MVP

1. Entrar com apelido em modo demonstração ou com conta Firebase.
2. Escolher um evento.
3. Montar 4 titulares e até 2 reservas dentro do orçamento virtual.
4. Confirmar a escalação.
5. Ver a pontuação e a posição no ranking.

As partidas e estatísticas ainda são simuladas. A próxima fase é criar o painel administrativo e substituir os mocks por uma fonte esportiva autorizada.
