import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ChefHat,
  ShoppingCart,
  Package,
  AlertCircle,
  TrendingDown,
  Sparkles,
  Refrigerator,
  Snowflake,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [hasInventory, setHasInventory] = useState(false);

  useEffect(() => {
    // Check if user has inventory
    const inventory = localStorage.getItem("inventory");
    setHasInventory(!!inventory);
  }, []);

  // Mock data - will be replaced with real data later
  const lowStockItems = 3;
  const expiringItems = 2;

  // Show inventory setup flow if no inventory
  if (!hasInventory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Welcome! 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              Let's stock your kitchen so I can recommend meals.
            </p>
          </div>

          {/* Inventory Setup Cards */}
          <div className="space-y-4 mb-8">
            <Card className="p-6 border-2 border-primary/50 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Refrigerator className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    Stock Your Kitchen
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Add items from your fridge, freezer, and pantry. This helps us
                    recommend recipes based on what you already have.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="border-primary text-primary">
                      <Refrigerator className="w-3 h-3 mr-1" />
                      Fridge
                    </Badge>
                    <Badge variant="outline" className="border-primary text-primary">
                      <Snowflake className="w-3 h-3 mr-1" />
                      Freezer
                    </Badge>
                    <Badge variant="outline" className="border-primary text-primary">
                      <Package className="w-3 h-3 mr-1" />
                      Pantry
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent"
              onClick={() => navigate("/inventory-setup")}
            >
              Start Setup
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                localStorage.setItem("inventory", JSON.stringify({}));
                setHasInventory(true);
              }}
            >
              Skip for Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">
            What would you like to cook today?
          </p>
        </div>

        {/* Alert Cards */}
        {(lowStockItems > 0 || expiringItems > 0) && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {lowStockItems > 0 && (
              <Card className="p-4 border-warning/50 bg-warning/5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      Low Stock Alert
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      You have {lowStockItems} items running low
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/inventory")}>
                    View
                  </Button>
                </div>
              </Card>
            )}

            {expiringItems > 0 && (
              <Card className="p-4 border-destructive/50 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      Expiring Soon
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {expiringItems} items need to be used soon
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/inventory")}>
                    View
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* What Can I Make */}
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary group"
            onClick={() => navigate("/recipes")}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  What Can I Make?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Discover recipes based on ingredients you already have
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                AI Powered
              </Badge>
            </div>
          </Card>

          {/* My Grocery List */}
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-secondary group"
            onClick={() => navigate("/grocery-list")}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                  My Grocery List
                </h2>
                <p className="text-sm text-muted-foreground">
                  Smart shopping lists based on your meal plans
                </p>
              </div>
              <Badge variant="outline" className="border-secondary text-secondary">
                0 items
              </Badge>
            </div>
          </Card>

          {/* My Inventory */}
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-accent group"
            onClick={() => navigate("/inventory")}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Package className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                  My Inventory
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your fridge, freezer, and pantry items
                </p>
              </div>
              <Badge variant="outline" className="border-accent text-accent">
                Manage Items
              </Badge>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 text-foreground">
            Your Impact This Month
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">$42</div>
              <div className="text-sm text-muted-foreground">Saved on Food Waste</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-1">18</div>
              <div className="text-sm text-muted-foreground">Meals Cooked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-1">5.2kg</div>
              <div className="text-sm text-muted-foreground">CO₂ Saved</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;
