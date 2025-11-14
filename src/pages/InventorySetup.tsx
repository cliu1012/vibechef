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
}

const commonItems = {
  fridge: [
    { name: "Milk", unit: "L" },
    { name: "Eggs", unit: "count" },
    { name: "Spinach", unit: "g" },
    { name: "Yogurt", unit: "g" },
    { name: "Chicken Thigh", unit: "g" },
    { name: "Cheese", unit: "g" },
    { name: "Tomatoes", unit: "count" },
    { name: "Butter", unit: "g" },
  ],
  freezer: [
    { name: "Frozen Peas", unit: "g" },
    { name: "Frozen Berries", unit: "g" },
    { name: "Ice Cream", unit: "L" },
    { name: "Frozen Pizza", unit: "count" },
    { name: "Frozen Fish", unit: "g" },
    { name: "Frozen Broccoli", unit: "g" },
  ],
  pantry: [
    { name: "Rice", unit: "kg" },
    { name: "Pasta", unit: "g" },
    { name: "Olive Oil", unit: "mL" },
    { name: "Flour", unit: "kg" },
    { name: "Sugar", unit: "g" },
    { name: "Salt", unit: "g" },
    { name: "Canned Beans", unit: "can" },
    { name: "Oats", unit: "g" },
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

  const handleItemToggle = (itemName: string, unit: string) => {
    const exists = currentSelected.find((item) => item.name === itemName);
    if (exists) {
      setSelectedItems({
        ...selectedItems,
        [step]: currentSelected.filter((item) => item.name !== itemName),
      });
    } else {
      setSelectedItems({
        ...selectedItems,
        [step]: [...currentSelected, { name: itemName, quantity: 1, unit }],
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
      setSelectedItems({
        ...selectedItems,
        [step]: [
          ...currentSelected,
          { name: customItem, quantity: parseFloat(customQuantity), unit: "unit" },
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
                onClick={() => handleItemToggle(item.name, item.unit)}
              >
                <div className="font-medium text-foreground mb-2">
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
