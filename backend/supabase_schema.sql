-- Supabase PostgreSQL Schema for CariMakan

CREATE TABLE users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  phone text DEFAULT NULL,
  address text DEFAULT NULL,
  birth_date date DEFAULT NULL,
  bio text DEFAULT NULL,
  avatar text DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE chats (
  id text PRIMARY KEY,
  sender_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  receiver_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE orders (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  order_number text NOT NULL UNIQUE,
  items jsonb NOT NULL,
  total_price numeric(10,2) NOT NULL,
  delivery_address text DEFAULT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'cooking', 'ready', 'completed')),
  payment_method text DEFAULT NULL,
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  voucher_code text DEFAULT NULL,
  voucher_discount numeric(10,2) DEFAULT NULL,
  estimated_time integer DEFAULT 30,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE ratings (
  id text PRIMARY KEY,
  meal_id text NOT NULL,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_name text NOT NULL,
  rating integer DEFAULT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE vouchers (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount numeric(10,2) NOT NULL,
  type text DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
  expires_at date NOT NULL,
  max_uses integer DEFAULT 100,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE wishlist (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  meal_id text NOT NULL,
  meal_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, meal_id)
);

-- Insert initial data
INSERT INTO users (id, name, email, password, role, created_at) VALUES
('admin-001', 'Admin', 'admin@cari.com', 'admin123', 'admin', '2026-06-29 10:39:17'),
('demo-001', 'Demo User', 'demo@email.com', 'password123', 'user', '2026-06-29 10:39:17'),
('user-1782730884651', 'tika', 'tika@gmail.com', '123456', 'user', '2026-06-29 11:01:24');
