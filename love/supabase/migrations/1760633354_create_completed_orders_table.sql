-- Migration: create_completed_orders_table
-- Created at: 1760633354

CREATE TABLE IF NOT EXISTS completed_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  manager TEXT,
  laser_time DECIMAL(10,2) DEFAULT 0,
  cleaning_time DECIMAL(10,2) DEFAULT 0,
  bending_time DECIMAL(10,2) DEFAULT 0,
  welding_time DECIMAL(10,2) DEFAULT 0,
  painting_time DECIMAL(10,2) DEFAULT 0,
  warehouse75_time DECIMAL(10,2) DEFAULT 0,
  warehouse_time DECIMAL(10,2) DEFAULT 0,
  total_time DECIMAL(10,2) DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completed_orders_completed_at ON completed_orders(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_completed_orders_order_number ON completed_orders(order_number);;