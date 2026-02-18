import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// This will print to your BROWSER console (Press F12)
if (typeof window !== "undefined") {
  console.log("Checking Supabase Variables:");
  console.log("URL exists:", !!supabaseUrl);
  console.log("Key exists:", !!supabaseKey);
}

export const supabase = createClient(supabaseUrl!, supabaseKey!)