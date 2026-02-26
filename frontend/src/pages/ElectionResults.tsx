import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Calendar, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'
import { Button } from '../components/ui/button'
import { ProgressBar } from '../components/ui/progress-bar'

interface Candidate {
  id: string
  name: string
  votes: number
}

interface Race {
  id: string
  title: string
  maxChoices: number
  candidates: Candidate[]
}

interface ElectionResults {
  election: { id: string; title: string; totalBallots: number; startsAt: string; endsAt: string }
  races: Race[]
}

const ElectionResults = () => {
  const { id } = useParams<{ id: string }>()
  const [results, setResults] = useState<ElectionResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResults()
  }, [id])

  const fetchResults = async () => {
    if (!id) return
    try {
      // Admin can see results anytime via admin API
      const isAdmin = !!localStorage.getItem('adminToken')
      const response = isAdmin
        ? await apiService.getAdminResults(id)
        : await apiService.getResults(id)
      setResults(response.data)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } }
      if (e.response?.status === 403) {
        setError('Results are not available yet. Please check back after the election has ended.')
      } else {
        setError('Failed to load results')
      }
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

  const getVotePercentage = (votes: number, totalBallots: number) =>
    totalBallots === 0 ? 0 : ((votes / totalBallots) * 100).toFixed(1)

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
      </div>
    )
  }

  if (error || !results) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-ed-lg border border-red-500/20 bg-red-500/5">
          <Trophy className="h-8 w-8 text-red-600/80" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-display-md font-bold text-ink mb-4">Results Not Available</h1>
        <p className="font-mono text-body-sm text-ink/55 mb-8">{error || 'The election results could not be loaded.'}</p>
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
      <motion.header
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
          <h1 className="font-display text-display-lg font-bold tracking-tighter text-ink mb-2">
            {results.election.title}
          </h1>
          <p className="font-mono text-body-sm text-ink/55">Election Results</p>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-ed-lg border border-ink/[0.08] bg-paper/60 backdrop-blur-md p-6 lg:p-8 mb-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50 mb-1">Total Votes</p>
            <p className="font-display text-display-md font-bold text-ink">{results.election.totalBallots}</p>
          </div>
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50 mb-1">Races</p>
            <p className="font-display text-display-md font-bold text-ink">{results.races.length}</p>
          </div>
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50 mb-1">Voting Period</p>
            <p className="font-mono text-body-sm text-ink">
              {formatDate(results.election.startsAt)} → {formatDate(results.election.endsAt)}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-10">
        {results.races.map((race, raceIndex) => (
          <motion.div
            key={race.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * raceIndex }}
            className="rounded-ed-lg border border-ink/[0.08] bg-paper/60 backdrop-blur-md p-6 lg:p-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-ed-md border border-ink/[0.08] bg-ink/[0.02]">
                <Trophy className="h-6 w-6 text-ink/60" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-display text-display-sm font-bold text-ink">{race.title}</h2>
                <p className="font-mono text-[0.6875rem] text-ink/50">
                  {race.maxChoices} choice{race.maxChoices !== 1 ? 's' : ''} · {race.candidates.length} candidate
                  {race.candidates.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {race.candidates
                .sort((a, b) => b.votes - a.votes)
                .map((candidate, index) => (
                  <div key={candidate.id} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[0.6875rem] text-ink/40 w-6">
                          {index + 1}.
                        </span>
                        <span className="font-display text-body font-semibold text-ink">{candidate.name}</span>
                        {index === 0 && candidate.votes > 0 && (
                          <span className="font-mono text-[0.6875rem] text-amber-600">1st</span>
                        )}
                        {index === 1 && candidate.votes > 0 && (
                          <span className="font-mono text-[0.6875rem] text-ink/50">2nd</span>
                        )}
                        {index === 2 && candidate.votes > 0 && (
                          <span className="font-mono text-[0.6875rem] text-amber-700/80">3rd</span>
                        )}
                      </div>
                      <div className="font-mono text-body-sm text-ink/60">
                        {candidate.votes} votes
                        <span className="text-ink/45 ml-2">
                          ({getVotePercentage(candidate.votes, results.election.totalBallots)}%)
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={Number(getVotePercentage(candidate.votes, results.election.totalBallots))}
                      className="mt-1"
                    />
                  </div>
                ))}
            </div>

            {race.candidates.every((c) => c.votes === 0) && (
              <p className="font-mono text-body-sm text-ink/50 text-center py-8">
                No votes have been cast for this race yet.
              </p>
            )}
          </motion.div>
        ))}
      </div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pt-8 border-t border-ink/[0.08] flex flex-wrap justify-center gap-6 font-mono text-[0.6875rem] text-ink/45"
      >
        <span className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5" strokeWidth={2} />
          {results.election.totalBallots} votes cast
        </span>
        <span className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
          Ended {formatDate(results.election.endsAt)}
        </span>
      </motion.footer>
    </div>
  )
}

export default ElectionResults
