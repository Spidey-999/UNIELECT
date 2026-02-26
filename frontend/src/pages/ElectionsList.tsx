import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Users, Calendar, ChevronRight, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'
import Alert from '../components/Alert'

interface Election {
  id: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  isActive: boolean
  turnout: number
  races: { id: string; title: string; maxChoices: number; candidateCount: number }[]
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const ElectionsList = () => {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchElections()
  }, [])

  const fetchElections = async () => {
    try {
      setLoading(true)
      const response = await apiService.getElections()
      setElections(response.data)
      setError(null)
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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const getTimeRemaining = (endsAt: string) => {
    const now = new Date()
    const end = new Date(endsAt)
    if (now > end) return 'Ended'
    const diff = end.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `${days}d left`
    if (hours > 0) return `${hours}h left`
    return '< 1h left'
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
          <span className="font-mono text-body-sm text-ink/50">Loading elections</span>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Alert type="error" message={error} />
        </motion.div>
      </div>
    )
  }

  if (!elections || elections.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-ed-xl border border-ink/[0.08] bg-ink/[0.02]">
          <Calendar className="h-10 w-10 text-ink/30" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-display-lg font-bold tracking-tight text-ink mb-4">No Elections</h1>
        <p className="font-mono text-body-sm text-ink/55 max-w-sm mb-8">Check back later for upcoming elections.</p>
        <div className="flex items-center gap-3 rounded-ed-md border border-ink/[0.08] px-6 py-4">
          <TrendingUp className="h-4 w-4 text-ink/40" strokeWidth={1.5} />
          <span className="font-mono text-body-sm text-ink/60">Stay tuned</span>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* Asymmetrical header — offset layout */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
      >
        <div className="lg:col-span-7 lg:col-start-2">
          <h1 className="font-display text-display-xl font-bold tracking-tighter text-ink mb-6">
            Active Elections
          </h1>
          <p className="font-mono text-body-sm text-ink/55 max-w-xl leading-relaxed">
            Cast your vote and make your voice heard in shaping the future of our student community.
          </p>
        </div>
      </motion.header>

      {alert && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </motion.div>
      )}

      {/* Bento Grid — varying widths, organic layout */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {elections.map((election, index) => (
          <motion.article
            key={election.id}
            variants={item}
            className="group"
          >
            <Link
              to={`/elections/${election.id}`}
              className="block h-full rounded-ed-lg border border-ink/[0.08] bg-paper/60 backdrop-blur-md p-6 lg:p-8 transition-all duration-300 hover:border-ink/[0.12] hover:bg-paper/80"
              style={{
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: index % 2 === 1 ? 'translateY(0)' : undefined,
              }}
            >
              <div className="flex justify-between items-start mb-6">
                {election.isActive && (
                  <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                )}
                <span className="font-mono text-[0.6875rem] text-ink/45 flex items-center gap-1.5 ml-auto">
                  <Clock className="h-3 w-3" strokeWidth={1.5} />
                  {getTimeRemaining(election.endsAt)}
                </span>
              </div>

              <h2 className="font-display text-display-sm font-bold tracking-tight text-ink mb-3 line-clamp-2 group-hover:text-ink/90 transition-colors">
                {election.title}
              </h2>
              <p className="font-mono text-body-sm text-ink/55 line-clamp-3 mb-8 leading-relaxed">
                {election.description}
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="rounded-ed-sm border border-ink/[0.06] bg-ink/[0.02] p-3 text-center">
                  <Calendar className="h-4 w-4 text-ink/40 mx-auto mb-1" strokeWidth={1.5} />
                  <p className="font-mono text-[0.6875rem] text-ink/45 uppercase tracking-wider">Start</p>
                  <p className="font-mono text-[0.75rem] text-ink font-medium mt-0.5">{formatDate(election.startsAt).split(',')[0]}</p>
                </div>
                <div className="rounded-ed-sm border border-ink/[0.06] bg-ink/[0.02] p-3 text-center">
                  <Users className="h-4 w-4 text-ink/40 mx-auto mb-1" strokeWidth={1.5} />
                  <p className="font-mono text-[0.6875rem] text-ink/45 uppercase tracking-wider">Turnout</p>
                  <p className="font-mono text-[0.75rem] text-ink font-medium mt-0.5">{election.turnout}</p>
                </div>
                <div className="rounded-ed-sm border border-ink/[0.06] bg-ink/[0.02] p-3 text-center">
                  <TrendingUp className="h-4 w-4 text-ink/40 mx-auto mb-1" strokeWidth={1.5} />
                  <p className="font-mono text-[0.6875rem] text-ink/45 uppercase tracking-wider">Races</p>
                  <p className="font-mono text-[0.75rem] text-ink font-medium mt-0.5">{election.races.length}</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 font-mono text-body-sm text-ink group-hover:gap-3 transition-[gap]">
                {election.isActive ? 'Vote Now' : 'View Details'}
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </span>
            </Link>
          </motion.article>
        ))}
      </motion.div>

      {/* Footer — minimal */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pt-16 border-t border-ink/[0.08]"
      >
        <p className="font-mono text-[0.6875rem] text-ink/40 uppercase tracking-wider">
          © 2026 UNIELECT · Secure · Anonymous · Accessible
        </p>
      </motion.footer>
    </div>
  )
}

export default ElectionsList
