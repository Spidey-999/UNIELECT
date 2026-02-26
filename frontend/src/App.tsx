import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ElectionsList from './pages/ElectionsList'
import ElectionDetail from './pages/ElectionDetail'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import CreateElection from './pages/CreateElection'
import ElectionResults from './pages/ElectionResults'
import AdminElectionManage from './pages/AdminElectionManage'
import AdminAuditLog from './pages/AdminAuditLog'
import FloatingThemeControl from './components/FloatingThemeControl'

function App() {
  return (
    <div className="min-h-screen bg-paper text-ink relative">
      {/* Grain overlay — removes flat digital look */}
      <div className="grain-overlay" aria-hidden />
      <div className="light-grid-overlay" aria-hidden />
      <div className="mesh-gradient-overlay" aria-hidden />

      <Navbar />

      {/* Generous white space — content breathes */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16 lg:py-24">
        <Routes>
          <Route path="/" element={<ElectionsList />} />
          <Route path="/elections/:id" element={<ElectionDetail />} />
          <Route path="/elections/:id/results" element={<ElectionResults />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/elections/create" element={<CreateElection />} />
          <Route path="/admin/elections/:id" element={<AdminElectionManage />} />
          <Route path="/admin/audit-log" element={<AdminAuditLog />} />
        </Routes>
      </main>
      <FloatingThemeControl />
    </div>
  )
}

export default App
