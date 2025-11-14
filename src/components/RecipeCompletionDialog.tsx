import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Star, Check, Bookmark, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface RecipeIngredient {
  id: string;
  raw_text: string;
  quantity: number | null;
  unit: string | null;
}

interface RecipeCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  recipeName: string;
  ingredients: RecipeIngredient[];
}

export const RecipeCompletionDialog = ({
  open,
  onOpenChange,
  recipeId,
  recipeName,
  ingredients,
}: RecipeCompletionDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [finishedIngredients, setFinishedIngredients] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventoryStatus, setInventoryStatus] = useState<{
    updated: string[];
    missing: string[];
  }>({ updated: [], missing: [] });

  // Load inventory status when dialog opens
  useEffect(() => {
    if (open && user) {
      loadInventoryStatus();
    }
  }, [open, user]);

  const loadInventoryStatus = async () => {
    if (!user) return;

    try {
      // Get user's inventory
      const { data: inventory } = await supabase
        .from("user_inventory")
        .select("custom_name, quantity")
        .eq("user_id", user.id);

      if (!inventory) return;

      const inventoryMap = new Map(
        inventory.map((item) => [item.custom_name?.toLowerCase(), item.quantity])
      );

      const updated: string[] = [];
      const missing: string[] = [];

      // Check each ingredient
      ingredients.forEach((ing) => {
        const ingredientName = ing.raw_text.toLowerCase();
        const quantity = inventoryMap.get(ingredientName);

        if (quantity && quantity > 0) {
          updated.push(ing.raw_text);
        } else {
          missing.push(ing.raw_text);
        }
      });

      setInventoryStatus({ updated, missing });
    } catch (error) {
      console.error("Error loading inventory status:", error);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Save rating if provided
      if (rating > 0) {
        await supabase
          .from("recipe_ratings")
          .upsert({
            user_id: user.id,
            recipe_id: recipeId,
            rating,
          });
      }

      // Save recipe if bookmarked
      if (saved) {
        await supabase
          .from("saved_recipes")
          .upsert({
            user_id: user.id,
            recipe_id: recipeId,
          });
      }

      // Log the cooking event
      await supabase.from("cooked_recipes_log").insert({
        user_id: user.id,
        recipe_id: recipeId,
      });

      // Update inventory - subtract 1 from each ingredient in stock
      const { data: inventoryItems } = await supabase
        .from("user_inventory")
        .select("*")
        .eq("user_id", user.id);

      if (inventoryItems) {
        const inventoryMap = new Map(
          inventoryItems.map((item) => [item.custom_name?.toLowerCase(), item])
        );

        for (const ing of ingredients) {
          const ingredientName = ing.raw_text.toLowerCase();
          const inventoryItem = inventoryMap.get(ingredientName);

          if (inventoryItem && inventoryItem.quantity > 0) {
            const newQuantity = Math.max(0, inventoryItem.quantity - 1);

            await supabase
              .from("user_inventory")
              .update({ quantity: newQuantity })
              .eq("id", inventoryItem.id);
          }
        }
      }

      // Handle finished ingredients - remove from inventory and add to grocery list
      if (finishedIngredients.length > 0 && inventoryItems) {
        for (const ingredientId of finishedIngredients) {
          const ingredient = ingredients.find((i) => i.id === ingredientId);
          if (!ingredient) continue;

          const ingredientName = ingredient.raw_text.toLowerCase();
          const matchingItem = inventoryItems.find(
            (item) => item.custom_name?.toLowerCase() === ingredientName
          );

          // Remove from inventory
          if (matchingItem) {
            await supabase
              .from("user_inventory")
              .delete()
              .eq("id", matchingItem.id);
          }

          // Add to grocery list
          await supabase.from("grocery_list").insert({
            user_id: user.id,
            item_name: ingredient.raw_text,
            quantity: 1,
            unit: "serving",
            source: "recipe",
            recipe_id: recipeId,
          });
        }
      }

      let message = "Recipe cooked!";
      if (inventoryStatus.missing.length > 0) {
        message += ` Missing ingredients: ${inventoryStatus.missing.slice(0, 3).join(", ")}`;
        if (inventoryStatus.missing.length > 3) {
          message += ` +${inventoryStatus.missing.length - 3} more`;
        }
      }

      toast.success(message);
      onOpenChange(false);
    } catch (error) {
      console.error("Error completing recipe:", error);
      toast.error("Failed to save recipe completion");
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredient = (ingredientId: string) => {
    setFinishedIngredients((prev) =>
      prev.includes(ingredientId)
        ? prev.filter((id) => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How was your cooking experience?</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating */}
          <div>
            <h3 className="font-semibold mb-3">Rate this recipe</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredStar || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Save for later */}
          <div>
            <Button
              variant={saved ? "default" : "outline"}
              onClick={() => setSaved(!saved)}
              className="w-full"
            >
              <Bookmark className={`w-4 h-4 mr-2 ${saved ? "fill-current" : ""}`} />
              {saved ? "Saved for Later" : "Save for Later"}
            </Button>
          </div>

          {/* Finished ingredients */}
          <div>
            <h3 className="font-semibold mb-3">Did any ingredients finish?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Select ingredients that ran out - we'll remove them from inventory and add to your grocery list
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ingredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                >
                  <Checkbox
                    id={ingredient.id}
                    checked={finishedIngredients.includes(ingredient.id)}
                    onCheckedChange={() => toggleIngredient(ingredient.id)}
                  />
                  <label
                    htmlFor={ingredient.id}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {ingredient.raw_text}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={loading}>
            <Check className="w-4 h-4 mr-2" />
            Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
