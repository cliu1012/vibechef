-- Add user_id column to recipes table to track recipe ownership
ALTER TABLE recipes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_recipes_user_id ON recipes(user_id);

-- Drop old admin-only policies
DROP POLICY IF EXISTS "Admins can insert recipes" ON recipes;
DROP POLICY IF EXISTS "Admins can update recipes" ON recipes;
DROP POLICY IF EXISTS "Admins can delete recipes" ON recipes;

-- Create new policies that allow users to manage their own recipes
CREATE POLICY "Users can insert their own recipes"
  ON recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
  ON recipes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can still manage all recipes
CREATE POLICY "Admins can insert any recipe"
  ON recipes
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any recipe"
  ON recipes
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any recipe"
  ON recipes
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update recipe_ingredients policies to allow users to manage ingredients for their own recipes
DROP POLICY IF EXISTS "Admins can insert recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Admins can update recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Admins can delete recipe ingredients" ON recipe_ingredients;

CREATE POLICY "Users can insert ingredients for their own recipes"
  ON recipe_ingredients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ingredients for their own recipes"
  ON recipe_ingredients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients for their own recipes"
  ON recipe_ingredients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Admins can still manage all ingredients
CREATE POLICY "Admins can insert any recipe ingredients"
  ON recipe_ingredients
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any recipe ingredients"
  ON recipe_ingredients
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any recipe ingredients"
  ON recipe_ingredients
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update recipe_tags policies similarly
DROP POLICY IF EXISTS "Admins can insert recipe tags" ON recipe_tags;
DROP POLICY IF EXISTS "Admins can update recipe tags" ON recipe_tags;
DROP POLICY IF EXISTS "Admins can delete recipe tags" ON recipe_tags;

CREATE POLICY "Users can insert tags for their own recipes"
  ON recipe_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tags for their own recipes"
  ON recipe_tags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags for their own recipes"
  ON recipe_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Admins can still manage all tags
CREATE POLICY "Admins can insert any recipe tags"
  ON recipe_tags
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any recipe tags"
  ON recipe_tags
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any recipe tags"
  ON recipe_tags
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));