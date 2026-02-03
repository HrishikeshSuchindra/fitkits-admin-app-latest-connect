import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitkits.admin',
  appName: 'FitKits',
  webDir: 'dist',
  // Production build: app uses bundled dist/ folder
  // For development hot-reload, uncomment the server block below:
  // server: {
  //   url: 'https://68412e49-c447-42d0-9ba8-f057430cb0a6.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;