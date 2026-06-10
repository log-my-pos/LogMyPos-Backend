import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Bun.env.SUPABASE_URL;
const supabaseSecretKey = Bun.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Missing Supabase environment variables.');
}

// Export the single client instance to use across your app
export const supabase = createClient(supabaseUrl, supabaseSecretKey);