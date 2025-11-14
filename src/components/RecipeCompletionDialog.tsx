import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star, Check, Bookmark } from "lucide-react";
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

      // Handle finished ingredients
      if (finishedIngredients.length > 0) {
        // Get inventory items matching these ingredients
        const { data: inventoryItems } = await supabase
          .from("user_inventory")
          .select("*")
          .eq("user_id", user.id);

        if (inventoryItems) {
          const itemsToRemove: string[] = [];
          const itemsToAddToGrocery: Array<{ name: string; quantity: number; unit: string }> = [];

          finishedIngredients.forEach((ingredientId) => {
            const ingredient = ingredients.find((i) => i.id === ingredientId);
            if (!ingredient) return;

            const ingredientText = ingredient.raw_text.toLowerCase();
            const matchingItem = inventoryItems.find((item) => {
              const itemName = (item.custom_name || "").toLowerCase();
              return itemName && ingredientText.includes(itemName);
            });

            if (matchingItem) {
              itemsToRemove.push(matchingItem.id);
              itemsToAddToGrocery.push({
                name: matchingItem.custom_name || ingredient.raw_text,
                quantity: matchingItem.quantity,
                unit: matchingItem.unit,
              });
            } else {
              itemsToAddToGrocery.push({
                name: ingredient.raw_text,
                quantity: ingredient.quantity || 1,
                unit: ingredient.unit || "serving",
              });
            }
          });

          // Remove from inventory
          if (itemsToRemove.length > 0) {
            await supabase
              .from("user_inventory")
              .delete()
              .in("id", itemsToRemove);
          }

          // Add to grocery list
          const groceryItems = itemsToAddToGrocery.map((item) => ({
            user_id: user.id,
            item_name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            source: "recipe",
            recipe_id: recipeId,
          }));

          await supabase.from("grocery_list").insert(groceryItems);
        }
      }

      toast.success("Recipe completed!");
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
