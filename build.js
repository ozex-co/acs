#!/usr/bin/env node

/**
 * Custom build script for ACS application
 * Ensures consistent API URLs across the application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { exit } = require('process');

console.log('🛠️  Starting ACS Frontend build process...');

// Backend URL to use
const BACKEND_URL = 'https://acs-backend-2bvr.onrender.com';
console.log(`📡 Using backend URL: ${BACKEND_URL}`);

// Paths to check and modify
const API_UTILS_PATH = path.join(__dirname, 'src/utils/api.ts');
const API_CONSTANTS_PATH = path.join(__dirname, 'src/utils/constants.ts');
const API_HELPERS_PATH = path.join(__dirname, 'src/utils/apiHelpers.ts');

// 1. Update API_ROUTES.BASE_URL in api.ts
console.log('✅ Checking API configuration in api.ts...');
try {
  let apiContent = fs.readFileSync(API_UTILS_PATH, 'utf8');
  // Use a regex to update the BASE_URL
  apiContent = apiContent.replace(
    /(BASE_URL:\s*['"])(.+?)(['"])/,
    `$1${BACKEND_URL}/api$3`
  );
  fs.writeFileSync(API_UTILS_PATH, apiContent);
  console.log('✅ Updated API_ROUTES.BASE_URL in api.ts');
} catch (error) {
  console.error('❌ Failed to update api.ts:', error);
  exit(1);
}

// 2. Update API.BASE_URL in constants.ts
console.log('✅ Checking API configuration in constants.ts...');
try {
  let constantsContent = fs.readFileSync(API_CONSTANTS_PATH, 'utf8');
  // Use a regex to update the BASE_URL
  constantsContent = constantsContent.replace(
    /(BASE_URL:\s*['"])(.+?)(['"])/,
    `$1${BACKEND_URL}$3`
  );
  fs.writeFileSync(API_CONSTANTS_PATH, constantsContent);
  console.log('✅ Updated API.BASE_URL in constants.ts');
} catch (error) {
  console.error('❌ Failed to update constants.ts:', error);
  exit(1);
}

// 3. Build the application
console.log('🏗️  Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  exit(1);
}

console.log('✨ All done! The application is ready to deploy.'); 