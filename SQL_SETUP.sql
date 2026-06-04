-- SQL Commands for Neon Database Setup
-- Run these in the Neon SQL Editor to prepare the database for order tracking

-- 1. Create tables table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  table_number INTEGER UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Alter orders table to add table_id if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS table_id INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS table_number INTEGER DEFAULT 1,
ADD CONSTRAINT fk_orders_table_id FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL;

-- 3. Insert default tables (Mesa 1-10)
INSERT INTO tables (table_number, status) 
VALUES 
  (1, 'available'),
  (2, 'available'),
  (3, 'available'),
  (4, 'available'),
  (5, 'available'),
  (6, 'available'),
  (7, 'available'),
  (8, 'available'),
  (9, 'available'),
  (10, 'available')
ON CONFLICT (table_number) DO NOTHING;

-- 4. Verify the orders table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='orders' ORDER BY ordinal_position;
