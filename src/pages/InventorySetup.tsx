import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Minus, Edit2 } from "lucide-react";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Item {
  name: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  image?: string;
}

interface FoodDatasetItem {
  food: string;
  "Caloric Value": number;
  Protein: number;
  Carbohydrates: number;
  Fat: number;
  "Dietary Fiber": number;
}

interface CommonItem {
  id: string;
  food_name: string;
  category: string;
  display_order: number;
}

const InventorySetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<"fridge" | "freezer" | "pantry">("fridge");
  const [selectedItems, setSelectedItems] = useState<{
    fridge: Item[];
    freezer: Item[];
    pantry: Item[];
  }>({
    fridge: [],
    freezer: [],
    pantry: [],
  });
  const [customItem, setCustomItem] = useState("");
  const [customQuantity, setCustomQuantity] = useState("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foodDatabase, setFoodDatabase] = useState<FoodDatasetItem[]>([]);
  const [commonItems, setCommonItems] = useState<{
    fridge: Item[];
    freezer: Item[];
    pantry: Item[];
  }>({
    fridge: [],
    freezer: [],
    pantry: [],
  });
  const [openAutocomplete, setOpenAutocomplete] = useState(false);

  useEffect(() => {
    loadFoodDatabase();
    loadCommonItems();
  }, []);

  const loadCommonItems = async () => {
    try {
      const { data, error } = await supabase
        .from("common_items")
        .select("*")
        .order("display_order");

      if (error) throw error;

      // Wait for food database to be loaded
      // We'll match common items with food database after both are loaded
      setCommonItems((prev) => {
        const grouped = { fridge: [], freezer: [], pantry: [] } as any;
        data?.forEach((item) => {
          grouped[item.category] = grouped[item.category] || [];
          grouped[item.category].push({
            name: item.food_name,
            quantity: 1,
            unit: "g",
            image: "📦",
          });
        });
        return grouped;
      });
    } catch (error) {
      console.error("Error loading common items:", error);
    }
  };

  // When food database is loaded, enrich common items with nutritional data
  useEffect(() => {
    if (foodDatabase.length > 0) {
      setCommonItems((prev) => {
        const enriched = { fridge: [], freezer: [], pantry: [] } as any;
        
        Object.keys(prev).forEach((category) => {
          enriched[category] = prev[category as keyof typeof prev].map((item: Item) => {
            const foodItem = foodDatabase.find(
              (f) => f.food.toLowerCase().includes(item.name.toLowerCase())
            );
            
            return {
              ...item,
              calories: foodItem?.["Caloric Value"],
              protein: foodItem?.Protein,
              carbs: foodItem?.Carbohydrates,
              fat: foodItem?.Fat,
              fiber: foodItem?.["Dietary Fiber"],
            };
          });
        });
        
        return enriched;
      });
    }
  }, [foodDatabase]);

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
          return new Promise<FoodDatasetItem[]>((resolve) => {
            Papa.parse(csvText, {
              header: true,
              dynamicTyping: true,
              skipEmptyLines: true,
              complete: (results) => {
                const items = (results.data as any[])
                  .filter((item) => item.food)
                  .map((item) => ({
                    food: item.food,
                    "Caloric Value": parseFloat(item["Caloric Value"]) || 0,
                    Protein: parseFloat(item.Protein) || 0,
                    Carbohydrates: parseFloat(item.Carbohydrates) || 0,
                    Fat: parseFloat(item.Fat) || 0,
                    "Dietary Fiber": parseFloat(item["Dietary Fiber"]) || 0,
                  }));
                resolve(items);
              },
            });
          });
        })
      );
      const combinedData = allData.flat();
      setFoodDatabase(combinedData);
    } catch (error) {
      console.error("Error loading food database:", error);
    }
  };

  // Filter suggestions based on custom item input
  const filteredSuggestions = customItem.trim().length > 0
    ? foodDatabase
        .filter((item) =>
          item.food.toLowerCase().includes(customItem.toLowerCase())
        )
        .slice(0, 10)
    : [];

  const currentItems = commonItems[step];
  const currentSelected = selectedItems[step];

  const handleItemToggle = (item: Item) => {
    const exists = currentSelected.find((i) => i.name === item.name);
    if (exists) {
      setSelectedItems({
        ...selectedItems,
        [step]: currentSelected.filter((i) => i.name !== item.name),
      });
    } else {
      setSelectedItems({
        ...selectedItems,
        [step]: [
          ...currentSelected,
          {
            name: item.name,
            quantity: 1,
            unit: item.unit,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fiber: item.fiber,
            image: item.image,
          },
        ],
      });
    }
  };

  const handleQuantityChange = (itemName: string, delta: number) => {
    setSelectedItems({
      ...selectedItems,
      [step]: currentSelected.map((item) =>
        item.name === itemName
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      ),
    });
  };

  const handleEditNutrition = (item: Item) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleSaveNutrition = () => {
    if (editingItem) {
      setSelectedItems({
        ...selectedItems,
        [step]: currentSelected.map((item) =>
          item.name === editingItem.name ? editingItem : item
        ),
      });
      setEditDialogOpen(false);
      setEditingItem(null);
    }
  };

  const handleSelectSuggestion = (suggestion: FoodDatasetItem) => {
    if (customQuantity) {
      setSelectedItems({
        ...selectedItems,
        [step]: [
          ...currentSelected,
          {
            name: suggestion.food,
            quantity: parseFloat(customQuantity),
            unit: "g",
            calories: suggestion["Caloric Value"],
            protein: suggestion.Protein,
            carbs: suggestion.Carbohydrates,
            fat: suggestion.Fat,
            fiber: suggestion["Dietary Fiber"],
            image: "📦",
          },
        ],
      });
      setCustomItem("");
      setCustomQuantity("");
      setOpenAutocomplete(false);
    } else {
      toast.error("Please enter a quantity first");
    }
  };

  const handleAddCustomItem = () => {
    if (customItem.trim() && customQuantity) {
      // Check if there's an exact match in the dataset
      const exactMatch = foodDatabase.find(
        item => item.food.toLowerCase() === customItem.toLowerCase()
      );

      if (exactMatch) {
        handleSelectSuggestion(exactMatch);
      } else {
        // Add without nutritional data
        setSelectedItems({
          ...selectedItems,
          [step]: [
            ...currentSelected,
            {
              name: customItem,
              quantity: parseFloat(customQuantity),
              unit: "unit",
              image: "📦",
            },
          ],
        });
        setCustomItem("");
        setCustomQuantity("");
      }
    }
  };

  const handleNext = async () => {
    if (step === "fridge") {
      setStep("freezer");
    } else if (step === "freezer") {
      setStep("pantry");
    } else {
      // Final step - save to database
      if (!user) return;
      
      setLoading(true);
      try {
        // Combine all items from all locations
        const allItems = [
          ...selectedItems.fridge.map(item => ({ ...item, location: 'fridge' })),
          ...selectedItems.freezer.map(item => ({ ...item, location: 'freezer' })),
          ...selectedItems.pantry.map(item => ({ ...item, location: 'pantry' })),
        ];

        // Save to database
        const inventoryItems = allItems.map((item) => {
          const foodItem = foodDatabase.find(f => f.food.toLowerCase() === item.name.toLowerCase());
          
          return {
            user_id: user.id,
            food_id: null, // We're not using food_database table anymore, using CSV directly
            custom_name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            location: item.location,
            status: "in-stock",
            calories: item.calories,
            protein_g: item.protein,
            carbs_g: item.carbs,
            fat_g: item.fat,
            fiber_g: item.fiber,
          };
        });

        const { error } = await supabase.from("user_inventory").insert(inventoryItems);

        if (error) {
          toast.error("Failed to save inventory");
          console.error(error);
        } else {
          toast.success("Inventory saved successfully!");
          navigate("/home");
        }
      } catch (error) {
        toast.error("An error occurred");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "fridge":
        return "Stock Your Fridge";
      case "freezer":
        return "Stock Your Freezer";
      case "pantry":
        return "Stock Your Pantry";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {getStepTitle()}
          </h1>
          <p className="text-muted-foreground">
            Let's stock your kitchen so I can recommend meals
          </p>
          <div className="flex justify-center gap-2 mt-4">
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
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {currentItems.map((item) => {
            const selected = currentSelected.find((i) => i.name === item.name);
            return (
              <Card
                key={item.name}
                className={`p-4 cursor-pointer transition-all ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/50"
                }`}
                onClick={() => handleItemToggle(item)}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-2xl">{item.image}</span>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.calories} cal • P:{item.protein}g • C:{item.carbs}g
                    </div>
                  </div>
                  {selected && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNutrition(selected);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {selected && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(item.name, -1);
                      }}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm min-w-[60px] text-center">
                      {selected.quantity} {selected.unit}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(item.name, 1);
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3">
            Add Custom Item
          </h3>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Popover open={openAutocomplete && filteredSuggestions.length > 0} onOpenChange={setOpenAutocomplete}>
                <PopoverTrigger asChild>
                  <Input
                    placeholder="Item name (start typing for suggestions)"
                    value={customItem}
                    onChange={(e) => {
                      setCustomItem(e.target.value);
                      setOpenAutocomplete(true);
                    }}
                    onFocus={() => setOpenAutocomplete(true)}
                    className="flex-1"
                  />
                </PopoverTrigger>
                {filteredSuggestions.length > 0 && (
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandEmpty>No food items found.</CommandEmpty>
                        <CommandGroup heading="Suggestions from database">
                          {filteredSuggestions.map((suggestion) => (
                            <CommandItem
                              key={suggestion.food}
                              value={suggestion.food}
                              onSelect={() => {
                                setCustomItem(suggestion.food);
                                handleSelectSuggestion(suggestion);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{suggestion.food}</span>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(suggestion["Caloric Value"])} cal • 
                                  P: {suggestion.Protein.toFixed(1)}g • 
                                  C: {suggestion.Carbohydrates.toFixed(1)}g • 
                                  F: {suggestion.Fat.toFixed(1)}g
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
            </div>
            <Input
              type="number"
              placeholder="Qty (g)"
              value={customQuantity}
              onChange={(e) => setCustomQuantity(e.target.value)}
              className="w-24"
            />
            <Button onClick={handleAddCustomItem} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Type to search {foodDatabase.length.toLocaleString()} food items with nutritional data
          </p>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/home")}>
            Skip for Now
          </Button>
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-primary to-accent"
            disabled={loading}
          >
            {loading ? "Saving..." : step === "pantry" ? "Finish Setup" : "Next"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nutritional Data - {editingItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="calories">Calories (per {editingItem?.unit})</Label>
              <Input
                id="calories"
                type="number"
                value={editingItem?.calories || ""}
                onChange={(e) =>
                  setEditingItem(
                    editingItem
                      ? { ...editingItem, calories: parseFloat(e.target.value) }
                      : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={editingItem?.protein || ""}
                onChange={(e) =>
                  setEditingItem(
                    editingItem
                      ? { ...editingItem, protein: parseFloat(e.target.value) }
                      : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="carbs">Carbohydrates (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={editingItem?.carbs || ""}
                onChange={(e) =>
                  setEditingItem(
                    editingItem
                      ? { ...editingItem, carbs: parseFloat(e.target.value) }
                      : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                value={editingItem?.fat || ""}
                onChange={(e) =>
                  setEditingItem(
                    editingItem
                      ? { ...editingItem, fat: parseFloat(e.target.value) }
                      : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fiber">Fiber (g)</Label>
              <Input
                id="fiber"
                type="number"
                value={editingItem?.fiber || ""}
                onChange={(e) =>
                  setEditingItem(
                    editingItem
                      ? { ...editingItem, fiber: parseFloat(e.target.value) }
                      : null
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNutrition}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventorySetup;
