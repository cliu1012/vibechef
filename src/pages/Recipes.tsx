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
  Sparkles,
  Filter,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  time: number;
  calories: number;
  protein: number;
  difficulty: "easy" | "medium" | "hard";
  matchScore: number;
  image: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadInventory();
      loadUserAllergies();
    }
  }, [user]);

  const loadUserAllergies = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('allergies')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("Error loading allergies:", error);
    } else if (data) {
      setUserAllergies(data.allergies || []);
    }
  };

  // Mock recipe data with ingredients
  const recipes: Recipe[] = [
    {
      id: "1",
      name: "Grilled Chicken & Rice Bowl",
      time: 25,
      calories: 520,
      protein: 42,
      difficulty: "easy",
      matchScore: 95,
      image: "🍗",
      tags: ["High Protein", "Balanced"],
      ingredients: [
        { name: "Chicken Breast", quantity: 200, unit: "g" },
        { name: "Rice", quantity: 150, unit: "g" },
        { name: "Olive Oil", quantity: 1, unit: "tbsp" },
        { name: "Garlic", quantity: 2, unit: "cloves" },
      ],
    },
    {
      id: "2",
      name: "Veggie Stir Fry",
      time: 15,
      calories: 320,
      protein: 12,
      difficulty: "easy",
      matchScore: 88,
      image: "🥗",
      tags: ["Vegetarian", "Quick"],
      ingredients: [
        { name: "Broccoli", quantity: 200, unit: "g" },
        { name: "Carrots", quantity: 100, unit: "g" },
        { name: "Bell Pepper", quantity: 1, unit: "piece" },
        { name: "Soy Sauce", quantity: 2, unit: "tbsp" },
      ],
    },
    {
      id: "3",
      name: "Tomato Pasta",
      time: 20,
      calories: 450,
      protein: 15,
      difficulty: "easy",
      matchScore: 82,
      image: "🍝",
      tags: ["Vegetarian", "Comfort Food"],
      ingredients: [
        { name: "Pasta", quantity: 200, unit: "g" },
        { name: "Tomatoes", quantity: 300, unit: "g" },
        { name: "Garlic", quantity: 3, unit: "cloves" },
        { name: "Olive Oil", quantity: 2, unit: "tbsp" },
      ],
    },
  ];

  const loadInventory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_inventory")
      .select(`
        id,
        custom_name,
        quantity,
        unit,
        food_id,
        food_database (
          name
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error loading inventory:", error);
      return;
    }

    setInventory(data || []);
  };

  const calculateIngredientMatch = (recipe: Recipe) => {
    if (!inventory.length) return { percentage: 0, haveCount: 0, totalCount: recipe.ingredients.length };

    let haveCount = 0;
    
    recipe.ingredients.forEach((ingredient) => {
      const matchingItem = inventory.find((item) => {
        const itemName = item.custom_name || item.food_database?.name || "";
        return itemName.toLowerCase().includes(ingredient.name.toLowerCase()) ||
               ingredient.name.toLowerCase().includes(itemName.toLowerCase());
      });

      if (matchingItem && matchingItem.quantity >= ingredient.quantity) {
        haveCount++;
      }
    });

    const percentage = Math.round((haveCount / recipe.ingredients.length) * 100);
    return { percentage, haveCount, totalCount: recipe.ingredients.length };
  };

  const handleAddMissingToList = async (recipe: RecipeWithMatch) => {
    if (!user) return;
    
    const missingIngredients = recipe.ingredients.filter((ingredient) => {
      const hasIngredient = inventory.some((item) => {
        const itemName = item.custom_name || item.food_database?.name || "";
        return (
          itemName.toLowerCase().includes(ingredient.name.toLowerCase()) ||
          ingredient.name.toLowerCase().includes(itemName.toLowerCase())
        ) && item.quantity >= ingredient.quantity;
      });
      return !hasIngredient;
    });

    if (missingIngredients.length === 0) {
      toast.info("You already have all ingredients!");
      return;
    }

    try {
      // Get existing grocery list from localStorage
      const existingList = JSON.parse(localStorage.getItem('groceryList') || '[]');
      
      const newItems = missingIngredients.map((ing) => ({
        id: `${Date.now()}-${Math.random()}`,
        name: ing.name,
        quantity: `${ing.quantity} ${ing.unit}`,
        category: "Recipe Ingredients",
        checked: false,
        recipeId: recipe.id,
        recipeName: recipe.name,
      }));

      localStorage.setItem('groceryList', JSON.stringify([...existingList, ...newItems]));
      toast.success(`Added ${missingIngredients.length} items to grocery list!`);
    } catch (error) {
      console.error("Error adding to grocery list:", error);
      toast.error("Failed to add items to grocery list");
    }
  };

  const handleCookRecipe = async (recipe: RecipeWithMatch) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update inventory by deducting ingredients
      for (const ingredient of recipe.ingredients) {
        const matchingItem = inventory.find((item) => {
          const itemName = item.custom_name || item.food_database?.name || "";
          return itemName.toLowerCase().includes(ingredient.name.toLowerCase()) ||
                 ingredient.name.toLowerCase().includes(itemName.toLowerCase());
        });

        if (matchingItem) {
          const newQuantity = Math.max(0, matchingItem.quantity - ingredient.quantity);
          
          if (newQuantity === 0) {
            // Delete item if quantity reaches 0
            await supabase
              .from("user_inventory")
              .delete()
              .eq("id", matchingItem.id);
          } else {
            // Update quantity
            await supabase
              .from("user_inventory")
              .update({ quantity: newQuantity })
              .eq("id", matchingItem.id);
          }
        }
      }

      // Save cooked recipe to localStorage (will be moved to DB later)
      const cookedRecipes = JSON.parse(localStorage.getItem('cookedRecipes') || '[]');
      cookedRecipes.push({
        recipeId: recipe.id,
        recipeName: recipe.name,
        cookedAt: new Date().toISOString(),
        userId: user.id,
      });
      localStorage.setItem('cookedRecipes', JSON.stringify(cookedRecipes));

      toast.success(`Cooked ${recipe.name}! Added to your recipes.`);
      setSelectedRecipe(null);
      loadInventory(); // Reload inventory
    } catch (error) {
      console.error("Error cooking recipe:", error);
      toast.error("Failed to update inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const recipesWithMatch = recipes.map((recipe) => ({
    ...recipe,
    ingredientMatch: calculateIngredientMatch(recipe),
  }));

  // Filter out recipes with allergens
  const hasAllergen = (recipe: Recipe): boolean => {
    if (userAllergies.length === 0) return false;
    
    return recipe.ingredients.some(ingredient => 
      userAllergies.some(allergy => 
        ingredient.name.toLowerCase().includes(allergy.toLowerCase()) ||
        allergy.toLowerCase().includes(ingredient.name.toLowerCase())
      )
    );
  };

  const filteredRecipes = recipesWithMatch
    .filter((recipe) => !hasAllergen(recipe)) // Exclude recipes with allergens
    .filter((recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: "bg-green-500/10 text-green-500",
      medium: "bg-yellow-500/10 text-yellow-500",
      hard: "bg-red-500/10 text-red-500",
    };
    return colors[difficulty as keyof typeof colors] || colors.easy;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <BackButton />
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            What Can You Make?
          </h1>
          <p className="text-muted-foreground">
            Recipes matched to your inventory and preferences
          </p>
        </div>

        {/* AI Suggestion Banner */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                AI Recommendation
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Based on your inventory, you have ingredients for{" "}
                <strong>
                  {recipesWithMatch.filter((r) => r.ingredientMatch.percentage === 100).length} recipes
                </strong>{" "}
                without shopping!
              </p>
            </div>
          </div>
        </Card>

        {/* Search and Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Quick Filters */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Recipes</TabsTrigger>
            <TabsTrigger value="canMake">
              Can Make Now ({recipesWithMatch.filter((r) => r.ingredientMatch.percentage === 100).length})
            </TabsTrigger>
            <TabsTrigger value="quick">Quick & Easy</TabsTrigger>
            <TabsTrigger value="highProtein">High Protein</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <RecipeGrid recipes={filteredRecipes} onSelectRecipe={setSelectedRecipe} />
          </TabsContent>
          <TabsContent value="canMake" className="mt-6">
            <RecipeGrid 
              recipes={filteredRecipes.filter((r) => r.ingredientMatch.percentage === 100)} 
              onSelectRecipe={setSelectedRecipe}
            />
          </TabsContent>
          <TabsContent value="quick" className="mt-6">
            <RecipeGrid 
              recipes={filteredRecipes.filter((r) => r.time <= 20)} 
              onSelectRecipe={setSelectedRecipe}
            />
          </TabsContent>
          <TabsContent value="highProtein" className="mt-6">
            <RecipeGrid 
              recipes={filteredRecipes.filter((r) => r.protein >= 30)} 
              onSelectRecipe={setSelectedRecipe}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Recipe Details Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <span className="text-4xl">{selectedRecipe?.image}</span>
              {selectedRecipe?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedRecipe?.time} mins • {selectedRecipe?.calories} cal • {selectedRecipe?.protein}g protein
            </DialogDescription>
          </DialogHeader>

          {selectedRecipe && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Ingredient Match</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedRecipe.ingredientMatch.percentage}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecipe.ingredientMatch.haveCount} of {selectedRecipe.ingredientMatch.totalCount} ingredients
                  </p>
                </div>
                {selectedRecipe.ingredientMatch.percentage < 100 && (
                  <Button variant="outline" size="sm">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add Missing to List
                  </Button>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-3">Ingredients</h3>
                <div className="space-y-2">
                  {selectedRecipe.ingredients.map((ingredient, index) => {
                    const hasIngredient = inventory.some((item) => {
                      const itemName = item.custom_name || item.food_database?.name || "";
                      return (
                        itemName.toLowerCase().includes(ingredient.name.toLowerCase()) ||
                        ingredient.name.toLowerCase().includes(itemName.toLowerCase())
                      ) && item.quantity >= ingredient.quantity;
                    });

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          {hasIngredient ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span className={hasIngredient ? "text-foreground" : "text-muted-foreground"}>
                            {ingredient.name}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedRecipe.ingredientMatch.percentage < 100 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAddMissingToList(selectedRecipe)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add Missing to Grocery List
                </Button>
              )}
              <Button
                className="w-full"
                onClick={() => handleCookRecipe(selectedRecipe)}
                disabled={loading || selectedRecipe.ingredientMatch.percentage < 100}
              >
                <ChefHat className="w-4 h-4 mr-2" />
                {loading ? "Updating Inventory..." : "Cook This Recipe"}
              </Button>
              {selectedRecipe.ingredientMatch.percentage < 100 && (
                <p className="text-sm text-center text-muted-foreground">
                  Add missing ingredients first or add to grocery list
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface RecipeGridProps {
  recipes: RecipeWithMatch[];
  onSelectRecipe: (recipe: RecipeWithMatch) => void;
}

const RecipeGrid = ({ recipes, onSelectRecipe }: RecipeGridProps) => {
  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: "bg-green-500/10 text-green-500",
      medium: "bg-yellow-500/10 text-yellow-500",
      hard: "bg-red-500/10 text-red-500",
    };
    return colors[difficulty as keyof typeof colors] || colors.easy;
  };

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium text-muted-foreground">No recipes found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <Card
          key={recipe.id}
          className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
          onClick={() => onSelectRecipe(recipe)}
        >
          <div className="relative h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <span className="text-6xl">{recipe.image}</span>
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className={`${
                  recipe.ingredientMatch.percentage === 100
                    ? "bg-green-500/10 text-green-500"
                    : recipe.ingredientMatch.percentage >= 50
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {recipe.ingredientMatch.percentage}% Match
              </Badge>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
              {recipe.name}
            </h3>

            <div className="flex flex-wrap gap-2 mb-3">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{recipe.time} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4" />
                <span>{recipe.calories} cal</span>
              </div>
              <Badge className={getDifficultyColor(recipe.difficulty)} variant="secondary">
                {recipe.difficulty}
              </Badge>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ingredients:</span>
                <span className="font-medium text-foreground">
                  {recipe.ingredientMatch.haveCount}/{recipe.ingredientMatch.totalCount}
                </span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    recipe.ingredientMatch.percentage === 100
                      ? "bg-green-500"
                      : recipe.ingredientMatch.percentage >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${recipe.ingredientMatch.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Recipes;
