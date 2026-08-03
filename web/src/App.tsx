import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { AppShell } from './components/AppShell'
import { EventDetailPage } from './pages/EventDetailPage'
import { EventsPage } from './pages/EventsPage'
import { LoginPage } from './pages/LoginPage'
import { RankingPage } from './pages/RankingPage'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <p className="page">Carregando sua conta...</p>
  return <Navigate to={user ? '/eventos' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/eventos" element={<EventsPage />} />
        <Route path="/eventos/:eventId" element={<EventDetailPage />} />
        <Route path="/ranking" element={<RankingPage />} />
      </Route>
    </Routes>
  )
}
