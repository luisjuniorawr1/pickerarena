import { Navigate } from 'react-router-dom'
import { mockEvents, mockRankingSeed } from '../data/mock'
import { resolveLineupSlots, totalLineupPoints } from '../domain/football'
import { getLineups, getUser } from '../lib/storage'

export function RankingPage() {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />

  const lineups = getLineups().filter((l) => l.userId === user.id)
  let myPoints = 0
  for (const lineup of lineups) {
    const event = mockEvents.find((e) => e.id === lineup.eventId)
    if (!event?.stats || event.status !== 'scored') continue
    myPoints += totalLineupPoints(resolveLineupSlots(lineup, event.players, event.stats))
  }

  const rows = [
    ...mockRankingSeed,
    { userId: user.id, displayName: user.displayName, points: myPoints },
  ].sort((a, b) => b.points - a.points)

  return (
    <section className="page ranking-page">
      <header className="page-head ranking-head">
        <div>
          <p className="eyebrow">Temporada mensal</p>
          <h1>Ranking de julho</h1>
          <p>Seu desempenho em todos os eventos do ciclo.</p>
        </div>
        <div className="ranking-summary">
          <span>Sua pontuação</span>
          <strong>{myPoints}</strong>
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
          <strong>Premiação mensal</strong>
          <small>Top 3 recebem prêmio real. Demais posições recebem moedas.</small>
        </div>
      </div>
      <ol className="ranking">
        {rows.map((row, index) => (
          <li key={row.userId} className={row.userId === user.id ? 'is-you' : ''}>
            <span className={`rank rank--${index + 1}`}>{index + 1}</span>
            <span className="ranking-avatar">{row.displayName.slice(0, 1).toUpperCase()}</span>
            <span className="who">
              <strong>{row.displayName}</strong>
              <small>{row.userId === user.id ? 'Você' : index < 3 ? 'Zona de prêmio' : 'Recebe moedas'}</small>
            </span>
            <span className="pts">{row.points} <small>pts</small></span>
          </li>
        ))}
      </ol>
    </section>
  )
}
