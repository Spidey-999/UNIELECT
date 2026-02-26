import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Vote, LogOut, BarChart3, Calendar, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { Alert, LoadingSpinner } from '../components'
import api from '../services/api'

interface Election {
  id: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  method: string
  isActive?: boolean
  _count?: { races: number; candidates: number; ballots: number }
}

interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
}

const UserDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserData | null>(null)
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('userToken')
    if (!userData || !token) {
      navigate('/user/login')
      return
    }
    setUser(JSON.parse(userData))
    fetchElections()
  }, [navigate])

  const fetchElections = async () => {
    try {
      const response = await api.get('/api/elections')
      setElections(response.data)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err.response as { data?: { error?: string } })?.data?.error
          : undefined
      setError(msg || 'Failed to fetch elections')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userToken')
    localStorage.removeItem('user')
    navigate('/user/login')
  }

  const isElectionActive = (e: Election) => {
    const now = new Date()
    const start = new Date(e.startsAt)
    const end = new Date(e.endsAt)
    return now >= start && now <= end
  }

  const getStatus = (e: Election) => {
    const now = new Date()
    const start = new Date(e.startsAt)
    const end = new Date(e.endsAt)
    if (now < start) return { text: 'Upcoming', color: 'text-amber-700', border: 'border-amber-500/20' }
    if (now > end) return { text: 'Ended', color: 'text-ink/50', border: 'border-ink/10' }
    return { text: 'Active', color: 'text-emerald-700', border: 'border-emerald-500/20' }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-12 lg:space-y-16">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
      >
        <div>
          <h1 className="font-display text-display-lg font-bold tracking-tighter text-ink mb-1">
            Welcome, {user?.firstName || 'Student'}
          </h1>
          <p className="font-mono text-body-sm text-ink/55">UNIELECT Voting Dashboard</p>
        </div>
        <button
          onClick={handleLogout}
          className="font-mono text-body-sm text-ink/55 hover:text-ink flex items-center gap-2 transition-colors self-start"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Logout
        </button>
      </motion.header>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Bento-style stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
      >
        {[
          { label: 'Total Elections', value: elections.length, icon: BarChart3 },
          { label: 'Active Now', value: elections.filter(isElectionActive).length, icon: Vote },
          { label: 'This Month', value: elections.filter((e) => {
            const d = new Date(e.startsAt)
            const n = new Date()
            return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
          }).length, icon: Calendar },
          { label: 'Participation', value: 'High', icon: Users },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="rounded-ed-lg border border-ink/[0.08] bg-paper/60 backdrop-blur-md p-6"
          >
            <stat.icon className="h-5 w-5 text-ink/40 mb-4" strokeWidth={1.5} />
            <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50">{stat.label}</p>
            <p className="font-display text-display-sm font-bold text-ink mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Elections list */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="font-display text-display-md font-bold text-ink mb-6 flex items-center gap-2">
          <Vote className="h-5 w-5 text-ink/60" strokeWidth={2} />
          Available Elections
        </h2>

        {elections.length === 0 ? (
          <div className="rounded-ed-lg border border-ink/[0.08] p-12 text-center">
            <Calendar className="h-12 w-12 text-ink/30 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="font-display text-display-sm font-bold text-ink mb-2">No Active Elections</h3>
            <p className="font-mono text-body-sm text-ink/55">Check back later for new voting opportunities.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {elections.map((election, i) => {
              const active = isElectionActive(election)
              const status = getStatus(election)
              return (
                <motion.div
                  key={election.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className={`rounded-ed-lg border p-6 transition-all ${status.border} ${active ? 'bg-emerald-500/5' : 'bg-paper/60 backdrop-blur-md border-ink/[0.08]'}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-display-sm font-bold text-ink">{election.title}</h3>
                        <span className={`font-mono text-[0.6875rem] uppercase tracking-wider ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      <p className="font-mono text-body-sm text-ink/55 line-clamp-2 mb-3">{election.description}</p>
                      <div className="flex items-center gap-4 font-mono text-[0.6875rem] text-ink/45">
                        <span>Starts: {new Date(election.startsAt).toLocaleDateString()}</span>
                        <span>Ends: {new Date(election.endsAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {active ? (
                        <Link
                          to={`/elections/${election.id}`}
                          className="inline-flex items-center gap-2 h-10 px-5 rounded-ed-md bg-ink text-paper font-mono text-body-sm font-medium hover:bg-ink/90 transition-colors"
                        >
                          <Vote className="h-4 w-4" strokeWidth={2} />
                          Vote Now
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-2 h-10 px-5 rounded-ed-md bg-ink/10 text-ink/50 font-mono text-body-sm cursor-not-allowed">
                          <Vote className="h-4 w-4" />
                          {status.text}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Quick actions — Bento cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { title: 'My Profile', desc: 'View and update your voter information', href: '/user/profile', icon: User },
            { title: 'Voting History', desc: 'View your past voting activity', href: '/user/history', icon: BarChart3 },
            { title: 'Help & Support', desc: 'Get help with voting process', href: '/user/help', icon: Users },
          ].map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="rounded-ed-lg border border-ink/[0.08] bg-paper/60 backdrop-blur-md p-6 block hover:border-ink/[0.12] hover:bg-paper/80 transition-all"
            >
              <action.icon className="h-8 w-8 text-ink/50 mb-4" strokeWidth={1.5} />
              <h3 className="font-display text-display-sm font-bold text-ink mb-2">{action.title}</h3>
              <p className="font-mono text-body-sm text-ink/55">{action.desc}</p>
            </Link>
          ))}
        </div>
      </motion.section>
    </div>
  )
}

export default UserDashboard
