import { useState } from 'react'
import { API_URL } from './config.js'

/* ---------- API ---------- */

const api = (path, { method = 'GET', body, token } = {}) =>
  fetch(`${API_URL}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => {
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || `Erro ${r.status}`)
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

// Atualiza uma língua e mantém a outra (cria os dois campos se ainda não existirem)
const withKey = (value, k, v) => ({ pt: '', en: '', ...value, [k]: v })

// Campo em português e inglês
const P = ({ label, value, onChange, area }) => (
  <div className="apair">
    <T label={`${label} · PT`} area={area} value={value?.pt} onChange={(v) => onChange(withKey(value, 'pt', v))} />
    <T label={`${label} · EN`} area={area} value={value?.en} onChange={(v) => onChange(withKey(value, 'en', v))} />
  </div>
)

const Tags = ({ value, onChange }) => {
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
  <>
    {['pt', 'en'].map((l) => (
      <section key={l} className="asec">
        <h5>{l === 'pt' ? 'Português' : 'English'}</h5>
        {c.about[l].map((p, i) => (
          <div key={i} className="arow">
            <textarea rows={5} value={p} onChange={(e) => set({ about: { ...c.about, [l]: upd(c.about[l], i, e.target.value) } })} />
            <button className="aico" aria-label="Remover" onClick={() => set({ about: { ...c.about, [l]: del(c.about[l], i) } })}>✕</button>
          </div>
        ))}
        <button className="btn" onClick={() => set({ about: { ...c.about, [l]: [...c.about[l], ''] } })}>+ Parágrafo</button>
      </section>
    ))}
  </>
)

const ICONS = ['code', 'server', 'monitor', 'gauge', 'network', 'wrench']

const SkillsTab = ({ c, set }) => {
  const up = (i, patch) => set({ skills: upd(c.skills, i, { ...c.skills[i], ...patch }) })
  return (
    <>
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

const GamesTab = ({ c, set }) => {
  const up = (i, patch) => set({ games: upd(c.games, i, { ...c.games[i], ...patch }) })
  return (
    <>
      {c.games.map((g, i) => (
        <Item key={i} i={i} n={c.games.length} title={g.name}
          onMove={(d) => set({ games: move(c.games, i, d) })} onDel={() => set({ games: del(c.games, i) })}>
          <T label="Nome" value={g.name} onChange={(v) => up(i, { name: v })} />
          <T label="ID do jogo (roblox.com/games/ID). Vazio = Em breve" value={g.placeId ?? ''} ph="9285238704"
            onChange={(v) => up(i, { placeId: v.replace(/\D/g, '') === '' ? null : Number(v.replace(/\D/g, '')) })} />
          <label className="af">
            <span>Seu papel</span>
            <select value={g.kind} onChange={(e) => up(i, { kind: e.target.value })}>
              <option value="creator">Criador</option>
              <option value="contributor">Colaborador</option>
            </select>
          </label>
          <P label="Descrição" area value={g.desc} onChange={(v) => up(i, { desc: v })} />
        </Item>
      ))}
      <button className="btn" onClick={() => set({ games: [...c.games, { placeId: null, name: 'Novo jogo', kind: 'creator', desc: { pt: '', en: '' } }] })}>+ Jogo</button>
    </>
  )
}

const WorkTab = ({ c, set }) => {
  const up = (i, patch) => set({ work: upd(c.work, i, { ...c.work[i], ...patch }) })
  const label = (w) => w.title?.pt || (w.type === 'video' ? 'Vídeo' : w.id === 'wheel' ? 'Demo: roleta de prêmios' : 'Demo: barra de quest')
  return (
    <>
      {c.work.map((w, i) => (
        <Item key={i} i={i} n={c.work.length} title={label(w)}
          onMove={(d) => set({ work: move(c.work, i, d) })} onDel={() => set({ work: del(c.work, i) })}>
          {w.type === 'video'
            ? <T label="Link do vídeo (.mp4)" value={w.src} ph="https://..." onChange={(v) => up(i, { src: v })} />
            : (
              <label className="af">
                <span>Demo</span>
                <select value={w.id} onChange={(e) => up(i, { id: e.target.value })}>
                  <option value="quest">Barra de quest</option>
                  <option value="wheel">Roleta de prêmios</option>
                </select>
              </label>
            )}
          <div className="af"><span>Tags (UI, Systems, VFX)</span><Tags value={w.tags} onChange={(v) => up(i, { tags: v })} /></div>
          <P label={w.type === 'video' ? 'Título' : 'Título (opcional)'} value={w.title} onChange={(v) => up(i, { title: v, desc: w.desc ?? { pt: '', en: '' } })} />
          <P label={w.type === 'video' ? 'Descrição' : 'Descrição (opcional)'} area value={w.desc} onChange={(v) => up(i, { desc: v, title: w.title ?? { pt: '', en: '' } })} />
        </Item>
      ))}
      <div className="arow">
        <button className="btn" onClick={() => set({ work: [...c.work, { id: 'quest', type: 'demo', tags: ['UI'] }] })}>+ Demo</button>
        <button className="btn" onClick={() => set({ work: [...c.work, { id: `v${Date.now().toString(36)}`, type: 'video', src: '', tags: [], title: { pt: '', en: '' }, desc: { pt: '', en: '' } }] })}>+ Vídeo</button>
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
      await api('/content', { method: 'PUT', token, body: content })
      onPublished(content)
      setMsg('Publicado ✓')
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
