import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://vltnlagohodvaewjlbye.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdG5sYWdvaG9kdmFld2psYnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjAyMjEsImV4cCI6MjA3NTU5NjIyMX0.KOhDmTavhbdTbY-88s5ZzB1BEklur4bYJn-EcjfhbGg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
