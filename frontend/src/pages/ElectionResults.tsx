import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Calendar, Trophy, BarChart3 } from 'lucide-react'
import axios from 'axios'

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
  election: {
    id: string
    title: string
    totalBallots: number
    startsAt: string
    endsAt: string
  }
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
    try {
      const response = await axios.get(`/api/elections/${id}/results`)
      setResults(response.data)
    } catch (error: any) {
      if (error.response?.status === 403) {
        setError('Results are not available yet. Please check back after the election has ended.')
      } else {
        setError('Failed to load results')
      }
    } finally {
      setLoading(false)
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

  const getVotePercentage = (votes: number, totalBallots: number) => {
    if (totalBallots === 0) return 0
    return ((votes / totalBallots) * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
          <BarChart3 className="h-6 w-6 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Results Not Available</h1>
        <p className="text-gray-600 mb-6">{error || 'The election results could not be loaded.'}</p>
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
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{results.election.title}</h1>
        <p className="text-gray-600">Election Results</p>
      </div>

      <div className="card p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{results.election.totalBallots}</div>
            <div className="text-sm text-gray-600">Total Votes Cast</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{results.races.length}</div>
            <div className="text-sm text-gray-600">Races</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatDate(results.election.startsAt)} - {formatDate(results.election.endsAt)}
            </div>
            <div className="text-sm text-gray-600">Voting Period</div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {results.races.map((race, raceIndex) => (
          <div key={race.id} className="card p-6">
            <div className="flex items-center mb-6">
              <Trophy className="h-6 w-6 text-yellow-500 mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{race.title}</h2>
                <p className="text-gray-600">
                  Select {race.maxChoices} candidate{race.maxChoices > 1 ? 's' : ''} • {race.candidates.length} candidate{race.candidates.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {race.candidates
                .sort((a, b) => b.votes - a.votes)
                .map((candidate, index) => (
                  <div key={candidate.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 text-center">
                      {index === 0 && candidate.votes > 0 && (
                        <div className="text-yellow-500 font-bold">🏆</div>
                      )}
                      {index === 1 && candidate.votes > 0 && (
                        <div className="text-gray-400 font-bold">🥈</div>
                      )}
                      {index === 2 && candidate.votes > 0 && (
                        <div className="text-orange-600 font-bold">🥉</div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{candidate.name}</span>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-gray-900">{candidate.votes}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({getVotePercentage(candidate.votes, results.election.totalBallots)}%)
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${getVotePercentage(candidate.votes, results.election.totalBallots)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {race.candidates.every(c => c.votes === 0) && (
              <div className="text-center py-8 text-gray-500">
                No votes have been cast for this race yet.
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>Total turnout: {results.election.totalBallots} votes</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Results available after: {formatDate(results.election.endsAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElectionResults
