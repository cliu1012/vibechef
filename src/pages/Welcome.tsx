import { Button } from "@/components/ui/button";
import { ArrowRight, ChefHat, ShoppingCart, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const Welcome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect authenticated users to home
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
              <ChefHat className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Brand Name */}
          <div className="mb-4">
            <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              VibeChef
            </h2>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
              Cook Smarter. Waste Less. Eat Better.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Get AI-powered meal ideas from your actual fridge—tailored to your taste, time, and nutrition goals.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-primary via-primary to-accent hover:opacity-90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              onClick={() => navigate("/auth")}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Reduce Food Waste</h3>
              <p className="text-sm text-muted-foreground">
                Use ingredients before they expire with smart recipe suggestions
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-border">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <ShoppingCart className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Smart Grocery Lists</h3>
              <p className="text-sm text-muted-foreground">
                Automatically generate lists based on your meal plans and inventory
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <ChefHat className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Personalized Meals</h3>
              <p className="text-sm text-muted-foreground">
                Get recipes that match your dietary needs, time, and taste preferences
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Join thousands of users saving money and eating better
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
