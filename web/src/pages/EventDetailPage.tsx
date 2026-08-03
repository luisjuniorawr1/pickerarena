import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { mockEvents } from '../data/mock'
import {
  resolveLineupSlots,
  totalLineupPoints,
  validateFootballLineup,
} from '../domain/football'
import {
  BENCH_BUDGET,
  MAX_BENCH,
  SCORING_VERSION,
  STARTER_BUDGET,
  STARTER_COUNT,
  type Lineup,
  type Player,
  type Position,
} from '../domain/types'
import { loadUserLineup, persistLineup } from '../lib/lineupRepository'

const posLabel: Record<Position, string> = {
  goleiro: 'GK',
  zagueiro: 'ZAG',
  meio: 'MEI',
  atacante: 'ATA',
}

function spend(ids: string[], players: Player[]) {
  const map = new Map(players.map((player) => [player.id, player]))
  return ids.reduce((total, id) => total + (map.get(id)?.price ?? 0), 0)
}

function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))
}

export function EventDetailPage() {
  const { eventId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const event = mockEvents.find((item) => item.id === eventId) ?? null

  const [starters, setStarters] = useState<string[]>([])
  const [bench, setBench] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [filter, setFilter] = useState<Position | 'all'>('all')
  const [saved, setSaved] = useState<Lineup | null>(null)
  const [lineupLoading, setLineupLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !event) {
      setStarters([])
      setBench([])
      setSaved(null)
      setLineupLoading(false)
      return
    }

    let cancelled = false
    setLineupLoading(true)
    setMessage(null)

    loadUserLineup(event.id, user.id)
      .then((existing) => {
        if (cancelled) return
        setStarters(existing?.starters ?? [])
        setBench(existing?.bench ?? [])
        setSaved(existing)
      })
      .catch((error) => {
        console.error('Não foi possível carregar a escalação.', error)
        if (!cancelled) setMessage('Não foi possível sincronizar sua escalação.')
      })
      .finally(() => {
        if (!cancelled) setLineupLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [event?.id, user?.id])

  const scoredSlots = useMemo(() => {
    if (!event || event.status !== 'scored' || !event.stats || !saved) return null
    return resolveLineupSlots(saved, event.players, event.stats)
  }, [event, saved])

  if (authLoading) return <p className="page">Carregando sua conta...</p>
  if (!user) return <Navigate to="/login" replace />
  if (!event) {
    return (
      <section className="page">
        <p>Evento não encontrado.</p>
        <Link to="/eventos">Voltar</Link>
      </section>
    )
  }

  const currentUser = user
  const currentEvent = event
  const players = currentEvent.players
  const canEdit =
    !lineupLoading &&
    (currentEvent.status === 'scored' ||
      (currentEvent.status === 'open' && new Date() <= new Date(currentEvent.startsAt)))
  const starterSpend = spend(starters, players)
  const benchSpend = spend(bench, players)
  const validation = validateFootballLineup({ starters, bench }, players)
  const selected = new Set([...starters, ...bench])
  const visible = players.filter((player) => filter === 'all' || player.position === filter)

  function togglePlayer(player: Player) {
    if (!canEdit || saving) return
    setMessage(null)

    if (starters.includes(player.id)) {
      setStarters(starters.filter((id) => id !== player.id))
      return
    }
    if (bench.includes(player.id)) {
      setBench(bench.filter((id) => id !== player.id))
      return
    }

    const isGk = player.position === 'goleiro'
    const hasGk = [...starters, ...bench].some(
      (id) => players.find((item) => item.id === id)?.position === 'goleiro',
    )
    if (isGk && hasGk) {
      setMessage('Só pode 1 goleiro')
      return
    }

    if (starters.length < STARTER_COUNT) {
      if (starterSpend + player.price > STARTER_BUDGET) {
        setMessage(`Titulares sem crédito para ${player.price}`)
        return
      }
      setStarters([...starters, player.id])
      return
    }

    if (bench.length < MAX_BENCH) {
      if (isGk) {
        setMessage('Goleiro só nos titulares')
        return
      }
      if (benchSpend + player.price > BENCH_BUDGET) {
        setMessage(`Reservas sem crédito para ${player.price}`)
        return
      }
      setBench([...bench, player.id])
      return
    }

    setMessage('Escalação cheia (4 titulares + 2 reservas)')
  }

  async function onSave() {
    if (saving) return
    const result = validateFootballLineup({ starters, bench }, players)
    if (!result.ok) {
      setMessage(result.errors.join(' · '))
      return
    }

    const lineup: Lineup = {
      eventId: currentEvent.id,
      userId: currentUser.id,
      starters,
      bench,
      submittedAt: new Date().toISOString(),
      scoringVersion: SCORING_VERSION,
    }

    setSaving(true)
    setMessage(null)
    try {
      await persistLineup(lineup)
      setSaved(lineup)
      setMessage(
        currentEvent.status === 'scored'
          ? 'Escalação salva — veja a pontuação abaixo'
          : 'Escalação sincronizada',
      )
    } catch (error) {
      console.error('Não foi possível salvar a escalação.', error)
      setMessage('Não foi possível salvar agora. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function nameOf(id: string) {
    return players.find((player) => player.id === id)?.name ?? id
  }

  return (
    <section className="page lineup-page">
      <Link className="back-link" to="/eventos">
        <span aria-hidden="true">←</span> Todos os eventos
      </Link>
      <header className="match-hero">
        <div className="match-hero__meta">
          <span>{currentEvent.competition}</span>
          <span className={`status-pill status-pill--${currentEvent.status}`}>
            {currentEvent.status === 'open' ? 'Escalação aberta' : 'Finalizado'}
          </span>
        </div>
        <div className="match-hero__teams">
          <div className="team team--hero">
            <span className="team-shirt team-shirt--home" aria-hidden="true">
              {currentEvent.homeTeam.slice(0, 3).toUpperCase()}
            </span>
            <strong>{currentEvent.homeTeam}</strong>
          </div>
          <div className="match-hero__versus">
            <small>{formatEventDate(currentEvent.startsAt)}</small>
            <strong>×</strong>
            <span>{currentEvent.status === 'open' ? 'Deadline no horário da partida' : 'Partida encerrada'}</span>
          </div>
          <div className="team team--hero">
            <span className="team-shirt team-shirt--away" aria-hidden="true">
              {currentEvent.awayTeam.slice(0, 3).toUpperCase()}
            </span>
            <strong>{currentEvent.awayTeam}</strong>
          </div>
        </div>
      </header>

      <div className="flow-steps" aria-label="Progresso da escalação">
        <span className="is-complete">1 <small>Evento</small></span>
        <span className="is-active">2 <small>Escalação</small></span>
        <span className={saved ? 'is-complete' : ''}>3 <small>Confirmação</small></span>
      </div>

      {lineupLoading && <p className="flash">Sincronizando sua escalação...</p>}

      <div className="lineup-grid">
        <div className="squad-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Seu time</p>
              <h2>Escalação</h2>
            </div>
            <span className="selection-count">{starters.length + bench.length}/6</span>
          </div>
          <div className="budget-row">
            <div>
              <span>Titulares</span>
              <strong>{starterSpend} / {STARTER_BUDGET}</strong>
              <i><b style={{ width: `${Math.min((starterSpend / STARTER_BUDGET) * 100, 100)}%` }} /></i>
            </div>
            <div>
              <span>Reservas</span>
              <strong>{benchSpend} / {BENCH_BUDGET}</strong>
              <i><b style={{ width: `${Math.min((benchSpend / BENCH_BUDGET) * 100, 100)}%` }} /></i>
            </div>
          </div>
          <div className="slot-block">
            <h2>
              Titulares ({starters.length}/{STARTER_COUNT})
            </h2>
            <ol>
              {starters.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => togglePlayer(players.find((player) => player.id === id)!)}
                    disabled={!canEdit || saving}
                  >
                    <span>{nameOf(id).slice(0, 1)}</span>
                    {nameOf(id)}
                    <b aria-hidden="true">×</b>
                  </button>
                </li>
              ))}
              {Array.from({ length: STARTER_COUNT - starters.length }).map((_, index) => (
                <li className="empty-slot" key={`starter-${index}`}>
                  <span>+</span> Escolha um atleta
                </li>
              ))}
            </ol>
          </div>
          <div className="slot-block">
            <h2>
              Reservas ({bench.length}/{MAX_BENCH})
            </h2>
            <ol>
              {bench.map((id, index) => (
                <li key={id}>
                  <span className="bench-order">R{index + 1}</span>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => togglePlayer(players.find((player) => player.id === id)!)}
                    disabled={!canEdit || saving}
                  >
                    <span>{nameOf(id).slice(0, 1)}</span>
                    {nameOf(id)}
                    <b aria-hidden="true">×</b>
                  </button>
                </li>
              ))}
              {Array.from({ length: MAX_BENCH - bench.length }).map((_, index) => (
                <li className="empty-slot" key={`bench-${index}`}>
                  <span>+</span> Reserva {bench.length + index + 1}
                </li>
              ))}
            </ol>
          </div>

          {currentEvent.status === 'scored' && (
            <p className="hint">
              Evento demonstrativo: monte o time e salve para ver o breakdown football-v1.
            </p>
          )}
          {message && <p className="flash">{message}</p>}
          {!validation.ok && canEdit && (
            <ul className="errors">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="pool-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Disponíveis</p>
              <h2>Selecione os atletas</h2>
            </div>
            <span className="rule-note">Máx. 1 GK</span>
          </div>
          <div className="filters">
            {(['all', 'goleiro', 'zagueiro', 'meio', 'atacante'] as const).map((positionFilter) => (
              <button
                key={positionFilter}
                type="button"
                className={filter === positionFilter ? 'btn primary compact' : 'btn ghost compact'}
                onClick={() => setFilter(positionFilter)}
              >
                {positionFilter === 'all' ? 'Todos' : posLabel[positionFilter]}
              </button>
            ))}
          </div>
          <ul className="player-pool">
            {visible.map((player) => {
              const inStarters = starters.includes(player.id)
              const inBench = bench.includes(player.id)
              return (
                <li key={player.id}>
                  <button
                    type="button"
                    className={`player-row ${inStarters ? 'is-starter' : ''} ${inBench ? 'is-bench' : ''}`}
                    onClick={() => togglePlayer(player)}
                    disabled={saving || (!canEdit && !selected.has(player.id))}
                  >
                    <span className={`player-avatar player-avatar--${player.teamId}`}>
                      {player.name.slice(0, 1)}
                    </span>
                    <span className="pname">
                      <strong>{player.name}</strong>
                      <small>{player.teamName} · {posLabel[player.position]}</small>
                    </span>
                    <span className="price">
                      {player.price}
                      <small>cr</small>
                    </span>
                    <span className="select-mark" aria-hidden="true">
                      {inStarters ? '✓' : inBench ? 'R' : '+'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {scoredSlots && (
        <section className="scoreboard">
          <div className="scoreboard-head">
            <div>
              <p className="eyebrow">Desempenho</p>
              <h2>Pontuação da sua escalação</h2>
            </div>
            <p className="total-pts">{totalLineupPoints(scoredSlots)} <small>pts</small></p>
          </div>
          <ul>
            {scoredSlots.map((slot) => (
              <li key={slot.starterId}>
                <strong>{nameOf(slot.starterId)}</strong> {slot.starterPoints} pts
                {slot.starterBreakdown.length > 0 && (
                  <span className="bd"> — {slot.starterBreakdown.join(', ')}</span>
                )}
                {slot.coveredByBench && slot.benchId && (
                  <div className="bench-cover">
                    + banco {nameOf(slot.benchId)}: {slot.benchPoints} pts
                    {slot.benchBreakdown.length > 0 && (
                      <span className="bd"> — {slot.benchBreakdown.join(', ')}</span>
                    )}
                  </div>
                )}
                <div className="slot-total">Slot: {slot.slotPoints}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {currentEvent.status === 'scored' && !saved && (
        <p className="hint">Monte 4 titulares (+ banco) e salve para ver a pontuação demonstrativa.</p>
      )}

      {canEdit && (
        <div className="save-dock">
          <div>
            <span>{starters.length}/{STARTER_COUNT} titulares</span>
            <strong>{validation.ok ? 'Time pronto para confirmar' : 'Complete sua escalação'}</strong>
          </div>
          <button
            type="button"
            className="btn primary"
            onClick={() => void onSave()}
            disabled={saving || !validation.ok}
          >
            {saving
              ? 'Salvando...'
              : currentEvent.status === 'scored'
                ? 'Salvar e ver pontuação'
                : 'Confirmar escalação'}
            <span aria-hidden="true">✓</span>
          </button>
        </div>
      )}
    </section>
  )
}
