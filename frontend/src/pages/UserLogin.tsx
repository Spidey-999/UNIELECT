import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import { Alert, LoadingSpinner } from '../components';
import Logo from '../components/Logo';
import api from '../services/api';
import '../styles/animations.css';

interface LoginData {
  email: string;
  password: string;
}

const UserLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/users/login', formData);
      
      if (response.data.token) {
        localStorage.setItem('userToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Follow flowchart: Login → Election Dashboard
        navigate('/user/dashboard');
      }
    } catch (err: any) {
      // Follow flowchart: If invalid → Error message → Back to login
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="card-modern p-8 animate-fade-in-up">
          {/* UNIELECT Logo and title */}
          <div className="text-center mb-8">
            <Logo size="lg" className="mb-6" />
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              Student Login
              <Sparkles className="h-6 w-6 text-yellow-300 animate-sparkle" />
            </h2>
            <p className="text-white/80">Enter your credentials to vote</p>
            <p className="text-white/60 text-sm italic mt-2">UNIELECT: Where every student counts</p>
          </div>

          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                  Student ID / Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setIsFocused('email')}
                    onBlur={() => setIsFocused(null)}
                    className={`input-modern ${isFocused === 'email' ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent' : ''}`}
                    placeholder="01244086B or student@unielect.edu.gh"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <User className={`h-5 w-5 transition-colors ${isFocused === 'email' ? 'text-blue-400' : 'text-white/50'}`} />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
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
                    onFocus={() => setIsFocused('password')}
                    onBlur={() => setIsFocused(null)}
                    className={`input-modern pr-12 ${isFocused === 'password' ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent' : ''}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/70 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-semibold"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign In to Vote
                  </>
                )}
              </button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-white/80 text-sm">
                New voter?{' '}
                <Link to="/user/register" className="font-medium text-blue-300 hover:text-blue-200 transition-colors">
                  Register here
                </Link>
              </p>
              <p className="text-white/80 text-sm">
                Election administrator?{' '}
                <Link to="/admin/login" className="font-medium text-purple-300 hover:text-purple-200 transition-colors">
                  Admin Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
