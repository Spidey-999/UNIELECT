import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../services/api'
import { Alert, LoadingSpinner } from '../components'

interface RegisterData {
  email: string
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
  phoneNumber?: string
}

const UserRegister = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = (): string | null => {
    if (!formData.email || !formData.firstName || !formData.lastName) return 'All required fields must be filled'
    if (formData.password.length < 6) return 'Password must be at least 6 characters long'
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match'
    if (formData.phoneNumber && !/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) return 'Invalid phone number format'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { confirmPassword, ...registerData } = formData
      const response = await api.post('/api/users/register', registerData)
      if (response.data.token) {
        localStorage.setItem('userToken', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        setSuccess('Registration successful! Redirecting...')
        setTimeout(() => navigate('/user/dashboard'), 2000)
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err.response as { data?: { error?: string } })?.data?.error
          : undefined
      setError(msg || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'flex h-11 w-full rounded-ed-md border border-ink/[0.1] bg-paper px-4 font-mono text-body-sm placeholder:text-ink/40 focus:outline-none focus:border-ink/[0.3]'
  const labelClass = 'block font-mono text-[0.6875rem] uppercase tracking-wider text-ink/60 mb-2'

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
              Student Registration
            </h1>
            <p className="font-mono text-body-sm text-ink/55">Create your UNIELECT voting account</p>
          </div>

          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={() => setError(null)} />
            </div>
          )}
          {success && (
            <div className="mb-6">
              <Alert type="success" message={success} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelClass}>First Name *</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>Last Name *</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="01244086B or student@unielect.edu.gh"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className={labelClass}>Phone (Optional)</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={inputClass}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>Password *</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputClass} pr-12`}
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelClass}>Confirm Password *</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`${inputClass} pr-12`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" strokeWidth={2} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="mt-8 font-mono text-body-sm text-ink/55 text-center">
            Already have an account?{' '}
            <Link to="/user/login" className="text-ink font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default UserRegister
