import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'

const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    try {
      setLoading(true)
      setError('')
      const response = await apiService.login(email, password)
      localStorage.setItem('adminToken', response.data.token)
      navigate('/admin')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err.response as { data?: { error?: string } })?.data?.error
          : undefined
      setError(msg || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-ed-xl border border-ink/[0.08] bg-paper/80 backdrop-blur-md p-8 lg:p-10">
          <div className="mb-10">
            <h1 className="font-display text-display-lg font-bold tracking-tighter text-ink mb-2">
              Admin Login
            </h1>
            <p className="font-mono text-body-sm text-ink/55">Sign in to manage elections</p>
          </div>

          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[0.6875rem] uppercase tracking-wider text-ink/60 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className={`flex h-11 w-full rounded-ed-md border bg-paper px-4 font-mono text-body-sm placeholder:text-ink/40 focus:outline-none transition-all ${
                  focusedField === 'email' ? 'border-ink/[0.3]' : 'border-ink/[0.1] focus:border-ink/[0.3]'
                }`}
                placeholder="admin@gmail.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-[0.6875rem] uppercase tracking-wider text-ink/60 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`flex h-11 w-full rounded-ed-md border bg-paper pr-12 px-4 font-mono text-body-sm placeholder:text-ink/40 focus:outline-none transition-all ${
                    focusedField === 'password' ? 'border-ink/[0.3]' : 'border-ink/[0.1] focus:border-ink/[0.3]'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-ed-md bg-ink text-paper font-mono text-body-sm font-medium flex items-center justify-center gap-2 hover:bg-ink/90 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="border-paper/30 border-t-paper" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" strokeWidth={2} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <a
            href="/"
            className="mt-8 inline-flex items-center gap-2 font-mono text-body-sm text-ink/55 hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Elections
          </a>
        </div>

        <p className="mt-8 text-center font-mono text-[0.6875rem] text-ink/40 uppercase tracking-wider">
          UNIELECT Admin
        </p>
      </motion.div>
    </div>
  )
}

export default AdminLogin
