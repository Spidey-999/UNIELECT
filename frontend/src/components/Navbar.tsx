import { Link, useLocation } from 'react-router-dom'
import { Vote, Shield, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo';

const Navbar = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isAdminRoute = location.pathname.startsWith('/admin')
  
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }
  
  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }
  
  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Logo size="sm" className="mr-2" />
            </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                !isAdminRoute 
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                  : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              <Logo size="sm" className="mr-2" />
              <span>Elections</span>
            </Link>
            
            <Link 
              to="/user/login" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                !isAdminRoute 
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                  : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Student Login</span>
            </Link>
            
            <Link 
              to="/admin/login" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                !isAdminRoute 
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                  : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={handleMobileMenuToggle}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-white/20 animate-fade-in-down">
            <div className="container mx-auto px-4 py-4 space-y-2">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 w-full ${
                  !isAdminRoute 
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                }`}
              >
                <Vote className="h-5 w-5" />
                <span>Elections</span>
              </Link>
              
              <Link 
                to="/user/login" 
                onClick={handleMobileMenuClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 w-full ${
                  !isAdminRoute 
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                }`}
              >
                <User className="h-5 w-5" />
                <span>Student Login</span>
              </Link>
              
              <Link 
                to="/admin/login" 
                onClick={handleMobileMenuClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 w-full ${
                  !isAdminRoute 
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                }`}
              >
                <Shield className="h-5 w-5" />
                <span>Admin</span>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Animated underline */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 animate-gradient"></div>
    </nav>
  )
}

export default Navbar
