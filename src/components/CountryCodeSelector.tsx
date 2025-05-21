import React, { useState, useEffect, useRef } from 'react';

interface Country {
  name: string;
  code: string;
  dialCode: string;
}

interface CountryCodeSelectorProps {
  onChange: (dialCode: string) => void;
  value?: string;
}

const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({ onChange, value = '+213' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: 'الجزائر',
    code: 'DZ',
    dialCode: '+213'
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Common countries in the Arab world and beyond
  const countries: Country[] = [
    { name: 'الجزائر', code: 'DZ', dialCode: '+213' },
    { name: 'مصر', code: 'EG', dialCode: '+20' },
    { name: 'المغرب', code: 'MA', dialCode: '+212' },
    { name: 'تونس', code: 'TN', dialCode: '+216' },
    { name: 'السعودية', code: 'SA', dialCode: '+966' },
    { name: 'الإمارات', code: 'AE', dialCode: '+971' },
    { name: 'قطر', code: 'QA', dialCode: '+974' },
    { name: 'الكويت', code: 'KW', dialCode: '+965' },
    { name: 'البحرين', code: 'BH', dialCode: '+973' },
    { name: 'عمان', code: 'OM', dialCode: '+968' },
    { name: 'الأردن', code: 'JO', dialCode: '+962' },
    { name: 'لبنان', code: 'LB', dialCode: '+961' },
    { name: 'العراق', code: 'IQ', dialCode: '+964' },
    { name: 'ليبيا', code: 'LY', dialCode: '+218' },
    { name: 'السودان', code: 'SD', dialCode: '+249' },
    { name: 'فلسطين', code: 'PS', dialCode: '+970' },
  ];

  // Set initial country based on value prop
  useEffect(() => {
    const country = countries.find(c => c.dialCode === value);
    if (country) {
      setSelectedCountry(country);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    onChange(country.dialCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center justify-between w-full px-3 py-2 bg-bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center">
          <span className="mr-2">{selectedCountry.dialCode}</span>
          <span>{selectedCountry.name}</span>
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-bg-light border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {countries.map((country) => (
            <button
              key={country.code}
              type="button"
              className="w-full px-3 py-2 text-right hover:bg-bg-dark focus:outline-none"
              onClick={() => handleSelectCountry(country)}
            >
              <span className="flex items-center">
                <span className="mr-2">{country.dialCode}</span>
                <span>{country.name}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelector; 