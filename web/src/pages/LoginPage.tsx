import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function readableAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Não foi possível entrar.'
  if (message.includes('auth/invalid-credential')) return 'E-mail ou senha incorretos.'
  if (message.includes('auth/email-already-in-use')) return 'Este e-mail já está cadastrado.'
  if (message.includes('auth/weak-password')) return 'Use uma senha com pelo menos 6 caracteres.'
  if (message.includes('auth/popup-closed-by-user')) return 'A janela do Google foi fechada antes de concluir.'
  return message
}

export function LoginPage() {
  const {
    user,
    loading,
    cloudEnabled,
    signInDemo,
    signInGoogle,
    signInEmail,
    signUpEmail,
  } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <p className="page">Carregando sua conta...</p>
  if (user) return <Navigate to="/eventos" replace />

  async function run(action: () => Promise<void>) {
    setSubmitting(true)
    setError(null)
    try {
      await action()
      navigate('/eventos')
    } catch (authError) {
      setError(readableAuthError(authError))
    } finally {
      setSubmitting(false)
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!cloudEnabled) {
      if (!name.trim()) return
      void run(() => signInDemo(name))
      return
    }

    if (!email.trim() || password.length < 6) return
    if (creatingAccount) {
      if (!name.trim()) return
      void run(() => signUpEmail(name, email.trim(), password))
      return
    }
    void run(() => signInEmail(email.trim(), password))
  }

  return (
    <section className="hero-login">
      <div className="hero-login__copy">
        <p className="eyebrow">Fantasy esportivo gratuito</p>
        <h1 className="brand-hero">Picker Arena</h1>
        <p className="lede">
          Escale evento a evento, use seus créditos virtuais e dispute posições no ranking.
        </p>
      </div>
      <form className="login-card" onSubmit={onSubmit}>
        {cloudEnabled ? (
          <>
            <button
              className="btn primary"
              type="button"
              disabled={submitting}
              onClick={() => void run(signInGoogle)}
            >
              Continuar com Google
            </button>
            <p className="hint">ou use e-mail e senha</p>
            {creatingAccount && (
              <>
                <label htmlFor="name">Como quer ser chamado?</label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome ou apelido"
                  maxLength={24}
                  autoComplete="nickname"
                />
              </>
            )}
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
            />
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 6 caracteres"
              minLength={6}
              autoComplete={creatingAccount ? 'new-password' : 'current-password'}
            />
            <button
              className="btn primary"
              type="submit"
              disabled={
                submitting ||
                !email.trim() ||
                password.length < 6 ||
                (creatingAccount && !name.trim())
              }
            >
              {submitting ? 'Aguarde...' : creatingAccount ? 'Criar conta' : 'Entrar'}
            </button>
            <button
              className="btn ghost"
              type="button"
              disabled={submitting}
              onClick={() => {
                setCreatingAccount((value) => !value)
                setError(null)
              }}
            >
              {creatingAccount ? 'Já tenho uma conta' : 'Criar uma conta'}
            </button>
          </>
        ) : (
          <>
            <label htmlFor="nick">Como quer ser chamado?</label>
            <input
              id="nick"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu apelido"
              maxLength={24}
            />
            <button className="btn primary" type="submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Entrando...' : 'Entrar e testar'}
            </button>
            <p className="hint">
              Modo demonstração ativo. A conta na nuvem será liberada quando o Firebase for conectado.
            </p>
          </>
        )}
        {error && <p className="flash">{error}</p>}
      </form>
    </section>
  )
}
