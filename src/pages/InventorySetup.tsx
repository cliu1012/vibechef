import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Minus } from "lucide-react";

interface Item {
  name: string;
  quantity: number;
  unit: string;
  image: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

const commonItems = {
  fridge: [
    { name: "Milk", unit: "L", image: "🥛", protein: 3.4, carbs: 5, fat: 3.3, fiber: 0 },
    { name: "Eggs", unit: "count", image: "🥚", protein: 6, carbs: 0.6, fat: 5, fiber: 0 },
    { name: "Spinach", unit: "g", image: "🥬", protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
    { name: "Yogurt", unit: "g", image: "🥣", protein: 10, carbs: 3.6, fat: 0.4, fiber: 0 },
    { name: "Chicken Thigh", unit: "g", image: "🍗", protein: 26, carbs: 0, fat: 15, fiber: 0 },
    { name: "Cheese", unit: "g", image: "🧀", protein: 25, carbs: 1.3, fat: 33, fiber: 0 },
    { name: "Tomatoes", unit: "count", image: "🍅", protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
    { name: "Butter", unit: "g", image: "🧈", protein: 0.9, carbs: 0.1, fat: 81, fiber: 0 },
  ],
  freezer: [
    { name: "Frozen Peas", unit: "g", image: "🫛", protein: 5, carbs: 14, fat: 0.4, fiber: 5.7 },
    { name: "Frozen Berries", unit: "g", image: "🫐", protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4 },
    { name: "Ice Cream", unit: "L", image: "🍨", protein: 3.5, carbs: 24, fat: 11, fiber: 0.5 },
    { name: "Frozen Pizza", unit: "count", image: "🍕", protein: 11, carbs: 33, fat: 10, fiber: 2.3 },
    { name: "Frozen Fish", unit: "g", image: "🐟", protein: 22, carbs: 0, fat: 5, fiber: 0 },
    { name: "Frozen Broccoli", unit: "g", image: "🥦", protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
  ],
  pantry: [
    { name: "Rice", unit: "kg", image: "🍚", protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
    { name: "Pasta", unit: "g", image: "🍝", protein: 5, carbs: 25, fat: 0.9, fiber: 1.8 },
    { name: "Olive Oil", unit: "mL", image: "🫒", protein: 0, carbs: 0, fat: 14, fiber: 0 },
    { name: "Flour", unit: "kg", image: "🌾", protein: 10, carbs: 76, fat: 1, fiber: 2.7 },
    { name: "Sugar", unit: "g", image: "🍬", protein: 0, carbs: 100, fat: 0, fiber: 0 },
    { name: "Salt", unit: "g", image: "🧂", protein: 0, carbs: 0, fat: 0, fiber: 0 },
    { name: "Canned Beans", unit: "can", image: "🥫", protein: 6, carbs: 20, fat: 0.5, fiber: 6 },
    { name: "Oats", unit: "g", image: "🌾", protein: 17, carbs: 66, fat: 7, fiber: 11 },
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
        [step]: [...currentSelected, { 
          name: item.name, 
          quantity: 1, 
          unit: item.unit,
          image: item.image,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber
        }],
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

  const handleMacroChange = (itemName: string, field: string, value: string) => {
    setSelectedItems({
      ...selectedItems,
      [step]: currentSelected.map((item) =>
        item.name === itemName
          ? { ...item, [field]: parseFloat(value) || 0 }
          : item
      ),
    });
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
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
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
      // Save to localStorage or database
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
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
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-4xl">{item.image}</div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground mb-1">
                      {item.name}
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
                  </div>
                </div>
                {selected && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="number"
                      placeholder="Protein (g)"
                      value={selected.protein || ''}
                      onChange={(e) => handleMacroChange(item.name, 'protein', e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Carbs (g)"
                      value={selected.carbs || ''}
                      onChange={(e) => handleMacroChange(item.name, 'carbs', e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Fat (g)"
                      value={selected.fat || ''}
                      onChange={(e) => handleMacroChange(item.name, 'fat', e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Fiber (g)"
                      value={selected.fiber || ''}
                      onChange={(e) => handleMacroChange(item.name, 'fiber', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
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
    </div>
  );
};

export default InventorySetup;
