-- Add image_url column to global_wines table
ALTER TABLE global_wines
ADD COLUMN image_url VARCHAR(500) NULL;
