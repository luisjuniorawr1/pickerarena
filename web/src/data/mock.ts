import type { FootballEvent, Player, PlayerMatchStats } from '../domain/types'

function p(
  id: string,
  name: string,
  teamId: string,
  teamName: string,
  position: Player['position'],
  price: Player['price'],
): Player {
  return { id, name, teamId, teamName, position, price }
}

const flamengo = 'fla'
const palmeiras = 'pal'

const playersFlaPal: Player[] = [
  p('fla-gk', 'Rossi', flamengo, 'Flamengo', 'goleiro', 5),
  p('fla-z1', 'Léo Pereira', flamengo, 'Flamengo', 'zagueiro', 5),
  p('fla-z2', 'Fabrício Bruno', flamengo, 'Flamengo', 'zagueiro', 3),
  p('fla-z3', 'Ayrton Lucas', flamengo, 'Flamengo', 'zagueiro', 3),
  p('fla-m1', 'Gerson', flamengo, 'Flamengo', 'meio', 7),
  p('fla-m2', 'Arrascaeta', flamengo, 'Flamengo', 'meio', 7),
  p('fla-m3', 'De la Cruz', flamengo, 'Flamengo', 'meio', 5),
  p('fla-m4', 'Pulgar', flamengo, 'Flamengo', 'meio', 3),
  p('fla-a1', 'Pedro', flamengo, 'Flamengo', 'atacante', 7),
  p('fla-a2', 'Gabriel', flamengo, 'Flamengo', 'atacante', 5),
  p('fla-a3', 'Everton Cebolinha', flamengo, 'Flamengo', 'atacante', 3),
  p('fla-a4', 'Carlinhos', flamengo, 'Flamengo', 'atacante', 1),

  p('pal-gk', 'Weverton', palmeiras, 'Palmeiras', 'goleiro', 5),
  p('pal-z1', 'Gustavo Gómez', palmeiras, 'Palmeiras', 'zagueiro', 5),
  p('pal-z2', 'Murilo', palmeiras, 'Palmeiras', 'zagueiro', 3),
  p('pal-z3', 'Piquerez', palmeiras, 'Palmeiras', 'zagueiro', 3),
  p('pal-m1', 'Raphael Veiga', palmeiras, 'Palmeiras', 'meio', 7),
  p('pal-m2', 'Zé Rafael', palmeiras, 'Palmeiras', 'meio', 5),
  p('pal-m3', 'Richard Ríos', palmeiras, 'Palmeiras', 'meio', 3),
  p('pal-m4', 'Aníbal Moreno', palmeiras, 'Palmeiras', 'meio', 3),
  p('pal-a1', 'Endrick', palmeiras, 'Palmeiras', 'atacante', 7),
  p('pal-a2', 'Estêvão', palmeiras, 'Palmeiras', 'atacante', 5),
  p('pal-a3', 'Rony', palmeiras, 'Palmeiras', 'atacante', 3),
  p('pal-a4', 'Lázaro', palmeiras, 'Palmeiras', 'atacante', 1),
]

function stats(
  playerId: string,
  partial: Partial<PlayerMatchStats> & Pick<PlayerMatchStats, 'minutes' | 'played' | 'exited'>,
): PlayerMatchStats {
  return {
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    ownGoals: 0,
    penaltiesMissed: 0,
    penaltiesSaved: 0,
    saves: 0,
    tackles: 0,
    goalsConceded: 0,
    cleanSheet: false,
    ...partial,
    playerId,
  }
}

/** Evento aberto — deadline daqui a ~2 dias */
const openStarts = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()

/** Evento já pontuado — ontem */
const scoredStarts = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

const scoredStats: PlayerMatchStats[] = [
  stats('fla-gk', { minutes: 90, played: true, exited: false, saves: 4, goalsConceded: 1 }),
  stats('fla-z1', { minutes: 90, played: true, exited: false, tackles: 4, goalsConceded: 1 }),
  stats('fla-z2', { minutes: 70, played: true, exited: true, tackles: 3, goalsConceded: 1 }),
  stats('fla-z3', { minutes: 20, played: true, exited: false, tackles: 1, goalsConceded: 0 }),
  stats('fla-m1', { minutes: 90, played: true, exited: false, assists: 1, tackles: 3 }),
  stats('fla-m2', { minutes: 85, played: true, exited: true, goals: 1, tackles: 1 }),
  stats('fla-m3', { minutes: 0, played: false, exited: true }),
  stats('fla-m4', { minutes: 90, played: true, exited: false, yellowCards: 1, tackles: 6 }),
  stats('fla-a1', { minutes: 90, played: true, exited: false, goals: 2 }),
  stats('fla-a2', { minutes: 60, played: true, exited: true, assists: 1 }),
  stats('fla-a3', { minutes: 30, played: true, exited: false }),
  stats('fla-a4', { minutes: 0, played: false, exited: true }),

  stats('pal-gk', {
    minutes: 90,
    played: true,
    exited: false,
    saves: 6,
    goalsConceded: 2,
    cleanSheet: false,
  }),
  stats('pal-z1', { minutes: 90, played: true, exited: false, tackles: 5, goalsConceded: 2 }),
  stats('pal-z2', { minutes: 90, played: true, exited: false, tackles: 2, goalsConceded: 2 }),
  stats('pal-z3', { minutes: 75, played: true, exited: true, tackles: 3, goalsConceded: 2 }),
  stats('pal-m1', { minutes: 90, played: true, exited: false, goals: 1, assists: 1, tackles: 2 }),
  stats('pal-m2', { minutes: 0, played: false, exited: true }),
  stats('pal-m3', { minutes: 90, played: true, exited: false, tackles: 4 }),
  stats('pal-m4', { minutes: 45, played: true, exited: true, yellowCards: 1 }),
  stats('pal-a1', { minutes: 80, played: true, exited: true, goals: 1 }),
  stats('pal-a2', { minutes: 90, played: true, exited: false, assists: 1 }),
  stats('pal-a3', { minutes: 15, played: true, exited: false }),
  stats('pal-a4', { minutes: 0, played: false, exited: true }),
]

export const mockEvents: FootballEvent[] = [
  {
    id: 'evt-br-fla-pal-open',
    sport: 'football',
    competition: 'Brasileirão',
    homeTeam: 'Flamengo',
    awayTeam: 'Palmeiras',
    startsAt: openStarts,
    status: 'open',
    players: playersFlaPal,
  },
  {
    id: 'evt-br-fla-pal-scored',
    sport: 'football',
    competition: 'Brasileirão',
    homeTeam: 'Flamengo',
    awayTeam: 'Palmeiras',
    startsAt: scoredStarts,
    status: 'scored',
    players: playersFlaPal,
    stats: scoredStats,
  },
]

export const mockRankingSeed = [
  { userId: 'demo-maria', displayName: 'Maria', points: 42 },
  { userId: 'demo-joao', displayName: 'João', points: 38 },
  { userId: 'demo-ana', displayName: 'Ana', points: 31 },
]
