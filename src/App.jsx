import { Suspense, lazy, useContext, useEffect, useId, useRef, useState } from 'react'
import { PT_COUNTRIES, text } from './data.js'
import { API_URL } from './config.js'
import { ContentCtx, defaults, mergeContent, pick, safeUrl } from './content.js'
import { brand } from './icons.js'

const Admin = lazy(() => import('./Admin.jsx'))
const useC = () => useContext(ContentCtx)

/* ---------- Dados do Roblox: stats.json é gerado pelo GitHub Actions ---------- */

const useStats = () => {
  const [s, setS] = useState({ games: {}, avatar: null, history: {}, updated: null })
  useEffect(() => {
    let alive = true
    const load = () =>
      fetch(`${import.meta.env.BASE_URL}stats.json?t=${Date.now()}`)
        .then((r) => r.json())
        .then((j) => alive && setS({ games: j.games || {}, avatar: j.avatar || null, history: j.history || {}, updated: j.updated || null }))
        .catch(() => {})
    load()
    const t = setInterval(load, 60000)
    return () => { alive = false; clearInterval(t) }
  }, [])
  return s
}

const ui = {
  pt: { rating: 'Avaliação', dead: 'Sem jogadores agora' },
  en: { rating: 'Rating', dead: 'No players right now' },
}

const statIcons = {
  playing: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  visits: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  favorites: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  rating: 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z',
}

const MAIL = 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'

const skillIcons = {
  code: <path pathLength={1} d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12" />,
  server: <><rect pathLength={1} x="4" y="3" width="16" height="7" rx="2" /><rect pathLength={1} x="4" y="14" width="16" height="7" rx="2" /><path pathLength={1} d="M8 6.5h.01M8 17.5h.01" /></>,
  monitor: <><rect pathLength={1} x="3" y="4" width="18" height="12" rx="2" /><path pathLength={1} d="M8 20h8M12 16v4" /></>,
  gauge: <><path pathLength={1} d="M4 17a8 8 0 1 1 16 0" /><path pathLength={1} d="M12 17l4-5" /></>,
  network: <><circle pathLength={1} cx="12" cy="5" r="2" /><circle pathLength={1} cx="5" cy="19" r="2" /><circle pathLength={1} cx="19" cy="19" r="2" /><path pathLength={1} d="M12 7v5M12 12l-6 5M12 12l6 5" /></>,
  wrench: <path pathLength={1} d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
}

const renderCode = (s) =>
  s.split(/(`[^`]+`)/).map((p, i) => (p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : p))

/* ---------- Idioma: país do visitante, padrão inglês ---------- */

const saved = () => { try { return localStorage.getItem('lang') } catch { return null } }

const useLang = () => {
  const [lang, setLang] = useState(saved() || 'en')
  useEffect(() => {
    if (saved()) return
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 4000)
    fetch('https://get.geojs.io/v1/ip/country.json', { signal: ctrl.signal })
      .then((r) => r.json())
      .then((c) => setLang(PT_COUNTRIES.includes(c.country) ? 'pt' : 'en'))
      .catch(() => {})
      .finally(() => clearTimeout(timeout))
    return () => ctrl.abort()
  }, [])
  const choose = (l) => {
    setLang(l)
    try { localStorage.setItem('lang', l) } catch {}
  }
  return [lang, choose]
}

/* ---------- Fundo: partículas e brilho do cursor num único canvas (30 fps) ---------- */

const startParticles = (canvas) => {
  const ctx = canvas.getContext('2d')
  const m = { x: -999, y: -999, gx: -999, gy: -999 }
  let w, h, raf, last = 0
  const resize = () => { w = canvas.width = innerWidth; h = canvas.height = innerHeight }
  const move = (e) => { m.x = e.clientX; m.y = e.clientY }
  resize()
  const dots = Array.from({ length: 55 }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
  }))
  const frame = (now) => {
    raf = requestAnimationFrame(frame)
    if (now - last < 33 || document.hidden) return
    last = now
    ctx.clearRect(0, 0, w, h)
    m.gx += (m.x - m.gx) * 0.2
    m.gy += (m.y - m.gy) * 0.2
    const g = ctx.createRadialGradient(m.gx, m.gy, 0, m.gx, m.gy, 260)
    g.addColorStop(0, 'rgba(255,255,255,.1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    for (const d of dots) {
      d.x = (d.x + d.vx + w) % w
      d.y = (d.y + d.vy + h) % h
      ctx.fillStyle = 'rgba(255,255,255,.45)'
      ctx.fillRect(d.x, d.y, 2, 2)
      const dist = Math.hypot(d.x - m.gx, d.y - m.gy)
      if (dist < 170) {
        ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 170) * 0.5})`
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(m.gx, m.gy); ctx.stroke()
      }
    }
  }
  addEventListener('resize', resize)
  addEventListener('mousemove', move)
  raf = requestAnimationFrame(frame)
  return () => {
    cancelAnimationFrame(raf)
    removeEventListener('resize', resize)
    removeEventListener('mousemove', move)
  }
}

const Fx = () => {
  const ref = useRef(null)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    return startParticles(ref.current)
  }, [])
  return <canvas ref={ref} className="fx" />
}

/* ---------- Peças reutilizáveis ---------- */

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

const Counter = ({ value, short, dec = 0 }) => {
  const [shown, setShown] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current
    const t0 = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min((now - t0) / 1000, 1)
      setShown(Math.round((from + (value - from) * (1 - (1 - p) ** 3)) * 10 ** dec) / 10 ** dec)
      if (p < 1) raf = requestAnimationFrame(tick)
      else prev.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{short ? compact.format(shown) : shown.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}</>
}

// Fade in ao entrar na tela e fade out ao sair. Com `card`, o fade fica no próprio frame
// (o blur do fundo só funciona se o opacity estiver no mesmo elemento do backdrop-filter).
const R = ({ i = 0, card, className = '', children }) => {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    const io = new IntersectionObserver(
      ([e]) => el.classList.toggle('in', e.isIntersecting),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className={`r${card ? ' rc' : ''} ${className}`} style={{ '--i': i }}>{children}</div>
}

// Inclinação 3D + crescimento suaves: um laço rAF com interpolação, só transform (compositor)
const useTilt = (max = 8, grow = 1.045) => {
  const ref = useRef(null)
  const st = useRef({ x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1, raf: 0, on: false, r: null })
  const tick = () => {
    const o = st.current
    const el = ref.current
    if (!el) return
    o.x += (o.tx - o.x) * 0.16
    o.y += (o.ty - o.y) * 0.16
    o.s += (o.ts - o.s) * 0.16
    const idle = !o.on && Math.abs(o.x) + Math.abs(o.y) + Math.abs(o.s - 1) < 0.002
    el.style.transform = idle ? '' : `perspective(1000px) rotateX(${-o.y * max}deg) rotateY(${o.x * max}deg) scale(${o.s})`
    o.raf = idle ? 0 : requestAnimationFrame(tick)
  }
  const kick = () => { if (!st.current.raf) st.current.raf = requestAnimationFrame(tick) }
  const onMouseEnter = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const o = st.current
    o.r = ref.current.getBoundingClientRect()
    o.on = true
    o.ts = grow
    kick()
  }
  const onMouseMove = (e) => {
    const o = st.current
    if (!o.on) return
    const clamp = (v) => Math.max(-0.5, Math.min(0.5, v))
    o.tx = clamp((e.clientX - o.r.left) / o.r.width - 0.5)
    o.ty = clamp((e.clientY - o.r.top) / o.r.height - 0.5)
    ref.current.style.setProperty('--gx', `${(o.tx + 0.5) * 100}%`)
    ref.current.style.setProperty('--gy', `${(o.ty + 0.5) * 100}%`)
    kick()
  }
  const onMouseLeave = () => {
    const o = st.current
    o.tx = 0; o.ty = 0; o.ts = 1; o.on = false; o.r = null
    kick()
  }
  useEffect(() => () => cancelAnimationFrame(st.current.raf), [])
  return { ref, onMouseEnter, onMouseMove, onMouseLeave }
}

// Todo frame de conteúdo: fosco com blur, cresce e inclina no hover
const Card = ({ className = '', soft, children, ...rest }) => {
  const tilt = useTilt(soft ? 1.5 : 8, soft ? 1.015 : 1.045)
  return <article {...tilt} className={`fr card ${className}`} {...rest}>{children}</article>
}

const Section = ({ id, title, lead, children }) => (
  <section id={id} className="sec">
    <R><h3>{title}</h3>{lead && <p className="lead2">{lead}</p>}</R>
    {children}
  </section>
)

const Filters = ({ value, onChange, options }) => (
  <R>
    <div className="filters">
      {options.map(([k, label]) => (
        <button key={k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>{label}</button>
      ))}
    </div>
  </R>
)

/* ---------- Sobre ---------- */

const About = ({ t, lang }) => {
  const { about } = useC()
  return (
    <Section id="about" title={t.about.title}>
      <R card>
        <Card soft className="about">
          {(about[lang]?.length ? about[lang] : about.pt).map((p, i) => <p key={i}>{p}</p>)}
        </Card>
      </R>
    </Section>
  )
}

/* ---------- Árvore que acompanha a rolagem (Habilidades e Mais trabalhos) ---------- */

const anims = ['a-left', 'a-rise', 'a-pop', 'a-spin', 'a-right', 'a-flip']

const Tree = ({ children }) => {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    let raf = 0
    const update = () => {
      raf = 0
      const mid = innerHeight * 0.55
      const r = el.getBoundingClientRect()
      el.style.setProperty('--p', Math.max(0, Math.min(1, (mid - r.top) / r.height)).toFixed(4))
      el.querySelectorAll('.snode').forEach((n) => {
        const b = n.getBoundingClientRect()
        n.classList.toggle('lit', b.top + b.height / 2 < mid)
      })
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [])
  return <div ref={ref} className="tree"><div className="trunk" />{children}</div>
}

const TreeNode = ({ i, icon, children }) => (
  <div className={`snode ${i % 2 ? 'odd' : 'even'}`}>
    <R card className={`scell ${anims[i % anims.length]}`}>{children}</R>
    <div className="nd">{icon}</div>
  </div>
)

/* ---------- Habilidades ---------- */

const Skills = ({ t, lang }) => {
  const { skills } = useC()
  return (
    <Section id="skills" title={t.skills.title} lead={t.skills.lead}>
      <Tree>
        {skills.map((s, i) => (
          <TreeNode key={`${s.title}-${i}`} i={i}
            icon={<svg className={`sico i-${s.icon}`} viewBox="0 0 24 24" aria-hidden="true">{skillIcons[s.icon] || skillIcons.code}</svg>}>
            <Card className="scard">
              <h4>{s.title}</h4>
              <p>{renderCode(pick(s.desc, lang))}</p>
              <ul className="tags">{s.tags.map((g, k) => <li key={g} style={{ '--k': k }}>{g}</li>)}</ul>
            </Card>
          </TreeNode>
        ))}
      </Tree>
    </Section>
  )
}

/* ---------- Jogos ---------- */

const Stat = ({ k, label, value, short, pct, live }) => (
  <div className={`stat${live ? ' live' : ''}`}>
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d={statIcons[k]} /></svg>
    <dt>{label}</dt>
    <dd>{value == null ? '–' : <><Counter value={value} short={short} />{pct ? '%' : ''}</>}</dd>
  </div>
)

const GameCard = ({ g, d, t, lang }) => {
  const dead = d && d.playing === 0
  return (
    <Card className={`game${dead ? ' dead' : ''}${g.status === 'past' ? ' past' : ''}`} title={dead ? ui[lang].dead : undefined}>
      <div className="cover">
        {d?.icon ? <img src={d.icon} alt={g.name} /> : <b>{g.name[0]}</b>}
        <span className="badge role">{t.games[g.kind]}</span>
        {d && <span className="badge now"><i className="dot" /><Counter value={d.playing} /></span>}
      </div>
      <h4>{g.name}</h4>
      {(g.status === 'past' || g.tags?.length > 0) && (
        <ul className="tags">
          {g.status === 'past' && <li className="past-tag" style={{ '--k': 0 }}>{t.games.pastTag}</li>}
          {(g.tags || []).map((k, n) => <li key={k} style={{ '--k': n + 1 }}>{t.games.tags[k] || k}</li>)}
        </ul>
      )}
      {g.placeId && (
        <dl className="stats">
          <Stat k="playing" label={t.games.playing} value={d?.playing} live />
          <Stat k="visits" label={t.games.visits} value={d?.visits} short />
          <Stat k="favorites" label={t.games.favorites} value={d?.favorites} short />
          <Stat k="rating" label={ui[lang].rating} value={d?.rating} pct />
        </dl>
      )}
      {g.placeId
        ? <a className="btn primary" href={`https://www.roblox.com/games/${g.placeId}`} target="_blank" rel="noreferrer">▶ {t.games.play}</a>
        : <span className="btn off">{t.games.soon}</span>}
    </Card>
  )
}

const Games = ({ t, lang, stats }) => {
  const { games } = useC()
  const [f, setF] = useState('all')
  const match = (g, k) => k === 'all' || (k === 'past' ? g.status === 'past' : g.kind === k)
  const count = (k) => games.filter((g) => match(g, k)).length
  const keys = ['all', 'creator', 'contributor', ...(count('past') ? ['past'] : [])]
  return (
    <Section id="games" title={t.games.title} lead={t.games.lead}>
      <Filters value={keys.includes(f) ? f : 'all'} onChange={setF}
        options={keys.map((k) => [k, `${t.games[k]} ${count(k)}`])} />
      <div className="grid">
        {games.filter((g) => match(g, keys.includes(f) ? f : 'all')).map((g, i) => (
          <R key={g.name} i={i} card className="cell g">
            <GameCard g={g} d={stats.games[g.placeId]} t={t} lang={lang} />
          </R>
        ))}
      </div>
    </Section>
  )
}

/* ---------- Mais trabalhos ---------- */

const workIcons = {
  image: <><rect pathLength={1} x="3" y="4" width="18" height="16" rx="3" /><circle pathLength={1} cx="9" cy="10" r="1.6" /><path pathLength={1} d="M4 18l5-5 4 4 3-3 4 4" /></>,
  video: <><rect pathLength={1} x="3" y="5" width="18" height="14" rx="3" /><path pathLength={1} d="M10 9.5v5l4.5-2.5z" /></>,
}

const Work = ({ t, lang }) => {
  const { work } = useC()
  const items = work.filter((w) => w.src && (w.type === 'video' || w.type === 'image'))
  if (!items.length) return null
  return (
    <Section id="work" title={t.work.title} lead={t.work.lead}>
      <Tree>
        {items.map((w, i) => {
          const title = pick(w.title, lang)
          const desc = pick(w.desc, lang)
          return (
            <TreeNode key={`${w.id}-${i}`} i={i}
              icon={<svg className={`sico i-${w.type}`} viewBox="0 0 24 24" aria-hidden="true">{workIcons[w.type]}</svg>}>
              <Card className="scard wcard">
                <div className="stage">
                  {w.type === 'video'
                    ? <video src={safeUrl(w.src)} autoPlay loop muted playsInline />
                    : <img src={safeUrl(w.src)} alt={title} loading="lazy" />}
                </div>
                {w.tags?.length > 0 && <span className="role">{w.tags.map((k) => t.work.tags[k] || k).join(', ')}</span>}
                {title && <h4>{title}</h4>}
                {desc && <p>{desc}</p>}
              </Card>
            </TreeNode>
          )
        })}
      </Tree>
    </Section>
  )
}

/* ---------- Contato: ícones do mesmo tamanho; redireciona quando há link ---------- */

const Social = ({ l, t, i }) => {
  const [ok, setOk] = useState(false)
  const body = (
    <>
      <svg className="soc-ico" viewBox="0 0 24 24" aria-hidden="true"><path d={l.path} /></svg>
      <span>{ok ? t.contact.copied : l.label}</span>
    </>
  )
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(l.copy)
      setOk(true)
      setTimeout(() => setOk(false), 1800)
    } catch {}
  }
  return (
    <R i={i} card>
      {l.href
        ? <a className="fr soc" href={safeUrl(l.href)} target={l.href.startsWith('mailto') ? undefined : '_blank'} rel="noreferrer">{body}</a>
        : <button className="fr soc" onClick={copy} title={l.copy}>{body}</button>}
    </R>
  )
}

/* ---------- Estatísticas: um único card ao vivo ---------- */

// Junta o histórico de vários jogos somando os registros do mesmo horário
const merge = (lists) => {
  const m = new Map()
  lists.forEach((l) => l.forEach(([t, p, v, f]) => {
    const o = m.get(t) || [t, 0, 0, 0]
    o[1] += p; o[2] += v; o[3] += f
    m.set(t, o)
  }))
  return [...m.values()].sort((a, b) => a[0] - b[0])
}

const CW = 600, CH = 210, PL = 44, PR = 10, PT = 10, PB = 24

const AreaChart = ({ data, L, long, label, nowLabel }) => {
  const [h, setH] = useState(null)
  const gid = useId().replace(/:/g, '')
  const t0 = data[0][0]
  const t1 = data[data.length - 1][0]
  const ys = data.map((d) => d[1])
  const lo = Math.min(...ys)
  const hi = Math.max(...ys)
  const pad = (hi - lo) * 0.15 || Math.max(1, hi * 0.1)
  const y0 = Math.max(0, lo - pad)
  const y1 = hi + pad
  const X = (t) => PL + ((t - t0) / (t1 - t0 || 1)) * (CW - PL - PR)
  const Y = (v) => PT + (1 - (v - y0) / (y1 - y0 || 1)) * (CH - PT - PB)
  const line = data.map(([t, v], i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${Y(v).toFixed(1)}`).join('')
  const area = `${line}L${X(t1).toFixed(1)} ${CH - PB}L${X(t0).toFixed(1)} ${CH - PB}Z`
  const pk = data[ys.indexOf(hi)]
  const last = data[data.length - 1]
  const fmt = (t) => new Date(t).toLocaleString(L, long ? { month: 'short', day: 'numeric', hour: '2-digit' } : { hour: '2-digit', minute: '2-digit' })
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * CW
    const t = t0 + Math.max(0, Math.min(1, (px - PL) / (CW - PL - PR))) * (t1 - t0)
    let best = 0
    data.forEach((d, i) => { if (Math.abs(d[0] - t) < Math.abs(data[best][0] - t)) best = i })
    setH(best)
  }
  return (
    <div className="plot" onMouseLeave={() => setH(null)}>
      <svg viewBox={`0 0 ${CW} ${CH}`} onMouseMove={move}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".3" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => {
          const v = y0 + ((y1 - y0) * i) / 3
          return (
            <g key={i}>
              <line className="grid-l" x1={PL} x2={CW - PR} y1={Y(v)} y2={Y(v)} />
              <text className="axis" x={PL - 8} y={Y(v) + 4} textAnchor="end">{compact.format(Math.round(v))}</text>
            </g>
          )
        })}
        <path className="area" d={area} fill={`url(#${gid})`} />
        <path className="line-p" d={line} pathLength="1" />
        {[[t0, 'start'], [(t0 + t1) / 2, 'middle'], [t1, 'end']].map(([t, a]) => (
          <text key={a} className="axis" x={X(t)} y={CH - 6} textAnchor={a}>{fmt(t)}</text>
        ))}
        <circle className="peak-mark" cx={X(pk[0])} cy={Y(pk[1])} r="5" fill="none" stroke="#fff" strokeWidth="1.5" />
        <text className="axis peak-mark peak-txt" x={X(pk[0])} y={Math.max(PT + 10, Y(pk[1]) - 11)} textAnchor="middle">{compact.format(pk[1])}</text>
        <circle className="live-ring" cx={X(last[0])} cy={Y(last[1])} r="4.5" />
        <circle className="live-dot" cx={X(last[0])} cy={Y(last[1])} r="4.5" />
        {h != null && (
          <>
            <line className="cursor" x1={X(data[h][0])} x2={X(data[h][0])} y1={PT} y2={CH - PB} />
            <circle cx={X(data[h][0])} cy={Y(data[h][1])} r="4.5" fill="#fff" />
          </>
        )}
      </svg>
      {h != null && (
        <div className="tip" style={{ left: `${(X(data[h][0]) / CW) * 100}%`, top: `${(Y(data[h][1]) / CH) * 100}%` }}>
          <small>{fmt(data[h][0])}{h === data.length - 1 ? ` · ${nowLabel}` : ''}</small>{data[h][1].toLocaleString()} {label}
        </div>
      )}
    </div>
  )
}

// Enquanto há só um registro: batimento ao vivo com o número atual
const Heartbeat = ({ s, playing, count }) => (
  <div className="hbwrap">
    <svg className="hb" viewBox="0 0 300 60" aria-hidden="true">
      <path className="base" d="M0 30H80L96 30L104 12L114 48L122 22L130 30H300" pathLength="1" />
      <path className="beat" d="M0 30H80L96 30L104 12L114 48L122 22L130 30H300" pathLength="1" />
    </svg>
    <b className="hbnum"><Counter value={playing} /></b>
    <p className="hbtxt">{s.collecting}</p>
    <span className="hbtxt">{s.records.replace('{n}', count)}</span>
  </div>
)

const ranges = ['6h', '24h', '7d']

const Stats = ({ t, lang, rows, history = {}, updated }) => {
  const [sel, setSel] = useState('all')
  const [range, setRange] = useState('24h')
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])
  const s = t.stats
  const L = lang === 'pt' ? 'pt-BR' : 'en-US'
  if (!rows.length) {
    return (
      <Section id="stats" title={s.title} lead={s.lead}>
        <R><p className="lead2">{s.empty}</p></R>
      </Section>
    )
  }
  const picked = sel === 'all' ? rows : rows.filter((r) => String(r.g.placeId) === sel)
  const playing = picked.reduce((a, r) => a + (r.d.playing || 0), 0)
  const series = merge(picked.map((r) => history[r.g.placeId] || []))
  const end = series.length ? series[series.length - 1][0] : 0
  const hours = { '6h': 6, '24h': 24, '7d': 168 }[range]
  const view = series.filter((p) => p[0] >= end - hours * 36e5).map((p) => [p[0], p[1]])
  const vals = view.map((p) => p[1])
  const peak = vals.length ? Math.max(...vals) : playing
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : playing
  const mins = updated ? Math.max(0, Math.round((now - updated) / 6e4)) : null
  return (
    <Section id="stats" title={s.title} lead={s.lead}>
      {rows.length > 1 && (
        <Filters value={sel} onChange={setSel}
          options={[['all', s.all], ...rows.map((r) => [String(r.g.placeId), r.g.name])]} />
      )}
      <R card>
        <Card soft className="live-card">
          <div className="lhead">
            <div className="ltitle">
              <h4>{s.charts.players}</h4>
              <span className="badge-live">
                <i className="dot" />{s.live}
                {mins != null && ` · ${mins < 1 ? s.justNow : s.updated.replace('{n}', mins)}`}
              </span>
            </div>
            <div className="pills" style={{ '--x': ranges.indexOf(range) }}>
              {ranges.map((k) => (
                <button key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{s.ranges[k]}</button>
              ))}
            </div>
          </div>
          {view.length > 1
            ? <AreaChart key={`${sel}${range}`} data={view} L={L} long={range === '7d'} label={s.tip} nowLabel={s.now} />
            : <Heartbeat s={s} playing={playing} count={series.length} />}
          <div className="pstats">
            <span>{s.peak}<b><Counter value={peak} /></b></span>
            <span>{s.avg}<b><Counter value={avg} /></b></span>
            <span>{s.now}<b><Counter value={playing} /></b></span>
          </div>
        </Card>
      </R>
    </Section>
  )
}

/* ---------- Rodapé: idioma em menu suspenso, navegação e jogos populares ---------- */

const LangMenu = ({ lang, setLang }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const out = (e) => { if (!ref.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    addEventListener('mousedown', out)
    addEventListener('keydown', esc)
    return () => { removeEventListener('mousedown', out); removeEventListener('keydown', esc) }
  }, [open])
  const langs = [['en', 'English'], ['pt', 'Português']]
  return (
    <div className="lang" ref={ref}>
      <button className="fr lang-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
        {langs.find(([k]) => k === lang)[1]}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <ul className="fr lang-menu" role="listbox">
          {langs.map(([k, n]) => (
            <li key={k}>
              <button role="option" aria-selected={k === lang} className={k === lang ? 'on' : ''}
                onClick={() => { setLang(k); setOpen(false) }}>{n}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const Footer = ({ t, lang, setLang }) => (
  <footer className="foot">
    <div className="foot-base">
      <p>© {new Date().getFullYear()} Ayrez. {t.foot.rights}</p>
      <LangMenu lang={lang} setLang={setLang} />
    </div>
  </footer>
)

/* ---------- App ---------- */

// Conteúdo publicado no painel de admin (cai no padrão de data.js se a API não responder)
const useRemote = () => {
  const [remote, setRemote] = useState(defaults)
  useEffect(() => {
    if (!API_URL) return
    let alive = true
    const load = () =>
      fetch(`${API_URL}/content`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((j) => alive && setRemote(mergeContent(j)))
        .catch(() => {})
    load()
    const id = setInterval(load, 60000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  return [remote, setRemote]
}

// Só o seu IP vê o botão de edição (a API confere pelo IP que a Cloudflare enxerga)
const useIsAdmin = () => {
  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    if (!API_URL) return
    fetch(`${API_URL}/auth/me`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setAdmin(!!j.admin))
      .catch(() => {})
  }, [])
  return admin
}

const ids = ['home', 'about', 'skills', 'stats', 'games', 'work', 'contact']

const useActive = () => {
  const [a, setA] = useState('home')
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setA(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    )
    ids.forEach((id) => { const el = document.getElementById(id); el && io.observe(el) })
    return () => io.disconnect()
  }, [])
  return a
}

const useScrolled = () => {
  const [s, setS] = useState(false)
  useEffect(() => {
    const on = () => setS(scrollY > 40)
    on()
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [])
  return s
}

export default function App() {
  const [lang, setLang] = useLang()
  const t = text[lang]
  const stats = useStats()
  const [remote, setRemote] = useRemote()
  const [draft, setDraft] = useState(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const content = draft ?? remote
  const isAdmin = useIsAdmin()
  const active = useActive()
  const scrolled = useScrolled()
  const hasWork = content.work.some((w) => w.src)
  const rows = content.games.filter((g) => g.placeId && stats.games[g.placeId]).map((g) => ({ g, d: stats.games[g.placeId] }))
  const contacts = [
    ...content.links.map((l) => ({ ...l, path: brand[l.id] })),
    ...(content.email ? [{ id: 'mail', label: 'Email', href: `mailto:${content.email}`, path: MAIL }] : []),
  ]

  useEffect(() => { document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en' }, [lang])

  return (
    <ContentCtx.Provider value={content}>
      <Fx />
      <header className={`bar${scrolled ? ' scrolled' : ''}`}>
        <nav className="pill">
          {Object.keys(t.nav).filter((k) => k !== 'work' || hasWork).map((k) => (
            <a key={k} href={`#${k}`} className={active === k ? 'on' : ''}>{t.nav[k]}</a>
          ))}
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <p className="tag">{t.heroTag}</p>
          <h1><span className="grad">Ayrez</span></h1>
          <p className="lead">{t.lead}</p>
          <div className="cta">
            <a className="btn primary" href="#games">{t.view}</a>
            <a className="btn" href="#contact">{t.talk}</a>
          </div>
        </section>

        <About t={t} lang={lang} />
        <Skills t={t} lang={lang} />
        <Stats t={t} lang={lang} rows={rows} history={stats.history} updated={stats.updated} />
        <Games t={t} lang={lang} stats={stats} />
        <Work t={t} lang={lang} />

        <Section id="contact" title={t.contact.title} lead={t.contact.lead}>
          <div className="socs">
            {contacts.map((l, i) => <Social key={l.id} l={l} t={t} i={i} />)}
          </div>
        </Section>
      </main>

      <Footer t={t} lang={lang} setLang={setLang} />

      {isAdmin && !adminOpen && (
        <button className="adm-open" aria-label="Editar o site" title="Editar o site" onClick={() => setAdminOpen(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
        </button>
      )}

      {adminOpen && (
        <Suspense fallback={null}>
          <Admin content={content} dirty={draft !== null} setDraft={setDraft}
            onPublished={(c) => { setRemote(c); setDraft(null) }}
            onDiscard={() => setDraft(null)} onClose={() => setAdminOpen(false)} />
        </Suspense>
      )}
    </ContentCtx.Provider>
  )
}
