import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Clock, Users, Calendar, ArrowLeft, CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { MagneticButton } from '../components/ui/magnetic-button'

interface Candidate {
  id: string
  name: string
  bio?: string
  photoUrl?: string
}

interface Race {
  id: string
  title: string
  maxChoices: number
  description?: string
  candidates: Candidate[]
}

interface Election {
  id: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  isActive: boolean
  races: Race[]
}

const ElectionDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [tokenLoading, setTokenLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    fetchElection()
  }, [id])

  const fetchElection = async () => {
    try {
      const response = await axios.get(`/api/elections/${id}`)
      setElection(response.data)
    } catch {
      setMessage({ type: 'error', text: 'Failed to load election details' })
    } finally {
      setLoading(false)
    }
  }

  const getToken = async () => {
    if (!id || !email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }
    try {
      setTokenLoading(true)
      setMessage(null)
      const res = await axios.post(`/api/elections/${id}/token`, { email: email.trim() })
      const data = res.data as { token: string }
      setToken(data.token)
      setMessage({ type: 'success', text: 'Access granted. You can now cast your vote below.' })
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err.response as { data?: { error?: string } })?.data?.error
          : undefined
      setMessage({ type: 'error', text: msg || 'Failed to get voting access' })
    } finally {
      setTokenLoading(false)
    }
  }

  const handleCandidateToggle = (raceId: string, candidateId: string) => {
    const race = election?.races.find((r) => r.id === raceId)
    if (!race) return

    setSelections((prev) => {
      const current = prev[raceId] || []
      const isSelected = current.includes(candidateId)
      if (isSelected) return { ...prev, [raceId]: current.filter((c) => c !== candidateId) }
      if (current.length >= race.maxChoices) {
        setMessage({
          type: 'error',
          text: `You can only select ${race.maxChoices} candidate${race.maxChoices > 1 ? 's' : ''} for ${race.title}`,
        })
        return prev
      }
      return { ...prev, [raceId]: [...current, candidateId] }
    })
  }

  const castVote = async () => {
    if (!token) {
      setMessage({ type: 'error', text: 'Please get voting access before casting your vote.' })
      return
    }

    const voteSelections = Object.entries(selections).map(([raceId, candidateIds]) => ({
      raceId,
      candidateIds,
    }))

    try {
      setVoting(true)
      await axios.post(`/api/elections/${id}/vote`, { token, selections: voteSelections })
      setMessage({ type: 'success', text: 'Your vote has been cast successfully! Thank you for participating.' })
      setToken('')
      setSelections({})
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err.response as { data?: { error?: string } })?.data?.error
          : undefined
      setMessage({ type: 'error', text: msg || 'Failed to cast vote' })
    } finally {
      setVoting(false)
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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
      </div>
    )
  }

  if (!election) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <h1 className="font-display text-display-md font-bold text-ink mb-4">Election Not Found</h1>
        <p className="font-mono text-body-sm text-ink/55 mb-8">The election you're looking for doesn't exist.</p>
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Elections
          </Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="space-y-12 lg:space-y-16">
      {/* Asymmetrical header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        <div className="lg:col-span-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-body-sm text-ink/55 hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back
          </Link>
        </div>
        <div className="lg:col-span-8 lg:col-start-3">
          <h1 className="font-display text-display-lg font-bold tracking-tighter text-ink mb-4">
            {election.title}
          </h1>
          <p className="font-mono text-body-sm text-ink/55 mb-6 max-w-2xl">{election.description}</p>
          <div className="flex flex-wrap gap-6 font-mono text-body-sm text-ink/50">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" strokeWidth={1.5} />
              {formatDate(election.startsAt)} → {formatDate(election.endsAt)}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" strokeWidth={1.5} />
              {election.isActive ? 'Active' : 'Not Active'}
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" strokeWidth={1.5} />
              {election.races.length} race{election.races.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-ed-md border p-4 flex items-center gap-3 ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800'
              : 'border-red-500/30 bg-red-500/5 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
          )}
          <span className="font-mono text-body-sm">{message.text}</span>
        </motion.div>
      )}

      {!election.isActive && (
        <div className="rounded-ed-lg border border-amber-500/20 bg-amber-500/5 p-6 flex items-center gap-4">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" strokeWidth={2} />
          <span className="font-mono text-body-sm text-amber-800">Voting is not currently active for this election.</span>
        </div>
      )}

      {election.isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {!token ? (
            <Card className="p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-ed-md border border-ink/[0.1] bg-ink/[0.03]">
                  <Mail className="h-6 w-6 text-ink/70" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="font-display text-display-sm font-bold text-ink mb-1">Get Voting Access</h2>
                  <p className="font-mono text-body-sm text-ink/55">
                    Enter your email address to get instant voting access.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-mono text-[0.6875rem] uppercase tracking-wider text-ink/60 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setMessage(null) }}
                    className="flex h-11 w-full rounded-ed-md border border-ink/[0.1] bg-paper px-4 font-mono text-body-sm placeholder:text-ink/40 focus:outline-none focus:border-ink/[0.3]"
                    placeholder="your.email@gmail.com"
                    disabled={tokenLoading}
                  />
                </div>
                <div>
                  <Button
                    onClick={getToken}
                    disabled={tokenLoading}
                    className="gap-2"
                  >
                    {tokenLoading ? 'Getting Access...' : 'Get Voting Access'}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 lg:p-8 border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-display-sm font-bold text-emerald-800">Access Granted</h3>
                  <p className="font-mono text-body-sm text-emerald-700/80">You can now cast your vote below</p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" strokeWidth={2} />
              </div>
            </Card>
          )}
        </motion.div>
      )}

      <div className="space-y-8">
        {election.races.map((race, raceIndex) => (
          <motion.div
            key={race.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * raceIndex }}
          >
            <Card className="p-6 lg:p-8">
              <div className="mb-6">
                <h2 className="font-display text-display-sm font-bold text-ink mb-2">{race.title}</h2>
                {race.description && (
                  <p className="font-mono text-body-sm text-ink/55 mb-2">{race.description}</p>
                )}
                <p className="font-mono text-[0.6875rem] text-ink/45 uppercase tracking-wider">
                  Select {race.maxChoices} candidate{race.maxChoices > 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-3">
                {race.candidates.map((candidate) => {
                  const isSelected = selections[race.id]?.includes(candidate.id)
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => election.isActive && handleCandidateToggle(race.id, candidate.id)}
                      onMouseMove={(e) => {
                        const el = e.currentTarget
                        const rect = el.getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const y = e.clientY - rect.top
                        el.style.setProperty('--mx', `${x}px`)
                        el.style.setProperty('--my', `${y}px`)
                      }}
                      className={`group relative flex items-center gap-4 rounded-ed-md border p-4 cursor-pointer transition-all duration-200 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-none ${
                        isSelected
                          ? 'dark:border-emerald-500 dark:shadow-[0_0_8px_#10b981] border-black border-2 bg-emerald-50'
                          : 'dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/5 border-black/20 hover:bg-[rgba(200,200,200,0.1)]'
                      } ${!election.isActive ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 rounded-ed-md opacity-0 dark:group-hover:opacity-100"
                        style={{
                          background: 'radial-gradient(180px circle at var(--mx) var(--my), rgba(255,255,255,0.08), transparent 40%)',
                          transition: 'opacity 150ms ease',
                        }}
                      />
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          isSelected ? 'border-ink bg-ink' : 'border-ink/30'
                        }`}
                      >
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-paper" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-body font-semibold text-ink">{candidate.name}</h3>
                        {candidate.bio && (
                          <p className="font-mono text-body-sm text-ink/55 mt-0.5 line-clamp-1">{candidate.bio}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {election.isActive && token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center pt-4"
        >
          <MagneticButton
            onClick={castVote}
            disabled={voting || Object.keys(selections).length === 0}
            size="lg"
            className="px-12"
          >
            {voting ? 'Casting Vote...' : 'Cast Vote'}
          </MagneticButton>
        </motion.div>
      )}
    </div>
  )
}

export default ElectionDetail
