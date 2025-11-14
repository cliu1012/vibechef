-- Create food database table with nutritional information
CREATE TABLE IF NOT EXISTS public.food_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('protein', 'dairy', 'vegetable', 'fruit', 'grain', 'snack', 'beverage')),
  calories DECIMAL(10, 2) NOT NULL,
  protein_g DECIMAL(10, 2) DEFAULT 0,
  carbs_g DECIMAL(10, 2) DEFAULT 0,
  fat_g DECIMAL(10, 2) DEFAULT 0,
  fiber_g DECIMAL(10, 2) DEFAULT 0,
  default_serving_size DECIMAL(10, 2) DEFAULT 100,
  default_unit TEXT DEFAULT 'g',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user profiles table for dietary preferences
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_calorie_goal INTEGER,
  protein_goal_g INTEGER,
  carbs_goal_g INTEGER,
  fat_goal_g INTEGER,
  fiber_goal_g INTEGER,
  allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
  dietary_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  cooking_time_preference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user inventory table
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.food_database(id) ON DELETE SET NULL,
  custom_name TEXT,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('fridge', 'freezer', 'pantry')),
  status TEXT DEFAULT 'in-stock' CHECK (status IN ('in-stock', 'low', 'expiring', 'out')),
  expires_at DATE,
  calories DECIMAL(10, 2),
  protein_g DECIMAL(10, 2),
  carbs_g DECIMAL(10, 2),
  fat_g DECIMAL(10, 2),
  fiber_g DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for food_database (public read)
CREATE POLICY "Food database is publicly readable"
  ON public.food_database FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_inventory
CREATE POLICY "Users can view their own inventory"
  ON public.user_inventory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory items"
  ON public.user_inventory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items"
  ON public.user_inventory FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items"
  ON public.user_inventory FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX idx_user_inventory_location ON public.user_inventory(location);
CREATE INDEX idx_user_inventory_status ON public.user_inventory(status);
CREATE INDEX idx_food_database_category ON public.food_database(category);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_inventory_updated_at
  BEFORE UPDATE ON public.user_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample food items from the datasets
INSERT INTO public.food_database (name, category, calories, protein_g, carbs_g, fat_g, fiber_g, default_serving_size, default_unit) VALUES
  ('Chicken Breast', 'protein', 165, 31, 0, 3.6, 0, 100, 'g'),
  ('Eggs', 'protein', 155, 13, 1.1, 11, 0, 100, 'g'),
  ('Milk', 'dairy', 61, 3.2, 4.8, 3.3, 0, 100, 'ml'),
  ('Cheese', 'dairy', 402, 25, 1.3, 33, 0, 100, 'g'),
  ('Yogurt', 'dairy', 59, 10, 3.6, 0.4, 0, 100, 'g'),
  ('Rice', 'grain', 130, 2.7, 28, 0.3, 0.4, 100, 'g'),
  ('Frozen Peas', 'vegetable', 81, 5, 14, 0.4, 5, 100, 'g'),
  ('Spinach', 'vegetable', 23, 2.9, 3.6, 0.4, 2.2, 100, 'g'),
  ('Tomatoes', 'vegetable', 18, 0.9, 3.9, 0.2, 1.2, 100, 'g'),
  ('Broccoli', 'vegetable', 34, 2.8, 7, 0.4, 2.6, 100, 'g'),
  ('Carrots', 'vegetable', 41, 0.9, 10, 0.2, 2.8, 100, 'g'),
  ('Apples', 'fruit', 52, 0.3, 14, 0.2, 2.4, 100, 'g'),
  ('Bananas', 'fruit', 89, 1.1, 23, 0.3, 2.6, 100, 'g'),
  ('Oranges', 'fruit', 47, 0.9, 12, 0.1, 2.4, 100, 'g'),
  ('Bread', 'grain', 265, 9, 49, 3.2, 2.7, 100, 'g'),
  ('Pasta', 'grain', 371, 13, 75, 1.5, 3.2, 100, 'g'),
  ('Oats', 'grain', 389, 17, 66, 6.9, 10.6, 100, 'g'),
  ('Chicken Thigh', 'protein', 209, 26, 0, 11, 0, 100, 'g'),
  ('Ground Beef', 'protein', 250, 26, 0, 15, 0, 100, 'g'),
  ('Salmon', 'protein', 208, 20, 0, 13, 0, 100, 'g'),
  ('Turkey', 'protein', 189, 29, 0, 7, 0, 100, 'g'),
  ('Peanut Butter', 'snack', 588, 25, 20, 50, 6, 100, 'g'),
  ('Almonds', 'snack', 579, 21, 22, 50, 12.5, 100, 'g'),
  ('Olive Oil', 'snack', 884, 0, 0, 100, 0, 100, 'ml'),
  ('Butter', 'dairy', 717, 0.9, 0.1, 81, 0, 100, 'g');