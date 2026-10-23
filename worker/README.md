# API do portfólio (Cloudflare Worker + D1)

Guarda o conteúdo editável do site. Só o(s) IP(s) da sua lista `ADMIN_IPS` podem editar.

## Publicar

```
cd worker
npm install
npx wrangler login
npx wrangler d1 create portfolio          # copie o database_id para o wrangler.toml
npx wrangler secret put SESSION_SECRET    # algo longo e aleatório
npx wrangler deploy
```

Depois, em `src/config.js`, ponha a URL do Worker em `API_URL` e faça push.

## Descobrir o seu IP e liberar

1. Abra `https://SEU-WORKER.workers.dev/auth/me` no navegador. Aparece algo como `{"admin":false,"ip":"203.0.113.9"}`.
2. Copie o valor de `ip` e salve:
   ```
   npx wrangler secret put ADMIN_IPS
   ```
   Pode ser mais de um, separados por vírgula (casa, celular, trabalho). Em IPv6 vale o prefixo (os 4 primeiros blocos).
3. Recarregue o site. O botão de lápis aparece no canto de baixo, só para esse IP.

O IP fica num segredo, não no repositório.

## Quando o seu IP mudar

O botão some. Abra `/auth/me` de novo, copie o novo `ip` e rode `npx wrangler secret put ADMIN_IPS`.

## Segurança

- O IP vem da Cloudflare (`CF-Connecting-IP`). Cabeçalhos como `X-Forwarded-For` são ignorados, e um IP de fora não pode ser falsificado numa conexão HTTPS normal.
- Quem usa a mesma rede que você (Wi-Fi, rede móvel compartilhada, VPN) tem o mesmo IP e também seria aceito. Por isso, prefira listar só IPs de redes que você controla.
- A sessão dura 30 minutos e só vale para o IP que a pediu.
- Só o site em `ALLOWED_ORIGINS` fala com a API, e todo conteúdo salvo passa por uma lista de campos permitidos.

## Limpeza (se você usou a versão com passkey)

```
npx wrangler secret delete SETUP_TOKEN
```
