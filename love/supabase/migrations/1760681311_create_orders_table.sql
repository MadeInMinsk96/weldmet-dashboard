-- Migration: create_orders_table
-- Created at: 1760681311

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager TEXT,
  order_number TEXT NOT NULL UNIQUE,
  operation_type TEXT,
  shipment_date TEXT,
  cutting_time DECIMAL(10,2) DEFAULT 0,
  cutting_status TEXT,
  cleaning_time DECIMAL(10,2) DEFAULT 0,
  cleaning_status TEXT,
  bending_time DECIMAL(10,2) DEFAULT 0,
  bending_status TEXT,
  welding_time DECIMAL(10,2) DEFAULT 0,
  welding_status TEXT,
  painting_time DECIMAL(10,2) DEFAULT 0,
  painting_status TEXT,
  warehouse75_time DECIMAL(10,2) DEFAULT 0,
  warehouse75_status TEXT,
  warehouse_time DECIMAL(10,2) DEFAULT 0,
  warehouse_status TEXT,
  overall_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_manager ON orders(manager);
CREATE INDEX IF NOT EXISTS idx_orders_overall_status ON orders(overall_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all reads (no authentication required)
CREATE POLICY "Allow public read access to orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

-- Create policy to allow all inserts (no authentication required)
CREATE POLICY "Allow public insert access to orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy to allow all updates (no authentication required)
CREATE POLICY "Allow public update access to orders"
  ON orders
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policy to allow all deletes (no authentication required)
CREATE POLICY "Allow public delete access to orders"
  ON orders
  FOR DELETE
  TO public
  USING (true);;