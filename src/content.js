import { createContext } from 'react'
import { EMAIL, games, links, skillList, text, work } from './data.js'

export const ContentCtx = createContext(null)

// Conteúdo padrão (o de src/data.js). O que você publica no painel sobrescreve isso.
export const defaults = {
  about: { pt: text.pt.about.paragraphs, en: text.en.about.paragraphs },
  skills: skillList,
  games,
  work,
  links,
  email: EMAIL,
}

export const mergeContent = (remote) => {
  const c = {
    ...defaults,
    ...Object.fromEntries(Object.entries(remote || {}).filter(([k]) => k in defaults)),
  }
  // Só vídeo e imagem (demos antigas salvas no painel são ignoradas)
  return { ...c, work: (c.work || []).filter((w) => w.type === 'video' || w.type === 'image') }
}

// Texto na língua do visitante; se a tradução ainda não existe, cai no português
export const pick = (v, lang) => v?.[lang] || v?.pt || ''

// Só deixa passar links http(s), mailto e caminhos do próprio site
export const safeUrl = (u) => (/^(https?:\/\/|mailto:|\/)/i.test(u || '') ? u : '#')
