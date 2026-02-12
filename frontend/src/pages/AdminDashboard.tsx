import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Calendar, Download, Eye, LogOut, BarChart3 } from 'lucide-react'
import { apiService } from '../services/api'
import { useApi } from '../services/api'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'

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
    candidates: Array<{
      id: string
      name: string
    }>
  }>
  _count: {
    ballots: number
    tokens: number
  }
}

const AdminDashboard = () => {
  const { data: elections, loading, error, execute } = useApi<Election[]>()
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    fetchElections()
  }, [])

  const fetchElections = async () => {
    try {
      await execute(() => apiService.getAdminElections())
    } catch (error) {
      // Error is handled by useApi hook
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    window.location.href = '/admin/login'
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
    } catch (error: any) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Failed to export tokens' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)}
          className="mb-6"
        />
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage elections and view results</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/elections/create"
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Election</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="btn btn-secondary inline-flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {error && (
        <Alert 
          type="error" 
          message={error} 
          className="mb-6"
        />
      )}

      {!elections || elections.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <Calendar className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Elections Created</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first election.</p>
          <Link
            to="/admin/elections/create"
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Election</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {elections.map((election) => (
            <div key={election.id} className="card p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {isActive(election.startsAt, election.endsAt) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {formatDate(election.startsAt)} - {formatDate(election.endsAt)}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {election.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {election.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{election._count.ballots} votes cast</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>{election._count.tokens} tokens issued</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{election.races.length} race{election.races.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-2">
                  <Link
                    to={`/admin/elections/${election.id}/results`}
                    className="btn btn-secondary inline-flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Results</span>
                  </Link>
                  
                  <button
                    onClick={() => handleExportTokens(election.id)}
                    className="btn btn-secondary inline-flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Tokens</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
