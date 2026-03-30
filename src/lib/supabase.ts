import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lurnxfrryigwentsdeuc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cm54ZnJyeWlnd2VudHNkZXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjM3MjAsImV4cCI6MjA4OTIzOTcyMH0.2U87GQ9HyGk1zUL4-MbyW46i89MNGgIM6TOGUtovuv4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'fitkits-admin-auth',
  }
});

export const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`;
