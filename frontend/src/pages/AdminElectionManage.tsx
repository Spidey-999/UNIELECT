import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Users, Calendar, BarChart3, Trash2, Pencil, Plus, Upload, Activity, Shield, X, Save
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

const inputBase =
  'flex h-11 w-full rounded-ed-md border border-ink/[0.1] bg-paper px-4 font-mono text-body-sm placeholder:text-ink/40 focus:outline-none focus:border-ink/[0.3]'
const labelClass = 'block font-mono text-[0.6875rem] uppercase tracking-wider text-ink/60 mb-2'

interface Candidate {
  id: string
  name: string
  bio?: string | null
  photoUrl?: string | null
}

interface Race {
  id: string
  title: string
  maxChoices: number
  description?: string | null
  candidates: Candidate[]
}

interface Election {
  id: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  races: Race[]
  _count: { ballots: number; tokens: number; eligibleStudents?: number }
}

interface ActivityData {
  election: { totalBallots: number; eligibleCount: number; verifiedCount: number; title: string; startsAt: string; endsAt: string }
  recentBallots: Array<{ id: string; castAt: string; externalId: string; phoneLast4: string }>
  raceProgress: Array<{ id: string; title: string; candidates: Array<{ id: string; name: string; votes: number }> }>
}

const AdminElectionManage = () => {
  const { id } = useParams<{ id: string }>()
  const [election, setElection] = useState<Election | null>(null)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '', startsAt: '', endsAt: '' })
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showActivity, setShowActivity] = useState(true)
  const [expandedRace, setExpandedRace] = useState<string | null>(null)
  const [newCandidate, setNewCandidate] = useState<Record<string, string>>({})

  const fetchElection = useCallback(async () => {
    if (!id) return
    try {
      const res = await apiService.getAdminElections()
      const elections = res.data as Election[]
      const el = elections.find((e) => e.id === id)
      setElection(el || null)
      if (el) {
        setEditForm({
          title: el.title,
          description: el.description || '',
          startsAt: el.startsAt.slice(0, 16),
          endsAt: el.endsAt.slice(0, 16),
        })
      }
    } catch {
      setAlert({ type: 'error', message: 'Failed to load election' })
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchActivity = useCallback(async () => {
    if (!id) return
    try {
      const res = await apiService.getElectionActivity(id)
      setActivity(res.data as ActivityData)
    } catch {
      // ignore - activity is optional
    }
  }, [id])

  useEffect(() => {
    fetchElection()
  }, [fetchElection])

  useEffect(() => {
    if (id && election) fetchActivity()
  }, [id, election, fetchActivity])

  const handleSaveElection = async () => {
    if (!id) return
    try {
      await apiService.updateElection(id, {
        title: editForm.title,
        description: editForm.description,
        startsAt: editForm.startsAt,
        endsAt: editForm.endsAt,
      })
      setEditing(false)
      fetchElection()
      setAlert({ type: 'success', message: 'Election updated' })
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err.response as { data?: { error?: string } })?.data?.error
        : undefined
      setAlert({ type: 'error', message: msg || 'Failed to update' })
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      setDeleting(true)
      await apiService.deleteElection(id)
      window.location.href = '/admin'
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err.response as { data?: { error?: string } })?.data?.error
        : undefined
      setAlert({ type: 'error', message: msg || 'Failed to delete' })
      setDeleting(false)
    }
  }

  const handleUploadEligibility = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    try {
      setUploading(true)
      await apiService.uploadEligibility(id, file)
      fetchElection()
      setAlert({ type: 'success', message: 'Eligibility list uploaded successfully' })
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err.response as { data?: { error?: string } })?.data?.error
        : undefined
      setAlert({ type: 'error', message: msg || 'Failed to upload' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleAddCandidate = async (raceId: string) => {
    const name = newCandidate[raceId]?.trim()
    if (!name || !id) return
    try {
      await apiService.addCandidate(id, raceId, { name })
      setNewCandidate((prev) => ({ ...prev, [raceId]: '' }))
      setExpandedRace(null)
      fetchElection()
      setAlert({ type: 'success', message: 'Candidate added' })
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err.response as { data?: { error?: string } })?.data?.error
        : undefined
      setAlert({ type: 'error', message: msg || 'Failed to add candidate' })
    }
  }

  const handleRemoveCandidate = async (raceId: string, candidateId: string) => {
    if (!id || !confirm('Remove this candidate? Votes for them will remain but they will no longer appear.')) return
    try {
      await apiService.removeCandidate(id, raceId, candidateId)
      fetchElection()
      fetchActivity()
      setAlert({ type: 'success', message: 'Candidate removed' })
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err.response as { data?: { error?: string } })?.data?.error
        : undefined
      setAlert({ type: 'error', message: msg || 'Failed to remove' })
    }
  }

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!election) {
    return (
      <div className="text-center py-16">
        <h1 className="font-display text-display-md font-bold text-ink mb-4">Election Not Found</h1>
        <Link to="/admin">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <header className="flex flex-col gap-4">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 font-mono text-body-sm text-ink/55 hover:text-ink transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            {editing ? (
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    className={`${inputBase} py-3`}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Start</label>
                    <input
                      type="datetime-local"
                      value={editForm.startsAt}
                      onChange={(e) => setEditForm((f) => ({ ...f, startsAt: e.target.value }))}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>End</label>
                    <input
                      type="datetime-local"
                      value={editForm.endsAt}
                      onChange={(e) => setEditForm((f) => ({ ...f, endsAt: e.target.value }))}
                      className={inputBase}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveElection} className="gap-2">
                    <Save className="h-4 w-4" strokeWidth={2} />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-display-lg font-bold tracking-tighter text-ink mb-2">
                  {election.title}
                </h1>
                <p className="font-mono text-body-sm text-ink/55 mb-4 max-w-2xl">{election.description}</p>
                <div className="flex flex-wrap gap-6 font-mono text-[0.6875rem] text-ink/50">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" strokeWidth={1.5} />
                    {formatDate(election.startsAt)} → {formatDate(election.endsAt)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" strokeWidth={1.5} />
                    {election._count.ballots} votes
                  </span>
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" strokeWidth={1.5} />
                    {election.races.length} race{election.races.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {!editing && (
              <Button variant="outline" onClick={() => setEditing(true)} className="gap-2">
                <Pencil className="h-4 w-4" strokeWidth={2} />
                Edit Election
              </Button>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleUploadEligibility}
                disabled={uploading}
              />
              <span className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-ed-md border border-ink/[0.15] bg-transparent text-ink hover:bg-ink/[0.04] font-mono text-body-sm tracking-wide transition-all">
                <Upload className="h-4 w-4" strokeWidth={2} />
                {uploading ? 'Uploading...' : 'Upload Eligibility'}
              </span>
            </label>
            <Link to={`/elections/${id}/results`}>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" strokeWidth={2} />
                View Results
              </Button>
            </Link>
            {!deleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(true)}
                className="text-red-600 border-red-500/30 hover:bg-red-500/5 gap-2"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
                Delete
              </Button>
            ) : (
              <div className="flex gap-2 items-center">
                <span className="font-mono text-[0.6875rem] text-ink/60">Confirm delete?</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 border-red-500/50 hover:bg-red-500/10"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Voter activity & live progress */}
      <Card className="p-6">
        <button
          onClick={() => setShowActivity(!showActivity)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="font-display text-display-sm font-bold text-ink flex items-center gap-2">
            <Activity className="h-5 w-5" strokeWidth={2} />
            Voter Activity & Live Progress
            <span className="ml-2 inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 live-pulse" />
              <span className="font-mono text-[0.6875rem] text-ink/50">Live</span>
            </span>
          </h2>
          <span className="font-mono text-[0.6875rem] text-ink/50">{showActivity ? 'Hide' : 'Show'}</span>
        </button>
        {showActivity && activity && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-ed-md border border-ink/[0.08] p-4">
                <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50 mb-1">Total Votes</p>
                <p className="font-display text-display-sm font-bold text-ink">{activity.election.totalBallots}</p>
              </div>
              <div className="rounded-ed-md border border-ink/[0.08] p-4">
                <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50 mb-1">Eligible</p>
                <p className="font-display text-display-sm font-bold text-ink">{activity.election.eligibleCount}</p>
              </div>
              <div className="rounded-ed-md border border-ink/[0.08] p-4">
                <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50 mb-1">Verified</p>
                <p className="font-display text-display-sm font-bold text-ink">{activity.election.verifiedCount}</p>
              </div>
              <div className="rounded-ed-md border border-ink/[0.08] p-4">
                <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink/50 mb-1">Races</p>
                <p className="font-display text-display-sm font-bold text-ink">{activity.raceProgress.length}</p>
              </div>
            </div>
            <div>
              <h3 className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink/60 mb-3">Recent Ballots</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activity.recentBallots.length === 0 ? (
                  <p className="font-mono text-body-sm text-ink/50">No ballots cast yet</p>
                ) : (
                  activity.recentBallots.map((b) => (
                    <div
                      key={b.id}
                      className="flex justify-between items-center py-2 border-b border-ink/[0.06] font-mono text-body-sm"
                    >
                      <span className="text-ink/70">{b.externalId}</span>
                      <span className="text-ink/45">{b.phoneLast4}</span>
                      <span className="text-ink/40 font-mono text-[0.6875rem]">
                        {formatDate(b.castAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            {activity.raceProgress.length > 0 && (
              <div>
                <h3 className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink/60 mb-3">Live Progress by Race</h3>
                <div className="space-y-4">
                  {activity.raceProgress.map((race) => (
                    <div key={race.id} className="rounded-ed-md border border-ink/[0.08] p-4">
                      <p className="font-mono text-body-sm font-medium text-ink mb-2">{race.title}</p>
                      <div className="space-y-2">
                        {race.candidates.slice(0, 5).map((c) => (
                          <div key={c.id} className="flex justify-between font-mono text-[0.6875rem] text-ink/70">
                            <span>{c.name}</span>
                            <span>{c.votes} votes</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </Card>

      {/* Manage candidates */}
      <div>
        <h2 className="font-display text-display-sm font-bold text-ink mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5" strokeWidth={2} />
          Manage Races & Candidates
        </h2>
        <div className="space-y-6">
          {election.races.map((race) => (
            <Card key={race.id} className="p-6">
              <h3 className="font-display text-display-sm font-bold text-ink mb-4">{race.title}</h3>
              <p className="font-mono text-[0.6875rem] text-ink/50 mb-4">
                Max {race.maxChoices} choice{race.maxChoices !== 1 ? 's' : ''} · {race.candidates.length} candidate
                {race.candidates.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2 mb-4">
                {race.candidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-ed-md border border-ink/[0.08] px-4 py-3"
                  >
                    <span className="font-mono text-body-sm text-ink">{c.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCandidate(race.id, c.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-500/5"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </Button>
                  </div>
                ))}
              </div>
              {expandedRace === race.id ? (
                <div className="flex gap-2">
                  <input
                    value={newCandidate[race.id] || ''}
                    onChange={(e) => setNewCandidate((p) => ({ ...p, [race.id]: e.target.value }))}
                    placeholder="Candidate name"
                    className={`${inputBase} flex-1`}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCandidate(race.id)}
                  />
                  <Button onClick={() => handleAddCandidate(race.id)} disabled={!newCandidate[race.id]?.trim()} className="gap-2">
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    Add
                  </Button>
                  <Button variant="outline" onClick={() => setExpandedRace(null)}>
                    <X className="h-4 w-4" strokeWidth={2} />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setExpandedRace(race.id)} className="gap-2">
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  Add Candidate
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminElectionManage
