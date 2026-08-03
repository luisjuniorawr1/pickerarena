import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getUser, login } from '../lib/storage'

export function LoginPage() {
  const existing = getUser()
  const navigate = useNavigate()
  const [name, setName] = useState('')

  if (existing) return <Navigate to="/eventos" replace />

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    login(name)
    navigate('/eventos')
  }

  return (
    <section className="hero-login">
      <div className="hero-login__copy">
        <p className="eyebrow">Fantasy multi-esporte</p>
        <h1 className="brand-hero">Picker Arena</h1>
        <p className="lede">
          Escala evento a evento. Monta o time com créditos, usa o banco e disputa o ranking
          mensal.
        </p>
      </div>
      <form className="login-card" onSubmit={onSubmit}>
        <label htmlFor="nick">Como quer ser chamado?</label>
        <input
          id="nick"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu apelido"
          maxLength={24}
        />
        <button className="btn primary" type="submit" disabled={!name.trim()}>
          Entrar e jogar
        </button>
        <p className="hint">MVP com login local e dados mock — sem senha.</p>
      </form>
    </section>
  )
}
