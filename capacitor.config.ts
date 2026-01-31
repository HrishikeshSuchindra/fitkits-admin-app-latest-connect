import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitkits.admin',
  appName: 'FitKits',
  webDir: 'dist',
  server: {
    url: 'https://68412e49-c447-42d0-9ba8-f057430cb0a6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
