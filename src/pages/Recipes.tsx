import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Clock,
  Flame,
  ChefHat,
  ShoppingCart,
  CheckCircle2,
  ExternalLink,
  Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RecipeIngredient {
  id: string;
  raw_text: string;
  quantity: number | null;
  unit: string | null;
}

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  steps: string[] | null;
  servings: number | null;
  total_time_minutes: number | null;
  difficulty: string | null;
  calories_per_serving: number | null;
  image_url: string | null;
  source: string | null;
  source_url: string | null;
  tags: string[];
  ingredients: RecipeIngredient[];
}

interface RecipeWithMatch extends Recipe {
  ingredientMatch: { 
    percentage: number; 
    haveCount: number; 
    totalCount: number;
  };
}

interface InventoryItem {
  id: string;
  custom_name: string | null;
  quantity: number;
  unit: string;
  food_id: string | null;
  food_database?: {
    name: string;
  };
}

const Recipes = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadInventory();
      loadUserAllergies();
      loadRecipes();
    }
  }, [user]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (recipesError) throw recipesError;

      const recipeIds = recipesData?.map(r => r.id) || [];
      
      const [ingredientsResult, tagsResult] = await Promise.all([
        supabase.from('recipe_ingredients').select('*').in('recipe_id', recipeIds),
        supabase.from('recipe_tags').select('*').in('recipe_id', recipeIds)
      ]);

      const ingredientsByRecipe = (ingredientsResult.data || []).reduce((acc, ing) => {
        if (!acc[ing.recipe_id]) acc[ing.recipe_id] = [];
        acc[ing.recipe_id].push(ing);
        return acc;
      }, {} as Record<string, RecipeIngredient[]>);

      const tagsByRecipe = (tagsResult.data || []).reduce((acc, tag) => {
        if (!acc[tag.recipe_id]) acc[tag.recipe_id] = [];
        acc[tag.recipe_id].push(tag.tag);
        return acc;
      }, {} as Record<string, string[]>);

      const enrichedRecipes = recipesData?.map(recipe => ({
        ...recipe,
        steps: Array.isArray(recipe.steps) ? recipe.steps : null,
        ingredients: ingredientsByRecipe[recipe.id] || [],
        tags: tagsByRecipe[recipe.id] || [],
      })) || [];

      setRecipes(enrichedRecipes as Recipe[]);
    } catch (error) {
      console.error("Error loading recipes:", error);
      toast.error("Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  const loadUserAllergies = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('allergies')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setUserAllergies(data.allergies || []);
  };

  const loadInventory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_inventory")
      .select('id, custom_name, quantity, unit, food_id, food_database(name)')
      .eq("user_id", user.id);
    setInventory(data || []);
  };

  const calculateIngredientMatch = (recipe: Recipe) => {
    if (!inventory.length) return { percentage: 0, haveCount: 0, totalCount: recipe.ingredients.length };
    let haveCount = 0;
    recipe.ingredients.forEach((ingredient) => {
      const ingredientText = ingredient.raw_text.toLowerCase();
      const matchingItem = inventory.find((item) => {
        const itemName = (item.custom_name || item.food_database?.name || "").toLowerCase();
        return itemName && (ingredientText.includes(itemName) || itemName.includes(ingredientText.split(' ')[0]));
      });
      if (matchingItem) haveCount++;
    });
    const percentage = recipe.ingredients.length > 0 ? Math.round((haveCount / recipe.ingredients.length) * 100) : 0;
    return { percentage, haveCount, totalCount: recipe.ingredients.length };
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const hasAllergen = userAllergies.some((allergy) => {
      const allergyLower = allergy.toLowerCase();
      return recipe.ingredients.some(ing => ing.raw_text.toLowerCase().includes(allergyLower)) ||
             recipe.tags.some(tag => tag.toLowerCase().includes(allergyLower));
    });
    return !hasAllergen;
  });

  const recipesWithMatch: RecipeWithMatch[] = filteredRecipes.map((recipe) => ({
    ...recipe,
    ingredientMatch: calculateIngredientMatch(recipe),
  }));

  const searchedRecipes = recipesWithMatch.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <BackButton />
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/import-recipe')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Import from MyPlate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/import-csv-recipes')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Import CSV Recipes
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Recipe Library</h1>
            <p className="text-muted-foreground">{filteredRecipes.length} recipes available</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search recipes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

          {loading ? (
            <div className="text-center py-12">Loading recipes...</div>
          ) : searchedRecipes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No recipes found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchedRecipes.map((recipe) => (
                <Card key={recipe.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedRecipe(recipe)}>
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-6xl">
                    {recipe.image_url ? <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" /> : "🍽️"}
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold line-clamp-1">{recipe.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {recipe.total_time_minutes && <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{recipe.total_time_minutes}m</div>}
                      {recipe.calories_per_serving && <div className="flex items-center gap-1"><Flame className="w-4 h-4" />{recipe.calories_per_serving} cal</div>}
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Ingredient Match</span>
                        <span className="text-sm font-semibold text-primary">{recipe.ingredientMatch.percentage}%</span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${recipe.ingredientMatch.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRecipe.title}</DialogTitle>
                {selectedRecipe.description && <DialogDescription>{selectedRecipe.description}</DialogDescription>}
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <ul className="space-y-1">
                    {selectedRecipe.ingredients.map((ing) => (
                      <li key={ing.id} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {ing.raw_text}
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedRecipe.steps && (
                  <div>
                    <h3 className="font-semibold mb-2">Directions</h3>
                    <ol className="list-decimal list-inside space-y-1">
                      {selectedRecipe.steps.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recipes;
