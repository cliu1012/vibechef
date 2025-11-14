import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";

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
  const [newItem, setNewItem] = useState("");
  const [items, setItems] = useState<GroceryItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('groceryList');
    if (stored) {
      setItems(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('groceryList', JSON.stringify(items));
  }, [items]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            My Grocery List
          </h1>
          <p className="text-muted-foreground">
            {uncheckedItems.length} items to buy
          </p>
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
