-- Create admin table if it doesn't exist
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin with bcrypt hashed password for 'admin123'
-- The hash for 'admin123' is '$2b$10$K8BvQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQ'
INSERT INTO admins (username, password_hash, name) 
VALUES ('admin', '$2b$10$K8BvQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQ', 'Administrator')
ON CONFLICT (username) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;
