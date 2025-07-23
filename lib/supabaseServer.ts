import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ebagafhujdikqimsmmos.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYWdhZmh1amRpa3FpbXNtbW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDM5MTAsImV4cCI6MjA2ODc3OTkxMH0.3B2h4Ob9IKXYv-5Cd-MJP_3MCqCu8ZG6ulsaUj-ArkQ'

// DEBUG: ตรวจสอบการโหลด Service Role Key (ไม่แสดงค่า key จริง)
console.log('[supabaseServer] Service Role Key loaded:', !!supabaseServiceKey)

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey) 