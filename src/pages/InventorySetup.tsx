import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Minus, Edit2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface FoodItem {
  id: string;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  category: "fridge" | "freezer" | "pantry";
}

interface SelectedItem extends FoodItem {
  quantity: number;
  unit: string;
}

const InventorySetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<"fridge" | "freezer" | "pantry">("fridge");
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [foodDatabase, setFoodDatabase] = useState<any[]>([]);
  const [displayedFoods, setDisplayedFoods] = useState<FoodItem[]>([]);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [selectedItems, setSelectedItems] = useState<{
    fridge: SelectedItem[];
    freezer: SelectedItem[];
    pantry: SelectedItem[];
  }>({
    fridge: [],
    freezer: [],
    pantry: [],
  });
  const [editingItem, setEditingItem] = useState<SelectedItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadFoodDatabase();
  }, []);

  useEffect(() => {
    if (foodDatabase.length > 0) {
      loadCommonItems();
    }
  }, [foodDatabase.length]);

  useEffect(() => {
    if (allFoods.length > 0) {
      loadDisplayedFoods();
    }
  }, [allFoods, step, usedIndices]);

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

  const loadCommonItems = async () => {
    try {
      const { data, error } = await supabase
        .from("common_items")
        .select("*")
        .order("display_order");

      if (error) throw error;

      // Match with nutrition data from CSV
      const itemsWithNutrition = (data || []).map((item) => {
        const nutritionData = foodDatabase.find(
          (food) => food.food && food.food.toLowerCase().includes(item.food_name.toLowerCase())
        );

        return {
          id: item.id,
          food: item.food_name,
          category: item.category as "fridge" | "freezer" | "pantry",
          calories: nutritionData?.["Caloric Value"] || 0,
          protein: nutritionData?.Protein || 0,
          carbs: nutritionData?.Carbohydrates || 0,
          fat: nutritionData?.Fat || 0,
          fiber: nutritionData?.["Dietary Fiber"] || 0,
        };
      });

      setAllFoods(itemsWithNutrition);
      setLoadingData(false);
    } catch (error) {
      console.error("Error loading common items:", error);
      toast.error("Failed to load food items");
      setLoadingData(false);
    }
  };

  const loadDisplayedFoods = () => {
    const categoryFoods = allFoods.filter((food) => food.category === step);
    const availableIndices = categoryFoods
      .map((_, idx) => idx)
      .filter((idx) => !usedIndices.has(idx));

    if (availableIndices.length < 8) {
      // Reset if we don't have enough
      setUsedIndices(new Set());
      const shuffled = [...categoryFoods].sort(() => Math.random() - 0.5).slice(0, 8);
      setDisplayedFoods(shuffled);
      return;
    }

    // Shuffle and pick 8
    const shuffled = [...availableIndices].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 8);
    
    setDisplayedFoods(selected.map((idx) => categoryFoods[idx]));
  };

  const replaceDisplayedFood = (index: number) => {
    const categoryFoods = allFoods.filter((food) => food.category === step);
    const currentFood = displayedFoods[index];
    const currentIndex = categoryFoods.findIndex(f => f.id === currentFood.id);
    
    setUsedIndices((prev) => new Set([...prev, currentIndex]));
    
    const availableIndices = categoryFoods
      .map((_, idx) => idx)
      .filter((idx) => !usedIndices.has(idx) && idx !== currentIndex);

    if (availableIndices.length === 0) {
      // Reset and reload if we run out
      setUsedIndices(new Set());
      return;
    }

    const randomIndex =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];
    
    setDisplayedFoods((prev) => {
      const newFoods = [...prev];
      newFoods[index] = categoryFoods[randomIndex];
      return newFoods;
    });
  };

  const selectFood = (food: FoodItem, index: number) => {
    const newItem: SelectedItem = {
      ...food,
      quantity: 1,
      unit: "serving",
    };
    
    setSelectedItems((prev) => ({
      ...prev,
      [step]: [...prev[step], newItem],
    }));
    
    toast.success(`Added ${food.food}`);
    replaceDisplayedFood(index);
  };

  const removeItem = (index: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [step]: prev[step].filter((_, i) => i !== index),
    }));
  };

  const updateQuantity = (index: number, delta: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [step]: prev[step].map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(0.1, item.quantity + delta) }
          : item
      ),
    }));
  };

  const openEditDialog = (item: SelectedItem) => {
    setEditingItem({ ...item });
    setEditDialogOpen(true);
  };

  const saveEdit = () => {
    if (!editingItem) return;

    setSelectedItems((prev) => ({
      ...prev,
      [step]: prev[step].map((item) =>
        item.food === editingItem.food ? editingItem : item
      ),
    }));
    
    setEditDialogOpen(false);
    setEditingItem(null);
    toast.success("Updated nutrition info");
  };

  const handleNext = () => {
    if (step === "fridge") {
      setStep("freezer");
      setUsedIndices(new Set());
    } else if (step === "freezer") {
      setStep("pantry");
      setUsedIndices(new Set());
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    const allItems = [
      ...selectedItems.fridge,
      ...selectedItems.freezer,
      ...selectedItems.pantry,
    ];

    if (allItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setLoading(true);
    try {
      const inventoryItems = allItems.map((item) => ({
        user_id: user.id,
        food_id: null,
        custom_name: item.food,
        quantity: item.quantity,
        unit: item.unit,
        location: item.category,
        calories: item.calories,
        protein_g: item.protein,
        carbs_g: item.carbs,
        fat_g: item.fat,
        fiber_g: item.fiber,
        status: "in-stock",
      }));

      const { error } = await supabase
        .from("user_inventory")
        .insert(inventoryItems);

      if (error) throw error;

      toast.success("Inventory saved successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error saving inventory:", error);
      toast.error("Failed to save inventory");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading food database...</p>
        </div>
      </div>
    );
  }

  const stepTitle = {
    fridge: "Stock Your Fridge",
    freezer: "Stock Your Freezer",
    pantry: "Stock Your Pantry",
  };

  const stepDescription = {
    fridge: "Select items you have in your fridge",
    freezer: "Select items you have in your freezer",
    pantry: "Select items you have in your pantry",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {stepTitle[step]}
          </h1>
          <p className="text-muted-foreground">{stepDescription[step]}</p>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          <Badge variant={step === "fridge" ? "default" : "outline"}>
            Fridge
          </Badge>
          <Badge variant={step === "freezer" ? "default" : "outline"}>
            Freezer
          </Badge>
          <Badge variant={step === "pantry" ? "default" : "outline"}>
            Pantry
          </Badge>
        </div>

        {/* Common Foods Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Common Items (Click to add - new items appear as you select)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayedFoods.map((food, index) => (
              <Card
                key={`${food.id}-${index}`}
                className="p-4 cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                onClick={() => selectFood(food, index)}
              >
                <div className="text-center space-y-2">
                  <h3 className="font-medium text-sm capitalize line-clamp-2">
                    {food.food}
                  </h3>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="font-semibold">{Math.round(food.calories)} cal</div>
                    <div className="text-[10px] text-muted-foreground/70">per 100g</div>
                    <div className="flex justify-between">
                      <span>P: {food.protein.toFixed(1)}g</span>
                      <span>C: {food.carbs.toFixed(1)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>F: {food.fat.toFixed(1)}g</span>
                      <span>Fib: {food.fiber.toFixed(1)}g</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Selected Items */}
        {selectedItems[step].length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Selected Items ({selectedItems[step].length})
            </h2>
            <div className="space-y-3">
              {selectedItems[step].map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium capitalize">{item.food}</h3>
                      <div className="text-xs text-muted-foreground mt-1">
                        {Math.round(item.calories)} cal | P: {item.protein.toFixed(1)}g | C:{" "}
                        {item.carbs.toFixed(1)}g | F: {item.fat.toFixed(1)}g
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(index, -0.5)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-16 text-center">
                        {item.quantity} {item.unit}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(index, 0.5)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (step === "freezer") {
                setStep("fridge");
                setUsedIndices(new Set());
              } else if (step === "pantry") {
                setStep("freezer");
                setUsedIndices(new Set());
              }
            }}
            disabled={step === "fridge"}
          >
            Back
          </Button>
          <Button onClick={handleNext} disabled={loading}>
            {loading ? (
              "Saving..."
            ) : step === "pantry" ? (
              <>
                Complete <Check className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nutrition Info - {editingItem?.food}</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label>Calories</Label>
                <Input
                  type="number"
                  value={editingItem.calories}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      calories: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  value={editingItem.protein}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      protein: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  value={editingItem.carbs}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      carbs: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Fat (g)</Label>
                <Input
                  type="number"
                  value={editingItem.fat}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      fat: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Fiber (g)</Label>
                <Input
                  type="number"
                  value={editingItem.fiber}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      fiber: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventorySetup;
