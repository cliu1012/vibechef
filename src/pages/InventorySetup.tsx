import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Minus, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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

const commonItems = {
  fridge: [
    {
      name: "Milk",
      unit: "L",
      calories: 42,
      protein: 3.4,
      carbs: 5,
      fat: 1,
      fiber: 0,
      image: "🥛",
    },
    {
      name: "Eggs",
      unit: "count",
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      fiber: 0,
      image: "🥚",
    },
    {
      name: "Spinach",
      unit: "g",
      calories: 23,
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4,
      fiber: 2.2,
      image: "🥬",
    },
    {
      name: "Yogurt",
      unit: "g",
      calories: 59,
      protein: 10,
      carbs: 3.6,
      fat: 0.4,
      fiber: 0,
      image: "🥛",
    },
    {
      name: "Chicken Thigh",
      unit: "g",
      calories: 209,
      protein: 26,
      carbs: 0,
      fat: 11,
      fiber: 0,
      image: "🍗",
    },
    {
      name: "Cheese",
      unit: "g",
      calories: 402,
      protein: 25,
      carbs: 1.3,
      fat: 33,
      fiber: 0,
      image: "🧀",
    },
    {
      name: "Tomatoes",
      unit: "count",
      calories: 18,
      protein: 0.9,
      carbs: 3.9,
      fat: 0.2,
      fiber: 1.2,
      image: "🍅",
    },
    {
      name: "Butter",
      unit: "g",
      calories: 717,
      protein: 0.9,
      carbs: 0.1,
      fat: 81,
      fiber: 0,
      image: "🧈",
    },
  ],
  freezer: [
    {
      name: "Frozen Peas",
      unit: "g",
      calories: 81,
      protein: 5.4,
      carbs: 14,
      fat: 0.4,
      fiber: 5.7,
      image: "🫛",
    },
    {
      name: "Frozen Berries",
      unit: "g",
      calories: 57,
      protein: 0.7,
      carbs: 14,
      fat: 0.3,
      fiber: 2.4,
      image: "🫐",
    },
    {
      name: "Ice Cream",
      unit: "L",
      calories: 207,
      protein: 3.5,
      carbs: 24,
      fat: 11,
      fiber: 0.7,
      image: "🍨",
    },
    {
      name: "Frozen Pizza",
      unit: "count",
      calories: 266,
      protein: 11,
      carbs: 33,
      fat: 10,
      fiber: 2.3,
      image: "🍕",
    },
    {
      name: "Frozen Fish",
      unit: "g",
      calories: 206,
      protein: 22,
      carbs: 0,
      fat: 12,
      fiber: 0,
      image: "🐟",
    },
    {
      name: "Frozen Broccoli",
      unit: "g",
      calories: 35,
      protein: 2.4,
      carbs: 7,
      fat: 0.4,
      fiber: 3.3,
      image: "🥦",
    },
  ],
  pantry: [
    {
      name: "Rice",
      unit: "kg",
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      fiber: 0.4,
      image: "🍚",
    },
    {
      name: "Pasta",
      unit: "g",
      calories: 131,
      protein: 5,
      carbs: 25,
      fat: 1.1,
      fiber: 1.8,
      image: "🍝",
    },
    {
      name: "Olive Oil",
      unit: "mL",
      calories: 884,
      protein: 0,
      carbs: 0,
      fat: 100,
      fiber: 0,
      image: "🫒",
    },
    {
      name: "Flour",
      unit: "kg",
      calories: 364,
      protein: 10,
      carbs: 76,
      fat: 1,
      fiber: 2.7,
      image: "🌾",
    },
    {
      name: "Sugar",
      unit: "g",
      calories: 387,
      protein: 0,
      carbs: 100,
      fat: 0,
      fiber: 0,
      image: "🧂",
    },
    {
      name: "Salt",
      unit: "g",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      image: "🧂",
    },
    {
      name: "Canned Beans",
      unit: "can",
      calories: 127,
      protein: 7.6,
      carbs: 23,
      fat: 0.5,
      fiber: 6.4,
      image: "🫘",
    },
    {
      name: "Oats",
      unit: "g",
      calories: 389,
      protein: 17,
      carbs: 66,
      fat: 7,
      fiber: 11,
      image: "🌾",
    },
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const currentItems = commonItems[step];
  const currentSelected = selectedItems[step];

  const handleItemToggle = (item: typeof commonItems.fridge[0]) => {
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

  const handleAddCustomItem = () => {
    if (customItem.trim() && customQuantity) {
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
  };

  const handleNext = () => {
    if (step === "fridge") setStep("freezer");
    else if (step === "freezer") setStep("pantry");
    else {
      localStorage.setItem("inventory", JSON.stringify(selectedItems));
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

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/home")}>
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
