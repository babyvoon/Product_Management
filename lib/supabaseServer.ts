import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// DEBUG: ตรวจสอบการโหลด Service Role Key (ไม่แสดงค่า key จริง)
console.log('[supabaseServer] Service Role Key loaded:', !!supabaseServiceKey)

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey) 