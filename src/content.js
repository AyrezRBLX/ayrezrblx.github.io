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

export const mergeContent = (remote) => ({
  ...defaults,
  ...Object.fromEntries(Object.entries(remote || {}).filter(([k]) => k in defaults)),
})

// Só deixa passar links http(s), mailto e caminhos do próprio site
export const safeUrl = (u) => (/^(https?:\/\/|mailto:|\/)/i.test(u || '') ? u : '#')
