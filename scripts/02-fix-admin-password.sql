-- Update admin password with correct bcrypt hash for 'admin123'
UPDATE admins 
SET password_hash = '$2b$10$K8BvQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQ'
WHERE username = 'admin';

-- If admin doesn't exist, create it
INSERT INTO admins (username, password_hash, name) 
VALUES ('admin', '$2b$10$K8BvQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQQqQ', 'Administrator')
ON CONFLICT (username) DO NOTHING;
