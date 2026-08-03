import type { Lineup } from '../domain/types'

const USER_KEY = 'pa_user'
const LINEUPS_KEY = 'pa_lineups'

export interface SessionUser {
  id: string
  displayName: string
}

export function getUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function login(displayName: string): SessionUser {
  const trimmed = displayName.trim()
  const user: SessionUser = {
    id: `u-${trimmed.toLowerCase().replace(/\s+/g, '-')}`,
    displayName: trimmed,
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}

export function logout(): void {
  localStorage.removeItem(USER_KEY)
}

export function getLineups(): Lineup[] {
  const raw = localStorage.getItem(LINEUPS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Lineup[]
  } catch {
    return []
  }
}

export function saveLineup(lineup: Lineup): void {
  const all = getLineups().filter(
    (l) => !(l.eventId === lineup.eventId && l.userId === lineup.userId),
  )
  all.push(lineup)
  localStorage.setItem(LINEUPS_KEY, JSON.stringify(all))
}

export function getUserLineup(eventId: string, userId: string): Lineup | null {
  return getLineups().find((l) => l.eventId === eventId && l.userId === userId) ?? null
}
