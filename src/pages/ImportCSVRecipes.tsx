import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import BackButton from "@/components/BackButton";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";
import recipesCSV from "@/assets/data/recipes_mvop.csv?raw";

interface CSVRecipe {
  recipe_name: string;
  cuisine: string;
  time_to_cook_min: string;
  difficulty: string;
  ingredients: string;
  steps: string;
}

const ImportCSVRecipes = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const importRecipes = async () => {
    setImporting(true);
    setProgress(0);
    setStatus("idle");

    try {
      // Parse CSV
      const result = Papa.parse<CSVRecipe>(recipesCSV, {
        header: true,
        skipEmptyLines: true,
      });

      if (result.errors.length > 0) {
        throw new Error("Failed to parse CSV");
      }

      const recipes = result.data;
      setProgress(10);

      // Clear existing recipes
      setMessage("Clearing existing recipes...");
      const { error: deleteError } = await supabase
        .from("recipes")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (deleteError) throw deleteError;
      setProgress(20);

      // Import recipes
      setMessage("Importing recipes...");
      const totalRecipes = recipes.length;

      for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        const slug = createSlug(recipe.recipe_name);

        // Insert recipe
        const { data: recipeData, error: recipeError} = await supabase
          .from("recipes")
          .insert({
            title: recipe.recipe_name,
            cuisine: recipe.cuisine,
            total_time_minutes: parseInt(recipe.time_to_cook_min) || null,
            difficulty: recipe.difficulty,
            steps: recipe.steps.split("|").map((s) => s.trim()),
            image_url: `/images/${slug}.jpg`,
            source: "csv_import",
          })
          .select()
          .single();

        if (recipeError) {
          console.error("Error importing recipe:", recipe.recipe_name, recipeError);
          continue;
        }

        // Insert ingredients
        const ingredients = recipe.ingredients
          .split(";")
          .map((ing) => ing.trim())
          .filter((ing) => ing.length > 0);

        for (const ingredient of ingredients) {
          await supabase.from("recipe_ingredients").insert({
            recipe_id: recipeData.id,
            raw_text: ingredient,
          });
        }

        // Update progress
        const currentProgress = 20 + ((i + 1) / totalRecipes) * 70;
        setProgress(currentProgress);
        setMessage(`Imported ${i + 1} of ${totalRecipes} recipes...`);
      }

      setProgress(100);
      setStatus("success");
      setMessage(`Successfully imported ${totalRecipes} recipes!`);
      toast.success(`Imported ${totalRecipes} recipes`);
    } catch (error) {
      console.error("Import error:", error);
      setStatus("error");
      setMessage("Failed to import recipes");
      toast.error("Failed to import recipes");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <BackButton />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Import Recipes from CSV
          </h1>
            <p className="text-muted-foreground">
              Import recipes from the uploaded CSV file
            </p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-center py-8">
              {status === "idle" && (
                <Upload className="w-16 h-16 text-muted-foreground" />
              )}
              {status === "success" && (
                <CheckCircle className="w-16 h-16 text-green-500" />
              )}
              {status === "error" && (
                <AlertCircle className="w-16 h-16 text-destructive" />
              )}
            </div>

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">
                  {message}
                </p>
              </div>
            )}

            {!importing && status !== "idle" && (
              <p className="text-center text-foreground font-medium">
                {message}
              </p>
            )}

            <div className="space-y-4">
              <Button
                onClick={importRecipes}
                disabled={importing}
                className="w-full bg-gradient-to-r from-primary to-accent"
                size="lg"
              >
                {importing ? "Importing..." : "Import Recipes"}
              </Button>

              {status === "success" && (
                <Button
                  onClick={() => (window.location.href = "/recipes")}
                  variant="outline"
                  className="w-full"
                >
                  View Recipes
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>This will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Clear all existing recipes</li>
                <li>Import new recipes from the CSV</li>
                <li>Create recipe ingredients for each recipe</li>
                <li>Generate image URLs based on recipe names</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ImportCSVRecipes;
