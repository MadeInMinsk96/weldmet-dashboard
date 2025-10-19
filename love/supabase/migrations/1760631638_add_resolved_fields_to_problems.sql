-- Migration: add_resolved_fields_to_problems
-- Created at: 1760631638

ALTER TABLE problems 
ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolved_by TEXT;;