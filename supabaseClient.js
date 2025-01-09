import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase configuration');
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Store tokens in localStorage by default
    persistSession: true,
    // Automatically refresh the token before it expires
    autoRefreshToken: true,
    // Detect when to refresh the token - 5 minutes before expiry
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'bible-app-auth-token'
  },
  // Debug mode to get more logs
  debug: true,
});



// Test function with timeout and explicit promise handling
export const testSupabaseConnection = async () => {
  console.log('Starting Supabase connection test...');

  // Create a timeout promise
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Supabase connection timeout')), 5000);
  });

  try {
    // Race between the actual request and timeout
    const result = await Promise.race([
      supabase.from('users').select('count').limit(1),
      timeout
    ]);

    console.log('Supabase test completed:', result);
    return true;
  } catch (error) {
    console.error('Supabase test error:', error);

    // Log specific error details
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return false;
  }
};

// Optional: Test the connection on client initialization
console.log('From the supabaseclient file')
supabase.from('bible_versions').select('count').single()
    .then(({ data, error }) => {
      console.log('From the supabaseclient test')
      if (error) {
        console.error('Supabase connection test failed:', error);
      } else {
        console.log('Supabase connection test successful:', data);
      }
    });

// Helper function to get stored session
export const getStoredSession = () => {
  const tokenString = localStorage.getItem('bible-app-auth-token');
  if (tokenString) {
    try {
      return JSON.parse(tokenString);
    } catch (e) {
      console.error('Error parsing stored session:', e);
      return null;
    }
  }
  return null;
};


// Test function
export const testSupabaseConnection2 = async () => {
  try {
    console.log('Testing Supabase connection...')
    const { data, error } = await supabase.from('users').select('count').limit(1)

    if (error) {
      console.error('Supabase test error:', error)
      return false
    }

    console.log('Supabase test successful:', data)
    return true
  } catch (e) {
    console.error('Supabase test caught error:', e)
    return false
  }
}