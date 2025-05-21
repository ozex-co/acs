import React from 'react';
import { APP_CONFIG } from '../config/appConfig';

interface MaintenancePageProps {
  contactEmail?: string;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ 
  contactEmail = APP_CONFIG.CONTACT_EMAIL 
}) => {
  const { THEME } = APP_CONFIG;
  
  return (
    <div className={`min-h-screen ${THEME.DARK_BG_PRIMARY} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full">
        <div 
          className={`${THEME.DARK_BG_SECONDARY} rounded-2xl p-8 shadow-lg ${THEME.DARK_BORDER} border ${THEME.FADE_IN}`}
        >
          <div className="text-center">
            <h1 className={`text-3xl font-bold ${THEME.DARK_TEXT_PRIMARY} mb-6`}>Coming Soon</h1>
            
            <div className="w-16 h-1 bg-primary-500 mx-auto mb-6 animate-in zoom-in duration-500"></div>
            
            <p className={`${THEME.DARK_TEXT_SECONDARY} mb-6 ${THEME.SLIDE_IN_BOTTOM}`}>
              We're working on something amazing. Our platform is currently under maintenance 
              and will be back soon with new features.
            </p>
            
            <div className={`${THEME.SLIDE_IN_BOTTOM} duration-500 delay-200`}>
              <a 
                href={`mailto:${contactEmail}`}
                className="inline-block px-6 py-3 bg-primary-500 text-white font-medium rounded-lg 
                          hover:bg-primary-600 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage; 