import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Loader from '../components/Loader';
import Button from '../components/Button';
import { useLoading } from '../context/LoadingContext';
import { useError } from '../context/ErrorContext';
import { adminApi } from '../utils/api';
import { FiSearch, FiX, FiTrash2 } from 'react-icons/fi';

interface User {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  age: number;
  createdAt: string;
}

// Function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDifference = today.getMonth() - dob.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();
  const { showError } = useError();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get highlighted user ID from query params
  const queryParams = new URLSearchParams(location.search);
  const highlightedUserId = queryParams.get('highlight');
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      const filtered = users.filter(user => 
        user.fullName.toLowerCase().includes(searchTermLower) ||
        user.phone.includes(searchTermLower) ||
        (user.email && user.email.toLowerCase().includes(searchTermLower))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);
  
  const fetchUsers = async () => {
    const loadingId = 'fetch-admin-users';
    startLoading(loadingId, 'Loading users...');
    
    try {
      // Use adminApi instead of direct axios calls
      const response = await adminApi.getUsers(currentPage, 10, searchQuery);
      
      console.log('Users API response:', response);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Extract users array from the response - handle various possible structures
      let usersData;
      
      if (response.data?.users && Array.isArray(response.data.users)) {
        // Standard structure with users array in response.data.users
        usersData = response.data.users;
      } else if (response.data?.data?.users && Array.isArray(response.data.data.users)) {
        // Nested structure with users array in response.data.data.users
        usersData = response.data.data.users;
      } else if (Array.isArray(response.data)) {
        // Direct array in response.data
        usersData = response.data;
      } else if (typeof response.data === 'object' && response.data !== null) {
        // Try to find any array property that might contain users
        const possibleUserArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleUserArrays.length > 0) {
          // Use the first array found
          usersData = possibleUserArrays[0];
        } else {
          usersData = [];
        }
      } else {
        usersData = [];
      }
      
      console.log('Extracted users data:', usersData);
      
      if (!Array.isArray(usersData)) {
        console.error('Expected users array, got:', usersData);
        usersData = []; // Fallback to empty array to prevent errors
      }
      
      // Calculate age for each user based on dateOfBirth
      const usersWithAge = usersData.map((user: any) => ({
        ...user,
        age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : 0
      }));
      
      console.log('Processed users data:', usersWithAge);
      
      setUsers(usersWithAge);
      setFilteredUsers(usersWithAge);
      
      // Highlight user if specified in URL
      if (highlightedUserId) {
        const highlightedUser = usersWithAge.find(
          (user: User) => user.id === parseInt(highlightedUserId)
        );
        if (highlightedUser) {
          // Scroll to the highlighted user after render
          setTimeout(() => {
            const element = document.getElementById(`user-${highlightedUserId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('animate-highlight');
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
      showError('Failed to load users');
    } finally {
      setIsLoading(false);
      stopLoading(loadingId);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsDeleting(true);
    const loadingId = 'delete-user';
    startLoading(loadingId, `Deleting user ${selectedUser.fullName}...`);
    
    try {
      // Use adminApi instead of direct axios calls
      const response = await adminApi.deleteUser(selectedUser.id);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Update users list
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setIsConfirmDeleteOpen(false);
      
      // Show success message
      showError(`User ${selectedUser.fullName} was deleted successfully`);
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Failed to delete user. Please try again.');
    } finally {
      setIsDeleting(false);
      setSelectedUser(null);
      stopLoading(loadingId);
    }
  };
  
  const confirmDelete = (user: User) => {
    setSelectedUser(user);
    setIsConfirmDeleteOpen(true);
  };
  
  const cancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setSelectedUser(null);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <AdminLayout title="Users">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">View and manage system users</p>
        </div>
        
        <Button 
          onClick={() => navigate('/admin/dashboard')}
          variant="secondary"
        >
          Back to Dashboard
        </Button>
      </div>
      
      {/* Search */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary"
        />
        
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX />
          </button>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <Loader size="lg" />
          <p className="mt-4 text-gray-400">Loading users...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <Button 
            variant="primary"
            className="mt-4"
            onClick={fetchUsers}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* User Count */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4">
            <p className="text-gray-600 dark:text-gray-300">
              Total users: <span className="text-gray-900 dark:text-white font-medium">{users.length}</span>
              {searchTerm && (
                <span>
                  , Filtered: <span className="text-gray-900 dark:text-white font-medium">{filteredUsers.length}</span>
                </span>
              )}
            </p>
          </div>
          
          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Age</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        id={`user-${user.id}`}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          highlightedUserId && Number(highlightedUserId) === user.id 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{user.phone}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{user.email || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{user.age || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {user.createdAt ? formatDate(user.createdAt) : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => confirmDelete(user)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'No users match your search.' : 'No users found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* Confirm Delete Modal */}
      {isConfirmDeleteOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete user <span className="font-semibold">{selectedUser.fullName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4 rtl:space-x-reverse">
              <Button
                variant="secondary"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsersPage; 