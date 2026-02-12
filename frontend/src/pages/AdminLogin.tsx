import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react'
import { apiService } from '../services/api'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'
import '../styles/animations.css'

const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFocused, setIsFocused] = useState<string | null>(null)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiService.login(email, password)
      localStorage.setItem('adminToken', response.data.token)
      navigate('/admin')
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="card-modern p-8 animate-fade-in-up">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-6 animate-float">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in-down">
              Welcome Back
            </h1>
            <p className="text-white/80 text-sm animate-slide-in-left">
              Sign in to manage elections
            </p>
          </div>

          {/* Alert */}
          {error && (
            <div className="mb-6 animate-fade-in-down">
              <Alert 
                type="error" 
                message={error} 
                onClose={() => setError('')}
                className="glass-dark"
              />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-4">
              {/* Email field */}
              <div className="animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`input-modern transition-all duration-300 ${
                      isFocused === 'email' ? 'ring-2 ring-white/50' : ''
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused('email')}
                    onBlur={() => setIsFocused('')}
                    placeholder="admin@school.edu"
                    aria-describedby={error ? 'email-error' : undefined}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Sparkles className="h-4 w-4 text-white/40" />
                  </div>
                </div>
              </div>

              {/* Password field */}
              <div className="animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className={`input-modern pr-12 transition-all duration-300 ${
                      isFocused === 'password' ? 'ring-2 ring-white/50' : ''
                    }`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused('password')}
                    onBlur={() => setIsFocused('')}
                    placeholder="Enter your password"
                    aria-describedby={error ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white/80 transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-glow w-full py-3 px-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="border-white" />
                    <span className="ml-2">Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Back link */}
          <div className="text-center mt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <a 
              href="/" 
              className="text-white/80 hover:text-white text-sm transition-colors duration-200 inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Elections
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/60 text-xs animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <p> 2024 Student Election System. Secure voting made simple.</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
