-- Coffee Shop Inventory System Database Schema
-- Database: inventory_coffee

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create schema
CREATE SCHEMA IF NOT EXISTS coffee_inventory;

-- Admin users table
CREATE TABLE IF NOT EXISTS coffee_inventory.admin_users (
  admin_id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT 'Admin',
  workspace_name VARCHAR(255) DEFAULT 'Coffee Shop',
  is_active BOOLEAN DEFAULT TRUE,
  member_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS coffee_inventory.products (
  product_id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity NUMERIC(12, 2) DEFAULT 0,
  description TEXT,
  image_url TEXT,
  last_update VARCHAR(255) DEFAULT 'Recently added product',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_products_category ON coffee_inventory.products(category);
CREATE INDEX idx_products_created_at ON coffee_inventory.products(created_at DESC);
CREATE INDEX idx_admin_email ON coffee_inventory.admin_users(email);

-- Default admin user (password: 1234)
INSERT INTO coffee_inventory.admin_users (full_name, email, password_hash, role, workspace_name)
VALUES (
  'Admin User',
  'brix@gmail.com',
  crypt('1234', gen_salt('bf')),
  'Admin',
  'Coffee Shop'
)
ON CONFLICT (email) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  workspace_name = EXCLUDED.workspace_name,
  is_active = TRUE,
  updated_at = CURRENT_TIMESTAMP;

UPDATE coffee_inventory.admin_users
SET
  is_active = FALSE,
  updated_at = CURRENT_TIMESTAMP
WHERE lower(email) = 'admin@coffeeshop.com';

-- Sample coffee products
INSERT INTO coffee_inventory.products (product_name, category, unit, quantity, description, last_update)
VALUES 
  ('Arabica Beans', 'Coffee Beans', 'kg', 25.50, 'Premium arabica beans from Ethiopia', 'Restocked arabica beans'),
  ('Robusta Beans', 'Coffee Beans', 'kg', 15.75, 'High quality robusta beans', 'Added robusta beans'),
  ('Whole Milk', 'Milk', 'liters', 40.00, 'Fresh whole milk for steaming', 'Restocked milk supply'),
  ('Almond Milk', 'Milk', 'liters', 12.50, 'Plant-based milk alternative', 'Recently added'),
  ('Vanilla Syrup', 'Syrup', 'liters', 8.00, 'Premium vanilla syrup', 'Inventory updated'),
  ('Caramel Syrup', 'Syrup', 'liters', 6.50, 'Rich caramel flavoring', 'Stock replenished'),
  ('Paper Cups', 'Supplies', 'pcs', 500, '12oz disposable cups', 'Restocked supplies'),
  ('Wooden Stirrers', 'Supplies', 'pcs', 1000, 'Eco-friendly wooden stirrers', 'New inventory added')
ON CONFLICT DO NOTHING;
