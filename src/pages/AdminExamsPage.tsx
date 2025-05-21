import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useLoading } from '../context/LoadingContext';
import { useError } from '../context/ErrorContext';
import { adminApi } from '../utils/api';
import { FiTrash2, FiEdit2, FiDownload, FiFileText } from 'react-icons/fi';
import { API, STORAGE } from '../utils/constants';
import { apiUtils } from '../utils/apiHelpers';
import axios from 'axios';

interface Exam {
  id: string;
  title: string;
  description: string;
  questionsCount: number;
  duration: number;
  minAge: number;
  maxAge: number;
  createdAt: string;
  isPublic?: boolean;
}

// Bulk update form state
interface BulkUpdateForm {
  isPublic?: boolean;
  minAge?: number;
  maxAge?: number;
  applyToPublic: boolean;
  applyToAgeRange: boolean;
}

// Add export-related types
type ExportFormat = 'csv' | 'pdf';

interface ExportOptions {
  format: ExportFormat;
  all: boolean; // Whether to export all exams or just selected ones
}

const AdminExamsPage = () => {
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  const { showError } = useError();
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());
  
  // Bulk update state
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkUpdateForm, setBulkUpdateForm] = useState<BulkUpdateForm>({
    isPublic: undefined,
    minAge: undefined,
    maxAge: undefined,
    applyToPublic: false,
    applyToAgeRange: false
  });
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  
  // Add export-related state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    all: true
  });
  const [isExporting, setIsExporting] = useState(false);
  
  useEffect(() => {
    fetchExams();
  }, []);
  
  const fetchExams = async () => {
    setIsLoading(true);
    const loadingId = 'fetch-admin-exams';
    startLoading(loadingId, 'جاري تحميل الاختبارات...');
    
    try {
      // Use the apiUtils implementation
      const response = await apiUtils.getExams();
      
      // Add detailed logging to see the actual API response
      console.log('Raw exams API response:', response);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Improve data extraction to handle different response formats
      let extractedExams = [];
      
      if (response.data) {
        // Console log to debug the structure
        console.log('Response data structure:', response.data);
        
        // Extract exams from various possible response formats
        if (Array.isArray(response.data)) {
          // Direct array of exams
          extractedExams = response.data;
          console.log('Extracted exams from direct array:', extractedExams.length);
        } else if (response.data.exams && Array.isArray(response.data.exams)) {
          // Standard { exams: [...] } format
          extractedExams = response.data.exams;
          console.log('Extracted exams from data.exams:', extractedExams.length);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // API response in { data: [...] } format
          extractedExams = response.data.data;
          console.log('Extracted exams from data.data array:', extractedExams.length);
        } else if (response.data.data && response.data.data.exams && Array.isArray(response.data.data.exams)) {
          // Nested format { data: { exams: [...] } }
          extractedExams = response.data.data.exams;
          console.log('Extracted exams from data.data.exams:', extractedExams.length);
        }
      }
      
      // Set exams with more robust extraction
      setExams(extractedExams);
      
      // Log the final set of exams
      console.log('Final exams array set to state:', extractedExams);
      
      if (extractedExams.length === 0) {
        console.warn('No exams found in the response, but request was successful');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('فشل في تحميل الاختبارات');
      showError('فشل في تحميل الاختبارات');
    } finally {
      setIsLoading(false);
      stopLoading(loadingId);
    }
  };
  
  const handleCreateExam = () => {
    navigate('/admin/exams/create');
  };
  
  const handleEditExam = (examId: string) => {
    navigate(`/admin/exams/edit/${examId}`);
  };
  
  const confirmDelete = (examId: string) => {
    setExamToDelete(examId);
  };
  
  const cancelDelete = () => {
    setExamToDelete(null);
  };
  
  const handleDeleteExam = async (examId: string) => {
    setIsDeleting(true);
    const loadingId = 'delete-exam';
    startLoading(loadingId, 'جاري حذف الاختبار...');
    
    try {
      // Use the apiUtils implementation
      const response = await apiUtils.deleteExam(examId);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Update the exams list
      setExams(exams.filter(exam => exam.id !== examId));
      setExamToDelete(null);
    } catch (error) {
      console.error('Error deleting exam:', error);
      showError('فشل في حذف الاختبار');
    } finally {
      setIsDeleting(false);
      stopLoading(loadingId);
    }
  };
  
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedExamIds(new Set(exams.map(e => e.id)));
    } else {
      setSelectedExamIds(new Set());
    }
  };

  const handleSelectSingle = (examId: string, isChecked: boolean) => {
    setSelectedExamIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(examId);
      } else {
        newSet.delete(examId);
      }
      return newSet;
    });
  };

  const isAllSelected = exams.length > 0 && selectedExamIds.size === exams.length;

  const handleDeleteSelected = async () => {
    if (selectedExamIds.size === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedExamIds.size} selected exams? This action cannot be undone.`)) {
        return;
    }

    const idsToDelete = Array.from(selectedExamIds);
    setIsDeleting(true);
    const loadingId = 'delete-selected-exams';
    startLoading(loadingId, `جاري حذف ${selectedExamIds.size} اختبار...`);
    
    try {
      // Delete exams one by one using apiUtils
      const deletePromises = idsToDelete.map(id => 
        apiUtils.deleteExam(id)
      );
      
      await Promise.all(deletePromises);
      
      // Update the exams list
      setExams(prevExams => prevExams.filter(exam => !selectedExamIds.has(exam.id)));
      // Clear selection
      setSelectedExamIds(new Set());
      
    } catch (error) {
      console.error('Error performing bulk delete:', error);
      showError('فشل في حذف الاختبارات المحددة');
    } finally {
      setIsDeleting(false);
      stopLoading(loadingId);
    }
  };
  
  // Handle opening the bulk update modal
  const handleOpenBulkUpdateModal = () => {
    if (selectedExamIds.size === 0) {
      showError('Please select at least one exam to update');
      return;
    }
    setShowBulkUpdateModal(true);
  };
  
  // Handle bulk update form input changes
  const handleBulkUpdateFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setBulkUpdateForm(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'isPublic') {
      setBulkUpdateForm(prev => ({ 
        ...prev, 
        isPublic: value === 'true' ? true : value === 'false' ? false : undefined 
      }));
    } else {
      setBulkUpdateForm(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Perform the bulk update
  const handleBulkUpdate = async () => {
    const idsToUpdate = Array.from(selectedExamIds);
    
    // Validate form
    if (!bulkUpdateForm.applyToPublic && !bulkUpdateForm.applyToAgeRange) {
      showError('Please select at least one property to update');
      return;
    }
    
    if (bulkUpdateForm.applyToAgeRange) {
      if (!bulkUpdateForm.minAge || !bulkUpdateForm.maxAge) {
        showError('Please provide both minimum and maximum age');
        return;
      }
      
      if (Number(bulkUpdateForm.minAge) >= Number(bulkUpdateForm.maxAge)) {
        showError('Minimum age must be less than maximum age');
        return;
      }
    }
    
    setIsBulkUpdating(true);
    const loadingId = 'bulk-update-exams';
    startLoading(loadingId, `Updating ${idsToUpdate.length} exams...`);
    
    try {
      // Prepare update data
      const updateData: Record<string, any> = {};
      if (bulkUpdateForm.applyToPublic) {
        updateData.isPublic = bulkUpdateForm.isPublic;
      }
      if (bulkUpdateForm.applyToAgeRange) {
        updateData.minAge = Number(bulkUpdateForm.minAge);
        updateData.maxAge = Number(bulkUpdateForm.maxAge);
      }
      
      // Update exams one by one using adminApi
      const updatePromises = idsToUpdate.map(id => 
        adminApi.updateExam(id, updateData)
      );
      
      await Promise.all(updatePromises);
      
      // Update the exams list with the new values
      setExams(prevExams => 
        prevExams.map(exam => {
          if (selectedExamIds.has(exam.id)) {
            return {
              ...exam,
              ...(bulkUpdateForm.applyToPublic ? { isPublic: bulkUpdateForm.isPublic } : {}),
              ...(bulkUpdateForm.applyToAgeRange ? { 
                minAge: Number(bulkUpdateForm.minAge), 
                maxAge: Number(bulkUpdateForm.maxAge) 
              } : {})
            };
          }
          return exam;
        })
      );
      
      // Close modal and reset form
      setShowBulkUpdateModal(false);
      setBulkUpdateForm({
        isPublic: undefined,
        minAge: undefined,
        maxAge: undefined,
        applyToPublic: false,
        applyToAgeRange: false
      });
      
    } catch (error) {
      console.error('Error performing bulk update:', error);
      showError('Failed to update the selected exams');
    } finally {
      setIsBulkUpdating(false);
      stopLoading(loadingId);
    }
  };
  
  // Handle opening the export modal
  const handleOpenExportModal = () => {
    setExportOptions({
      format: 'csv',
      all: true
    });
    setShowExportModal(true);
  };
  
  // Handle export options changes
  const handleExportOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'radio' && name === 'exportScope') {
      setExportOptions(prev => ({
        ...prev,
        all: value === 'all'
      }));
    } else if (name === 'format') {
      setExportOptions(prev => ({
        ...prev,
        format: value as ExportFormat
      }));
    }
  };
  
  // Perform the export
  const handleExport = async () => {
    // Validate selection if exporting selected exams
    if (!exportOptions.all && selectedExamIds.size === 0) {
      showError('Please select at least one exam to export');
      return;
    }
    
    setIsExporting(true);
    const loadingId = 'export-exams';
    startLoading(loadingId, `Exporting exams as ${exportOptions.format.toUpperCase()}...`);
    
    try {
      // Get auth token
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }
      
      // Define endpoint based on format
      const endpoint = `${API.BASE_URL}/admin/exams/export/${exportOptions.format}`;
      
      // Define request data
      const requestData = exportOptions.all 
        ? {} 
        : { examIds: Array.from(selectedExamIds) };
      
      // Make the API call
      const response = await axios({
        url: endpoint,
        method: 'POST',
        data: requestData,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob' // Important for downloading files
      });
      
      // Create a blob from the response data
      const blob = new Blob(
        [response.data], 
        { type: exportOptions.format === 'csv' ? 'text/csv' : 'application/pdf' }
      );
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `exams-export-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      
      // Append to the document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
      
    } catch (error) {
      console.error('Error exporting exams:', error);
      showError(`Failed to export exams as ${exportOptions.format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
      stopLoading(loadingId);
    }
  };
  
  // Generate CSV manually (fallback if API export fails)
  const generateCsvExport = () => {
    try {
      // Define which exams to export
      const examsToExport = exportOptions.all 
        ? exams 
        : exams.filter(exam => selectedExamIds.has(exam.id));
      
      if (examsToExport.length === 0) {
        showError('No exams to export');
        return;
      }
      
      // Define CSV headers
      const headers = [
        'ID', 'Title', 'Description', 'Questions Count', 
        'Duration (min)', 'Min Age', 'Max Age', 'Created At'
      ];
      
      // Convert exams to CSV rows
      const rows = examsToExport.map(exam => [
        exam.id,
        `"${exam.title.replace(/"/g, '""')}"`, // Escape quotes
        `"${exam.description.replace(/"/g, '""')}"`, // Escape quotes
        exam.questionsCount,
        exam.duration,
        exam.minAge,
        exam.maxAge,
        new Date(exam.createdAt).toISOString()
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exams-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowExportModal(false);
      
    } catch (error) {
      console.error('Error generating CSV:', error);
      showError('Failed to generate CSV export');
    }
  };
  
  return (
    <AdminLayout title="إدارة الاختبارات">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">إدارة الاختبارات</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleOpenExportModal}>
            <FiDownload className="mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={handleCreateExam}>
            إضافة اختبار جديد
          </Button>
        </div>
      </div>
      
      {/* Exams table */}
      <div className="bg-bg-light p-6 rounded-lg shadow-md">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : exams.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No exams found. Create your first exam to get started.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-3 text-left w-10">
                      <input 
                        type="checkbox" 
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="form-checkbox h-5 w-5 text-accent bg-bg-dark border-gray-600 rounded"
                      />
                    </th>
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">Questions</th>
                    <th className="p-3 text-left">Duration</th>
                    <th className="p-3 text-left">Age Range</th>
                    <th className="p-3 text-left">Created</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => {
                    // Add a check to ensure exam has the expected format
                    if (!exam || typeof exam !== 'object') {
                      console.error('Invalid exam format:', exam);
                      return null;
                    }
                    
                    // Extract properties with fallbacks
                    const id = exam.id?.toString() || '';
                    const title = exam.title || 'Untitled Exam';
                    const questionsCount = exam.questionsCount || 0;
                    const duration = exam.duration || 0;
                    const minAge = exam.minAge ?? 0;
                    const maxAge = exam.maxAge ?? 100;
                    const createdAt = exam.createdAt || '';
                    
                    // Log the exam for debugging
                    console.log(`Processing exam ${id}:`, exam);
                    
                    return (
                      <tr key={id} className="border-b border-gray-800 hover:bg-bg-dark/30">
                        <td className="p-3">
                          <input 
                            type="checkbox" 
                            checked={selectedExamIds.has(id)}
                            onChange={(e) => handleSelectSingle(id, e.target.checked)}
                            className="form-checkbox h-5 w-5 text-accent bg-bg-dark border-gray-600 rounded"
                          />
                        </td>
                        <td className="p-3">{title}</td>
                        <td className="p-3">{questionsCount}</td>
                        <td className="p-3">{duration} min</td>
                        <td className="p-3">
                          {exam.isPublic ? 'Public' : `${minAge} - ${maxAge === 100 ? '∞' : maxAge}`}
                        </td>
                        <td className="p-3">
                          {new Date(createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditExam(id)}
                              className="text-blue-400 hover:text-blue-300"
                              title="Edit"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => confirmDelete(id)}
                              className="text-red-400 hover:text-red-300"
                              title="Delete"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      
      {/* Delete confirmation modal */}
      {examToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-dark p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this exam? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteExam(examToDelete)}
                loading={isDeleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-12">
          <Loader size="lg" />
          <p className="mt-4 text-gray-400">جاري تحميل الاختبارات...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-bg-light p-8 rounded-lg text-center">
          <p className="text-gray-400 mb-4">لا توجد اختبارات حالياً</p>
          <Button variant="primary" onClick={handleCreateExam}>
            إضافة اختبار جديد
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 p-3 bg-bg-light rounded-lg border border-gray-700 flex items-center gap-4">
             <input 
                type="checkbox" 
                className="form-checkbox h-5 w-5 text-primary bg-bg-dark border-gray-600 rounded focus:ring-primary"
                checked={isAllSelected}
                onChange={handleSelectAll}
                aria-label="Select all exams"
              />
              <span className="text-gray-400 text-sm">{selectedExamIds.size} selected</span>
              {selectedExamIds.size > 0 && (
                  <div className="flex gap-2">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleOpenExportModal}
                    >
                        <FiFileText className="mr-2" />
                        Export Selected
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleOpenBulkUpdateModal}
                    >
                        <FiEdit2 className="mr-2" />
                        Bulk Update
                    </Button>
                    <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={handleDeleteSelected}
                    >
                        <FiTrash2 className="mr-2" />
                        Delete Selected
                    </Button>
                  </div>
              )}
          </div>

          <div className="grid gap-6">
            {exams.map(exam => (
              <div key={exam.id} className="bg-bg-light p-6 rounded-lg shadow-md relative border border-transparent hover:border-primary transition-colors">
                 <div className="absolute top-3 right-3 z-10">
                    <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-primary bg-bg-dark border-gray-600 rounded focus:ring-primary"
                        checked={selectedExamIds.has(exam.id)}
                        onChange={(e) => handleSelectSingle(exam.id, e.target.checked)}
                        aria-labelledby={`exam-title-${exam.id}`}
                    />
                 </div>

                {examToDelete === exam.id && (
                  <div className="absolute inset-0 bg-bg-dark bg-opacity-90 rounded-lg flex items-center justify-center z-10">
                    <div className="bg-bg-light p-6 rounded-lg max-w-md w-full">
                      <h3 className="text-xl font-bold text-white mb-4">تأكيد الحذف</h3>
                      <p className="text-gray-400 mb-6">
                        هل أنت متأكد من حذف الاختبار "{exam.title}"؟ هذا الإجراء لا يمكن التراجع عنه.
                      </p>
                      <div className="flex gap-4">
                        <Button
                          variant="danger"
                          disabled={isDeleting}
                          onClick={() => handleDeleteExam(exam.id)}
                          className="w-1/2"
                        >
                          حذف
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={isDeleting}
                          onClick={cancelDelete}
                          className="w-1/2"
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <h2 id={`exam-title-${exam.id}`} className="text-xl font-bold text-white mb-2">{exam.title}</h2>
                  <p className="text-gray-400">{exam.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-bg-dark p-3 rounded-lg">
                    <span className="text-gray-400 block mb-1">عدد الأسئلة</span>
                    <span className="text-lg font-medium text-white">{exam.questionsCount}</span>
                  </div>
                  
                  <div className="bg-bg-dark p-3 rounded-lg">
                    <span className="text-gray-400 block mb-1">مدة الاختبار</span>
                    <span className="text-lg font-medium text-white">{exam.duration} دقيقة</span>
                  </div>
                  
                  <div className="bg-bg-dark p-3 rounded-lg">
                    <span className="text-gray-400 block mb-1">الفئة العمرية</span>
                    <span className="text-lg font-medium text-white">
                      {exam.minAge} - {exam.maxAge} سنة
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleEditExam(exam.id)}
                  >
                    تعديل
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => confirmDelete(exam.id)}
                  >
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Bulk Update Modal */}
          {showBulkUpdateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-bg-light p-6 rounded-lg max-w-md w-full">
                <h3 className="text-xl font-bold text-white mb-4">
                  Bulk Update Exams
                </h3>
                <p className="text-gray-400 mb-4">
                  Update properties for {selectedExamIds.size} selected exams
                </p>
                
                <div className="space-y-4">
                  {/* Public/Private Status */}
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="applyToPublic"
                        name="applyToPublic"
                        checked={bulkUpdateForm.applyToPublic}
                        onChange={handleBulkUpdateFormChange}
                        className="mr-2 h-4 w-4"
                      />
                      <label htmlFor="applyToPublic" className="text-white">
                        Update Public/Private Status
                      </label>
                    </div>
                    
                    {bulkUpdateForm.applyToPublic && (
                      <select
                        name="isPublic"
                        value={bulkUpdateForm.isPublic === undefined ? '' : bulkUpdateForm.isPublic.toString()}
                        onChange={handleBulkUpdateFormChange}
                        className="w-full bg-bg-dark border border-gray-600 rounded-lg px-3 py-2 text-white"
                        disabled={!bulkUpdateForm.applyToPublic}
                      >
                        <option value="">-- Select --</option>
                        <option value="true">Public (All ages)</option>
                        <option value="false">Age Restricted</option>
                      </select>
                    )}
                  </div>
                  
                  {/* Age Range */}
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="applyToAgeRange"
                        name="applyToAgeRange"
                        checked={bulkUpdateForm.applyToAgeRange}
                        onChange={handleBulkUpdateFormChange}
                        className="mr-2 h-4 w-4"
                      />
                      <label htmlFor="applyToAgeRange" className="text-white">
                        Update Age Range
                      </label>
                    </div>
                    
                    {bulkUpdateForm.applyToAgeRange && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="minAge" className="block text-gray-400 mb-1">Min Age</label>
                          <input
                            type="number"
                            id="minAge"
                            name="minAge"
                            value={bulkUpdateForm.minAge || ''}
                            onChange={handleBulkUpdateFormChange}
                            className="w-full bg-bg-dark border border-gray-600 rounded-lg px-3 py-2 text-white"
                            disabled={!bulkUpdateForm.applyToAgeRange}
                            min="0"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="maxAge" className="block text-gray-400 mb-1">Max Age</label>
                          <input
                            type="number"
                            id="maxAge"
                            name="maxAge"
                            value={bulkUpdateForm.maxAge || ''}
                            onChange={handleBulkUpdateFormChange}
                            className="w-full bg-bg-dark border border-gray-600 rounded-lg px-3 py-2 text-white"
                            disabled={!bulkUpdateForm.applyToAgeRange}
                            min="1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button
                    variant="primary"
                    onClick={handleBulkUpdate}
                    disabled={isBulkUpdating || (!bulkUpdateForm.applyToPublic && !bulkUpdateForm.applyToAgeRange)}
                    className="w-1/2"
                  >
                    {isBulkUpdating ? 'Updating...' : 'Update Exams'}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => setShowBulkUpdateModal(false)}
                    disabled={isBulkUpdating}
                    className="w-1/2"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Export Modal */}
          {showExportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-bg-light p-6 rounded-lg max-w-md w-full">
                <h3 className="text-xl font-bold text-white mb-4">
                  Export Exams
                </h3>
                <p className="text-gray-400 mb-4">
                  Select export format and options
                </p>
                
                <div className="space-y-4">
                  {/* Export Format */}
                  <div>
                    <label className="block text-white mb-2">Export Format</label>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="format"
                          value="csv"
                          checked={exportOptions.format === 'csv'}
                          onChange={handleExportOptionChange}
                          className="mr-2 h-4 w-4"
                        />
                        <span className="text-white">CSV</span>
                      </label>
                      
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="format"
                          value="pdf"
                          checked={exportOptions.format === 'pdf'}
                          onChange={handleExportOptionChange}
                          className="mr-2 h-4 w-4"
                        />
                        <span className="text-white">PDF</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Export Scope */}
                  <div>
                    <label className="block text-white mb-2">Export Scope</label>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="exportScope"
                          value="all"
                          checked={exportOptions.all}
                          onChange={handleExportOptionChange}
                          className="mr-2 h-4 w-4"
                        />
                        <span className="text-white">All Exams ({exams.length})</span>
                      </label>
                      
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="exportScope"
                          value="selected"
                          checked={!exportOptions.all}
                          onChange={handleExportOptionChange}
                          className="mr-2 h-4 w-4"
                        />
                        <span className="text-white">Selected ({selectedExamIds.size})</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button
                    variant="primary"
                    onClick={handleExport}
                    disabled={isExporting || (!exportOptions.all && selectedExamIds.size === 0)}
                    className="w-1/2"
                  >
                    {isExporting ? 'Exporting...' : 'Export'}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => setShowExportModal(false)}
                    disabled={isExporting}
                    className="w-1/2"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminExamsPage; 