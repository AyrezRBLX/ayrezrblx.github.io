// Roda no servidor (GitHub Actions ou sua máquina), onde a API do Roblox não bloqueia.
// Gera public/stats.json com os números atuais e um histórico de 7 dias.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { games as defaultGames, USER_ID } from '../src/data.js'
import { API_URL } from '../src/config.js'

const get = (url) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${r.status} ${url}`)
    return r.json()
  })

const one = async (placeId) => {
  const { universeId } = await get(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`)
  const [g, icon, votes] = await Promise.all([
    get(`https://games.roblox.com/v1/games?universeIds=${universeId}`),
    get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`),
    get(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`),
  ])
  const { playing, visits, favoritedCount, created, updated, maxPlayers, genre } = g.data[0]
  const { upVotes, downVotes } = votes.data[0]
  const total = upVotes + downVotes
  return {
    playing, visits, favorites: favoritedCount,
    up: upVotes, down: downVotes,
    rating: total ? Math.round((upVotes / total) * 100) : null,
    icon: icon.data[0]?.imageUrl ?? null,
    created, updated, maxPlayers, genre,
  }
}

const settle = async (id) => {
  try { return [id, await one(id)] } catch (e) { console.warn(e.message); return [id, null] }
}

// Histórico: baixa o stats.json já publicado (ou o arquivo local) e acrescenta o ponto de agora
const readLocal = () => {
  try { return existsSync('public/stats.json') ? JSON.parse(readFileSync('public/stats.json', 'utf8')) : null } catch { return null }
}
const previous = async () => {
  const url = process.env.PREV_STATS_URL
  if (!url) return readLocal()
  return get(`${url}?t=${Date.now()}`).catch(() => readLocal())
}

const avatar = await get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${USER_ID}&size=420x420&format=Png&isCircular=false`)
  .then((j) => j.data[0].imageUrl)
  .catch(() => null)

// Jogos publicados no painel de admin (se a API estiver configurada); senão, os de data.js
const remote = API_URL ? await get(`${API_URL}/content`).catch(() => null) : null
const games = remote?.games ?? defaultGames
const entries = await Promise.all(games.filter((g) => g.placeId).map((g) => settle(g.placeId)))
const now = Date.now()
const WEEK = 7 * 864e5
const prevHistory = (await previous())?.history ?? {}

const gamesOut = Object.fromEntries(entries.filter(([, v]) => v))
const history = Object.fromEntries(
  entries.map(([id, g]) => [
    id,
    [...(prevHistory[id] ?? []), ...(g ? [[now, g.playing, g.visits, g.favorites]] : [])]
      .filter(([t]) => t > now - WEEK)
      .slice(-2100),
  ])
)

mkdirSync('public', { recursive: true })
writeFileSync('public/stats.json', JSON.stringify({ updated: now, avatar, games: gamesOut, history }))
console.log(`stats.json: ${Object.keys(gamesOut).length}/${entries.length} jogos`)
