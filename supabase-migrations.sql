-- Smart City Актау: Database migrations
-- Run this SQL in Supabase SQL Editor

-- 0. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Add push notification columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS push_endpoint text,
  ADD COLUMN IF NOT EXISTS push_p256dh text,
  ADD COLUMN IF NOT EXISTS push_auth text;

-- 2. Add admin_comment column to feedback table
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS admin_comment text;

-- 3. Add photos column to feedback table (JSON array of URLs)
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]'::jsonb;

-- 4. Create storage bucket for feedback photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-photos', 'feedback-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Create policy for authenticated users to upload photos
CREATE POLICY "Users can upload feedback photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'feedback-photos');

-- 6. Create policy for public read access to feedback photos
CREATE POLICY "Public read access to feedback photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'feedback-photos');

-- 7. Create policy for users to delete their own feedback photos
CREATE POLICY "Users can delete own feedback photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'feedback-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 9. Add AI analysis columns to feedback table
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS ai_category text,
  ADD COLUMN IF NOT EXISTS ai_priority text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_duplicate_of uuid,
  ADD COLUMN IF NOT EXISTS photo_ai_tags jsonb DEFAULT '[]'::jsonb;

-- 10. Create view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_feedback_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'Received') as received_count,
  COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'Resolved') as resolved_count,
  COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_count,
  COUNT(*) as total_count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE status = 'Resolved') as avg_resolution_time_seconds
FROM public.feedback;

COMMENT ON TABLE public.feedback IS 'User feedback and complaints with AI-enhanced processing';
COMMENT ON COLUMN public.feedback.photos IS 'Array of photo URLs from Supabase Storage';
COMMENT ON COLUMN public.feedback.ai_category IS 'AI-detected category';
COMMENT ON COLUMN public.feedback.ai_priority IS 'AI-suggested priority (high/medium/low)';
COMMENT ON COLUMN public.feedback.ai_summary IS 'AI-generated summary';
COMMENT ON COLUMN public.feedback.ai_duplicate_of IS 'Reference to potential duplicate feedback';
COMMENT ON COLUMN public.feedback.photo_ai_tags IS 'AI-detected tags from photos (objects, text, quality issues)';

-- 11. Create news table for admin-written news
CREATE TABLE IF NOT EXISTS public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ru text NOT NULL,
  title_kz text NOT NULL,
  description_ru text NOT NULL,
  description_kz text NOT NULL,
  category text NOT NULL DEFAULT 'event',
  priority text NOT NULL DEFAULT 'medium',
  location text,
  image_url text,
  published boolean DEFAULT true,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON public.news(published);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);

COMMENT ON TABLE public.news IS 'Admin-written news articles (bilingual)';
COMMENT ON COLUMN public.news.title_ru IS 'News title in Russian';
COMMENT ON COLUMN public.news.title_kz IS 'News title in Kazakh';
COMMENT ON COLUMN public.news.description_ru IS 'News content in Russian';
COMMENT ON COLUMN public.news.description_kz IS 'News content in Kazakh';
COMMENT ON COLUMN public.news.category IS 'Category: traffic/event/alert/infrastructure';
COMMENT ON COLUMN public.news.priority IS 'Priority: high/medium/low';
COMMENT ON COLUMN public.news.published IS 'Whether the news is visible to users';

-- 12. RLS Policies for news
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Public can read only published news
DROP POLICY IF EXISTS "Public read published news" ON public.news;
CREATE POLICY "Public read published news" ON public.news
  FOR SELECT TO anon, authenticated
  USING (published = true);

-- Admin can read all news
DROP POLICY IF EXISTS "Admin read all news" ON public.news;
CREATE POLICY "Admin read all news" ON public.news
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.email = 'ch.qynon@gmail.com'
    )
  );

-- Owner can insert own feedback
DROP POLICY IF EXISTS "Owner insert feedback" ON public.feedback;
CREATE POLICY "Owner insert feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Owner can delete own feedback
DROP POLICY IF EXISTS "Owner delete feedback" ON public.feedback;
CREATE POLICY "Owner delete feedback" ON public.feedback
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admin can insert news
DROP POLICY IF EXISTS "Admin insert news" ON public.news;
CREATE POLICY "Admin insert news" ON public.news
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.email = 'ch.qynon@gmail.com'
    )
  );

-- Admin can update news
DROP POLICY IF EXISTS "Admin update news" ON public.news;
CREATE POLICY "Admin update news" ON public.news
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.email = 'ch.qynon@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.email = 'ch.qynon@gmail.com'
    )
  );

-- Admin can delete news
DROP POLICY IF EXISTS "Admin delete news" ON public.news;
CREATE POLICY "Admin delete news" ON public.news
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.email = 'ch.qynon@gmail.com'
    )
  );

-- 13. RLS Policies for feedback admin updates (ensure admin can update any feedback)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow owner to select own feedback (safe default)
DROP POLICY IF EXISTS "Owner select feedback" ON public.feedback;
CREATE POLICY "Owner select feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin can select all feedback
DROP POLICY IF EXISTS "Admin select all feedback" ON public.feedback;
CREATE POLICY "Admin select all feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.email = 'ch.qynon@gmail.com'
    )
  );

-- Admin can update any feedback (status/comment)
DROP POLICY IF EXISTS "Admin update feedback" ON public.feedback;
CREATE POLICY "Admin update feedback" ON public.feedback
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.email = 'ch.qynon@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.email = 'ch.qynon@gmail.com'
    )
  );
