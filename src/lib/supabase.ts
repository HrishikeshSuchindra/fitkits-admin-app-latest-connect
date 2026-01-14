import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xjpaliwcbwhmzpefigsr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcGFsaXdjYndobXpwZWZpZ3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjU2NDMsImV4cCI6MjA4MDEwMTY0M30.JH9sZoGBTaNeeJ-N-ASRCEIEMTvHC0AzcjMR-cRS95Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`;
