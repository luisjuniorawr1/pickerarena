export type Position = 'goleiro' | 'zagueiro' | 'meio' | 'atacante'
export type PlayerPrice = 7 | 5 | 3 | 1
export type EventStatus = 'open' | 'locked' | 'scored' | 'void'

export interface Player {
  id: string
  name: string
  teamId: string
  teamName: string
  position: Position
  price: PlayerPrice
}

export interface PlayerMatchStats {
  playerId: string
  minutes: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  ownGoals: number
  penaltiesMissed: number
  penaltiesSaved: number
  saves: number
  tackles: number
  goalsConceded: number
  cleanSheet: boolean
  /** true if left the pitch for any reason before full time while having entered, or never entered */
  exited: boolean
  played: boolean
}

export interface FootballEvent {
  id: string
  sport: 'football'
  competition: string
  homeTeam: string
  awayTeam: string
  startsAt: string
  status: EventStatus
  players: Player[]
  stats?: PlayerMatchStats[]
}

export interface Lineup {
  eventId: string
  userId: string
  starters: string[]
  bench: string[]
  submittedAt: string
  scoringVersion: 'football-v1'
}

export const STARTER_BUDGET = 16
export const BENCH_BUDGET = 6
export const STARTER_COUNT = 4
export const MAX_BENCH = 2
export const SCORING_VERSION = 'football-v1' as const
