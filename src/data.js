/* ===== Seu conteúdo: edite só este arquivo ===== */

export const HANDLE = 'ayrezrblx'
export const USER_ID = 290639979
export const DISCORD = 'ayrezrblx'
export const EMAIL = '' // coloque seu e-mail aqui e um botão de e-mail aparece

// Países que abrem o site em português; os demais abrem em inglês
export const PT_COUNTRIES = ['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL']

// Quem tem href abre o link; o Discord copia o usuário
export const links = [
  { id: 'discord', label: 'Discord', copy: DISCORD },
  { id: 'roblox', label: 'Roblox', href: 'https://www.roblox.com/users/290639979/profile' },
  { id: 'github', label: 'GitHub', href: `https://github.com/${HANDLE}` },
  { id: 'x', label: 'Twitter', href: `https://x.com/${HANDLE}` },
]

// kind: 'creator' | 'contributor'. status: 'active' (trabalho agora) | 'past' (já trabalhei).
// tags: Full-Stack, Long-Term, Short-Term... placeId: null = "Em breve" (sem botão de jogar)
export const games = [
  { placeId: 9285238704, name: 'Race Clicker', kind: 'contributor', status: 'active', tags: [] },
  { placeId: null, name: 'My Fish', kind: 'creator', status: 'active', tags: [] },
  { placeId: null, name: 'Clicker Simulator 2', kind: 'creator', status: 'active', tags: [] },
]

// Vídeos e imagens: coloque o arquivo em public/media/ e descomente um exemplo.
export const work = [
  // { id: 'arena', type: 'video', src: '/media/arena.mp4', tags: ['Systems'],
  //   title: { pt: 'Combate em arena', en: 'Arena combat' }, desc: { pt: 'Descrição', en: 'Description' } },
  // { id: 'hud', type: 'image', src: '/media/hud.png', tags: ['UI'] },
]

// icon: code | server | monitor | gauge | network | wrench. Use `crases` para destacar código.
export const skillList = [
  {
    icon: 'code', title: 'Luau & Software Engineering',
    desc: {
      pt: 'Código limpo, tipagem estrita (`--!strict`), modularização, abstração e sistemas reutilizáveis.',
      en: 'Clean code, strict typing (`--!strict`), modularization, abstraction and reusable systems.',
    },
    tags: ['Luau', 'Strict Typing', 'Clean Code'],
  },
  {
    icon: 'server', title: 'Backend & Game Systems',
    desc: {
      pt: 'Lógica de servidor, gerenciamento de dados, progressão, economia, quests e sistemas de recompensas.',
      en: 'Server logic, data management, progression, economy, quests and reward systems.',
    },
    tags: ['Server Architecture', 'Data Management', 'Gameplay Systems'],
  },
  {
    icon: 'monitor', title: 'Frontend & UI Development',
    desc: {
      pt: 'Interfaces interativas, atualização reativa da UI, animações, feedback visual e integração entre interface e sistemas de jogo.',
      en: 'Interactive interfaces, reactive UI updates, animations, visual feedback and integration between interface and game systems.',
    },
    tags: ['Roblox UI', 'Fusion', 'UI Architecture'],
  },
  {
    icon: 'gauge', title: 'Performance & Optimization',
    desc: {
      pt: 'Otimização de loops, estruturas de dados, gerenciamento de memória e redução de trabalho desnecessário em runtime.',
      en: 'Loop optimization, data structures, memory management and less unnecessary work at runtime.',
    },
    tags: ['Profiling', 'Memory Management', 'Optimization'],
  },
  {
    icon: 'network', title: 'Client-Server Architecture',
    desc: {
      pt: 'Comunicação entre cliente e servidor, RemoteEvents, RemoteFunctions, validação de dados e separação de responsabilidades.',
      en: 'Client-server communication, RemoteEvents, RemoteFunctions, data validation and separation of concerns.',
    },
    tags: ['Networking', 'Replication', 'Security'],
  },
  {
    icon: 'wrench', title: 'Codebase Maintenance & Refactoring',
    desc: {
      pt: 'Melhoria de sistemas existentes, identificação de redundâncias, organização de módulos e evolução de código legado.',
      en: 'Improving existing systems, spotting redundancy, organizing modules and evolving legacy code.',
    },
    tags: ['Refactoring', 'Debugging', 'Maintainability'],
  },
]

export const text = {
  pt: {
    nav: { home: 'Início', about: 'Sobre', skills: 'Habilidades', stats: 'Estatísticas', games: 'Jogos', work: 'Trabalhos', contact: 'Contato' },
    heroTag: 'Programador Roblox Full-Stack',
    lead: 'Programo em Lua há 8 anos. Sistemas sólidos por baixo, interfaces animadas por cima, para jogos que o jogador quer abrir de novo.',
    view: 'Ver jogos',
    talk: 'Falar comigo',
    playing: 'Jogando agora',
    visits: 'Visitas',
    about: {
      title: 'Sobre mim',
      paragraphs: [
        'Sou programador Roblox Full-Stack e, ao longo dos anos, venho aprimorando minhas habilidades no desenvolvimento de jogos, trabalhando tanto no backend quanto no frontend. Tenho experiência com Luau, criação de sistemas de jogo, interfaces, lógica de gameplay, otimização e organização de código.',
        'Gosto de desenvolver sistemas bem estruturados, reutilizáveis e eficientes, sempre buscando soluções que façam sentido a longo prazo. Estou constantemente estudando, aprendendo novas técnicas e melhorando a qualidade do meu trabalho.',
        'Tenho facilidade para entender sistemas existentes, trabalhar em projetos já em andamento e desenvolver funcionalidades do zero. Meu foco é escrever código limpo, confiável e fácil de manter, contribuindo para que os projetos evoluam com uma boa base técnica.',
        'Estou aberto a novos projetos, comissões e oportunidades de trabalho full-time como programador Roblox.',
      ],
    },
    skills: { title: 'Habilidades', lead: 'O que eu levo para cada projeto.' },
    stats: {
      title: 'Estatísticas',
      lead: 'Jogadores simultâneos em tempo real e o histórico dos últimos dias.',
      all: 'Todos os jogos',
      ranges: { '6h': '6h', '24h': '24h', '7d': '7 dias' },
      charts: { players: 'Jogadores ao longo do tempo' },
      live: 'Ao vivo', updated: 'atualizado há {n} min', justNow: 'atualizado agora',
      peak: 'Pico', avg: 'Média', now: 'Agora', tip: 'jogadores',
      collecting: 'Coletando dados. O gráfico aparece assim que houver mais de um registro, a cada ~5 minutos.',
      records: 'Registros até agora: {n}',
      empty: 'Os números aparecem assim que os dados do Roblox carregarem.',
    },
    games: {
      title: 'Jogos',
      lead: 'Jogos em que trabalho. Os números são atualizados ao vivo.',
      all: 'Todos', creator: 'Criador', contributor: 'Colaborador', past: 'Anteriores', pastTag: 'Já trabalhei',
      tags: { 'Full-Stack': 'Full-Stack', 'Long-Term': 'Longo prazo', 'Short-Term': 'Curto prazo' },
      play: 'Jogar', soon: 'Em breve', playing: 'Jogando agora', visits: 'Visitas', favorites: 'Favoritos',
    },
    work: {
      title: 'Mais trabalhos',
      lead: 'Sistemas e interfaces que já desenvolvi.',
      all: 'Todos',
      tags: { Systems: 'Sistemas', UI: 'UI', VFX: 'VFX' },
    },
    contact: {
      title: 'Contato',
      lead: 'Quer conversar ou propor um projeto? Me chame.',
      copied: 'Copiado ✓',
    },
    foot: {
      tagline: 'Programador Roblox criando sistemas de gameplay e interfaces.',
      taglineTotal: 'Programador Roblox criando sistemas de gameplay e interfaces. Os jogos em que trabalhei passaram de {n} visitas.',
      nav: 'Navegação', popular: 'Jogos populares', rights: 'Todos os direitos reservados.',
    },
  },
  en: {
    nav: { home: 'Home', about: 'About', skills: 'Skills', stats: 'Stats', games: 'Games', work: 'Work', contact: 'Contact' },
    heroTag: 'Full-Stack Roblox Developer',
    lead: 'I have been coding in Lua for 8 years. Solid systems underneath, animated interfaces on top, for games players want to open again.',
    view: 'View games',
    talk: 'Get in touch',
    playing: 'Playing now',
    visits: 'Visits',
    about: {
      title: 'About me',
      paragraphs: [
        "I'm a Full-Stack Roblox programmer and, over the years, I've been sharpening my game development skills, working on both the backend and the frontend. I have experience with Luau, building game systems, interfaces, gameplay logic, optimization and code organization.",
        'I enjoy building well-structured, reusable and efficient systems, always looking for solutions that make sense in the long run. I am constantly studying, learning new techniques and improving the quality of my work.',
        'I find it easy to understand existing systems, work on projects already in progress and build features from scratch. My focus is writing clean, reliable and easy-to-maintain code, helping projects evolve on a solid technical foundation.',
        "I'm open to new projects, commissions and full-time opportunities as a Roblox programmer.",
      ],
    },
    skills: { title: 'Skills', lead: 'What I bring to every project.' },
    stats: {
      title: 'Stats',
      lead: 'Concurrent players in real time and the history of the last few days.',
      all: 'All games',
      ranges: { '6h': '6h', '24h': '24h', '7d': '7 days' },
      charts: { players: 'Players over time' },
      live: 'Live', updated: 'updated {n} min ago', justNow: 'updated just now',
      peak: 'Peak', avg: 'Average', now: 'Now', tip: 'players',
      collecting: 'Collecting data. The chart appears as soon as there is more than one record, about every 5 minutes.',
      records: 'Records so far: {n}',
      empty: 'The numbers show up as soon as the Roblox data loads.',
    },
    games: {
      title: 'Games',
      lead: 'Games I work on. The numbers update live.',
      all: 'All', creator: 'Creator', contributor: 'Contributor', past: 'Past', pastTag: 'Past project',
      tags: { 'Full-Stack': 'Full-Stack', 'Long-Term': 'Long-term', 'Short-Term': 'Short-term' },
      play: 'Play', soon: 'Coming soon', playing: 'Playing now', visits: 'Visits', favorites: 'Favorites',
    },
    work: {
      title: 'More work',
      lead: 'Systems and interfaces I have built.',
      all: 'All',
      tags: { Systems: 'Systems', UI: 'UI', VFX: 'VFX' },
    },
    contact: {
      title: 'Contact',
      lead: 'Want to chat or propose a project? Reach out.',
      copied: 'Copied ✓',
    },
    foot: {
      tagline: 'Roblox developer building gameplay systems and interfaces.',
      taglineTotal: "Roblox developer building gameplay systems and interfaces. Games I've worked on have passed {n} visits.",
      nav: 'Navigation', popular: 'Popular games', rights: 'All rights reserved.',
    },
  },
}
