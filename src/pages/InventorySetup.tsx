import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Minus, Edit2 } from "lucide-react";

interface NutritionalData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface Item {
  name: string;
  quantity: number;
  unit: string;
  nutritionPer100: NutritionalData;
  image: string;
}

const commonItems = {
  fridge: [
    { name: "Milk", unit: "mL", image: "🥛", nutritionPer100: { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0 } },
    { name: "Eggs", unit: "count", image: "🥚", nutritionPer100: { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0 } },
    { name: "Spinach", unit: "g", image: "🥬", nutritionPer100: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 } },
    { name: "Yogurt", unit: "g", image: "🥛", nutritionPer100: { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0 } },
    { name: "Chicken Thigh", unit: "g", image: "🍗", nutritionPer100: { calories: 209, protein: 26, carbs: 0, fat: 11, fiber: 0 } },
    { name: "Cheese", unit: "g", image: "🧀", nutritionPer100: { calories: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0 } },
    { name: "Tomatoes", unit: "count", image: "🍅", nutritionPer100: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 } },
    { name: "Butter", unit: "g", image: "🧈", nutritionPer100: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0 } },
  ],
  freezer: [
    { name: "Frozen Peas", unit: "g", image: "🫛", nutritionPer100: { calories: 77, protein: 5, carbs: 14, fat: 0.4, fiber: 5 } },
    { name: "Frozen Berries", unit: "g", image: "🫐", nutritionPer100: { calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4 } },
    { name: "Ice Cream", unit: "mL", image: "🍦", nutritionPer100: { calories: 207, protein: 3.5, carbs: 24, fat: 11, fiber: 0.7 } },
    { name: "Frozen Pizza", unit: "count", image: "🍕", nutritionPer100: { calories: 266, protein: 11, carbs: 33, fat: 10, fiber: 2.3 } },
    { name: "Frozen Fish", unit: "g", image: "🐟", nutritionPer100: { calories: 206, protein: 22, carbs: 0, fat: 12, fiber: 0 } },
    { name: "Frozen Broccoli", unit: "g", image: "🥦", nutritionPer100: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 } },
  ],
  pantry: [
    { name: "Rice", unit: "g", image: "🍚", nutritionPer100: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 } },
    { name: "Pasta", unit: "g", image: "🍝", nutritionPer100: { calories: 371, protein: 13, carbs: 75, fat: 1.5, fiber: 3.2 } },
    { name: "Olive Oil", unit: "mL", image: "🫒", nutritionPer100: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 } },
    { name: "Flour", unit: "g", image: "🌾", nutritionPer100: { calories: 364, protein: 10, carbs: 76, fat: 1, fiber: 2.7 } },
    { name: "Sugar", unit: "g", image: "🧂", nutritionPer100: { calories: 387, protein: 0, carbs: 100, fat: 0, fiber: 0 } },
    { name: "Salt", unit: "g", image: "🧂", nutritionPer100: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 } },
    { name: "Canned Beans", unit: "g", image: "🫘", nutritionPer100: { calories: 81, protein: 5.5, carbs: 15, fat: 0.5, fiber: 6.4 } },
    { name: "Oats", unit: "g", image: "🌾", nutritionPer100: { calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 11 } },
  ],
};

const InventorySetup = () => {
  const navigate = useNavigate();
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
  const [editNutrition, setEditNutrition] = useState<NutritionalData>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });
  const [userGoals, setUserGoals] = useState<any>({});

  useEffect(() => {
    const prefs = localStorage.getItem("userPreferences");
    if (prefs) {
      setUserGoals(JSON.parse(prefs));
    }
  }, []);

  const currentItems = commonItems[step];
  const currentSelected = selectedItems[step];

  const calculateNutrition = (item: Item) => {
    const multiplier = item.unit === "count" ? item.quantity : item.quantity / 100;
    return {
      calories: Math.round(item.nutritionPer100.calories * multiplier),
      protein: Math.round(item.nutritionPer100.protein * multiplier * 10) / 10,
      carbs: Math.round(item.nutritionPer100.carbs * multiplier * 10) / 10,
      fat: Math.round(item.nutritionPer100.fat * multiplier * 10) / 10,
      fiber: Math.round(item.nutritionPer100.fiber * multiplier * 10) / 10,
    };
  };

  const handleItemToggle = (commonItem: typeof commonItems.fridge[0]) => {
    const exists = currentSelected.find((item) => item.name === commonItem.name);
    if (exists) {
      setSelectedItems({
        ...selectedItems,
        [step]: currentSelected.filter((item) => item.name !== commonItem.name),
      });
    } else {
      const newItem: Item = {
        name: commonItem.name,
        quantity: commonItem.unit === "count" ? 1 : 100,
        unit: commonItem.unit,
        nutritionPer100: { ...commonItem.nutritionPer100 },
        image: commonItem.image,
      };
      setSelectedItems({
        ...selectedItems,
        [step]: [...currentSelected, newItem],
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

  const handleAddCustomItem = () => {
    if (customItem.trim() && customQuantity) {
      const newItem: Item = {
        name: customItem,
        quantity: parseFloat(customQuantity),
        unit: "unit",
        nutritionPer100: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        image: "📦",
      };
      setSelectedItems({
        ...selectedItems,
        [step]: [...currentSelected, newItem],
      });
      setCustomItem("");
      setCustomQuantity("");
    }
  };

  const handleUpdateNutrition = () => {
    if (editingItem) {
      setSelectedItems({
        ...selectedItems,
        [step]: currentSelected.map((item) =>
          item.name === editingItem.name
            ? { ...item, nutritionPer100: { ...editNutrition } }
            : item
        ),
      });
      setEditingItem(null);
    }
  };

  const openEditNutrition = (item: Item) => {
    setEditingItem(item);
    setEditNutrition({ ...item.nutritionPer100 });
  };

  const handleNext = () => {
    if (step === "fridge") setStep("freezer");
    else if (step === "freezer") setStep("pantry");
    else {
      // Combine all items with location and save
      const allItems = [
        ...selectedItems.fridge.map(item => ({ ...item, location: "fridge" as const })),
        ...selectedItems.freezer.map(item => ({ ...item, location: "freezer" as const })),
        ...selectedItems.pantry.map(item => ({ ...item, location: "pantry" as const })),
      ];
      localStorage.setItem("inventory", JSON.stringify(allItems));
      navigate("/home");
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
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {getStepTitle()}
          </h1>
          <p className="text-muted-foreground">
            Select items you have and specify quantities
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

        {/* Common Items Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {currentItems.map((item) => {
            const selected = currentSelected.find((i) => i.name === item.name);
            const nutrition = selected ? calculateNutrition(selected) : null;
            const showMacros = userGoals.proteinGoal || userGoals.fiberGoal || userGoals.fatGoal || userGoals.carbsGoal;
            
            return (
              <Card
                key={item.name}
                className={`relative p-4 cursor-pointer transition-all overflow-hidden ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/50"
                }`}
                onClick={() => handleItemToggle(item)}
              >
                {/* Nutrition Badge */}
                {nutrition && (
                  <div className="absolute top-2 right-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 text-xs shadow-sm">
                    <div className="font-semibold text-foreground">{nutrition.calories} cal</div>
                    {showMacros && (
                      <div className="text-muted-foreground mt-1 space-y-0.5">
                        {userGoals.proteinGoal && <div>P: {nutrition.protein}g</div>}
                        {userGoals.carbsGoal && <div>C: {nutrition.carbs}g</div>}
                        {userGoals.fatGoal && <div>F: {nutrition.fat}g</div>}
                        {userGoals.fiberGoal && <div>Fb: {nutrition.fiber}g</div>}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{item.image}</div>
                  <div className="font-medium text-foreground flex-1">
                    {item.name}
                  </div>
                </div>
                
                {selected && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(item.name, item.unit === "count" ? -1 : -10);
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
                          handleQuantityChange(item.name, item.unit === "count" ? 1 : 10);
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditNutrition(selected);
                      }}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit Nutrition
                    </Button>
                  </>
                )}
              </Card>
            );
          })}
        </div>

        {/* Add Custom Item */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3">
            Add Custom Item
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Item name"
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Qty"
              value={customQuantity}
              onChange={(e) => setCustomQuantity(e.target.value)}
              className="w-24"
            />
            <Button onClick={handleAddCustomItem} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/home")}
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-primary to-accent"
          >
            {step === "pantry" ? "Finish Setup" : "Next"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Edit Nutrition Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nutritional Data (per 100{editingItem?.unit})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Calories</Label>
              <Input
                type="number"
                value={editNutrition.calories}
                onChange={(e) =>
                  setEditNutrition({ ...editNutrition, calories: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <Label>Protein (g)</Label>
              <Input
                type="number"
                value={editNutrition.protein}
                onChange={(e) =>
                  setEditNutrition({ ...editNutrition, protein: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <Label>Carbs (g)</Label>
              <Input
                type="number"
                value={editNutrition.carbs}
                onChange={(e) =>
                  setEditNutrition({ ...editNutrition, carbs: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <Label>Fat (g)</Label>
              <Input
                type="number"
                value={editNutrition.fat}
                onChange={(e) =>
                  setEditNutrition({ ...editNutrition, fat: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <Label>Fiber (g)</Label>
              <Input
                type="number"
                value={editNutrition.fiber}
                onChange={(e) =>
                  setEditNutrition({ ...editNutrition, fiber: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <Button onClick={handleUpdateNutrition} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventorySetup;
