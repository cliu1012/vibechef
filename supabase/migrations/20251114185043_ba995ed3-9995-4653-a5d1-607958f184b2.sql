-- Create common_items table to store suggested items
CREATE TABLE public.common_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  food_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fridge', 'freezer', 'pantry')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.common_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read common items (they're suggestions for all users)
CREATE POLICY "Common items are viewable by everyone"
  ON public.common_items
  FOR SELECT
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_common_items_category ON public.common_items(category, display_order);