import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://macodeqmuqflgmebdysj.supabase.co'
const supabaseKey = 'sb_publishable_UuKy0Z1OKnJAEpQMloaIyw_xj3LePi8'
export const supabase = createClient(supabaseUrl, supabaseKey)