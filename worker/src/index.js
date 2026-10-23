// API do portfólio: guarda o conteúdo editável do site.
// Só o(s) IP(s) da sua lista ADMIN_IPS podem editar. Roda no Cloudflare Workers com D1.

const enc = new TextEncoder()
const dec = new TextDecoder()

const b64u = {
  enc: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
}
const sha256 = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))
const same = async (a, b) => crypto.subtle.timingSafeEqual(await sha256(a), await sha256(b))

const hmac = async (env, msg) => {
  const key = await crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64u.enc(await crypto.subtle.sign('HMAC', key, enc.encode(msg)))
}

/* ---------- IP ---------- */

// IPv4 vale inteiro. IPv6 vale pelo prefixo /64 (o resto muda sozinho, por privacidade).
export const normIp = (ip) => {
  const s = String(ip || '').trim().toLowerCase()
  if (!s.includes(':')) return s
  const [head, tail = ''] = s.split('::')
  const h = head ? head.split(':') : []
  const t = tail ? tail.split(':') : []
  const groups = s.includes('::') ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h
  return groups.slice(0, 4).map((g) => g.padStart(4, '0')).join(':')
}

const isAdmin = (env, ip) =>
  !!ip && (env.ADMIN_IPS || '').split(/[\s,]+/).filter(Boolean).map(normIp).includes(normIp(ip))

/* ---------- sessão curta, amarrada ao IP de quem pediu ---------- */

const ipTag = async (ip) => b64u.enc(await sha256(normIp(ip))).slice(0, 16)

const issue = async (env, ip) => {
  const exp = Date.now() + 30 * 60 * 1000
  const body = b64u.enc(enc.encode(JSON.stringify({ exp, ip: await ipTag(ip) })))
  return { token: `${body}.${await hmac(env, body)}`, exp }
}

const session = async (env, req, ip) => {
  try {
    const [body, sig] = (req.headers.get('Authorization') || '').replace(/^Bearer /, '').split('.')
    if (!body || !sig || !(await same(sig, await hmac(env, body)))) return false
    const s = JSON.parse(dec.decode(b64u.dec(body)))
    return s.exp > Date.now() && s.ip === (await ipTag(ip)) && isAdmin(env, ip)
  } catch {
    return false
  }
}

/* ---------- banco (D1) ---------- */

let ready = null
const init = (env) =>
  (ready ??= env.DB.batch([
    env.DB.prepare('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS tr (k TEXT PRIMARY KEY, v TEXT NOT NULL)'),
  ]).catch((e) => { ready = null; throw e }))

/* ---------- limpeza do conteúdo: só entra o que está na lista de campos permitidos ---------- */

const str = (v, n = 400) => (typeof v === 'string' ? v.trim().slice(0, n) : '')
const pair = (v, n) => ({ pt: str(v?.pt, n), en: str(v?.en, n) })
const url = (v) => { const s = str(v, 500); return /^(https:\/\/|http:\/\/|mailto:|\/)/i.test(s) ? s : '' }
const arr = (v, max) => (Array.isArray(v) ? v.slice(0, max) : [])
const tags = (v) => arr(v, 12).map((t) => str(t, 40)).filter(Boolean)
const ICONS = ['code', 'server', 'monitor', 'gauge', 'network', 'wrench']
const LINKS = ['discord', 'roblox', 'github', 'x']

// Você escreve só em português. O inglês é gerado aqui (veja `localize`).
export const clean = (c) => ({
  about: arr(c?.about?.pt, 10).map((p) => str(p, 1500)).filter(Boolean),
  skills: arr(c?.skills, 24)
    .map((s) => ({ icon: ICONS.includes(s?.icon) ? s.icon : 'code', title: str(s?.title, 80), desc: str(s?.desc?.pt, 500), tags: tags(s?.tags) }))
    .filter((s) => s.title),
  games: arr(c?.games, 24)
    .map((g) => ({
      placeId: Number.isInteger(+g?.placeId) && +g.placeId > 0 ? +g.placeId : null,
      name: str(g?.name, 60),
      kind: g?.kind === 'contributor' ? 'contributor' : 'creator',
      status: g?.status === 'past' ? 'past' : 'active',
      tags: tags(g?.tags),
    }))
    .filter((g) => g.name),
  work: arr(c?.work, 24)
    .map((w) => {
      const video = w?.type === 'video'
      const o = {
        id: str(w?.id, 40) || `w${Math.random().toString(36).slice(2, 8)}`,
        type: video ? 'video' : 'image',
        src: url(w?.src),
        tags: tags(w?.tags),
      }
      if (w?.title?.pt || w?.desc?.pt) { o.title = str(w?.title?.pt, 80); o.desc = str(w?.desc?.pt, 300) }
      return o
    })
    .filter((w) => w.src),
  links: arr(c?.links, 8)
    .map((l) => ({ id: LINKS.includes(l?.id) ? l.id : null, label: str(l?.label, 30), href: url(l?.href), copy: str(l?.copy, 60) }))
    .filter((l) => l.id && (l.href || l.copy)),
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(c?.email, 120)) ? str(c.email, 120) : '',
})

/* ---------- tradução automática PT → EN (Workers AI), com cache no D1 ---------- */

const translate = async (env, text) => {
  if (!text || !env.AI) return text
  try {
    const hit = await env.DB.prepare('SELECT v FROM tr WHERE k = ?').bind(text).first()
    if (hit) return hit.v
    const r = await env.AI.run('@cf/meta/m2m100-1.2b', { text, source_lang: 'portuguese', target_lang: 'english' })
    const en = str(r?.translated_text, 2000)
    if (!en) return text
    await env.DB.prepare('INSERT OR REPLACE INTO tr(k, v) VALUES(?, ?)').bind(text, en).run()
    return en
  } catch {
    return text // se a tradução falhar, o inglês mostra o português em vez de ficar vazio
  }
}

const both = async (env, pt) => ({ pt, en: await translate(env, pt) })

export const localize = async (env, c) => ({
  ...c,
  about: { pt: c.about, en: await Promise.all(c.about.map((p) => translate(env, p))) },
  skills: await Promise.all(c.skills.map(async (s) => ({ ...s, desc: await both(env, s.desc) }))),
  work: await Promise.all(c.work.map(async (w) => (w.title !== undefined
    ? { ...w, title: await both(env, w.title), desc: await both(env, w.desc) }
    : w))),
})

/* ---------- rotas ---------- */

const routes = {
  'GET /content': async ({ env, out }) => {
    const row = await env.DB.prepare("SELECT v FROM kv WHERE k = 'content'").first()
    return out(row ? JSON.parse(row.v) : {})
  },

  // Diz se o visitante é você (o site usa isso para mostrar ou não o botão) e mostra o IP de quem perguntou
  'GET /auth/me': async ({ env, ip, out }) => out({ admin: isAdmin(env, ip), ip }),

  'POST /auth/ip': async ({ env, ip, out }) =>
    isAdmin(env, ip) ? out(await issue(env, ip)) : out({ error: 'seu IP não está na lista de admin' }, 403),

  'PUT /content': async ({ env, req, ip, body, out }) => {
    if (!(await session(env, req, ip))) return out({ error: 'não autorizado' }, 401)
    const data = { ...(await localize(env, clean(body))), updated: Date.now() }
    await env.DB.prepare("INSERT OR REPLACE INTO kv(k, v) VALUES('content', ?)").bind(JSON.stringify(data)).run()
    return out({ ok: true, updated: data.updated, translated: !!env.AI, content: data })
  },

  // Nome do jogo a partir do ID (a API do Roblox bloqueia o navegador, então a busca é feita aqui). Só para o admin.
  'GET /roblox/game': async ({ env, ip, query, out }) => {
    if (!isAdmin(env, ip)) return out({ error: 'não autorizado' }, 403)
    const id = String(query.get('placeId') || '').replace(/\D/g, '')
    if (!id || id.length > 15) return out({ error: 'ID inválido' }, 400)
    const get = (u) => fetch(u, { headers: { Accept: 'application/json' } }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json() })
    try {
      const { universeId } = await get(`https://apis.roblox.com/universes/v1/places/${id}/universe`)
      const j = await get(`https://games.roblox.com/v1/games?universeIds=${universeId}`)
      const name = j.data?.[0]?.name
      return name ? out({ name: str(name, 60) }) : out({ error: 'jogo não encontrado' }, 404)
    } catch {
      return out({ error: 'jogo não encontrado' }, 404)
    }
  },
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || ''
    const okOrigin = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).includes(origin)
    const headers = {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      Vary: 'Origin',
      ...(okOrigin && {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '600',
      }),
    }
    const out = (data, status = 200) => new Response(JSON.stringify(data), { status, headers })
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

    const { pathname, searchParams: query } = new URL(req.url)
    const handler = routes[`${req.method} ${pathname}`]
    if (!handler) return out({ error: 'não encontrado' }, 404)
    if (req.method !== 'GET' && !okOrigin) return out({ error: 'origem não permitida' }, 403)
    try {
      const raw = req.method === 'GET' ? '' : await req.text()
      if (raw.length > 100000) return out({ error: 'muito grande' }, 413)
      await init(env)
      // Só vale o IP que a Cloudflare vê. Cabeçalhos como X-Forwarded-For são ignorados de propósito.
      const ip = req.headers.get('CF-Connecting-IP') || ''
      return await handler({ req, env, out, ip, query, body: raw ? JSON.parse(raw) : {} })
    } catch {
      return out({ error: 'erro no servidor' }, 500)
    }
  },
}
