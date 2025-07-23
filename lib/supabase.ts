import { createClient } from "@supabase/supabase-js"

const supabaseUrl = 'https://ebagafhujdikqimsmmos.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYWdhZmh1amRpa3FpbXNtbW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDM5MTAsImV4cCI6MjA2ODc3OTkxMH0.3B2h4Ob9IKXYv-5Cd-MJP_3MCqCu8ZG6ulsaUj-ArkQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database tables
export interface User {
  id: string
  username: string
  name: string
  email: string
  role: "admin" | "user"
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string
  icon: string
  product_count: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  category_name: string
  stock: number
  image_url: string
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}
