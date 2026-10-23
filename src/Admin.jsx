import { useEffect, useRef, useState } from 'react'
import { API_URL } from './config.js'
import { mergeContent } from './content.js'

/* ---------- API ---------- */

const api = (path, { method = 'GET', body, token } = {}) =>
  fetch(`${API_URL}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => {
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.detail ? `${j.error}: ${j.detail}` : j.error || `Erro ${r.status}`)
    return j
  })

/* ---------- edição imutável de listas ---------- */

const upd = (a, i, v) => a.map((x, k) => (k === i ? v : x))
const del = (a, i) => a.filter((_, k) => k !== i)
const move = (a, i, d) => {
  const j = i + d
  if (j < 0 || j >= a.length) return a
  const b = [...a]
  ;[b[i], b[j]] = [b[j], b[i]]
  return b
}

/* ---------- campos ---------- */

const T = ({ label, value, onChange, area, ph }) => (
  <label className="af">
    <span>{label}</span>
    {area
      ? <textarea rows={4} value={value ?? ''} placeholder={ph} onChange={(e) => onChange(e.target.value)} />
      : <input value={value ?? ''} placeholder={ph} onChange={(e) => onChange(e.target.value)} />}
  </label>
)

// Texto só em português. O inglês é traduzido sozinho quando você publica.
const P = ({ label, value, onChange, area }) => (
  <T label={label} area={area} value={value?.pt} onChange={(v) => onChange({ ...value, pt: v })} />
)

const Tags = ({ value, onChange, suggest = [] }) => {
  const [v, setV] = useState('')
  const add = () => {
    const t = v.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setV('')
  }
  return (
    <div className="atags">
      {value.map((t) => (
        <span key={t} className="achip">{t}<button onClick={() => onChange(value.filter((x) => x !== t))} aria-label="Remover">×</button></span>
      ))}
      <input value={v} placeholder="Nova tag + Enter" onChange={(e) => setV(e.target.value)} onBlur={add}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }} />
      {suggest.filter((t) => !value.includes(t)).map((t) => (
        <button key={t} type="button" className="asug" onClick={() => onChange([...value, t])}>+ {t}</button>
      ))}
    </div>
  )
}

const Item = ({ title, i, n, onMove, onDel, children }) => (
  <details className="aitem">
    <summary>
      <span>{title || 'Sem título'}</span>
      <span className="aact">
        <button disabled={i === 0} onClick={(e) => { e.preventDefault(); onMove(-1) }} aria-label="Subir">↑</button>
        <button disabled={i === n - 1} onClick={(e) => { e.preventDefault(); onMove(1) }} aria-label="Descer">↓</button>
        <button onClick={(e) => { e.preventDefault(); onDel() }} aria-label="Remover">✕</button>
      </span>
    </summary>
    <div className="abody">{children}</div>
  </details>
)

/* ---------- abas ---------- */

const AboutTab = ({ c, set }) => (
  <section className="asec">
    <p className="ahint">Escreva só em português. A versão em inglês é gerada automaticamente ao publicar.</p>
    {c.about.pt.map((p, i) => (
      <div key={i} className="arow">
        <textarea rows={5} value={p} onChange={(e) => set({ about: { ...c.about, pt: upd(c.about.pt, i, e.target.value) } })} />
        <button className="aico" aria-label="Remover" onClick={() => set({ about: { ...c.about, pt: del(c.about.pt, i) } })}>✕</button>
      </div>
    ))}
    <button className="btn" onClick={() => set({ about: { ...c.about, pt: [...c.about.pt, ''] } })}>+ Parágrafo</button>
  </section>
)

const ICONS = ['code', 'server', 'monitor', 'gauge', 'network', 'wrench']

const SkillsTab = ({ c, set }) => {
  const up = (i, patch) => set({ skills: upd(c.skills, i, { ...c.skills[i], ...patch }) })
  return (
    <>
      <p className="ahint">Escreva só em português. O inglês é traduzido sozinho ao publicar.</p>
      {c.skills.map((s, i) => (
        <Item key={i} i={i} n={c.skills.length} title={s.title}
          onMove={(d) => set({ skills: move(c.skills, i, d) })} onDel={() => set({ skills: del(c.skills, i) })}>
          <T label="Título" value={s.title} onChange={(v) => up(i, { title: v })} />
          <label className="af">
            <span>Ícone</span>
            <select value={s.icon} onChange={(e) => up(i, { icon: e.target.value })}>
              {ICONS.map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
          <P label="Descrição" area value={s.desc} onChange={(v) => up(i, { desc: v })} />
          <div className="af"><span>Tags</span><Tags value={s.tags} onChange={(v) => up(i, { tags: v })} /></div>
        </Item>
      ))}
      <button className="btn" onClick={() => set({ skills: [...c.skills, { icon: 'code', title: 'Nova habilidade', desc: { pt: '', en: '' }, tags: [] }] })}>+ Habilidade</button>
    </>
  )
}

const GAME_TAGS = ['Full-Stack', 'Long-Term', 'Short-Term']

// Quando o ID muda, busca o nome do jogo no Roblox (via Worker) e preenche o campo Nome
const GameItem = ({ g, i, c, set }) => {
  const up = (patch) => set({ games: upd(c.games, i, { ...c.games[i], ...patch }) })
  const latest = useRef(up)
  latest.current = up
  const prev = useRef(g.placeId)
  const [look, setLook] = useState({ s: 'idle', m: '' })

  useEffect(() => {
    if (prev.current === g.placeId) return
    prev.current = g.placeId
    if (!g.placeId) { setLook({ s: 'idle', m: '' }); return }
    let alive = true
    setLook({ s: 'load', m: 'Buscando o nome no Roblox…' })
    const t = setTimeout(() => {
      api(`/roblox/game?placeId=${g.placeId}`)
        .then(({ name }) => { if (!alive) return; latest.current({ name }); setLook({ s: 'ok', m: 'Nome preenchido automaticamente ✓' }) })
        .catch((e) => alive && setLook({ s: 'err', m: `Não achei esse ID (${e.message}). Confira o número ou escreva o nome.` }))
    }, 600)
    return () => { alive = false; clearTimeout(t) }
  }, [g.placeId])

  return (
    <Item i={i} n={c.games.length} title={g.name}
      onMove={(d) => set({ games: move(c.games, i, d) })} onDel={() => set({ games: del(c.games, i) })}>
      <T label="ID do jogo (roblox.com/games/ID). Vazio = Em breve" value={g.placeId ?? ''} ph="9285238704"
        onChange={(v) => up({ placeId: v.replace(/\D/g, '') === '' ? null : Number(v.replace(/\D/g, '')) })} />
      {look.s !== 'idle' && <p className={`ahint${look.s === 'err' ? ' err' : ''}`}>{look.m}</p>}
      <T label={g.placeId ? 'Nome (vem do ID, mas você pode editar)' : 'Nome'} value={g.name} onChange={(v) => up({ name: v })} />
      <label className="af">
        <span>Seu papel</span>
        <select value={g.kind} onChange={(e) => up({ kind: e.target.value })}>
          <option value="creator">Criador</option>
          <option value="contributor">Colaborador</option>
        </select>
      </label>
      <label className="af">
        <span>Situação</span>
        <select value={g.status === 'past' ? 'past' : 'active'} onChange={(e) => up({ status: e.target.value })}>
          <option value="active">Trabalho nele atualmente</option>
          <option value="past">Já trabalhei, não trabalho mais</option>
        </select>
      </label>
      <div className="af"><span>Tags</span><Tags value={g.tags || []} suggest={GAME_TAGS} onChange={(v) => up({ tags: v })} /></div>
    </Item>
  )
}

const GamesTab = ({ c, set }) => (
  <>
    {c.games.map((g, i) => <GameItem key={i} g={g} i={i} c={c} set={set} />)}
    <button className="btn" onClick={() => set({ games: [...c.games, { placeId: null, name: 'Novo jogo', kind: 'creator', status: 'active', tags: [] }] })}>+ Jogo</button>
  </>
)

const WorkTab = ({ c, set }) => {
  const up = (i, patch) => set({ work: upd(c.work, i, { ...c.work[i], ...patch }) })
  const label = (w) => w.title?.pt || (w.type === 'video' ? 'Vídeo' : 'Imagem')
  const add = (type) => set({ work: [...c.work, { id: `w${Date.now().toString(36)}`, type, src: '', tags: [], title: { pt: '', en: '' }, desc: { pt: '', en: '' } }] })
  return (
    <>
      <p className="ahint">Escreva só em português. O inglês é traduzido sozinho ao publicar.</p>
      {c.work.map((w, i) => (
        <Item key={w.id || i} i={i} n={c.work.length} title={label(w)}
          onMove={(d) => set({ work: move(c.work, i, d) })} onDel={() => set({ work: del(c.work, i) })}>
          <T label={w.type === 'video' ? 'Link do vídeo (.mp4)' : 'Link da imagem'} value={w.src} ph={w.type === 'video' ? 'https://... ou /media/video.mp4' : 'https://... ou /media/imagem.png'}
            onChange={(v) => up(i, { src: v })} />
          <div className="af"><span>Tags (UI, Systems, VFX)</span><Tags value={w.tags || []} onChange={(v) => up(i, { tags: v })} /></div>
          <P label="Título (opcional)" value={w.title} onChange={(v) => up(i, { title: v })} />
          <P label="Descrição (opcional)" area value={w.desc} onChange={(v) => up(i, { desc: v })} />
        </Item>
      ))}
      <div className="arow">
        <button className="btn" onClick={() => add('video')}>+ Vídeo</button>
        <button className="btn" onClick={() => add('image')}>+ Imagem</button>
      </div>
    </>
  )
}

const LINKS = { discord: 'Discord', roblox: 'Roblox', github: 'GitHub', x: 'Twitter' }

const ContactTab = ({ c, set }) => {
  const up = (i, patch) => set({ links: upd(c.links, i, { ...c.links[i], ...patch }) })
  const missing = Object.keys(LINKS).filter((k) => !c.links.some((l) => l.id === k))
  return (
    <>
      <T label="E-mail (opcional)" value={c.email} ph="voce@exemplo.com" onChange={(v) => set({ email: v })} />
      {c.links.map((l, i) => (
        <Item key={l.id} i={i} n={c.links.length} title={LINKS[l.id]}
          onMove={(d) => set({ links: move(c.links, i, d) })} onDel={() => set({ links: del(c.links, i) })}>
          <T label="Nome exibido" value={l.label} onChange={(v) => up(i, { label: v })} />
          {l.id === 'discord'
            ? <T label="Usuário (copiado ao clicar)" value={l.copy} onChange={(v) => up(i, { copy: v })} />
            : <T label="Link" value={l.href} ph="https://..." onChange={(v) => up(i, { href: v })} />}
        </Item>
      ))}
      <div className="arow">
        {missing.map((k) => (
          <button key={k} className="btn"
            onClick={() => set({ links: [...c.links, { id: k, label: LINKS[k], ...(k === 'discord' ? { copy: '' } : { href: 'https://' }) }] })}>
            + {LINKS[k]}
          </button>
        ))}
      </div>
    </>
  )
}

const TABS = [['about', 'Sobre'], ['skills', 'Habilidades'], ['games', 'Jogos'], ['work', 'Trabalhos'], ['contact', 'Contato']]

/* ---------- painel ---------- */

export default function Admin({ content, dirty, setDraft, onPublished, onDiscard, onClose }) {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState('about')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (patch) => { setMsg(''); setDraft({ ...content, ...patch }) }
  const publish = async () => {
    setBusy(true); setMsg('')
    try {
      const { token } = await api('/auth/ip', { method: 'POST' })
      const r = await api('/content', { method: 'PUT', token, body: content })
      onPublished(r.content ? mergeContent(r.content) : content)
      setMsg(r.translated === false ? 'Publicado ✓ (sem tradução: falta ativar o Workers AI)' : 'Publicado ✓ (inglês traduzido)')
    } catch (e) {
      setMsg(`⚠ ${e.message}`)
    } finally { setBusy(false) }
  }
  const close = () => {
    if (dirty && !confirm('Descartar as alterações não publicadas?')) return
    onDiscard(); onClose()
  }

  if (!open) return <button className="btn primary adm-fab" onClick={() => setOpen(true)}>Admin{dirty ? ' •' : ''}</button>

  const props = { c: content, set }
  return (
    <aside className="fr adm-dock" aria-label="Painel de admin">
      <header className="adm-head">
        <div>
          <h4>Painel</h4>
          <span className={`adm-state${dirty ? ' dirty' : ''}`}>{dirty ? 'Alterações não publicadas' : 'Tudo publicado'}</span>
        </div>
        <div className="adm-hbtn">
          <button className="aico" title="Minimizar" aria-label="Minimizar" onClick={() => setOpen(false)}>–</button>
          <button className="aico" title="Fechar" aria-label="Fechar" onClick={close}>✕</button>
        </div>
      </header>
      <nav className="adm-tabs">
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </nav>
      <div className="adm-body">
        {tab === 'about' && <AboutTab {...props} />}
        {tab === 'skills' && <SkillsTab {...props} />}
        {tab === 'games' && <GamesTab {...props} />}
        {tab === 'work' && <WorkTab {...props} />}
        {tab === 'contact' && <ContactTab {...props} />}
      </div>
      <footer className="adm-foot">
        <span className="adm-msg">{msg || 'O site ao fundo já mostra o que você edita.'}</span>
        <div>
          <button className="btn" disabled={!dirty || busy} onClick={onDiscard}>Descartar</button>
          <button className="btn primary" disabled={!dirty || busy} onClick={publish}>{busy ? 'Publicando…' : 'Publicar'}</button>
        </div>
      </footer>
    </aside>
  )
}
