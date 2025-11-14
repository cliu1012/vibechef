import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BackButton from "@/components/BackButton";
import Papa from "papaparse";
import {
  Plus,
  Search,
  Package,
  Refrigerator,
  Snowflake,
  AlertCircle,
  ScanBarcode,
  Trash2,
  Edit,
  Info,
  HelpCircle,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: "fridge" | "freezer" | "pantry";
  status: "in-stock" | "low" | "expiring";
  expiresAt?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
}

interface FoodDatasetItem {
  food: string;
  "Caloric Value": number;
  Protein: number;
  Carbohydrates: number;
  Fat: number;
  "Dietary Fiber": number;
}

const COMMON_UNITS = ["serving", "g", "oz", "cup", "tbsp", "tsp", "piece", "lb", "kg", "ml", "L"];

const Inventory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [foodDatabase, setFoodDatabase] = useState<FoodDatasetItem[]>([]);
  const [commonItemNames, setCommonItemNames] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState("");
  const [customQuantity, setCustomQuantity] = useState("1");
  const [customUnit, setCustomUnit] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<"fridge" | "freezer" | "pantry">("fridge");
  const [openAutocomplete, setOpenAutocomplete] = useState(false);

  const getPreferredUnit = () => {
    return localStorage.getItem('preferredUnit') || 'serving';
  };

  const setPreferredUnit = (unit: string) => {
    localStorage.setItem('preferredUnit', unit);
  };

  useEffect(() => {
    setCustomUnit(getPreferredUnit());
  }, []);

  useEffect(() => {
    if (user) {
      loadInventory();
    }
    loadFoodDatabase();
    loadCommonItems();
  }, [user]);

  const loadCommonItems = async () => {
    try {
      const { data, error } = await supabase
        .from("common_items")
        .select("food_name")
        .order("display_order");

      if (error) throw error;
      
      setCommonItemNames(data?.map(item => item.food_name.toLowerCase()) || []);
    } catch (error) {
      console.error("Error loading common items:", error);
    }
  };

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

  const filteredSuggestions = customItem.trim().length > 0
    ? foodDatabase
        .filter((item) =>
          item.food.toLowerCase().includes(customItem.toLowerCase())
        )
        .sort((a, b) => {
          // Prioritize common items
          const aIsCommon = commonItemNames.includes(a.food.toLowerCase());
          const bIsCommon = commonItemNames.includes(b.food.toLowerCase());
          if (aIsCommon && !bIsCommon) return -1;
          if (!aIsCommon && bIsCommon) return 1;
          return 0;
        })
        .slice(0, 10)
    : [];

  const loadInventory = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load inventory");
      console.error(error);
    } else if (data) {
      const formattedItems: InventoryItem[] = data.map((item) => ({
        id: item.id,
        name: item.custom_name || item.food_id || "",
        quantity: Number(item.quantity),
        unit: item.unit,
        location: item.location as "fridge" | "freezer" | "pantry",
        status: item.status as "in-stock" | "low" | "expiring",
        expiresAt: item.expires_at || undefined,
        calories: item.calories || undefined,
        protein_g: item.protein_g || undefined,
        carbs_g: item.carbs_g || undefined,
        fat_g: item.fat_g || undefined,
        fiber_g: item.fiber_g || undefined,
      }));
      setItems(formattedItems);
    }
    setLoading(false);
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
      case "expiring":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-success/10 text-success border-success/20";
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || item.location === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !user) return;

    const { error } = await supabase
      .from("user_inventory")
      .update({
        quantity: editingItem.quantity,
        expires_at: editingItem.expiresAt || null,
        status: editingItem.status,
      })
      .eq("id", editingItem.id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update item");
      console.error(error);
    } else {
      toast.success("Item updated successfully!");
      await loadInventory();
      setEditDialogOpen(false);
      setEditingItem(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("user_inventory")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to delete item");
      console.error(error);
    } else {
      toast.success("Item deleted successfully!");
      await loadInventory();
    }
  };

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
          <Button 
            className="bg-gradient-to-r from-primary to-accent"
            onClick={() => navigate('/inventory-setup')}
          >
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
              <Button 
                className="bg-gradient-to-r from-primary to-accent"
                onClick={() => navigate('/inventory-setup')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </Card>
          ) : (
            filteredItems.map((item) => {
              const caloriesPerServing = item.calories ? Math.round(item.calories * item.quantity) : null;
              const proteinPerServing = item.protein_g ? (item.protein_g * item.quantity).toFixed(1) : null;
              const carbsPerServing = item.carbs_g ? (item.carbs_g * item.quantity).toFixed(1) : null;
              const fatPerServing = item.fat_g ? (item.fat_g * item.quantity).toFixed(1) : null;
              const fiberPerServing = item.fiber_g ? (item.fiber_g * item.quantity).toFixed(1) : null;
              
              return (
              <Card
                key={item.id}
                className="p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {getLocationIcon(item.location)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {item.status === "low" && "Low Stock"}
                          {item.status === "expiring" && "Expiring Soon"}
                          {item.status === "in-stock" && "In Stock"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
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
                      {caloriesPerServing && (
                        <div className="mt-2 p-2 bg-primary/5 rounded-md border border-primary/10 max-w-sm">
                          <div className="flex items-center gap-1 mb-1">
                            <Info className="w-3 h-3 text-primary" />
                            <span className="text-xs font-semibold text-primary">Per Serving:</span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div className="font-semibold text-foreground">{caloriesPerServing} calories</div>
                            {proteinPerServing && carbsPerServing && (
                              <div className="flex gap-3">
                                <span>Protein: {proteinPerServing}g</span>
                                <span>Carbs: {carbsPerServing}g</span>
                              </div>
                            )}
                            {fatPerServing && fiberPerServing && (
                              <div className="flex gap-3">
                                <span>Fat: {fatPerServing}g</span>
                                <span>Fiber: {fiberPerServing}g</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit item</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete item</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            )})
          )}
        </div>
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item - {editingItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={editingItem?.quantity || ""}
                onChange={(e) =>
                  setEditingItem(
                    editingItem
                      ? { ...editingItem, quantity: parseFloat(e.target.value) }
                      : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresAt">Expiry Date</Label>
              <Input
                id="expiresAt"
                type="date"
                value={editingItem?.expiresAt || ""}
                onChange={(e) =>
                  setEditingItem(
                    editingItem
                      ? { ...editingItem, expiresAt: e.target.value }
                      : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editingItem?.status}
                onValueChange={(value: InventoryItem["status"]) =>
                  setEditingItem(
                    editingItem ? { ...editingItem, status: value } : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
