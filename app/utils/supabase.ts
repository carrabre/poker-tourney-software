import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqwanqquqapqnuleafqf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xd2FucXF1cWFwcW51bGVhZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxOTMyMDUsImV4cCI6MjA1Nzc2OTIwNX0.u4yjdOz5M7QMUABpObu9yW-gyXE_gFBysf3ehYgJsJM';

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 