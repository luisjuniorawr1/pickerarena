import { Link, Navigate } from 'react-router-dom'
import { mockEvents } from '../data/mock'
import { getUser, getUserLineup } from '../lib/storage'

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

export function EventsPage() {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="page events-page">
      <header className="page-head events-head">
        <div>
          <p className="eyebrow">Fantasy multi-esporte</p>
          <h1>Escolha um evento</h1>
          <p>Monte sua escalação e dispute o ranking mensal.</p>
        </div>
        <div className="season-card">
          <span>Ciclo atual</span>
          <strong>Julho</strong>
          <small>Top 3 recebem prêmio real</small>
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
        <span>{mockEvents.length} partidas</span>
      </div>
      <ul className="event-list">
        {mockEvents.map((event) => {
          const mine = getUserLineup(event.id, user.id)
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
