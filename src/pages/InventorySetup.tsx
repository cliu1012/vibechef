import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Minus, Edit2, Check, RefreshCw, X, Info, HelpCircle } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface FoodDatabaseItem {
  food?: string;
  "Caloric Value"?: number;
  Protein?: number;
  Carbohydrates?: number;
  Fat?: number;
  "Dietary Fiber"?: number;
}

const COMMON_UNITS = ["serving", "g", "oz", "cup", "tbsp", "tsp", "piece", "lb", "kg", "ml", "L"];

const InventorySetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<"fridge" | "freezer" | "pantry">("fridge");
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [foodDatabase, setFoodDatabase] = useState<FoodDatabaseItem[]>([]);
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
  
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFoods, setFilteredFoods] = useState<FoodDatabaseItem[]>([]);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemDialogOpen, setCustomItemDialogOpen] = useState(false);

  const getPreferredUnit = () => {
    return localStorage.getItem('preferredUnit') || 'serving';
  };

  const setPreferredUnit = (unit: string) => {
    localStorage.setItem('preferredUnit', unit);
  };

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

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = foodDatabase
        .filter((food) => 
          food.food && food.food.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 10);
      setFilteredFoods(results);
    } else {
      setFilteredFoods([]);
    }
  }, [searchQuery, foodDatabase]);

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
          return new Promise<FoodDatabaseItem[]>((resolve) => {
            Papa.parse(csvText, {
              header: true,
              dynamicTyping: true,
              skipEmptyLines: true,
              complete: (results) => {
                resolve(results.data as FoodDatabaseItem[]);
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
      setUsedIndices(new Set());
      const shuffled = [...categoryFoods].sort(() => Math.random() - 0.5).slice(0, 8);
      setDisplayedFoods(shuffled);
      return;
    }

    const shuffled = [...availableIndices].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 8);
    
    setDisplayedFoods(selected.map((idx) => categoryFoods[idx]));
  };

  const refreshCommonItems = () => {
    setUsedIndices(new Set());
    loadDisplayedFoods();
    toast.success("Refreshed common items");
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

  const selectFood = (food: FoodItem, index?: number) => {
    const newItem: SelectedItem = {
      ...food,
      quantity: 1,
      unit: getPreferredUnit(),
    };
    
    setSelectedItems((prev) => ({
      ...prev,
      [step]: [...prev[step], newItem],
    }));
    
    toast.success(`Added ${food.food}`);
    if (index !== undefined) {
      replaceDisplayedFood(index);
    }
  };

  const addFromDatabase = (dbFood: FoodDatabaseItem) => {
    if (!dbFood.food) return;
    
    const newFood: FoodItem = {
      id: `custom-${Date.now()}`,
      food: dbFood.food,
      category: step,
      calories: dbFood["Caloric Value"] || 0,
      protein: dbFood.Protein || 0,
      carbs: dbFood.Carbohydrates || 0,
      fat: dbFood.Fat || 0,
      fiber: dbFood["Dietary Fiber"] || 0,
    };
    
    selectFood(newFood);
    setSearchQuery("");
    setShowManualAdd(false);
  };

  const openCustomItemDialog = () => {
    setCustomItemName(searchQuery);
    setCustomItemDialogOpen(true);
    setShowManualAdd(false);
  };

  const addCustomItem = () => {
    if (!customItemName.trim()) return;
    
    const newFood: FoodItem = {
      id: `custom-${Date.now()}`,
      food: customItemName,
      category: step,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };
    
    selectFood(newFood);
    setCustomItemName("");
    setCustomItemDialogOpen(false);
    setSearchQuery("");
    toast.success(`Added custom item: ${customItemName}`);
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

  const updateItemQuantity = (index: number, value: string) => {
    const quantity = parseFloat(value) || 0.1;
    setSelectedItems((prev) => ({
      ...prev,
      [step]: prev[step].map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(0.1, quantity) }
          : item
      ),
    }));
  };

  const updateItemUnit = (index: number, unit: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [step]: prev[step].map((item, i) =>
        i === index
          ? { ...item, unit }
          : item
      ),
    }));
    setPreferredUnit(unit);
    toast.success(`Default unit updated to ${unit}`);
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

  const handleSkip = () => {
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
      toast.info("No items added. You can add items later from the Inventory page.");
      sessionStorage.setItem('inventory-setup-completed', 'true');
      navigate("/home");
      return;
    }

    setLoading(true);
    try {
      const inventoryItems = allItems.map((item) => ({
        user_id: user.id,
        custom_name: item.food,
        quantity: item.quantity,
        unit: item.unit,
        location: item.category,
        calories: item.calories,
        protein_g: item.protein,
        carbs_g: item.carbs,
        fat_g: item.fat,
        fiber_g: item.fiber,
      }));

      const { error } = await supabase
        .from("user_inventory")
        .insert(inventoryItems);

      if (error) throw error;

      toast.success("Inventory saved successfully!");
      sessionStorage.setItem('inventory-setup-completed', 'true');
      navigate("/home");
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {stepTitle[step]}
          </h1>
          <p className="text-muted-foreground">{stepDescription[step]}</p>
        </div>

        <div className="flex gap-2 mb-8">
          <Badge variant={step === "fridge" ? "default" : "outline"}>Fridge</Badge>
          <Badge variant={step === "freezer" ? "default" : "outline"}>Freezer</Badge>
          <Badge variant={step === "pantry" ? "default" : "outline"}>Pantry</Badge>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Add Items Manually</h2>
          </div>
          
          {!showManualAdd ? (
            <Button variant="outline" onClick={() => setShowManualAdd(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Search or Add Custom Item
            </Button>
          ) : (
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search for food items (min 2 characters)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                    {searchQuery.length >= 2 && (
                      <div className="mt-2 border rounded-md max-h-64 overflow-y-auto bg-background">
                        {filteredFoods.length > 0 ? (
                          <div className="p-2 space-y-1">
                            {filteredFoods.map((food, idx) => (
                              <div
                                key={idx}
                                onClick={() => addFromDatabase(food)}
                                className="p-3 hover:bg-muted rounded-md cursor-pointer flex justify-between items-center transition-colors"
                              >
                                <span className="font-medium">{food.food}</span>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(food["Caloric Value"] || 0)} cal
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center space-y-2">
                            <p className="text-sm text-muted-foreground">No items found in database</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={openCustomItemDialog}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add "{searchQuery}" as custom item
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowManualAdd(false);
                      setSearchQuery("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Type at least 2 characters to search. Items not in database can be added as custom items.
                </p>
              </div>
            </Card>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Common Items</h2>
            <Button variant="outline" size="sm" onClick={refreshCommonItems}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Show More
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayedFoods.map((food, index) => {
              // Assign colors based on category
              const categoryColors = {
                fridge: "from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border-blue-500/20",
                freezer: "from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border-purple-500/20",
                pantry: "from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border-amber-500/20"
              };
              
              return (
                <Card 
                  key={`${food.id}-${index}`} 
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-105 bg-gradient-to-br ${categoryColors[step]}`}
                  onClick={() => selectFood(food, index)}
                >
                  <div className="text-center space-y-2">
                    <h3 className="font-medium text-sm capitalize line-clamp-2">{food.food}</h3>
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
              );
            })}
          </div>
        </div>

        {selectedItems[step].length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Selected Items ({selectedItems[step].length})</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Nutrition values shown are per serving. Click quantity to edit, or use +/- buttons. Change unit to set your preference.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-3">
              {selectedItems[step].map((item, index) => {
                const caloriesPerServing = Math.round(item.calories * item.quantity);
                const proteinPerServing = (item.protein * item.quantity).toFixed(1);
                const carbsPerServing = (item.carbs * item.quantity).toFixed(1);
                const fatPerServing = (item.fat * item.quantity).toFixed(1);
                const fiberPerServing = (item.fiber * item.quantity).toFixed(1);
                
                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium capitalize">{item.food}</h3>
                        <div className="mt-2 p-2 bg-primary/5 rounded-md border border-primary/10">
                          <div className="flex items-center gap-1 mb-1">
                            <Info className="w-3 h-3 text-primary" />
                            <span className="text-xs font-semibold text-primary">Per Serving:</span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div className="font-semibold text-foreground">{caloriesPerServing} calories</div>
                            <div className="flex gap-3">
                              <span>Protein: {proteinPerServing}g</span>
                              <span>Carbs: {carbsPerServing}g</span>
                            </div>
                            <div className="flex gap-3">
                              <span>Fat: {fatPerServing}g</span>
                              <span>Fiber: {fiberPerServing}g</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit nutrition details</TooltipContent>
                        </Tooltip>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" onClick={() => updateQuantity(index, -0.5)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              step="0.1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, e.target.value)}
                              className="w-16 h-8 text-center text-sm font-medium bg-primary/5 border-primary/20"
                            />
                            <Button variant="outline" size="icon" onClick={() => updateQuantity(index, 0.5)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Select value={item.unit} onValueChange={(value) => updateItemUnit(index, value)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={handleSkip} disabled={loading} className="flex-1">Skip</Button>
          <Button onClick={handleNext} disabled={loading} className="flex-1">
            {loading ? "Saving..." : step === "pantry" ? "Complete Setup" : <></>}
            {!loading && step !== "pantry" && <>Next <ChevronRight className="w-4 h-4 ml-2" /></>}
          </Button>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nutrition Info</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label>Item Name</Label>
                <Input value={editingItem.food} onChange={(e) => setEditingItem({ ...editingItem, food: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" step="0.1" value={editingItem.quantity} onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input value={editingItem.unit} onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Calories</Label>
                  <Input type="number" value={editingItem.calories} onChange={(e) => setEditingItem({ ...editingItem, calories: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Protein (g)</Label>
                  <Input type="number" step="0.1" value={editingItem.protein} onChange={(e) => setEditingItem({ ...editingItem, protein: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Carbs (g)</Label>
                  <Input type="number" step="0.1" value={editingItem.carbs} onChange={(e) => setEditingItem({ ...editingItem, carbs: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Fat (g)</Label>
                  <Input type="number" step="0.1" value={editingItem.fat} onChange={(e) => setEditingItem({ ...editingItem, fat: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customItemDialogOpen} onOpenChange={setCustomItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name</Label>
              <Input value={customItemName} onChange={(e) => setCustomItemName(e.target.value)} placeholder="Enter item name" />
            </div>
            <p className="text-sm text-muted-foreground">
              This item will be added with default nutrition values (0). You can edit them after adding.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={addCustomItem} disabled={!customItemName.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventorySetup;
