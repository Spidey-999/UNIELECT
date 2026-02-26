import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Calendar, Download, Eye, LogOut, BarChart3, Settings, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiService, useApi } from '../services/api'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'
import { Button } from '../components/ui/button'

interface Election {
  id: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  method: string
  races: Array<{
    id: string
    title: string
    maxChoices: number
    candidates: Array<{ id: string; name: string }>
  }>
  _count: { ballots: number; tokens: number }
}

const AdminDashboard = () => {
  const { data: elections, loading, error, execute } = useApi<Election[]>()
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchElections()
  }, [])

  const fetchElections = async () => {
    try {
      await execute(() => apiService.getAdminElections().then((r) => r.data as Election[]))
    } catch {
      // useApi handles error
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    window.location.href = '/admin/login'
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const isActive = (startsAt: string, endsAt: string) => {
    const now = new Date()
    return now >= new Date(startsAt) && now <= new Date(endsAt)
  }

  const handleExportTokens = async (electionId: string) => {
    try {
      const response = await apiService.generateTokens(electionId, 'eligible')
      const blob = new Blob([JSON.stringify(response.data.tokens, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tokens-${electionId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setAlert({ type: 'success', message: 'Tokens exported successfully!' })
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err.response as { data?: { error?: string } })?.data?.error
          : undefined
      setAlert({ type: 'error', message: msg || 'Failed to export tokens' })
    }
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
      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
      >
        <div>
          <h1 className="font-display text-display-lg font-bold tracking-tighter text-ink mb-2">
            Admin Dashboard
          </h1>
          <p className="font-mono text-body-sm text-ink/55">
            Create, update, and manage elections. Monitor voter activity and ensure platform integrity.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/admin/elections/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Create Election
            </Button>
          </Link>
          <Link to="/admin/audit-log">
            <Button variant="outline" className="gap-2">
              <Shield className="h-4 w-4" strokeWidth={2} />
              Audit Log
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Logout
          </Button>
        </div>
      </motion.header>

      {error && <Alert type="error" message={error} />}

      {!elections || elections.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-ed-lg border border-ink/[0.08] p-16 text-center"
        >
          <Calendar className="h-12 w-12 text-ink/30 mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="font-display text-display-sm font-bold text-ink mb-2">No Elections Created</h3>
          <p className="font-mono text-body-sm text-ink/55 mb-6">Get started by creating your first election.</p>
          <Link to="/admin/elections/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Create Election
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {elections.map((election, i) => (
            <motion.div
              key={election.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="rounded-ed-lg border border-ink/[0.08] bg-paper/60 backdrop-blur-md p-6 lg:p-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {isActive(election.startsAt, election.endsAt) && (
                      <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-emerald-600">
                        Active
                      </span>
                    )}
                    <span className="font-mono text-[0.6875rem] text-ink/50">
                      {formatDate(election.startsAt)} → {formatDate(election.endsAt)}
                    </span>
                  </div>
                  <h2 className="font-display text-display-sm font-bold text-ink mb-2">{election.title}</h2>
                  <p className="font-mono text-body-sm text-ink/55 line-clamp-2 mb-4">{election.description}</p>
                  <div className="flex flex-wrap gap-4 font-mono text-[0.6875rem] text-ink/50">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" strokeWidth={2} />
                      {election._count.ballots} votes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5" strokeWidth={2} />
                      {election._count.tokens} tokens
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                      {election.races.length} race{election.races.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Link to={`/admin/elections/${election.id}`}>
                    <Button variant="outline" className="w-full sm:w-auto gap-2">
                      <Settings className="h-4 w-4" strokeWidth={2} />
                      Manage
                    </Button>
                  </Link>
                  <Link to={`/elections/${election.id}/results`}>
                    <Button variant="outline" className="w-full sm:w-auto gap-2">
                      <Eye className="h-4 w-4" strokeWidth={2} />
                      Results
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => handleExportTokens(election.id)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" strokeWidth={2} />
                    Export Tokens
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
