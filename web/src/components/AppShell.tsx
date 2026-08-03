import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AppShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const initial = user?.displayName.trim().charAt(0).toUpperCase() || 'P'

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            PA
          </span>
          <span>Picker Arena</span>
        </Link>
        <nav className="nav">
          <NavLink to="/eventos">Eventos</NavLink>
          <NavLink to="/ranking">Ranking</NavLink>
        </nav>
        <div className="session">
          {user ? (
            <>
              <span className="wallet">
                <small>XP</small>
                <strong>9.500</strong>
              </span>
              <span className="session-avatar" aria-hidden="true">
                {initial}
              </span>
              <span className="session-name">{user.displayName}</span>
              <button
                type="button"
                className="btn ghost logout-button"
                onClick={handleSignOut}
              >
                Sair
              </button>
            </>
          ) : (
            <Link className="btn" to="/login">
              Entrar
            </Link>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      {user && (
        <nav className="bottom-nav" aria-label="Navegação principal">
          <NavLink to="/eventos">
            <span aria-hidden="true">◉</span>
            <small>Eventos</small>
          </NavLink>
          <NavLink to="/eventos" className="bottom-nav__play">
            <span aria-hidden="true">+</span>
            <small>Jogar</small>
          </NavLink>
          <NavLink to="/ranking">
            <span aria-hidden="true">♜</span>
            <small>Ranking</small>
          </NavLink>
        </nav>
      )}
    </div>
  )
}
