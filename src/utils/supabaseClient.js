import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Test connection
if (supabaseUrl && supabaseAnonKey) {
  supabase
    .from('ingredients')
    .select('count')
    .then(({ error }) => {
      if (error) {
        console.error('Supabase connection error:', error);
      } else {
        console.log('✅ Connected to Supabase!');
      }
    });
}