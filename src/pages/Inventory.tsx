import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/BackButton";
import {
  Plus,
  Search,
  Package,
  Refrigerator,
  Snowflake,
  AlertCircle,
  ScanBarcode,
  Pencil,
  Trash2,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: "fridge" | "freezer" | "pantry";
  status: "in-stock" | "low" | "out";
  expiresAt?: string;
  image?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock inventory data
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: "1",
      name: "Chicken Breast",
      quantity: 500,
      unit: "g",
      location: "fridge",
      status: "in-stock",
      expiresAt: "2025-11-18",
    },
    {
      id: "2",
      name: "Eggs",
      quantity: 4,
      unit: "count",
      location: "fridge",
      status: "low",
    },
    {
      id: "3",
      name: "Frozen Peas",
      quantity: 300,
      unit: "g",
      location: "freezer",
      status: "in-stock",
    },
    {
      id: "4",
      name: "Rice",
      quantity: 1,
      unit: "kg",
      location: "pantry",
      status: "in-stock",
    },
    {
      id: "5",
      name: "Tomatoes",
      quantity: 3,
      unit: "count",
      location: "fridge",
      status: "in-stock",
      expiresAt: "2025-11-16",
      image: "🍅",
    },
  ]);

  const handleEdit = (item: InventoryItem) => {
    setEditingItem({ ...item });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingItem) {
      setItems(items.map(item => item.id === editingItem.id ? editingItem : item));
      setIsDialogOpen(false);
      setEditingItem(null);
    }
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case "fridge":
        return <Refrigerator className="w-4 h-4" />;
      case "freezer":
        return <Snowflake className="w-4 h-4" />;
      case "pantry":
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "bg-warning/10 text-warning border-warning/20";
      case "out":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-success/10 text-success border-success/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "low":
        return "Low Stock";
      case "out":
        return "Out of Stock";
      default:
        return "In Stock";
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || item.location === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton />
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Inventory</h1>
          <p className="text-muted-foreground">
            Manage your fridge, freezer, and pantry items
          </p>
        </div>

        {/* Search and Actions */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="bg-gradient-to-r from-primary to-accent">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
          <Button variant="outline">
            <ScanBarcode className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="fridge">Fridge</TabsTrigger>
            <TabsTrigger value="freezer">Freezer</TabsTrigger>
            <TabsTrigger value="pantry">Pantry</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Items Grid */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-2">
                No items found
              </h3>
              <p className="text-muted-foreground mb-6">
                Start adding items to track your inventory
              </p>
              <Button className="bg-gradient-to-r from-primary to-accent">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card
                key={item.id}
                className="p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                      {item.image || getLocationIcon(item.location)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {item.quantity} {item.unit}
                        </span>
                        <span className="capitalize">{item.location}</span>
                        {item.expiresAt && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Expires {new Date(item.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={editingItem.quantity}
                      onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={editingItem.unit}
                      onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Location</Label>
                  <Select
                    value={editingItem.location}
                    onValueChange={(value: any) => setEditingItem({ ...editingItem, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fridge">Fridge</SelectItem>
                      <SelectItem value="freezer">Freezer</SelectItem>
                      <SelectItem value="pantry">Pantry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editingItem.status}
                    onValueChange={(value: any) => setEditingItem({ ...editingItem, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
                      <SelectItem value="out">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expiry Date (Optional)</Label>
                  <Input
                    type="date"
                    value={editingItem.expiresAt || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, expiresAt: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Protein (g)</Label>
                    <Input
                      type="number"
                      value={editingItem.protein || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, protein: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Carbs (g)</Label>
                    <Input
                      type="number"
                      value={editingItem.carbs || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, carbs: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Fat (g)</Label>
                    <Input
                      type="number"
                      value={editingItem.fat || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, fat: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Fiber (g)</Label>
                    <Input
                      type="number"
                      value={editingItem.fiber || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, fiber: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full bg-gradient-to-r from-primary to-accent">
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Inventory;
