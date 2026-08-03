import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { mockEvents } from '../data/mock'
import type { Lineup } from '../domain/types'
import { loadUserLineups } from '../lib/lineupRepository'

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))
}

function timeUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'Encerrado'
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  return `${hours}h ${Math.floor((ms % 3_600_000) / 60_000)}min`
}

const statusLabel: Record<string, string> = {
  open: 'Escalação aberta',
  locked: 'Em andamento',
  scored: 'Finalizado',
  void: 'Anulado',
}

const currentCycle = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())

export function EventsPage() {
  const { user, loading } = useAuth()
  const [lineups, setLineups] = useState<Lineup[]>([])
  const [loadingLineups, setLoadingLineups] = useState(false)

  useEffect(() => {
    if (!user) {
      setLineups([])
      return
    }

    let cancelled = false
    setLoadingLineups(true)
    loadUserLineups(user.id)
      .then((items) => {
        if (!cancelled) setLineups(items)
      })
      .catch((error) => console.error('Não foi possível carregar as escalações.', error))
      .finally(() => {
        if (!cancelled) setLoadingLineups(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  if (loading) return <p className="page">Carregando eventos...</p>
  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="page events-page">
      <header className="page-head events-head">
        <div>
          <p className="eyebrow">Fantasy esportivo gratuito</p>
          <h1>Escolha um evento</h1>
          <p>Monte sua escalação e dispute posições no ranking mensal.</p>
        </div>
        <div className="season-card">
          <span>Ciclo atual</span>
          <strong>{currentCycle}</strong>
          <small>Medalhas e XP virtuais</small>
        </div>
      </header>
      <div className="sport-tabs" role="tablist" aria-label="Esportes">
        <button className="is-active" type="button" role="tab" aria-selected="true">
          Futebol
        </button>
        <button type="button" role="tab" aria-selected="false" disabled>
          NBA <small>em breve</small>
        </button>
        <button type="button" role="tab" aria-selected="false" disabled>
          F1 <small>em breve</small>
        </button>
      </div>
      <div className="list-heading">
        <div>
          <span className="live-dot" />
          <strong>Eventos em destaque</strong>
        </div>
        <span>{loadingLineups ? 'sincronizando...' : `${mockEvents.length} partidas`}</span>
      </div>
      <ul className="event-list">
        {mockEvents.map((event) => {
          const mine = lineups.find(
            (lineup) => lineup.eventId === event.id && lineup.userId === user.id,
          )
          return (
            <li key={event.id} className={`event-row event-row--${event.status}`}>
              <div className="event-card__topline">
                <span className={`status-pill status-pill--${event.status}`}>
                  {statusLabel[event.status]}
                </span>
                <span>{event.competition}</span>
              </div>
              <div className="matchup">
                <div className="team">
                  <span className="team-shirt team-shirt--home" aria-hidden="true">
                    {event.homeTeam.slice(0, 3).toUpperCase()}
                  </span>
                  <strong>{event.homeTeam}</strong>
                </div>
                <div className="match-center">
                  <span>{formatWhen(event.startsAt)}</span>
                  <strong>×</strong>
                  <small>{event.status === 'open' ? `fecha em ${timeUntil(event.startsAt)}` : 'resultado disponível'}</small>
                </div>
                <div className="team">
                  <span className="team-shirt team-shirt--away" aria-hidden="true">
                    {event.awayTeam.slice(0, 3).toUpperCase()}
                  </span>
                  <strong>{event.awayTeam}</strong>
                </div>
              </div>
              <div className="event-card__footer">
                <div className="event-stat">
                  <span>Formato</span>
                  <strong>4 titulares + banco</strong>
                </div>
                <div className="event-stat">
                  <span>Sua escalação</span>
                  <strong>{mine ? 'Confirmada' : 'Pendente'}</strong>
                </div>
                <Link className="btn primary" to={`/eventos/${event.id}`}>
                  {event.status === 'open' ? (mine ? 'Editar time' : 'Montar time') : 'Ver desempenho'}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
