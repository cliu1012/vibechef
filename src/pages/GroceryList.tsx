import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import { Plus, ShoppingCart, Trash2, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Papa from "papaparse";

interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
  recipeId?: string;
  recipeName?: string;
}

const GroceryList = () => {
  const { user } = useAuth();
  const [newItem, setNewItem] = useState("");
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [foodDatabase, setFoodDatabase] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('groceryList');
    if (stored) {
      setItems(JSON.parse(stored));
    }
    loadFoodDatabase();
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('groceryList', JSON.stringify(items));
  }, [items]);

  const loadFoodDatabase = async () => {
    const datasets = [
      "/src/assets/data/FOOD-DATA-GROUP1.csv",
      "/src/assets/data/FOOD-DATA-GROUP2.csv",
      "/src/assets/data/FOOD-DATA-GROUP3.csv",
      "/src/assets/data/FOOD-DATA-GROUP4.csv",
      "/src/assets/data/FOOD-DATA-GROUP5.csv",
    ];

    try {
      const allData = await Promise.all(
        datasets.map(async (url) => {
          const response = await fetch(url);
          const csvText = await response.text();
          return new Promise<any[]>((resolve) => {
            Papa.parse(csvText, {
              header: true,
              dynamicTyping: true,
              skipEmptyLines: true,
              complete: (results) => {
                resolve(results.data);
              },
            });
          });
        })
      );
      
      setFoodDatabase(allData.flat());
    } catch (error) {
      console.error("Error loading food database:", error);
    }
  };

  const addToInventory = async (item: GroceryItem) => {
    if (!user) {
      toast.error("Please log in to add items to inventory");
      return;
    }

    try {
      // Try to find nutrition data
      const nutritionData = foodDatabase.find(
        (food) => food.food && food.food.toLowerCase().includes(item.name.toLowerCase())
      );

      // Determine location based on category or default to pantry
      let location: "fridge" | "freezer" | "pantry" = "pantry";
      const categoryLower = item.category.toLowerCase();
      if (categoryLower.includes("fridge") || categoryLower.includes("dairy") || categoryLower.includes("produce")) {
        location = "fridge";
      } else if (categoryLower.includes("freezer") || categoryLower.includes("frozen")) {
        location = "freezer";
      }

      // Parse quantity - try to extract numeric value
      const quantityMatch = item.quantity.match(/[\d.]+/);
      const quantity = quantityMatch ? parseFloat(quantityMatch[0]) : 1;

      const { error } = await supabase
        .from("user_inventory")
        .insert({
          user_id: user.id,
          custom_name: item.name,
          quantity: quantity,
          unit: "serving",
          location: location,
          status: "in-stock",
          calories: nutritionData?.["Caloric Value"] || null,
          protein_g: nutritionData?.Protein || null,
          carbs_g: nutritionData?.Carbohydrates || null,
          fat_g: nutritionData?.Fat || null,
          fiber_g: nutritionData?.["Dietary Fiber"] || null,
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error adding to inventory:", error);
      throw error;
    }
  };

  const toggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    // If checking the item, add to inventory
    if (!item.checked) {
      try {
        await addToInventory(item);
        toast.success(`${item.name} added to inventory!`);
      } catch (error) {
        toast.error("Failed to add to inventory");
        return;
      }
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, checked: !i.checked } : i
      )
    );
  };

  const purchaseAllGroceries = async () => {
    if (!user) {
      toast.error("Please log in to add items to inventory");
      return;
    }

    if (uncheckedItems.length === 0) {
      toast.info("No items to purchase!");
      return;
    }

    setLoading(true);
    try {
      // Add all unchecked items to inventory
      for (const item of uncheckedItems) {
        await addToInventory(item);
      }

      // Check all items
      setItems((prev) =>
        prev.map((item) => ({ ...item, checked: true }))
      );

      toast.success(`Added ${uncheckedItems.length} items to inventory!`);
    } catch (error) {
      console.error("Error purchasing groceries:", error);
      toast.error("Failed to add some items to inventory");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

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
            {uncheckedItems.length > 0 && (
              <Button
                onClick={purchaseAllGroceries}
                disabled={loading}
                className="bg-gradient-to-r from-primary to-accent"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : "Purchased All Groceries"}
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && newItem.trim()) {
                  setItems((prev) => [
                    {
                      id: Date.now().toString(),
                      name: newItem,
                      quantity: "1",
                      category: "Other",
                      checked: false,
                    },
                    ...prev,
                  ]);
                  setNewItem("");
                }
              }}
            />
            <Button
              className="bg-gradient-to-r from-primary to-accent"
              onClick={() => {
                if (newItem.trim()) {
                  setItems((prev) => [
                    {
                      id: Date.now().toString(),
                      name: newItem,
                      quantity: "1",
                      category: "Other",
                      checked: false,
                    },
                    ...prev,
                  ]);
                  setNewItem("");
                }
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Items to Buy */}
        {uncheckedItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">To Buy</h2>
            <div className="space-y-2">
              {uncheckedItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-foreground">{item.name}</div>
                        {item.recipeName && (
                          <Badge variant="outline" className="text-xs">
                            {item.recipeName}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity}
                      </div>
                    </div>
                    <Badge variant="secondary">{item.category}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
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
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-foreground line-through">
                          {item.name}
                        </div>
                        {item.recipeName && (
                          <Badge variant="outline" className="text-xs opacity-60">
                            {item.recipeName}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
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
