import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { apiService } from '../services/api'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'

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
  races?: { [key: number]: { title?: string, maxChoices?: string } }
}

const CreateElection = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  
  const [election, setElection] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: ''
  })
  
  const [races, setRaces] = useState<Race[]>([
    {
      title: '',
      maxChoices: 1,
      description: '',
      candidates: [{ name: '', bio: '', photoUrl: '' }]
    }
  ])

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    
    if (!election.title.trim()) {
      errors.title = 'Title is required'
    }
    
    if (!election.description.trim()) {
      errors.description = 'Description is required'
    }
    
    if (!election.startsAt) {
      errors.startsAt = 'Start time is required'
    }
    
    if (!election.endsAt) {
      errors.endsAt = 'End time is required'
    }
    
    if (election.startsAt && election.endsAt && new Date(election.startsAt) >= new Date(election.endsAt)) {
      errors.endsAt = 'End time must be after start time'
    }
    
    const raceErrors: { [key: number]: { title?: string, maxChoices?: string } } = {}
    races.forEach((race, index) => {
      if (race.title.trim()) {
        if (race.maxChoices < 1) {
          raceErrors[index] = { ...raceErrors[index], maxChoices: 'Max choices must be at least 1' }
        }
        
        const validCandidates = race.candidates.filter(c => c.name.trim())
        if (validCandidates.length < race.maxChoices) {
          raceErrors[index] = { ...raceErrors[index], title: `Need at least ${race.maxChoices} candidates` }
        }
      }
    })
    
    if (Object.keys(raceErrors).length > 0) {
      errors.races = raceErrors
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setError('')

    try {
      await apiService.createElection({
        ...election,
        races: races.filter(race => race.title.trim() !== '')
      })
      navigate('/admin')
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create election')
    } finally {
      setLoading(false)
    }
  }

  const addRace = () => {
    setRaces([...races, {
      title: '',
      maxChoices: 1,
      description: '',
      candidates: [{ name: '', bio: '', photoUrl: '' }]
    }])
  }

  const removeRace = (index: number) => {
    setRaces(races.filter((_, i) => i !== index))
    // Clear errors for this race
    const newErrors = { ...formErrors }
    if (newErrors.races) {
      delete newErrors.races[index]
    }
    setFormErrors(newErrors)
  }

  const updateRace = (index: number, field: keyof Race, value: any) => {
    const newRaces = [...races]
    newRaces[index] = { ...newRaces[index], [field]: value }
    setRaces(newRaces)
    
    // Clear race-specific errors when user makes changes
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
    newRaces[raceIndex].candidates[candidateIndex] = { ...newRaces[raceIndex].candidates[candidateIndex], [field]: value }
    setRaces(newRaces)
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Election</h1>
        <p className="text-gray-600">Set up a new election with races and candidates</p>
      </div>

      {error && (
        <Alert 
          type="error" 
          message={error} 
          onClose={() => setError('')}
          className="mb-6"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Election Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="label">
                Title <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                aria-describedby={formErrors.title ? 'title-error' : undefined}
                className={`input ${formErrors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
                value={election.title}
                onChange={(e) => {
                  setElection({ ...election, title: e.target.value })
                  if (formErrors.title) {
                    setFormErrors({ ...formErrors, title: undefined })
                  }
                }}
                placeholder="e.g., Student Council Election 2024"
              />
              {formErrors.title && (
                <p id="title-error" className="mt-1 text-sm text-red-600">
                  {formErrors.title}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="label">
                Description <span className="text-red-500" aria-label="required">*</span>
              </label>
              <textarea
                id="description"
                required
                rows={3}
                aria-describedby={formErrors.description ? 'description-error' : undefined}
                className={`input ${formErrors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                value={election.description}
                onChange={(e) => {
                  setElection({ ...election, description: e.target.value })
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: undefined })
                  }
                }}
                placeholder="Describe the election purpose and details"
              />
              {formErrors.description && (
                <p id="description-error" className="mt-1 text-sm text-red-600">
                  {formErrors.description}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="startsAt" className="label">
                Start Time <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="startsAt"
                type="datetime-local"
                required
                aria-describedby={formErrors.startsAt ? 'startsAt-error' : undefined}
                className={`input ${formErrors.startsAt ? 'border-red-500 focus:ring-red-500' : ''}`}
                value={election.startsAt}
                onChange={(e) => {
                  setElection({ ...election, startsAt: e.target.value })
                  if (formErrors.startsAt || formErrors.endsAt) {
                    setFormErrors({ ...formErrors, startsAt: undefined, endsAt: undefined })
                  }
                }}
              />
              {formErrors.startsAt && (
                <p id="startsAt-error" className="mt-1 text-sm text-red-600">
                  {formErrors.startsAt}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="endsAt" className="label">
                End Time <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="endsAt"
                type="datetime-local"
                required
                aria-describedby={formErrors.endsAt ? 'endsAt-error' : undefined}
                className={`input ${formErrors.endsAt ? 'border-red-500 focus:ring-red-500' : ''}`}
                value={election.endsAt}
                onChange={(e) => {
                  setElection({ ...election, endsAt: e.target.value })
                  if (formErrors.startsAt || formErrors.endsAt) {
                    setFormErrors({ ...formErrors, startsAt: undefined, endsAt: undefined })
                  }
                }}
              />
              {formErrors.endsAt && (
                <p id="endsAt-error" className="mt-1 text-sm text-red-600">
                  {formErrors.endsAt}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Races & Candidates</h2>
            <button
              type="button"
              onClick={addRace}
              className="btn btn-secondary inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Race</span>
            </button>
          </div>

          {races.map((race, raceIndex) => (
            <div key={raceIndex} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Race {raceIndex + 1}</h3>
                {races.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRace(raceIndex)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    aria-label={`Remove race ${raceIndex + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label htmlFor={`race-title-${raceIndex}`} className="label">
                    Race Title <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id={`race-title-${raceIndex}`}
                    type="text"
                    required
                    aria-describedby={formErrors.races?.[raceIndex]?.title ? `race-title-${raceIndex}-error` : undefined}
                    className={`input ${formErrors.races?.[raceIndex]?.title ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={race.title}
                    onChange={(e) => updateRace(raceIndex, 'title', e.target.value)}
                    placeholder="e.g., President"
                  />
                  {formErrors.races?.[raceIndex]?.title && (
                    <p id={`race-title-${raceIndex}-error`} className="mt-1 text-sm text-red-600">
                      {formErrors.races[raceIndex].title}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor={`race-maxChoices-${raceIndex}`} className="label">
                    Max Choices <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id={`race-maxChoices-${raceIndex}`}
                    type="number"
                    required
                    min="1"
                    aria-describedby={formErrors.races?.[raceIndex]?.maxChoices ? `race-maxChoices-${raceIndex}-error` : undefined}
                    className={`input ${formErrors.races?.[raceIndex]?.maxChoices ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={race.maxChoices}
                    onChange={(e) => updateRace(raceIndex, 'maxChoices', parseInt(e.target.value))}
                  />
                  {formErrors.races?.[raceIndex]?.maxChoices && (
                    <p id={`race-maxChoices-${raceIndex}-error`} className="mt-1 text-sm text-red-600">
                      {formErrors.races[raceIndex].maxChoices}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor={`race-description-${raceIndex}`} className="label">
                    Description (Optional)
                  </label>
                  <input
                    id={`race-description-${raceIndex}`}
                    type="text"
                    className="input"
                    value={race.description}
                    onChange={(e) => updateRace(raceIndex, 'description', e.target.value)}
                    placeholder="Race description"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-md font-medium text-gray-700">Candidates</h4>
                  <button
                    type="button"
                    onClick={() => addCandidate(raceIndex)}
                    className="btn btn-secondary inline-flex items-center space-x-2 text-sm"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Candidate</span>
                  </button>
                </div>

                {race.candidates.map((candidate, candidateIndex) => (
                  <div key={candidateIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-700">Candidate {candidateIndex + 1}</span>
                      {race.candidates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCandidate(raceIndex, candidateIndex)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          aria-label={`Remove candidate ${candidateIndex + 1}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor={`candidate-name-${raceIndex}-${candidateIndex}`} className="label">
                          Name <span className="text-red-500" aria-label="required">*</span>
                        </label>
                        <input
                          id={`candidate-name-${raceIndex}-${candidateIndex}`}
                          type="text"
                          required
                          className="input"
                          value={candidate.name}
                          onChange={(e) => updateCandidate(raceIndex, candidateIndex, 'name', e.target.value)}
                          placeholder="Candidate name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`candidate-bio-${raceIndex}-${candidateIndex}`} className="label">
                          Bio (Optional)
                        </label>
                        <input
                          id={`candidate-bio-${raceIndex}-${candidateIndex}`}
                          type="text"
                          className="input"
                          value={candidate.bio}
                          onChange={(e) => updateCandidate(raceIndex, candidateIndex, 'bio', e.target.value)}
                          placeholder="Brief bio"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`candidate-photo-${raceIndex}-${candidateIndex}`} className="label">
                          Photo URL (Optional)
                        </label>
                        <input
                          id={`candidate-photo-${raceIndex}-${candidateIndex}`}
                          type="url"
                          className="input"
                          value={candidate.photoUrl}
                          onChange={(e) => updateCandidate(raceIndex, candidateIndex, 'photoUrl', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="border-white" />
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Create Election
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateElection
