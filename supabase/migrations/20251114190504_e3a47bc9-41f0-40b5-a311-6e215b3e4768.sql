-- Add image_url column to common_items table
ALTER TABLE public.common_items 
ADD COLUMN image_url TEXT;