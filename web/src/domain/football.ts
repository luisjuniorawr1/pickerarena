import type { Lineup, Player, PlayerMatchStats, Position } from './types'
import { BENCH_BUDGET, MAX_BENCH, STARTER_BUDGET, STARTER_COUNT } from './types'

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

function sumPrices(ids: string[], byId: Map<string, Player>): number {
  return ids.reduce((sum, id) => sum + (byId.get(id)?.price ?? 0), 0)
}

export function validateFootballLineup(
  lineup: Pick<Lineup, 'starters' | 'bench'>,
  players: Player[],
): ValidationResult {
  const errors: string[] = []
  const byId = new Map(players.map((p) => [p.id, p]))
  const { starters, bench } = lineup

  if (starters.length !== STARTER_COUNT) {
    errors.push(`Escolha exatamente ${STARTER_COUNT} titulares`)
  }
  if (bench.length > MAX_BENCH) {
    errors.push(`No máximo ${MAX_BENCH} reservas`)
  }

  const all = [...starters, ...bench]
  if (new Set(all).size !== all.length) {
    errors.push('Jogador duplicado na escalação')
  }

  for (const id of all) {
    if (!byId.has(id)) errors.push(`Jogador inválido: ${id}`)
  }

  const goalkeepers = all
    .map((id) => byId.get(id))
    .filter((p): p is Player => !!p && p.position === 'goleiro')

  if (goalkeepers.length > 1) {
    errors.push('No máximo 1 goleiro na escalação')
  }
  if (goalkeepers.length === 1 && !starters.includes(goalkeepers[0].id)) {
    errors.push('O goleiro deve estar entre os titulares')
  }

  const starterSpend = sumPrices(starters, byId)
  const benchSpend = sumPrices(bench, byId)
  if (starterSpend > STARTER_BUDGET) {
    errors.push(`Titulares: ${starterSpend}/${STARTER_BUDGET} créditos`)
  }
  if (benchSpend > BENCH_BUDGET) {
    errors.push(`Reservas: ${benchSpend}/${BENCH_BUDGET} créditos`)
  }

  return { ok: errors.length === 0, errors }
}

function goalPoints(position: Position): number {
  switch (position) {
    case 'goleiro':
    case 'zagueiro':
      return 6
    case 'meio':
      return 5
    case 'atacante':
      return 4
  }
}

export function scorePlayerStats(
  player: Player,
  stats: PlayerMatchStats,
): { total: number; breakdown: string[] } {
  const breakdown: string[] = []
  let total = 0

  const timeCycles = Math.floor(stats.minutes / 5)
  if (timeCycles > 0) {
    total += timeCycles
    breakdown.push(`${timeCycles}×5' (+${timeCycles})`)
  }

  if (stats.goals > 0) {
    const g = stats.goals * goalPoints(player.position)
    total += g
    breakdown.push(`${stats.goals} gol(s) (+${g})`)
  }

  if (stats.assists > 0) {
    const a = stats.assists * 3
    total += a
    breakdown.push(`${stats.assists} assistência(s) (+${a})`)
  }

  if (stats.yellowCards > 0) {
    total -= stats.yellowCards
    breakdown.push(`${stats.yellowCards} amarelo(s) (−${stats.yellowCards})`)
  }

  if (stats.redCards > 0) {
    const r = stats.redCards * 3
    total -= r
    breakdown.push(`${stats.redCards} vermelho(s) (−${r})`)
  }

  if (stats.ownGoals > 0) {
    const o = stats.ownGoals * 2
    total -= o
    breakdown.push(`${stats.ownGoals} gol(s) contra (−${o})`)
  }

  if (stats.penaltiesMissed > 0) {
    const p = stats.penaltiesMissed * 2
    total -= p
    breakdown.push(`${stats.penaltiesMissed} pênalti(s) perdido(s) (−${p})`)
  }

  if (stats.cleanSheet && stats.minutes >= 60) {
    if (player.position === 'goleiro' || player.position === 'zagueiro') {
      total += 4
      breakdown.push('clean sheet (+4)')
    } else if (player.position === 'meio') {
      total += 1
      breakdown.push('clean sheet (+1)')
    }
  }

  if (player.position === 'goleiro' || player.position === 'zagueiro') {
    const penalty = Math.floor(stats.goalsConceded / 2)
    if (penalty > 0) {
      total -= penalty
      breakdown.push(`gols sofridos (−${penalty})`)
    }
  }

  if (player.position === 'goleiro') {
    const saveBlocks = Math.floor(stats.saves / 3)
    if (saveBlocks > 0) {
      total += saveBlocks
      breakdown.push(`defesas (+${saveBlocks})`)
    }
    if (stats.penaltiesSaved > 0) {
      const ps = stats.penaltiesSaved * 5
      total += ps
      breakdown.push(`pênalti defendido (+${ps})`)
    }
  }

  if (player.position === 'zagueiro' || player.position === 'meio') {
    const tackleBlocks = Math.floor(stats.tackles / 3)
    if (tackleBlocks > 0) {
      total += tackleBlocks
      breakdown.push(`desarmes (+${tackleBlocks})`)
    }
  }

  return { total, breakdown }
}

export interface SlotResult {
  starterId: string
  benchId?: string
  coveredByBench: boolean
  starterPoints: number
  benchPoints: number
  slotPoints: number
  starterBreakdown: string[]
  benchBreakdown: string[]
}

/**
 * Bench covers a starter who exited for any reason (including never played).
 * Reserve must have played. GK starters are never covered by outfield bench.
 */
export function resolveLineupSlots(
  lineup: Pick<Lineup, 'starters' | 'bench'>,
  players: Player[],
  statsList: PlayerMatchStats[],
): SlotResult[] {
  const byId = new Map(players.map((p) => [p.id, p]))
  const statsById = new Map(statsList.map((s) => [s.playerId, s]))

  const emptyStats = (playerId: string): PlayerMatchStats => ({
    playerId,
    minutes: 0,
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
    exited: true,
    played: false,
  })

  const needsCover = (starterId: string): boolean => {
    const starter = byId.get(starterId)
    const stats = statsById.get(starterId) ?? emptyStats(starterId)
    if (starter?.position === 'goleiro') return false
    return !stats.played || stats.exited
  }

  const canCover = (benchId: string): boolean => {
    const stats = statsById.get(benchId) ?? emptyStats(benchId)
    return stats.played
  }

  let benchIndex = 0
  const results: SlotResult[] = []

  for (const starterId of lineup.starters) {
    const starter = byId.get(starterId)!
    const starterStats = statsById.get(starterId) ?? emptyStats(starterId)
    const starterScore = scorePlayerStats(starter, starterStats)

    let benchId: string | undefined
    let covered = false
    let benchPoints = 0
    let benchBreakdown: string[] = []

    if (needsCover(starterId)) {
      while (benchIndex < lineup.bench.length) {
        const candidate = lineup.bench[benchIndex]
        benchIndex += 1
        if (canCover(candidate)) {
          const benchPlayer = byId.get(candidate)!
          const benchStats = statsById.get(candidate) ?? emptyStats(candidate)
          const scored = scorePlayerStats(benchPlayer, benchStats)
          benchId = candidate
          covered = true
          benchPoints = scored.total
          benchBreakdown = scored.breakdown
          break
        }
      }
    }

    results.push({
      starterId,
      benchId,
      coveredByBench: covered,
      starterPoints: starterScore.total,
      benchPoints,
      slotPoints: starterScore.total + benchPoints,
      starterBreakdown: starterScore.breakdown,
      benchBreakdown,
    })
  }

  return results
}

export function totalLineupPoints(slots: SlotResult[]): number {
  return slots.reduce((sum, s) => sum + s.slotPoints, 0)
}
