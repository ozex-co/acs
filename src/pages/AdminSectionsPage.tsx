import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useLoading } from '../context/LoadingContext';
import { useError } from '../context/ErrorContext';
import { adminApi } from '../utils/api';
import { FiTrash2, FiEdit2 } from 'react-icons/fi';
import DataFetchWrapper from '../components/DataFetchWrapper';
import { API, STORAGE } from '../utils/constants';
import { apiUtils } from '../utils/apiHelpers';

interface Section {
  id: string | number;
  name: string;
  description: string;
  createdAt: string;
}

const AdminSectionsPage: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { startLoading, stopLoading } = useLoading();
  const { showError } = useError();
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  // Fetch sections from API
  const fetchSections = async () => {
    setIsLoading(true);
    const loadingId = 'fetch-sections';
    startLoading(loadingId, 'Loading sections...');
    
    try {
      // Use the apiUtils implementation
      const response = await apiUtils.getSections();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Check if response has sections data
      if (!response.data || !response.data.sections) {
        throw new Error('Invalid response format');
      }
      
      setSections(response.data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setError('Failed to fetch sections. Please try again.');
      showError('Error fetching sections: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
      stopLoading(loadingId);
    }
  };
  
  useEffect(() => {
    fetchSections();
  }, []);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Open form for creating a new section
  const handleAddNew = () => {
    setFormData({ name: '', description: '' });
    setEditingSection(null);
    setIsFormOpen(true);
  };
  
  // Open form for editing an existing section
  const handleEdit = (section: Section) => {
    setFormData({
      name: section.name,
      description: section.description
    });
    setEditingSection(section);
    setIsFormOpen(true);
  };
  
  // Submit form for creating or updating a section
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('اسم القسم مطلوب');
      return;
    }
    
    const loadingId = `${editingSection ? 'update' : 'create'}-section`;
    startLoading(loadingId, `جاري ${editingSection ? 'تحديث' : 'إنشاء'} القسم...`);
    
    try {
      let response;
      
      if (editingSection) {
        // Update existing section using apiUtils
        response = await apiUtils.updateSection(editingSection.id, formData);
      } else {
        // Create new section using apiUtils
        response = await apiUtils.createSection(formData);
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Refresh the sections list
      await fetchSections();
      
      // Close the form
      setIsFormOpen(false);
    } catch (error: any) {
      console.error(`Error ${editingSection ? 'updating' : 'creating'} section:`, error);
      showError(error.message || `فشل في ${editingSection ? 'تحديث' : 'إنشاء'} القسم`);
    } finally {
      stopLoading(loadingId);
    }
  };
  
  // Delete a section
  const handleDelete = async (sectionId: string | number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      return;
    }
    
    const loadingId = 'delete-section';
    startLoading(loadingId, 'جاري حذف القسم...');
    
    try {
      // Use apiUtils to delete section
      const response = await apiUtils.deleteSection(sectionId);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Refresh the sections list
      await fetchSections();
    } catch (error: any) {
      console.error('Error deleting section:', error);
      showError(error.message || 'فشل في حذف القسم');
    } finally {
      stopLoading(loadingId);
    }
  };
  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الأقسام</h1>
          
          <Button
            variant="primary"
            onClick={handleAddNew}
            className="flex items-center"
          >
            <span className="mr-2">+</span>
            إضافة قسم جديد
          </Button>
        </div>
        
        {isFormOpen && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {editingSection ? 'تعديل القسم' : 'إضافة قسم جديد'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block mb-1 text-gray-700 dark:text-gray-300">اسم القسم</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="مثال: العلوم، الرياضيات، ..."
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block mb-1 text-gray-700 dark:text-gray-300">وصف القسم</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="اكتب وصفاً مختصراً للقسم..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsFormOpen(false)}
                  className="ml-3"
                >
                  إلغاء
                </Button>
                
                <Button type="submit" variant="primary">
                  {editingSection ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </div>
        )}
        
        <DataFetchWrapper
          isLoading={isLoading}
          error={error}
          isEmpty={sections.length === 0}
          emptyMessage="لا توجد أقسام حالياً. قم بإضافة قسم جديد للبدء."
          loadingId="fetch-sections"
          skeletonType="table"
          skeletonRows={5}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-600">الاسم</th>
                  <th className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-600">الوصف</th>
                  <th className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-600">تاريخ الإنشاء</th>
                  <th className="py-3 px-4 text-center text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <tr key={section.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-300">{section.name}</td>
                    <td className="py-3 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                      {section.description || '-'}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                      {new Date(section.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 dark:border-gray-600 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(section)}
                          className="p-1 text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 focus:outline-none ml-2"
                          title="تعديل"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleDelete(section.id)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                          title="حذف"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataFetchWrapper>
      </div>
    </AdminLayout>
  );
};

export default AdminSectionsPage; 