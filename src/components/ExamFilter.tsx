import React, { useState } from 'react';

interface ExamFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  sections: Array<{
    id: string | number;
    name: string;
  }>;
}

export interface FilterOptions {
  sectionId: string;
  difficulty: string;
  searchTerm: string;
}

const ExamFilter: React.FC<ExamFilterProps> = ({ onFilterChange, sections }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    sectionId: '',
    difficulty: '',
    searchTerm: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-sky-100 dark:bg-sky-900/20 p-4 rounded-lg mb-6 shadow-md">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">تصفية الاختبارات</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="sectionId" className="block text-sm mb-1 text-gray-600 dark:text-gray-300">القسم</label>
          <select
            id="sectionId"
            name="sectionId"
            value={filters.sectionId}
            onChange={handleChange}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">جميع الأقسام</option>
            {sections.map(section => (
              <option key={section.id} value={section.id}>{section.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="difficulty" className="block text-sm mb-1 text-gray-600 dark:text-gray-300">مستوى الصعوبة</label>
          <select
            id="difficulty"
            name="difficulty"
            value={filters.difficulty}
            onChange={handleChange}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">جميع المستويات</option>
            <option value="easy">سهل</option>
            <option value="medium">متوسط</option>
            <option value="hard">صعب</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="searchTerm" className="block text-sm mb-1 text-gray-600 dark:text-gray-300">بحث</label>
          <input
            type="text"
            id="searchTerm"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleChange}
            placeholder="اكتب للبحث..."
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ExamFilter; 