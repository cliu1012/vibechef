-- Create cooked_recipes_log table
CREATE TABLE IF NOT EXISTS public.cooked_recipes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  cooked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on cooked_recipes_log
ALTER TABLE public.cooked_recipes_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for cooked_recipes_log
CREATE POLICY "Users can view their own cooked recipes log"
  ON public.cooked_recipes_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cooked recipes log"
  ON public.cooked_recipes_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cooked recipes log"
  ON public.cooked_recipes_log
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update recipes table to include cuisine field if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recipes' AND column_name = 'cuisine') THEN
    ALTER TABLE public.recipes ADD COLUMN cuisine TEXT;
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_cooked_recipes_log_user_id ON public.cooked_recipes_log(user_id);
CREATE INDEX IF NOT EXISTS idx_cooked_recipes_log_recipe_id ON public.cooked_recipes_log(recipe_id);
CREATE INDEX IF NOT EXISTS idx_cooked_recipes_log_cooked_at ON public.cooked_recipes_log(cooked_at DESC);