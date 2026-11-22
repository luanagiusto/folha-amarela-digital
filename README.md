# Folha Amarela Digital (Angular)

Migração do site em HTML/CSS/JS para Angular, mantendo o Firebase (Auth + Firestore).

## Requisitos
- Node **22.22+** ou **24.15+** (exigência do Angular 22). Use `nvm` para trocar de versão.
- Não precisa instalar o Angular CLI global: `npx ng ...` já usa o do projeto.

## Rodar
```bash
npm install
npm start          # http://localhost:4200
npm run build      # saída em dist/folha-amarela-angular/browser
```

## Deploy (Vercel)
O `vercel.json` já faz o fallback para `index.html`, necessário para links como `/perfil/ID`.
Links antigos (`/perfil.html?id=ID`) são redirecionados automaticamente.

## Estrutura
```
src/app/
  core/
    firebase.ts            inicialização do Firebase (Auth + Firestore)
    models/models.ts       interfaces: Local, Reivindicacao, InteresseDestaque...
    services/              auth, locais, solicitacoes, diretorio (filtros), theme, ui, externo (ViaCEP/GPS)
    utils/texto.ts         normalização, busca com termos relacionados, WhatsApp, mapas
  layout/                  header, nav-drawer, footer
  shared/                  modal (casca), local-card, local-form (cadastro + edição)
  modals/                  cadastro, editar-perfil, cidade, acesso, painel, detalhes, destaque, indicação, chat
  pages/                   home, perfil, planos
```

## Fora desta versão (de propósito)
- `financeiro.html`: ideia em pausa. Ao retomar, criar a rota com um guard de admin (`AuthService.isAdmin`).
- Busca com Gemini: a chave não pode ficar no front-end. Se for retomar, chamar via backend (Cloud Function).
- Service worker: `public/sw.js` foi mantido, mas não é registrado (o site original também não registrava).

## Segurança
A `apiKey` do Firebase é pública por desenho. Quem protege os dados são as **regras do Firestore**:
confira no console do Firebase que escrita em `locais` (status/destaque/proprietarioUid), `reivindicacoes`
e `interessesDestaque` só é permitida como o app espera, e que só admin (claim `admin`) aprova.
