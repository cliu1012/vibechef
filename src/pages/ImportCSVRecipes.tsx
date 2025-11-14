import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { toast } from "sonner";
import Papa from "papaparse";

interface CSVRecipe {
  recipe_name: string;
  cuisine: string;
  time_to_cook_min: string;
  difficulty: string;
  ingredients: string;
  calory: string;
  nutrition_values: string;
}

const ImportCSVRecipes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseNutritionValues = (nutritionStr: string) => {
    const proteinMatch = nutritionStr.match(/Protein\s+([\d.]+)\s*g/i);
    const carbsMatch = nutritionStr.match(/Carbohydrates\s+([\d.]+)\s*g/i);
    const fatMatch = nutritionStr.match(/Fat\s+([\d.]+)\s*g/i);

    return {
      protein: proteinMatch ? parseFloat(proteinMatch[1]) : null,
      carbs: carbsMatch ? parseFloat(carbsMatch[1]) : null,
      fat: fatMatch ? parseFloat(fatMatch[1]) : null,
    };
  };

  const importRecipes = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("You must be logged in to import recipes");
        return;
      }

      // Fetch the CSV file
      const response = await fetch('/src/assets/data/recipes_50_generated.csv');
      const csvText = await response.text();

      // Parse CSV
      const parsed = await new Promise<CSVRecipe[]>((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data as CSVRecipe[]),
          error: (error) => reject(error)
        });
      });

      console.log(`Parsed ${parsed.length} recipes from CSV`);

      let importedCount = 0;
      const errors: string[] = [];

      // Import each recipe
      for (const csvRecipe of parsed) {
        try {
          const nutrition = parseNutritionValues(csvRecipe.nutrition_values);
          const calories = parseInt(csvRecipe.calory);
          const totalTime = parseInt(csvRecipe.time_to_cook_min);

          // Insert recipe
          const { data: recipe, error: recipeError } = await supabase
            .from('recipes')
            .insert({
              title: csvRecipe.recipe_name,
              description: `A delicious ${csvRecipe.cuisine} dish`,
              servings: 4,
              total_time_minutes: totalTime,
              difficulty: csvRecipe.difficulty.toLowerCase(),
              calories_per_serving: calories,
              source: 'csv_import',
            })
            .select()
            .single();

          if (recipeError) {
            errors.push(`Failed to import ${csvRecipe.recipe_name}: ${recipeError.message}`);
            continue;
          }

          // Insert ingredients
          const ingredients = csvRecipe.ingredients
            .split(';')
            .map(ing => ing.trim())
            .filter(ing => ing.length > 0);

          const ingredientRows = ingredients.map(ing => ({
            recipe_id: recipe.id,
            raw_text: ing,
          }));

          if (ingredientRows.length > 0) {
            const { error: ingredientsError } = await supabase
              .from('recipe_ingredients')
              .insert(ingredientRows);

            if (ingredientsError) {
              console.error(`Error inserting ingredients for ${csvRecipe.recipe_name}:`, ingredientsError);
            }
          }

          // Insert tags
          const tags = [
            csvRecipe.cuisine.toLowerCase(),
            csvRecipe.difficulty.toLowerCase(),
          ];

          if (totalTime <= 30) tags.push('quick');
          if (nutrition.protein && nutrition.protein > 30) tags.push('high protein');

          const tagRows = tags.map(tag => ({
            recipe_id: recipe.id,
            tag,
          }));

          const { error: tagsError } = await supabase
            .from('recipe_tags')
            .insert(tagRows);

          if (tagsError) {
            console.error(`Error inserting tags for ${csvRecipe.recipe_name}:`, tagsError);
          }

          importedCount++;
        } catch (err: any) {
          errors.push(`Error processing ${csvRecipe.recipe_name}: ${err.message}`);
        }
      }

      if (errors.length > 0) {
        console.error('Import errors:', errors);
      }

      setSuccess(importedCount);
      toast.success(`Successfully imported ${importedCount} recipes!`);
      
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import recipes');
      toast.error('Failed to import recipes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <BackButton />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-2xl">Import CSV Recipes</CardTitle>
            <CardDescription>
              Import 50 pre-generated recipes from the CSV file into your database.
              This will add recipes with ingredients and tags.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <Button 
                onClick={importRecipes} 
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing recipes...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import 50 Recipes
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success !== null && (
                <Alert className="border-success bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    Successfully imported <strong>{success}</strong> recipes!
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">What will be imported:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>50 recipes from various cuisines (Turkish, Italian, Mexican, Indian, etc.)</li>
                <li>Recipe details: cooking time, difficulty, calories</li>
                <li>Ingredients for each recipe</li>
                <li>Tags based on cuisine, difficulty, and characteristics</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => navigate('/recipes')}
                className="w-full"
              >
                View Recipes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportCSVRecipes;
