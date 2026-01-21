-- ============================================
-- Supabase Security Fix Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE RLS POLICIES FOR EACH TABLE
-- ============================================

-- --------------------
-- USERS TABLE POLICIES
-- --------------------
-- Users can only read and update their own record
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow insert for authenticated users (for sync)
CREATE POLICY "Allow insert for authenticated users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- --------------------
-- PROJECTS TABLE POLICIES
-- --------------------
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- --------------------
-- RESEARCH_TOPICS TABLE POLICIES
-- --------------------
CREATE POLICY "Users can view own topics" ON public.research_topics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topics" ON public.research_topics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topics" ON public.research_topics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topics" ON public.research_topics
  FOR DELETE USING (auth.uid() = user_id);

-- --------------------
-- GENERATED_CONTENT TABLE POLICIES
-- --------------------
CREATE POLICY "Users can view own content" ON public.generated_content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content" ON public.generated_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content" ON public.generated_content
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content" ON public.generated_content
  FOR DELETE USING (auth.uid() = user_id);

-- --------------------
-- API_USAGE TABLE POLICIES
-- --------------------
CREATE POLICY "Users can view own usage" ON public.api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.api_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.api_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- --------------------
-- SYSTEM_LOGS TABLE POLICIES
-- --------------------
-- System logs: users can only view their own logs, but system can insert any
CREATE POLICY "Users can view own logs" ON public.system_logs
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow service role to insert logs (server-side only)
CREATE POLICY "Service role can insert logs" ON public.system_logs
  FOR INSERT WITH CHECK (true);

-- --------------------
-- FEEDBACK TABLE POLICIES
-- --------------------
CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON public.feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 3. FIX FUNCTION SEARCH PATH (if exists)
-- ============================================

-- Check if handle_new_user function exists and fix it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Recreate with proper search_path
    ALTER FUNCTION public.handle_new_user() SET search_path = public;
  END IF;
END
$$;

-- ============================================
-- 4. GRANT NECESSARY PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_topics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_content TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.api_usage TO authenticated;
GRANT SELECT ON public.system_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.feedback TO authenticated;

-- ============================================
-- DONE! All security policies are now in place.
-- ============================================
