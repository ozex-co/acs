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
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Calculate age for each user based on dateOfBirth
      const usersWithAge = (response.data.users || []).map((user: any) => ({
        ...user,
        age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : 0
      }));
      
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
          <h1 className="text-2xl font-bold text-white">Users Management</h1>
          <p className="text-gray-400 mt-1">View and manage system users</p>
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
          className="w-full pl-10 pr-10 py-3 bg-bg-light border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
        />
        
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
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
          <div className="bg-bg-light p-4 rounded-lg mb-4">
            <p className="text-gray-400">
              Total users: <span className="text-white font-medium">{users.length}</span>
              {searchTerm && (
                <span>
                  , Filtered: <span className="text-white font-medium">{filteredUsers.length}</span>
                </span>
              )}
            </p>
          </div>
          
          {/* Users Table */}
          <div className="bg-bg-light rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-bg-dark">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Age</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                        {searchTerm ? 'No users match your search' : 'No users found'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr 
                        key={user.id} 
                        id={`user-${user.id}`}
                        className={`border-b border-gray-700 hover:bg-bg-dark cursor-pointer ${highlightedUserId && parseInt(highlightedUserId) === user.id ? 'bg-bg-dark' : ''}`}
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                      >
                        <td className="py-3 px-2 text-white">{user.fullName}</td>
                        <td className="py-3 px-2 text-gray-300">{user.phone || '-'}</td>
                        <td className="py-3 px-2 text-gray-300 hidden md:table-cell">{user.email || '-'}</td>
                        <td className="py-3 px-2 text-gray-300 hidden sm:table-cell">
                          {user.dateOfBirth ? `${user.age || calculateAge(user.dateOfBirth)} سنة` : '-'}
                        </td>
                        <td className="py-3 px-2 text-gray-300 hidden lg:table-cell">{user.createdAt ? formatDate(user.createdAt) : '-'}</td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(user);
                            }}
                            className="text-red-500 hover:text-red-400 p-1"
                            aria-label="Delete user"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* Delete Confirmation Modal */}
      {isConfirmDeleteOpen && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={cancelDelete}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-light p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete the user <span className="font-semibold text-white">{selectedUser.fullName}</span>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isDeleting}
                  onClick={cancelDelete}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={isDeleting}
                  onClick={handleDeleteUser}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminUsersPage; 