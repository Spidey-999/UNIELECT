import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Users, Calendar, ChevronRight, TrendingUp, Sparkles } from 'lucide-react'
import { apiService } from '../services/api'
import Alert from '../components/Alert'

const ElectionsList = () => {
  const [elections, setElections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  useEffect(() => {
    fetchElections()
  }, [])

  const fetchElections = async () => {
    try {
      setLoading(true)
      const response = await apiService.getElections()
      setElections(response.data)
      setError(null)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch elections')
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

  const getTimeRemaining = (endsAt: string) => {
    const now = new Date()
    const end = new Date(endsAt)
    
    if (now > end) return 'Ended'
    
    const diff = end.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`
    return 'Less than 1 hour left'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-indigo-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-lg text-gray-600 animate-pulse-slow">Loading elections...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert 
            type="error" 
            message={error}
            className="animate-fade-in-up"
          />
        </div>
      </div>
    )
  }

  if (!elections || elections.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-2xl bg-gray-200 mb-6 animate-float">
            <Calendar className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-down">No Elections Available</h1>
          <p className="text-lg text-gray-600 mb-8 animate-slide-in-left">Check back later for upcoming elections.</p>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 animate-fade-in-up">
            <div className="flex items-center space-x-4 text-gray-700">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <span className="text-sm">Stay tuned for new elections!</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50 animate-fade-in-down">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center animate-float">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Student Elections</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Participate in shaping your</span>
              <span className="text-sm font-semibold text-indigo-600">student community</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className="container mx-auto px-4 py-4">
          <Alert 
            type={alert.type} 
            message={alert.message} 
            onClose={() => setAlert(null)}
            className="animate-fade-in-down"
          />
        </div>
      )}

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="text-gradient">Active Elections</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cast your vote and make your voice heard in shaping the future of our student community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections.map((election: any, index: number) => (
            <article 
              key={election.id} 
              className={`card-modern p-6 cursor-pointer transition-all duration-300 animate-fade-in-up ${
                hoveredCard === election.id ? 'transform scale-105 shadow-2xl' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onMouseEnter={() => setHoveredCard(election.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Status badge */}
              <div className="flex justify-between items-start mb-4">
                {election.isActive && (
                  <span 
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 animate-pulse-slow"
                    aria-label="Election is currently active"
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    Live
                  </span>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">{getTimeRemaining(election.endsAt)}</span>
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                {election.title}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 mb-6 line-clamp-3">
                {election.description}
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-indigo-600 mx-auto mb-1" aria-hidden="true" />
                  <p className="text-xs text-gray-600">Start Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(election.startsAt)}</p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600 mx-auto mb-1" aria-hidden="true" />
                  <p className="text-xs text-gray-600">Turnout</p>
                  <p className="text-sm font-semibold text-gray-900">{election.turnout}</p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600 mx-auto mb-1" aria-hidden="true" />
                  <p className="text-xs text-gray-600">Races</p>
                  <p className="text-sm font-semibold text-gray-900">{election.races.length}</p>
                </div>
              </div>
              
              {/* Action button */}
              <Link
                to={`/elections/${election.id}`}
                className="btn-glow w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 inline-flex items-center justify-center"
                aria-label={`View details for ${election.title}`}
              >
                <span>{election.isActive ? 'Vote Now' : 'View Details'}</span>
                <ChevronRight className="h-4 w-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-white/20 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">© 2026 Student Election System. Empowering democratic participation.</p>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <span className="text-xs">Secure</span>
              <span className="text-xs">•</span>
              <span className="text-xs">Anonymous</span>
              <span className="text-xs">•</span>
              <span className="text-xs">Accessible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElectionsList
