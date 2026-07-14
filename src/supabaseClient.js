import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tcmmmdrbhdderxkynjll.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbW1tZHJiaGRkZXJ4a3luamxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzA4NDAsImV4cCI6MjA5NjQwNjg0MH0.8xLxVrWPD7wlAbW7slRKq80_MtDqc3LCKLlYK3dB2kk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
