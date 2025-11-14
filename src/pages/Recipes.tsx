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
  CheckCircle2,
  Filter,
  Check,
  AlertCircle,
  Plus,
} from "lucide-react";
import Papa from "papaparse";
import recipesCSV from "@/assets/data/recipes_mvop.csv?raw";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RecipeCompletionDialog } from "@/components/RecipeCompletionDialog";

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
    missingIngredients: string[];
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

interface CSVRecipe {
  recipe_name: string;
  cuisine: string;
  time_to_cook_min: string;
  difficulty: string;
  ingredients: string;
  steps: string;
}

const Recipes = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [csvRecipes, setCsvRecipes] = useState<CSVRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithMatch | null>(null);
  const [selectedCSVRecipe, setSelectedCSVRecipe] = useState<CSVRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [maxCookTime, setMaxCookTime] = useState<number>(120);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completingRecipe, setCompletingRecipe] = useState<RecipeWithMatch | null>(null);

  useEffect(() => {
    if (user) {
      loadInventory();
      loadUserAllergies();
      loadRecipes();
      loadCSVRecipes();
    }
  }, [user]);

  const loadCSVRecipes = () => {
    Papa.parse(recipesCSV, {
      header: true,
      complete: (results) => {
        setCsvRecipes(results.data as CSVRecipe[]);
      },
    });
  };

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
    if (!inventory.length)
      return {
        percentage: 0,
        haveCount: 0,
        totalCount: recipe.ingredients.length,
        missingIngredients: recipe.ingredients.map((i) => i.raw_text),
      };

    let haveCount = 0;
    const missingIngredients: string[] = [];

    recipe.ingredients.forEach((ingredient) => {
      const ingredientText = ingredient.raw_text.toLowerCase();
      const matchingItem = inventory.find((item) => {
        const itemName = (item.custom_name || item.food_database?.name || "").toLowerCase();
        return itemName && (ingredientText.includes(itemName) || itemName.includes(ingredientText.split(" ")[0]));
      });

      if (matchingItem) {
        haveCount++;
      } else {
        missingIngredients.push(ingredient.raw_text);
      }
    });

    const percentage =
      recipe.ingredients.length > 0 ? Math.round((haveCount / recipe.ingredients.length) * 100) : 0;

    return {
      percentage,
      haveCount,
      totalCount: recipe.ingredients.length,
      missingIngredients,
    };
  };

  const addMissingToGroceryList = async (recipe: RecipeWithMatch) => {
    if (!user) return;

    try {
      const groceryItems = recipe.ingredientMatch.missingIngredients.map((ingredient) => ({
        user_id: user.id,
        item_name: ingredient,
        quantity: 1,
        unit: "serving",
        source: "recipe",
        recipe_id: recipe.id,
      }));

      const { error } = await supabase.from("grocery_list").insert(groceryItems);

      if (error) throw error;

      toast.success(`Added ${groceryItems.length} missing ingredients to grocery list`);
    } catch (error) {
      console.error("Error adding to grocery list:", error);
      toast.error("Failed to add items to grocery list");
    }
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

  const cuisines = ["all", ...Array.from(new Set(csvRecipes.map(r => r.cuisine).filter(Boolean)))];
  const difficulties = ["all", "Easy", "Medium", "Hard"];

  const filteredCSVRecipes = csvRecipes.filter((recipe) => {
    const matchesSearch = recipe.recipe_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === "all" || recipe.cuisine === selectedCuisine;
    const matchesDifficulty = selectedDifficulty === "all" || recipe.difficulty === selectedDifficulty;
    const matchesCookTime = parseInt(recipe.time_to_cook_min) <= maxCookTime;
    return matchesSearch && matchesCuisine && matchesDifficulty && matchesCookTime;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <BackButton />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Recipe Library</h1>
            <p className="text-muted-foreground">Explore our collection of recipes</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search recipes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

          <Tabs defaultValue="catalog" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="catalog">Recipe Catalog ({filteredCSVRecipes.length})</TabsTrigger>
              <TabsTrigger value="database">My Recipes ({filteredRecipes.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="px-3 py-1.5 text-sm border rounded-md bg-background"
                >
                  {cuisines.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine === "all" ? "All Cuisines" : cuisine}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-1.5 text-sm border rounded-md bg-background"
                >
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff === "all" ? "All Difficulties" : diff}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Max Cook Time:</span>
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="15"
                    value={maxCookTime}
                    onChange={(e) => setMaxCookTime(parseInt(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm font-medium">{maxCookTime}min</span>
                </div>
              </div>

              {filteredCSVRecipes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No recipes found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCSVRecipes.map((recipe, idx) => (
                    <Card key={idx} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedCSVRecipe(recipe)}>
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-6xl">
                        🍽️
                      </div>
                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold line-clamp-2">{recipe.recipe_name}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{recipe.cuisine}</Badge>
                          <Badge variant="outline">{recipe.difficulty}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {recipe.time_to_cook_min}m
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="database" className="space-y-4">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRecipe.title}</DialogTitle>
                <div className="space-y-2">
                  {selectedRecipe.description && (
                    <DialogDescription>{selectedRecipe.description}</DialogDescription>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Ingredient Match:</span>
                      <Badge variant="secondary" className="font-semibold">
                        {selectedRecipe.ingredientMatch.percentage}%
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({selectedRecipe.ingredientMatch.haveCount} of {selectedRecipe.ingredientMatch.totalCount} ingredients)
                    </span>
                    {selectedRecipe.ingredientMatch.missingIngredients.length > 0 && (
                      <Badge variant="outline" className="text-orange-500 border-orange-500">
                        {selectedRecipe.ingredientMatch.missingIngredients.length} missing
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <ul className="space-y-1">
                    {selectedRecipe.ingredients.map((ing) => {
                      const isMissing = selectedRecipe.ingredientMatch.missingIngredients.includes(ing.raw_text);
                      return (
                        <li key={ing.id} className="flex items-center gap-2">
                          {isMissing ? (
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          <span className={isMissing ? "text-muted-foreground" : ""}>{ing.raw_text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {selectedRecipe.steps && (
                  <div>
                    <h3 className="font-semibold mb-2">Directions</h3>
                    <ol className="list-decimal list-inside space-y-2">
                      {selectedRecipe.steps.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 sticky bottom-0 bg-background pt-4 border-t sm:flex-row">
                {selectedRecipe.ingredientMatch.missingIngredients.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => addMissingToGroceryList(selectedRecipe)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Missing to Grocery List
                  </Button>
                )}
                <Button
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  size="lg"
                  onClick={() => {
                    setCompletingRecipe(selectedRecipe);
                    setSelectedRecipe(null);
                    setCompletionDialogOpen(true);
                  }}
                >
                  <Check className="w-5 h-5 mr-2" />
                  I Made It!
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {completingRecipe && (
        <RecipeCompletionDialog
          open={completionDialogOpen}
          onOpenChange={(open) => {
            setCompletionDialogOpen(open);
            if (!open) setCompletingRecipe(null);
          }}
          recipeId={completingRecipe.id}
          recipeName={completingRecipe.title}
          ingredients={completingRecipe.ingredients}
        />
      )}

      <Dialog open={!!selectedCSVRecipe} onOpenChange={() => setSelectedCSVRecipe(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCSVRecipe && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCSVRecipe.recipe_name}</DialogTitle>
                <DialogDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge>{selectedCSVRecipe.cuisine}</Badge>
                    <Badge variant="outline">{selectedCSVRecipe.difficulty}</Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{selectedCSVRecipe.time_to_cook_min} minutes</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Steps</h3>
                          <ol className="list-decimal list-inside space-y-2 text-sm">
                            {selectedCSVRecipe.steps.split('|').map((step, idx) => (
                              <li key={idx}>{step.trim()}</li>
                            ))}
                          </ol>
                        </div>
                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <ul className="space-y-1">
                    {selectedCSVRecipe.ingredients.split(';').map((ing, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        {ing.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recipes;
