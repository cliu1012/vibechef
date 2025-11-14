import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ProfileDialog } from "@/components/ProfileDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChefHat,
  ShoppingCart,
  Package,
  AlertCircle,
  TrendingDown,
  Sparkles,
  Clock,
  Flame,
  Check,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

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
  total_time_minutes: number | null;
  calories_per_serving: number | null;
  image_url: string | null;
  cuisine: string | null;
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

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lowStockItems, setLowStockItems] = useState(0);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithMatch | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadLowStockCount();
      loadInventory();
      loadRecipes();
    }
  }, [user]);

  const loadLowStockCount = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_inventory")
      .select("quantity")
      .eq("user_id", user.id)
      .lte("quantity", 1);

    if (!error && data) {
      setLowStockItems(data.length);
    }
  };

  const loadInventory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_inventory")
      .select("id, custom_name, quantity, unit, food_id, food_database(name)")
      .eq("user_id", user.id);
    setInventory(data || []);
  };

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(6);

      if (recipesError) throw recipesError;

      const recipeIds = recipesData?.map((r) => r.id) || [];

      const { data: ingredientsData } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .in("recipe_id", recipeIds);

      const ingredientsByRecipe = (ingredientsData || []).reduce((acc, ing) => {
        if (!acc[ing.recipe_id]) acc[ing.recipe_id] = [];
        acc[ing.recipe_id].push(ing);
        return acc;
      }, {} as Record<string, RecipeIngredient[]>);

      const enrichedRecipes =
        recipesData?.map((recipe) => ({
          ...recipe,
          steps: Array.isArray(recipe.steps) ? recipe.steps : null,
          ingredients: ingredientsByRecipe[recipe.id] || [],
        })) || [];

      setRecipes(enrichedRecipes as Recipe[]);
    } catch (error) {
      console.error("Error loading recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateIngredientMatch = (recipe: Recipe): RecipeWithMatch["ingredientMatch"] => {
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

  const recipesWithMatch: RecipeWithMatch[] = recipes.map((recipe) => ({
    ...recipe,
    ingredientMatch: calculateIngredientMatch(recipe),
  }));

  const addMissingToGroceryList = async () => {
    if (!selectedRecipe || !user) return;

    try {
      const groceryItems = selectedRecipe.ingredientMatch.missingIngredients.map((ingredient) => ({
        user_id: user.id,
        item_name: ingredient,
        quantity: 1,
        unit: "serving",
        source: "recipe",
        recipe_id: selectedRecipe.id,
      }));

      const { error } = await supabase.from("grocery_list").insert(groceryItems);

      if (error) throw error;

      toast.success(`Added ${groceryItems.length} missing ingredients to grocery list`);
      setSelectedRecipe(null);
    } catch (error) {
      console.error("Error adding to grocery list:", error);
      toast.error("Failed to add items to grocery list");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Button */}
        <div className="flex justify-end mb-4">
          <ProfileDialog />
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">
            What would you like to cook today?
          </p>
        </div>

        {/* Alert Cards */}
        {lowStockItems > 0 && (
          <div className="mb-8">
            <Card className="p-4 border-warning/50 bg-warning/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Low Stock Alert
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You have {lowStockItems} items with 1 serving or less remaining
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/inventory")}>
                  View
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* What Can I Make */}
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary group"
            onClick={() => navigate("/recipes")}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  What Can I Make?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Discover recipes based on ingredients you already have
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                AI Powered
              </Badge>
            </div>
          </Card>

          {/* My Grocery List */}
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-secondary group"
            onClick={() => navigate("/grocery-list")}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                  My Grocery List
                </h2>
                <p className="text-sm text-muted-foreground">
                  Smart shopping lists based on your meal plans
                </p>
              </div>
              <Badge variant="outline" className="border-secondary text-secondary">
                0 items
              </Badge>
            </div>
          </Card>

          {/* My Inventory */}
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-accent group"
            onClick={() => navigate("/inventory")}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Package className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                  My Inventory
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your fridge, freezer, and pantry items
                </p>
              </div>
              <Badge variant="outline" className="border-accent text-accent">
                Manage Items
              </Badge>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold text-lg mb-4 text-foreground">
            Your Impact This Month
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">$42</div>
              <div className="text-sm text-muted-foreground">Saved on Food Waste</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-1">18</div>
              <div className="text-sm text-muted-foreground">Meals Cooked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-1">5.2kg</div>
              <div className="text-sm text-muted-foreground">CO₂ Saved</div>
            </div>
          </div>
        </Card>

        {/* Recipe Suggestions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-xl text-foreground">Your Saved Recipes</h3>
            <Button variant="ghost" onClick={() => navigate("/recipes")}>
              View All
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading recipes...</div>
          ) : recipesWithMatch.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipesWithMatch.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-5xl">
                    {recipe.image_url ? (
                      <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                    ) : (
                      "🍽️"
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <h4 className="font-semibold line-clamp-1">{recipe.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {recipe.total_time_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {recipe.total_time_minutes}m
                        </div>
                      )}
                      {recipe.calories_per_serving && (
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4" />
                          {recipe.calories_per_serving} cal
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Ingredients Available</span>
                        <span className="text-sm font-semibold text-primary">
                          {recipe.ingredientMatch.haveCount}/{recipe.ingredientMatch.totalCount}
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-accent h-full transition-all"
                          style={{ width: `${recipe.ingredientMatch.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-2">No saved recipes yet</h3>
              <p className="text-muted-foreground mb-4">Explore our recipe catalog and save your favorites</p>
              <Button onClick={() => navigate("/recipes")}>Browse Recipes</Button>
            </Card>
          )}
        </div>
      </div>

      {/* Recipe Detail Dialog */}
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
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Ingredients Available:</span>
                      <Badge variant="secondary" className="font-semibold">
                        {selectedRecipe.ingredientMatch.haveCount}/{selectedRecipe.ingredientMatch.totalCount}
                      </Badge>
                    </div>
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
                            <Check className="w-4 h-4 text-green-500" />
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
                      {selectedRecipe.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {selectedRecipe.ingredientMatch.missingIngredients.length > 0 && (
                  <Button variant="outline" onClick={addMissingToGroceryList} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Missing to Grocery List
                  </Button>
                )}
                <Button
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent"
                  onClick={() => navigate("/recipes")}
                >
                  View All Recipes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
