import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Use Service Role Key for Crawler (Server-side) to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create client only if env vars exist (or let it throw inside where used?)
// Better: export a function to get it, or simpler: just accept it might fail if env is missing at verify time.
// The issue is 'import' hoisting runs this file BEFORE dotenv.config code in main script.

// Solution: Create client in a safer way or Ensure dotenv runs before import (via -r dotenv/config)
// But for now, let's just make it null-safe and throw on usage?
// No, createClient throws immediately if url is missing.

export const supabaseAdmin = (supabaseUrl && supabaseKey) 
  ? createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null as unknown as ReturnType<typeof createClient<Database>>; // Cast to bypass check for now, but will crash if used.

