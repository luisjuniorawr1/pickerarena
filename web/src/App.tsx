import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { EventDetailPage } from './pages/EventDetailPage'
import { EventsPage } from './pages/EventsPage'
import { LoginPage } from './pages/LoginPage'
import { RankingPage } from './pages/RankingPage'
import { getUser } from './lib/storage'

function HomeRedirect() {
  return <Navigate to={getUser() ? '/eventos' : '/login'} replace />
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
