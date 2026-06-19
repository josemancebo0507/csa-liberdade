import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://ehbosnplrsixaloivtbe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoYm9zbnBscnNpeGFsb2l2dGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTEwNjAsImV4cCI6MjA5NzM4NzA2MH0.q-m2sx91Ut5HdjTc8mPoG6a13f5C1kNsKInzD__3YT8'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
