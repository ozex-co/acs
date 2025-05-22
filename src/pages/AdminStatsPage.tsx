import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Loader from '../components/Loader';
import { useLoading } from '../context/LoadingContext';
import { useError } from '../context/ErrorContext';
import { adminApi } from '../utils/api';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface StatsData {
  counts: {
    users: number;
    exams: number;
    submissions: number;
  };
  performance: {
    averageScore: number;
    completionRate: number;
  };
  userActivity: {
    daily: {
      labels: string[];
      data: number[];
    };
    monthly: {
      labels: string[];
      data: number[];
    };
  };
  ageDistribution: {
    labels: string[];
    data: number[];
  };
  topExams: {
    name: string;
    submissions: number;
    averageScore: number;
  }[];
}

const AdminStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  const { showError } = useError();
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    const loadingId = 'fetch-stats';
    startLoading(loadingId, 'Loading statistics...');
    
    try {
      // Use adminApi instead of direct axios call
      const response = await adminApi.getStats();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics. Please try again.');
      showError('Failed to load statistics');
    } finally {
      setIsLoading(false);
      stopLoading(loadingId);
    }
  };
  
  if (isLoading) {
    return (
      <AdminLayout title="Statistics">
        <div className="text-center py-12">
          <Loader size="lg" />
          <p className="mt-4 text-gray-400">Loading statistics...</p>
        </div>
      </AdminLayout>
    );
  }
  
  if (error) {
    return (
      <AdminLayout title="Statistics">
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={fetchStats} 
            className="mt-4 px-4 py-2 bg-bg-dark rounded-lg hover:bg-red-500 hover:bg-opacity-20 transition"
          >
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  if (!stats) {
    return (
      <AdminLayout title="Statistics">
        <div className="text-center py-12">
          <p className="text-gray-400">No statistics available.</p>
        </div>
      </AdminLayout>
    );
  }
  
  // Prepare chart data
  const ageDistributionData = {
    labels: stats.ageDistribution?.labels || [],
    datasets: [
      {
        label: 'Users',
        data: stats.ageDistribution?.data || [],
        backgroundColor: [
          'rgba(95, 0, 255, 0.8)',
          'rgba(0, 242, 255, 0.8)',
          'rgba(34, 255, 136, 0.8)',
          'rgba(255, 214, 0, 0.8)',
          'rgba(255, 92, 0, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };
  
  const topExamsData = {
    labels: stats.topExams?.map(exam => exam.name) || [],
    datasets: [
      {
        label: 'Submissions',
        data: stats.topExams?.map(exam => exam.submissions) || [],
        backgroundColor: 'rgba(95, 0, 255, 0.8)',
        borderColor: 'rgba(95, 0, 255, 1)',
        borderWidth: 1,
      },
      {
        label: 'Average Score (%)',
        data: stats.topExams?.map(exam => exam.averageScore) || [],
        backgroundColor: 'rgba(0, 242, 255, 0.8)',
        borderColor: 'rgba(0, 242, 255, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const userActivityData = {
    labels: timeRange === 'weekly' ? stats.userActivity?.daily?.labels || [] : stats.userActivity?.monthly?.labels || [],
    datasets: [
      {
        label: 'User Registrations',
        data: timeRange === 'weekly' ? stats.userActivity?.daily?.data || [] : stats.userActivity?.monthly?.data || [],
        fill: true,
        backgroundColor: 'rgba(95, 0, 255, 0.2)',
        borderColor: 'rgba(95, 0, 255, 1)',
        tension: 0.4,
      },
    ],
  };
  
  return (
    <AdminLayout title="Statistics">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Statistics & Analytics</h1>
        <p className="text-gray-400 mt-1">View platform performance and user metrics</p>
      </div>
      
      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-light rounded-xl p-6 border border-[#5f00ff] shadow-lg shadow-[#5f00ff]/20">
          <h2 className="text-[#5f00ff] text-lg font-semibold mb-2">Total Users</h2>
          <p className="text-4xl font-bold text-text">{stats.counts?.users || 0}</p>
        </div>
        
        <div className="bg-bg-light rounded-xl p-6 border border-[#00f2ff] shadow-lg shadow-[#00f2ff]/20">
          <h2 className="text-[#00f2ff] text-lg font-semibold mb-2">Total Exams</h2>
          <p className="text-4xl font-bold text-text">{stats.counts?.exams || 0}</p>
        </div>
        
        <div className="bg-bg-light rounded-xl p-6 border border-[#22ff88] shadow-lg shadow-[#22ff88]/20">
          <h2 className="text-[#22ff88] text-lg font-semibold mb-2">Submissions</h2>
          <p className="text-4xl font-bold text-text">{stats.counts?.submissions || 0}</p>
        </div>
        
        <div className="bg-bg-light rounded-xl p-6 border border-white/30 shadow-lg">
          <h2 className="text-text/80 text-lg font-semibold mb-2">Avg. Score</h2>
          <p className="text-4xl font-bold text-text">{stats.performance?.averageScore || 0}%</p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Age Distribution */}
        <div className="bg-bg-light p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-text mb-4">Age Distribution</h2>
          <div className="h-64">
            <Pie 
              data={ageDistributionData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      color: 'white'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
        
        {/* Top Exams */}
        <div className="bg-bg-light p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-text mb-4">Top Exams</h2>
          <div className="h-64">
            <Bar 
              data={topExamsData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  },
                  x: {
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    grid: { display: false }
                  }
                },
                plugins: {
                  legend: {
                    labels: {
                      color: 'white'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>
      
      {/* User Activity */}
      <div className="bg-bg-light p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-text">User Activity</h2>
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-4 py-2 text-sm ${
                timeRange === 'weekly' 
                  ? 'bg-[#5f00ff] text-text' 
                  : 'bg-bg-dark text-gray-400 hover:bg-bg-dark/80'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-4 py-2 text-sm ${
                timeRange === 'monthly' 
                  ? 'bg-[#5f00ff] text-text' 
                  : 'bg-bg-dark text-gray-400 hover:bg-bg-dark/80'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
        <div className="h-80">
          <Line 
            data={userActivityData} 
            options={{ 
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                  ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                  grid: { display: false }
                }
              },
              plugins: {
                legend: {
                  labels: {
                    color: 'white'
                  }
                }
              }
            }} 
          />
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="bg-bg-light p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-text mb-4">Performance Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-gray-400 mb-2">Average Score</h3>
            <div className="bg-bg-dark rounded-lg p-4">
              <div className="flex items-end">
                <span className="text-4xl font-bold text-text">{stats.performance?.averageScore || 0}%</span>
                <span className="text-green-500 ml-2 mb-1">
                  {(stats.performance?.averageScore || 0) >= 70 ? '✓ Good' : ''}
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#5f00ff] to-[#00f2ff]" 
                  style={{ width: `${stats.performance?.averageScore || 0}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Average score across all exam submissions
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-gray-400 mb-2">Completion Rate</h3>
            <div className="bg-bg-dark rounded-lg p-4">
              <div className="flex items-end">
                <span className="text-4xl font-bold text-text">{stats.performance?.completionRate || 0}%</span>
                <span className={`ml-2 mb-1 ${(stats.performance?.completionRate || 0) >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {(stats.performance?.completionRate || 0) >= 80 ? '✓ Excellent' : '△ Average'}
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#22ff88] to-[#00f2ff]" 
                  style={{ width: `${stats.performance?.completionRate || 0}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Percentage of started exams that were completed
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStatsPage; 
