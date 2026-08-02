# Picker Arena

Fantasy multi-esporte, evento a evento.

## MVP web (mock)

```bash
cd web
npm install
npm run dev
```

Abre o endereço do Vite (geralmente `http://localhost:5173`).

### Fluxo
1. Login com apelido (localStorage)
2. Evento **aberto** — montar 4 titulares (orçamento 16) + até 2 reservas (orçamento 6)
3. Evento **pontuado** — ver breakdown football-v1 + cobertura de banco
4. Ranking mensal mock

Regras de domínio: `.cursor/skills/picker-arena-dominio/SKILL.md`

## Deploy (Firebase Hosting)

O app é um SPA estático (Vite + React Router). Config em `firebase.json`
(`public: web/dist`, rewrite de SPA para `index.html`).

Pré-requisitos: conta Google/Firebase e um projeto Firebase criado.

```bash
# 1. Instalar a CLI (uma vez)
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Vincular a um projeto Firebase existente (gera .firebaserc)
firebase use --add        # escolha o projeto e dê o alias "default"

# 4. Build do front
cd web
npm install
npm run build
cd ..

# 5. Deploy
firebase deploy --only hosting
```

Ao final a CLI mostra a URL pública `https://<projeto>.web.app`.
