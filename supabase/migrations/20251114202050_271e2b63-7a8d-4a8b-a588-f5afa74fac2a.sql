-- Create table for recipe ratings
CREATE TABLE IF NOT EXISTS public.recipe_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipe_ratings
CREATE POLICY "Users can view their own ratings"
  ON public.recipe_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ratings"
  ON public.recipe_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.recipe_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON public.recipe_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for saved recipes
CREATE TABLE IF NOT EXISTS public.saved_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_recipes
CREATE POLICY "Users can view their own saved recipes"
  ON public.saved_recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save recipes"
  ON public.saved_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave recipes"
  ON public.saved_recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for grocery list items
CREATE TABLE IF NOT EXISTS public.grocery_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'serving',
  source TEXT DEFAULT 'manual', -- 'manual', 'recipe', 'recommendation'
  recipe_id UUID,
  checked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grocery_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grocery_list
CREATE POLICY "Users can view their own grocery list"
  ON public.grocery_list FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their grocery list"
  ON public.grocery_list FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their grocery list"
  ON public.grocery_list FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their grocery list"
  ON public.grocery_list FOR DELETE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_recipe_ratings_updated_at
  BEFORE UPDATE ON public.recipe_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grocery_list_updated_at
  BEFORE UPDATE ON public.grocery_list
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();