import { useState } from 'react'
import axios, { AxiosError } from 'axios'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token (admin or user)
api.interceptors.request.use(
  (config) => {
    const isUserRoute = config.url?.startsWith('/api/users')
    const token = isUserRoute
      ? localStorage.getItem('userToken') ?? localStorage.getItem('adminToken')
      : localStorage.getItem('adminToken') ?? localStorage.getItem('userToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isAdminRoute = error.config?.url?.startsWith('/api/auth') || error.config?.url?.startsWith('/api/admin')
      if (isAdminRoute) {
        localStorage.removeItem('adminToken')
        window.location.href = '/admin/login'
      } else {
        localStorage.removeItem('userToken')
        localStorage.removeItem('user')
      }
    }
    return Promise.reject(error)
  }
)

// Custom hook for API calls with loading and error states
export const useApi = <T = unknown>() => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async (apiCall: () => Promise<T>) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      setData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof AxiosError 
        ? err.response?.data?.error || err.message
        : 'An unexpected error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setData(null)
    setError(null)
    setLoading(false)
  }

  return { data, loading, error, execute, reset }
}

// API service functions
export const apiService = {
  // Auth
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  // Elections
  getElections: () => api.get('/api/elections'),
  getElection: (id: string) => api.get(`/api/elections/${id}`),
  requestCode: (id: string, externalId: string, phoneNumber: string) =>
    api.post(`/api/elections/${id}/request-code`, { externalId, phoneNumber }),
  verifyCode: (id: string, externalId: string, phoneNumber: string, code: string) =>
    api.post(`/api/elections/${id}/verify-code`, { externalId, phoneNumber, code }),
  castVote: (id: string, token: string, selections: Array<{ raceId: string; candidateIds: string[] }>) =>
    api.post(`/api/elections/${id}/vote`, { token, selections }),
  getResults: (id: string) => api.get(`/api/elections/${id}/results`),

  // Admin
  getAdminElections: () => api.get('/api/admin/elections'),
  createElection: (electionData: Record<string, unknown>) => api.post('/api/admin/elections', electionData),
  updateElection: (id: string, data: { title?: string; description?: string; startsAt?: string; endsAt?: string }) =>
    api.put(`/api/admin/elections/${id}`, data),
  deleteElection: (id: string) => api.delete(`/api/admin/elections/${id}`),
  updateRace: (electionId: string, raceId: string, data: { title?: string; maxChoices?: number; description?: string }) =>
    api.patch(`/api/admin/elections/${electionId}/races/${raceId}`, data),
  addCandidate: (electionId: string, raceId: string, data: { name: string; bio?: string; photoUrl?: string }) =>
    api.post(`/api/admin/elections/${electionId}/races/${raceId}/candidates`, data),
  updateCandidate: (electionId: string, raceId: string, candidateId: string, data: { name?: string; bio?: string; photoUrl?: string }) =>
    api.patch(`/api/admin/elections/${electionId}/races/${raceId}/candidates/${candidateId}`, data),
  removeCandidate: (electionId: string, raceId: string, candidateId: string) =>
    api.delete(`/api/admin/elections/${electionId}/races/${raceId}/candidates/${candidateId}`),
  getElectionActivity: (id: string) => api.get(`/api/admin/elections/${id}/activity`),
  getAuditLog: (electionId?: string, limit?: number) =>
    api.get('/api/admin/audit-log', { params: { electionId, limit } }),
  uploadEligibility: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('csv', file)
    return api.post(`/api/admin/elections/${id}/eligibility`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  generateTokens: (id: string, method: string, count?: number) =>
    api.post(`/api/admin/elections/${id}/tokens`, { method, count }),
  getAdminResults: (id: string) => api.get(`/api/admin/elections/${id}/results`),
}

export default api
