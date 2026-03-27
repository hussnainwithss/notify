  ALTER TABLE users
    ADD COLUMN roles TEXT[] NOT NULL DEFAULT ARRAY['user']
    CHECK (roles <@ ARRAY['user', 'admin']);
