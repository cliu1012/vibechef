import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import { Plus, ShoppingCart, Trash2, CheckCheck, Star, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface GroceryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  source: string;
  recipe_id: string | null;
  checked: boolean;
}

interface RecommendedItem {
  name: string;
  recipe_count: number;
  missing_percentage: number;
}

const GroceryList = () => {
  const { user } = useAuth();
  const [newItem, setNewItem] = useState("");
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadGroceryList();
      loadRecommendations();
    }
  }, [user]);

  const loadGroceryList = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("grocery_list")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading grocery list:", error);
      toast.error("Failed to load grocery list");
    } else {
      setItems(data || []);
    }
  };

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      // Get user's current inventory
      const { data: inventory } = await supabase
        .from("user_inventory")
        .select("custom_name")
        .eq("user_id", user.id);

      const inventoryNames = (inventory || []).map((i) => i.custom_name?.toLowerCase());

      // Get all recipes and their ingredients
      const { data: recipes } = await supabase
        .from("recipes")
        .select("id, title, recipe_ingredients(raw_text)");

      if (!recipes) return;

      const recipeAnalysis: { [key: string]: { count: number; total: number } } = {};

      recipes.forEach((recipe) => {
        const ingredients = recipe.recipe_ingredients || [];
        const totalIngredients = ingredients.length;
        let matchingCount = 0;

        ingredients.forEach((ing) => {
          const ingText = ing.raw_text.toLowerCase();
          const hasIngredient = inventoryNames.some((name) => 
            ingText.includes(name) || name.includes(ingText.split(' ')[0])
          );

          if (hasIngredient) {
            matchingCount++;
          } else {
            // Track missing ingredients
            const ingredientName = ing.raw_text;
            if (!recipeAnalysis[ingredientName]) {
              recipeAnalysis[ingredientName] = { count: 0, total: 0 };
            }
            recipeAnalysis[ingredientName].count++;
            recipeAnalysis[ingredientName].total++;
          }
        });

        // Only consider recipes where we have 30-80% of ingredients
        const matchPercentage = totalIngredients > 0 ? (matchingCount / totalIngredients) * 100 : 0;
        if (matchPercentage >= 30 && matchPercentage <= 80) {
          ingredients.forEach((ing) => {
            const ingText = ing.raw_text.toLowerCase();
            const hasIngredient = inventoryNames.some((name) =>
              ingText.includes(name) || name.includes(ingText.split(' ')[0])
            );
            if (!hasIngredient && recipeAnalysis[ing.raw_text]) {
              recipeAnalysis[ing.raw_text].total++;
            }
          });
        }
      });

      // Convert to recommendations array and sort
      const recs = Object.entries(recipeAnalysis)
        .map(([name, data]) => ({
          name,
          recipe_count: data.count,
          missing_percentage: data.total,
        }))
        .sort((a, b) => b.recipe_count - a.recipe_count)
        .slice(0, 5);

      setRecommendations(recs);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    }
  };

  const addItem = async () => {
    if (!newItem.trim() || !user) {
      toast.error("Please enter an item name");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("grocery_list")
        .insert({
          user_id: user.id,
          item_name: newItem,
          quantity: 1,
          unit: "serving",
          source: "manual",
        });

      if (error) throw error;

      toast.success("Item added to grocery list");
      setNewItem("");
      loadGroceryList();
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  const addRecommendedItem = async (itemName: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("grocery_list")
        .insert({
          user_id: user.id,
          item_name: itemName,
          quantity: 1,
          unit: "serving",
          source: "recommendation",
        });

      if (error) throw error;

      toast.success("Added to grocery list");
      loadGroceryList();
      loadRecommendations();
    } catch (error) {
      console.error("Error adding recommendation:", error);
      toast.error("Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (id: string, checked: boolean) => {
    const { error } = await supabase
      .from("grocery_list")
      .update({ checked: !checked })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update item");
    } else {
      loadGroceryList();
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from("grocery_list")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete item");
    } else {
      toast.success("Item removed");
      loadGroceryList();
    }
  };

  const clearChecked = async () => {
    const checkedIds = items.filter((item) => item.checked).map((item) => item.id);

    if (checkedIds.length === 0) {
      toast.info("No items to clear");
      return;
    }

    const { error } = await supabase
      .from("grocery_list")
      .delete()
      .in("id", checkedIds);

    if (error) {
      toast.error("Failed to clear items");
    } else {
      toast.success("Checked items cleared");
      loadGroceryList();
    }
  };

  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  // Separate items by source
  const manualItems = items.filter((item) => item.source === "manual" && !item.checked);
  const recipeItems = items.filter((item) => item.source === "recipe" && !item.checked);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <BackButton />
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                My Grocery List
              </h1>
              <p className="text-muted-foreground">
                {uncheckedItems.length} items to buy
              </p>
            </div>
            {checkedItems.length > 0 && (
              <Button
                onClick={clearChecked}
                variant="outline"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Checked
              </Button>
            )}
          </div>
        </div>

        {/* Add Item */}
        <Card className="p-4 mb-6">
          <div className="flex gap-3">
            <Input
              placeholder="Add item to your list..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              disabled={loading}
            />
            <Button
              className="bg-gradient-to-r from-primary to-accent"
              onClick={addItem}
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* My Items */}
        {manualItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">My Items</h2>
            <div className="space-y-2">
              {manualItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleItem(item.id, item.checked)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{item.item_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* From Recipes You Made */}
        {recipeItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              From Recipes You Made
            </h2>
            <div className="space-y-2">
              {recipeItems.map((item) => (
                <Card key={item.id} className="p-4 border-yellow-500/20">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleItem(item.id, item.checked)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{item.item_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Items */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Recommended for You
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              These ingredients would complete recipes you almost have all items for
            </p>
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{rec.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Needed for {rec.recipe_count} recipe{rec.recipe_count > 1 ? "s" : ""}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addRecommendedItem(rec.name)}
                      disabled={loading}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Checked Items */}
        {checkedItems.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-muted-foreground mb-3">
              Checked Off ({checkedItems.length})
            </h2>
            <div className="space-y-2">
              {checkedItems.map((item) => (
                <Card key={item.id} className="p-4 opacity-60">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleItem(item.id, item.checked)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground line-through">
                        {item.item_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <Card className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-foreground mb-2">
              Your list is empty
            </h3>
            <p className="text-muted-foreground">
              Add items manually or let AI suggest what you need
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GroceryList;
