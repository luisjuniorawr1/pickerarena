import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { mockEvents, mockRankingSeed } from '../data/mock'
import { resolveLineupSlots, totalLineupPoints } from '../domain/football'
import type { Lineup } from '../domain/types'
import { loadUserLineups } from '../lib/lineupRepository'

const currentCycle = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())

export function RankingPage() {
  const { user, loading } = useAuth()
  const [lineups, setLineups] = useState<Lineup[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!user) {
      setLineups([])
      return
    }

    let cancelled = false
    setSyncing(true)
    loadUserLineups(user.id)
      .then((items) => {
        if (!cancelled) setLineups(items)
      })
      .catch((error) => console.error('Não foi possível carregar o ranking.', error))
      .finally(() => {
        if (!cancelled) setSyncing(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const myPoints = useMemo(() => {
    let points = 0
    for (const lineup of lineups) {
      const event = mockEvents.find((item) => item.id === lineup.eventId)
      if (!event?.stats || event.status !== 'scored') continue
      points += totalLineupPoints(resolveLineupSlots(lineup, event.players, event.stats))
    }
    return points
  }, [lineups])

  if (loading) return <p className="page">Carregando ranking...</p>
  if (!user) return <Navigate to="/login" replace />

  const rows = [
    ...mockRankingSeed,
    { userId: user.id, displayName: user.displayName, points: myPoints },
  ].sort((a, b) => b.points - a.points)

  return (
    <section className="page ranking-page">
      <header className="page-head ranking-head">
        <div>
          <p className="eyebrow">Temporada mensal</p>
          <h1>Ranking de {currentCycle}</h1>
          <p>Seu desempenho em todos os eventos do ciclo.</p>
        </div>
        <div className="ranking-summary">
          <span>Sua pontuação</span>
          <strong>{syncing ? '...' : myPoints}</strong>
          <small>pontos no mês</small>
        </div>
      </header>
      <div className="ranking-tabs">
        <button type="button" className="is-active">Geral</button>
        <button type="button" disabled>Amigos</button>
      </div>
      <div className="prize-banner">
        <span aria-hidden="true">◆</span>
        <div>
          <strong>Conquistas mensais</strong>
          <small>Os melhores colocados recebem medalhas e XP virtuais, sem valor em dinheiro.</small>
        </div>
      </div>
      <ol className="ranking">
        {rows.map((row, index) => (
          <li key={row.userId} className={row.userId === user.id ? 'is-you' : ''}>
            <span className={`rank rank--${index + 1}`}>{index + 1}</span>
            <span className="ranking-avatar">{row.displayName.slice(0, 1).toUpperCase()}</span>
            <span className="who">
              <strong>{row.displayName}</strong>
              <small>{row.userId === user.id ? 'Você' : index < 3 ? 'Pódio do ciclo' : 'Em disputa'}</small>
            </span>
            <span className="pts">{row.points} <small>pts</small></span>
          </li>
        ))}
      </ol>
    </section>
  )
}
