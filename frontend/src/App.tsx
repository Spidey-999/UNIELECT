import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ElectionsList from './pages/ElectionsList'
import ElectionDetail from './pages/ElectionDetail'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import CreateElection from './pages/CreateElection'
import ElectionResults from './pages/ElectionResults'
import UserRegister from './pages/UserRegister'
import UserLogin from './pages/UserLogin'
import UserDashboard from './pages/UserDashboard'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<ElectionsList />} />
          <Route path="/elections/:id" element={<ElectionDetail />} />
          <Route path="/elections/:id/results" element={<ElectionResults />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/elections/create" element={<CreateElection />} />
          <Route path="/user/register" element={<UserRegister />} />
          <Route path="/user/login" element={<UserLogin />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
