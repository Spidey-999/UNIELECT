import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

interface Candidate {
  name: string
  bio: string
  photoUrl: string
}

interface Race {
  title: string
  maxChoices: number
  description: string
  candidates: Candidate[]
}

interface FormErrors {
  title?: string
  description?: string
  startsAt?: string
  endsAt?: string
  races?: { [key: number]: { title?: string; maxChoices?: string } }
}

const inputBase =
  'flex h-11 w-full rounded-ed-md border border-ink/[0.1] bg-paper px-4 font-mono text-body-sm placeholder:text-ink/40 focus:outline-none focus:border-ink/[0.3] disabled:opacity-50'
const inputError = 'border-red-500/50 focus:border-red-500/70'
const labelClass = 'block font-mono text-[0.6875rem] uppercase tracking-wider text-ink/60 mb-2'

const CreateElection = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const [election, setElection] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
  })

  const [races, setRaces] = useState<Race[]>([
    { title: '', maxChoices: 1, description: '', candidates: [{ name: '', bio: '', photoUrl: '' }] },
  ])

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    if (!election.title.trim()) errors.title = 'Title is required'
    if (!election.description.trim()) errors.description = 'Description is required'
    if (!election.startsAt) errors.startsAt = 'Start time is required'
    if (!election.endsAt) errors.endsAt = 'End time is required'
    if (election.startsAt && election.endsAt && new Date(election.startsAt) >= new Date(election.endsAt)) {
      errors.endsAt = 'End time must be after start time'
    }
    const raceErrors: { [key: number]: { title?: string; maxChoices?: string } } = {}
    races.forEach((race, index) => {
      if (race.title.trim()) {
        if (race.maxChoices < 1) raceErrors[index] = { ...raceErrors[index], maxChoices: 'Max choices must be at least 1' }
        const validCandidates = race.candidates.filter((c) => c.name.trim())
        if (validCandidates.length < race.maxChoices) {
          raceErrors[index] = { ...raceErrors[index], title: `Need at least ${race.maxChoices} candidates` }
        }
      }
    })
    if (Object.keys(raceErrors).length > 0) errors.races = raceErrors
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    setError('')
    try {
      await apiService.createElection({
        ...election,
        races: races.filter((race) => race.title.trim() !== ''),
      })
      navigate('/admin')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err.response as { data?: { error?: string } })?.data?.error
          : undefined
      setError(msg || 'Failed to create election')
    } finally {
      setLoading(false)
    }
  }

  const addRace = () =>
    setRaces([
      ...races,
      { title: '', maxChoices: 1, description: '', candidates: [{ name: '', bio: '', photoUrl: '' }] },
    ])

  const removeRace = (index: number) => {
    setRaces(races.filter((_, i) => i !== index))
    const newErrors = { ...formErrors }
    if (newErrors.races) delete newErrors.races[index]
    setFormErrors(newErrors)
  }

  const updateRace = (index: number, field: keyof Race, value: string | number) => {
    const newRaces = [...races]
    newRaces[index] = { ...newRaces[index], [field]: value }
    setRaces(newRaces)
    if (formErrors.races?.[index]) {
      const newErrors = { ...formErrors }
      delete newErrors.races![index]
      setFormErrors(newErrors)
    }
  }

  const addCandidate = (raceIndex: number) => {
    const newRaces = [...races]
    newRaces[raceIndex].candidates.push({ name: '', bio: '', photoUrl: '' })
    setRaces(newRaces)
  }

  const removeCandidate = (raceIndex: number, candidateIndex: number) => {
    const newRaces = [...races]
    newRaces[raceIndex].candidates = newRaces[raceIndex].candidates.filter((_, i) => i !== candidateIndex)
    setRaces(newRaces)
  }

  const updateCandidate = (raceIndex: number, candidateIndex: number, field: keyof Candidate, value: string) => {
    const newRaces = [...races]
    newRaces[raceIndex].candidates[candidateIndex] = {
      ...newRaces[raceIndex].candidates[candidateIndex],
      [field]: value,
    }
    setRaces(newRaces)
  }

  return (
    <div className="space-y-10">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 font-mono text-body-sm text-ink/55 hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to Dashboard
        </button>
        <h1 className="font-display text-display-lg font-bold tracking-tighter text-ink mb-2">Create Election</h1>
        <p className="font-mono text-body-sm text-ink/55">Set up a new election with races and candidates</p>
      </motion.header>

      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          <Card className="p-6 lg:p-8">
            <h2 className="font-display text-display-sm font-bold text-ink mb-6">Election Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className={labelClass}>Title *</label>
                <input
                  id="title"
                  type="text"
                  required
                  value={election.title}
                  onChange={(e) => {
                    setElection({ ...election, title: e.target.value })
                    if (formErrors.title) setFormErrors({ ...formErrors, title: undefined })
                  }}
                  className={`${inputBase} ${formErrors.title ? inputError : ''}`}
                  placeholder="e.g., Student Council Election 2024"
                />
                {formErrors.title && <p className="mt-1.5 font-mono text-[0.6875rem] text-red-600">{formErrors.title}</p>}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className={labelClass}>Description *</label>
                <textarea
                  id="description"
                  required
                  rows={3}
                  value={election.description}
                  onChange={(e) => {
                    setElection({ ...election, description: e.target.value })
                    if (formErrors.description) setFormErrors({ ...formErrors, description: undefined })
                  }}
                  className={`${inputBase} py-3 ${formErrors.description ? inputError : ''}`}
                  placeholder="Describe the election purpose and details"
                />
                {formErrors.description && <p className="mt-1.5 font-mono text-[0.6875rem] text-red-600">{formErrors.description}</p>}
              </div>
              <div>
                <label htmlFor="startsAt" className={labelClass}>Start Time *</label>
                <input
                  id="startsAt"
                  type="datetime-local"
                  required
                  value={election.startsAt}
                  onChange={(e) => {
                    setElection({ ...election, startsAt: e.target.value })
                    setFormErrors({ ...formErrors, startsAt: undefined, endsAt: undefined })
                  }}
                  className={`${inputBase} ${formErrors.startsAt ? inputError : ''}`}
                />
                {formErrors.startsAt && <p className="mt-1.5 font-mono text-[0.6875rem] text-red-600">{formErrors.startsAt}</p>}
              </div>
              <div>
                <label htmlFor="endsAt" className={labelClass}>End Time *</label>
                <input
                  id="endsAt"
                  type="datetime-local"
                  required
                  value={election.endsAt}
                  onChange={(e) => {
                    setElection({ ...election, endsAt: e.target.value })
                    setFormErrors({ ...formErrors, startsAt: undefined, endsAt: undefined })
                  }}
                  className={`${inputBase} ${formErrors.endsAt ? inputError : ''}`}
                />
                {formErrors.endsAt && <p className="mt-1.5 font-mono text-[0.6875rem] text-red-600">{formErrors.endsAt}</p>}
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="font-display text-display-sm font-bold text-ink">Races & Candidates</h2>
            <Button variant="outline" type="button" onClick={addRace} className="gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add Race
            </Button>
          </div>

          {races.map((race, raceIndex) => (
            <motion.div
              key={raceIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.02 * raceIndex }}
            >
              <Card className="p-6 lg:p-8">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-display text-display-sm font-bold text-ink">Race {raceIndex + 1}</h3>
                  {races.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRace(raceIndex)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      aria-label={`Remove race ${raceIndex + 1}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label htmlFor={`race-title-${raceIndex}`} className={labelClass}>Race Title *</label>
                    <input
                      id={`race-title-${raceIndex}`}
                      type="text"
                      required
                      value={race.title}
                      onChange={(e) => updateRace(raceIndex, 'title', e.target.value)}
                      className={`${inputBase} ${formErrors.races?.[raceIndex]?.title ? inputError : ''}`}
                      placeholder="e.g., President"
                    />
                    {formErrors.races?.[raceIndex]?.title && (
                      <p className="mt-1.5 font-mono text-[0.6875rem] text-red-600">{formErrors.races[raceIndex].title}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`race-maxChoices-${raceIndex}`} className={labelClass}>Max Choices *</label>
                    <input
                      id={`race-maxChoices-${raceIndex}`}
                      type="number"
                      required
                      min={1}
                      value={race.maxChoices}
                      onChange={(e) => updateRace(raceIndex, 'maxChoices', parseInt(e.target.value, 10) || 1)}
                      className={`${inputBase} ${formErrors.races?.[raceIndex]?.maxChoices ? inputError : ''}`}
                    />
                    {formErrors.races?.[raceIndex]?.maxChoices && (
                      <p className="mt-1.5 font-mono text-[0.6875rem] text-red-600">{formErrors.races[raceIndex].maxChoices}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`race-description-${raceIndex}`} className={labelClass}>Description (Optional)</label>
                    <input
                      id={`race-description-${raceIndex}`}
                      type="text"
                      value={race.description}
                      onChange={(e) => updateRace(raceIndex, 'description', e.target.value)}
                      className={inputBase}
                      placeholder="Race description"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink/60">Candidates</h4>
                    <Button variant="secondary" type="button" size="sm" onClick={() => addCandidate(raceIndex)} className="gap-2">
                      <Plus className="h-3 w-3" strokeWidth={2} />
                      Add Candidate
                    </Button>
                  </div>

                  {race.candidates.map((candidate, candidateIndex) => (
                    <div
                      key={candidateIndex}
                      className="rounded-ed-md border border-ink/[0.08] p-4 bg-ink/[0.02]"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-[0.6875rem] text-ink/50">Candidate {candidateIndex + 1}</span>
                        {race.candidates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCandidate(raceIndex, candidateIndex)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            aria-label={`Remove candidate ${candidateIndex + 1}`}
                          >
                            <Trash2 className="h-3 w-3" strokeWidth={2} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor={`candidate-name-${raceIndex}-${candidateIndex}`} className={labelClass}>Name *</label>
                          <input
                            id={`candidate-name-${raceIndex}-${candidateIndex}`}
                            type="text"
                            required
                            value={candidate.name}
                            onChange={(e) => updateCandidate(raceIndex, candidateIndex, 'name', e.target.value)}
                            className={inputBase}
                            placeholder="Candidate name"
                          />
                        </div>
                        <div>
                          <label htmlFor={`candidate-bio-${raceIndex}-${candidateIndex}`} className={labelClass}>Bio (Optional)</label>
                          <input
                            id={`candidate-bio-${raceIndex}-${candidateIndex}`}
                            type="text"
                            value={candidate.bio}
                            onChange={(e) => updateCandidate(raceIndex, candidateIndex, 'bio', e.target.value)}
                            className={inputBase}
                            placeholder="Brief bio"
                          />
                        </div>
                        <div>
                          <label htmlFor={`candidate-photo-${raceIndex}-${candidateIndex}`} className={labelClass}>Photo URL (Optional)</label>
                          <input
                            id={`candidate-photo-${raceIndex}-${candidateIndex}`}
                            type="url"
                            value={candidate.photoUrl}
                            onChange={(e) => updateCandidate(raceIndex, candidateIndex, 'photoUrl', e.target.value)}
                            className={inputBase}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button type="submit" disabled={loading} size="lg" className="gap-2 px-12">
            {loading ? (
              <LoadingSpinner size="sm" className="border-paper/30 border-t-paper" />
            ) : (
              <>
                <Save className="h-5 w-5" strokeWidth={2} />
                Create Election
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateElection
