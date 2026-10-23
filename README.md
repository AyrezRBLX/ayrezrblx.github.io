# ayrezrblx.github.io

Portfólio em React + Vite. Todo o conteúdo (jogos, links, Discord, e-mail, textos PT/EN) fica em `src/data.js`.

- **Estatísticas do Roblox:** `scripts/fetch-stats.mjs` busca os dados no servidor e gera `public/stats.json`. O workflow roda a cada ~5 minutos e republica o site, sem proxy.
- Vídeos: coloque o .mp4 em `public/media/` e descomente o exemplo em `work`.
- Deploy: suba na `main` e ative Settings > Pages > Source: GitHub Actions.
- Local: `npm install && npm run dev` (o `predev` já busca as estatísticas).
- Se o repositório ficar 60 dias sem atividade, o GitHub pausa o agendamento: rode o workflow manualmente (Actions > Deploy > Run workflow).

## Painel de admin

O conteúdo (Sobre, Habilidades, Jogos, Trabalhos e Contato) pode ser editado no próprio site. O botão de lápis só aparece para o(s) IP(s) da sua lista de admin. Veja `worker/README.md` para publicar a API e liberar o seu IP. Sem API, o site usa só o que está em `src/data.js`.
