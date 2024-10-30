// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://danjwczbrhatiykqgqis.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhbmp3Y3picmhhdGl5a3FncWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NTI3MzYsImV4cCI6MjA0NTQyODczNn0.UJgF5qny2nMmTIJKOrk5B5MKnRgl1p2OUGpVyl8MIzQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
