-- Insert sample data for Smart City Aktau

INSERT INTO users (email, password_hash, full_name, role) 
VALUES (
  'qynon@admin.kz',
  '$2a$10$rR5ZqNnJvv0xKzX5FqZHJeJ.J5pZqNnJvv0xKzX5FqZHJeJ.J5pZq',
  'Admin User',
  'admin'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO complaints (user_id, case_id, title, description, category, status, created_at)
SELECT 
  u.id,
  'C-12345',
  'Broken Streetlight on Main St',
  'The streetlight near building #45 has been broken for 3 days',
  'Roads & Infrastructure',
  'Resolved',
  NOW() - INTERVAL '10 days'
FROM users u WHERE u.email = 'qynon@admin.kz'
ON CONFLICT (case_id) DO NOTHING;

INSERT INTO complaints (user_id, case_id, title, description, category, status, created_at)
SELECT 
  u.id,
  'C-12378',
  'Pothole near Elm & Oak Ave',
  'Large pothole causing damage to vehicles',
  'Roads & Infrastructure',
  'In Progress',
  NOW() - INTERVAL '4 days'
FROM users u WHERE u.email = 'qynon@admin.kz'
ON CONFLICT (case_id) DO NOTHING;

INSERT INTO complaints (user_id, case_id, title, description, category, status, created_at)
SELECT 
  u.id,
  'C-12399',
  'Graffiti on park bench',
  'Park bench at Central Park has graffiti',
  'Parks & Recreation',
  'Received',
  NOW() - INTERVAL '1 day'
FROM users u WHERE u.email = 'qynon@admin.kz'
ON CONFLICT (case_id) DO NOTHING;

INSERT INTO complaints (user_id, case_id, title, description, category, status, created_at)
SELECT 
  u.id,
  'C-12401',
  'Abandoned vehicle on 4th St',
  'Car parked for over 2 weeks',
  'Public Safety',
  'Rejected',
  NOW()
FROM users u WHERE u.email = 'qynon@admin.kz'
ON CONFLICT (case_id) DO NOTHING;

INSERT INTO map_events (title, description, event_type, latitude, longitude, start_time, end_time)
VALUES (
  'Summer Street Festival',
  'Annual summer festival with music and food',
  'festival',
  47.1056,
  51.9142,
  NOW(),
  NOW() + INTERVAL '8 hours'
) ON CONFLICT DO NOTHING;
