import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Clock, Users, Calendar, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import axios from 'axios'

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
  const [showTokenForm, setShowTokenForm] = useState(false)
  const [selections, setSelections] = useState<{ [raceId: string]: string[] }>({})
  const [voting, setVoting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchElection()
  }, [id])

  const fetchElection = async () => {
    try {
      const response = await axios.get(`/api/elections/${id}`)
      setElection(response.data)
    } catch (error) {
      console.error('Failed to fetch election:', error)
      setMessage({ type: 'error', text: 'Failed to load election details' })
    } finally {
      setLoading(false)
    }
  }

  const getToken = async () => {
    try {
      const response = await axios.post(`/api/elections/${id}/get-token`)
      setToken(response.data.token)
      setShowTokenForm(false)
      setMessage({ type: 'success', text: 'Voting code received! You can now cast your vote.' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to get voting code' })
    }
  }

  const handleCandidateToggle = (raceId: string, candidateId: string) => {
    const race = election?.races.find(r => r.id === raceId)
    if (!race) return

    setSelections(prev => {
      const current = prev[raceId] || []
      const isSelected = current.includes(candidateId)

      if (isSelected) {
        return { ...prev, [raceId]: current.filter(id => id !== candidateId) }
      } else {
        if (current.length >= race.maxChoices) {
          setMessage({ type: 'error', text: `You can only select ${race.maxChoices} candidate${race.maxChoices > 1 ? 's' : ''} for ${race.title}` })
          return prev
        }
        return { ...prev, [raceId]: [...current, candidateId] }
      }
    })
  }

  const castVote = async () => {
    if (!token) {
      setShowTokenForm(true)
      return
    }

    const voteSelections = Object.entries(selections).map(([raceId, candidateIds]) => ({
      raceId,
      candidateIds
    }))

    try {
      setVoting(true)
      await axios.post(`/api/elections/${id}/vote`, {
        token,
        selections: voteSelections
      })
      
      setMessage({ type: 'success', text: 'Your vote has been cast successfully! Thank you for participating.' })
      setToken('')
      setSelections({})
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to cast vote' })
    } finally {
      setVoting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Election Not Found</h1>
        <p className="text-gray-600 mb-6">The election you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Elections
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Elections
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{election.title}</h1>
        <p className="text-gray-600 mb-4">{election.description}</p>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Voting: {formatDate(election.startsAt)} - {formatDate(election.endsAt)}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{election.isActive ? 'Active' : 'Not Active'}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{election.races.length} race{election.races.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {!election.isActive && (
        <div className="card p-6 mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center text-yellow-800">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Voting is not currently active for this election.</span>
          </div>
        </div>
      )}

      {election.isActive && (
        <div className="mb-6">
          {!token ? (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Your Voting Code</h2>
              <p className="text-gray-600 mb-4">
                To ensure fair voting, please request a unique voting code. This code can only be used once.
              </p>
              <button onClick={getToken} className="btn btn-primary">
                Get Voting Code
              </button>
            </div>
          ) : (
            <div className="card p-6 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Voting Code Received</h3>
                  <p className="text-green-600">You can now cast your vote below</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-8">
        {election.races.map((race) => (
          <div key={race.id} className="card p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{race.title}</h2>
              {race.description && (
                <p className="text-gray-600 mb-2">{race.description}</p>
              )}
              <p className="text-sm text-gray-500">
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
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!election.isActive ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        isSelected ? 'border-primary-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{candidate.name}</h3>
                        {candidate.bio && (
                          <p className="text-sm text-gray-600 mt-1">{candidate.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {election.isActive && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={castVote}
            disabled={voting || Object.keys(selections).length === 0}
            className="btn btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {voting ? 'Casting Vote...' : 'Cast Vote'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ElectionDetail
