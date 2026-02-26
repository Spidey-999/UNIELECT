import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../services/api'
import { Alert, LoadingSpinner } from '../components'

interface LoginData {
  email: string
  password: string
}

const UserLogin = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<LoginData>({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await api.post('/api/users/login', formData)
      if (response.data.token) {
        localStorage.setItem('userToken', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        navigate('/user/dashboard')
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err.response as { data?: { error?: string } })?.data?.error
          : undefined
      setError(msg || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'flex h-11 w-full rounded-ed-md border bg-paper px-4 font-mono text-body-sm placeholder:text-ink/40 focus:outline-none transition-all'
  const inputFocus = (focused: boolean) =>
    focused ? 'border-ink/[0.3]' : 'border-ink/[0.1] focus:border-ink/[0.3]'

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
              Student Login
            </h1>
            <p className="font-mono text-body-sm text-ink/55">Enter your credentials to vote</p>
          </div>

          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={() => setError(null)} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[0.6875rem] uppercase tracking-wider text-ink/60 mb-2"
              >
                Student ID / Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className={`${inputBase} ${inputFocus(focusedField === 'email')}`}
                placeholder="01244086B or student@unielect.edu.gh"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-[0.6875rem] uppercase tracking-wider text-ink/60 mb-2"
              >
                Password / PIN
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`${inputBase} pr-12 ${inputFocus(focusedField === 'password')}`}
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

          <div className="mt-8 space-y-4">
            <p className="font-mono text-body-sm text-ink/55">
              New voter?{' '}
              <Link to="/user/register" className="text-ink font-medium hover:underline">
                Register here
              </Link>
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 font-mono text-body-sm text-ink/55 hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Back to Elections
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default UserLogin
