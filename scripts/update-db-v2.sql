-- Add RLS policies for security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own feedback
CREATE POLICY "Users can create feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- Everyone can view alerts
CREATE POLICY "Everyone can view alerts" ON alerts
  FOR SELECT USING (true);

-- Everyone can view map events
CREATE POLICY "Everyone can view events" ON map_events
  FOR SELECT USING (true);
