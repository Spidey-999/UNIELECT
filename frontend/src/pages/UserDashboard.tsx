import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Vote, LogOut, BarChart3, Calendar, Users, TrendingUp } from 'lucide-react';
import { Alert, LoadingSpinner } from '../components';
import Logo from '../components/Logo';
import api from '../services/api';
import '../styles/animations.css';

interface Election {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  method: string;
  isActive: boolean;
  _count?: {
    races: number;
    candidates: number;
    ballots: number;
  };
}

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('userToken');
    
    if (!userData || !token) {
      navigate('/user/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchElections();
  }, [navigate]);

  const fetchElections = async () => {
    try {
      const response = await api.get('/api/elections');
      setElections(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch elections');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    navigate('/user/login');
  };

  const isElectionActive = (election: Election) => {
    const now = new Date();
    const start = new Date(election.startsAt);
    const end = new Date(election.endsAt);
    return now >= start && now <= end;
  };

  const getElectionStatus = (election: Election) => {
    if (!isElectionActive(election)) {
      const now = new Date();
      const start = new Date(election.startsAt);
      const end = new Date(election.endsAt);
      
      if (now < start) return { status: 'upcoming', color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Upcoming' };
      if (now > end) return { status: 'ended', color: 'text-gray-600', bg: 'bg-gray-50', text: 'Ended' };
    }
    
    return { status: 'active', color: 'text-green-600', bg: 'bg-green-50', text: 'Active Now' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <Logo size="sm" className="mr-3" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Welcome, {user?.firstName || 'Student'}
                </h1>
                <p className="text-sm text-gray-600">UNIELECT Voting Dashboard</p>
                <p className="text-xs text-gray-500 italic">Where every student counts</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Elections</p>
                <p className="text-2xl font-bold text-gray-900">{elections.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Now</p>
                <p className="text-2xl font-bold text-gray-900">
                  {elections.filter(isElectionActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {elections.filter(e => {
                    const electionDate = new Date(e.startsAt);
                    const now = new Date();
                    return electionDate.getMonth() === now.getMonth() && 
                           electionDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Participation</p>
                <p className="text-2xl font-bold text-gray-900">High</p>
              </div>
            </div>
          </div>
        </div>

        {/* Elections Section - Following Flowchart */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Vote className="h-5 w-5 mr-2 text-indigo-600" />
              Available Elections
            </h2>
          </div>
          
          <div className="p-6">
            {elections.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Elections</h3>
                <p className="text-gray-600">Check back later for new voting opportunities.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {elections.map((election) => {
                  const status = getElectionStatus(election);
                  return (
                    <div 
                      key={election.id} 
                      className={`border rounded-lg p-6 transition-all duration-200 hover:shadow-md ${
                        isElectionActive(election) 
                          ? 'border-green-200 bg-green-50' 
                          : status.status === 'upcoming'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-3">
                              {election.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color} ${status.bg}`}>
                              {status.text}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {election.description}
                          </p>
                          
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Starts: {new Date(election.startsAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Ends: {new Date(election.endsAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {isElectionActive(election) ? (
                            <Link
                              to={`/elections/${election.id}`}
                              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              <Vote className="h-4 w-4 mr-2" />
                              Vote Now
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
                            >
                              <Vote className="h-4 w-4 mr-2" />
                              {status.status === 'upcoming' ? 'Not Started' : 'Ended'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-indigo-600 mb-4">
              <User className="h-8 w-8 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Profile</h3>
            <p className="text-gray-600 mb-4">View and update your voter information</p>
            <Link
              to="/user/profile"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View Profile
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-green-600 mb-4">
              <BarChart3 className="h-8 w-8 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Voting History</h3>
            <p className="text-gray-600 mb-4">View your past voting activity</p>
            <Link
              to="/user/history"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              View History
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-purple-600 mb-4">
              <Users className="h-8 w-8 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Help & Support</h3>
            <p className="text-gray-600 mb-4">Get help with voting process</p>
            <Link
              to="/user/help"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Get Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
