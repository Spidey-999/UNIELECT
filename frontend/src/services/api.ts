import { useState, useEffect } from 'react'
import axios, { AxiosError } from 'axios'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken')
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
      localStorage.removeItem('adminToken')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

// Custom hook for API calls with loading and error states
export const useApi = <T = any>() => {
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
  getToken: (id: string, turnstileToken?: string) =>
    api.post(`/api/elections/${id}/get-token`, { turnstileToken }),
  castVote: (id: string, token: string, selections: any) =>
    api.post(`/api/elections/${id}/vote`, { token, selections }),
  getResults: (id: string) => api.get(`/api/elections/${id}/results`),

  // Admin
  getAdminElections: () => api.get('/api/admin/elections'),
  createElection: (electionData: any) => api.post('/api/admin/elections', electionData),
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
