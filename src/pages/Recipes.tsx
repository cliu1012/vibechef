import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Clock,
  Flame,
  ChefHat,
  Sparkles,
  Filter,
} from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  time: number;
  calories: number;
  protein: number;
  difficulty: "easy" | "medium" | "hard";
  matchScore: number;
  image: string;
  tags: string[];
}

const Recipes = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock recipe data
  const recipes: Recipe[] = [
    {
      id: "1",
      name: "Grilled Chicken & Rice Bowl",
      time: 25,
      calories: 520,
      protein: 42,
      difficulty: "easy",
      matchScore: 95,
      image: "🍗",
      tags: ["High Protein", "Balanced"],
    },
    {
      id: "2",
      name: "Veggie Stir Fry",
      time: 15,
      calories: 320,
      protein: 12,
      difficulty: "easy",
      matchScore: 88,
      image: "🥗",
      tags: ["Vegetarian", "Quick"],
    },
    {
      id: "3",
      name: "Tomato Pasta",
      time: 20,
      calories: 450,
      protein: 15,
      difficulty: "easy",
      matchScore: 82,
      image: "🍝",
      tags: ["Vegetarian", "Comfort Food"],
    },
  ];

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            What Can You Make?
          </h1>
          <p className="text-muted-foreground">
            Recipes matched to your inventory and preferences
          </p>
        </div>

        {/* AI Suggestion Banner */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                AI Recommendation
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Based on your inventory, you can make <strong>12 recipes</strong> right
                now without shopping!
              </p>
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-accent"
              >
                Show Me Recipes
              </Button>
            </div>
          </div>
        </Card>

        {/* Search and Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80 whitespace-nowrap"
          >
            <Clock className="w-3 h-3 mr-1" />
            Under 20 min
          </Badge>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80 whitespace-nowrap"
          >
            <Flame className="w-3 h-3 mr-1" />
            Low Calorie
          </Badge>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80 whitespace-nowrap"
          >
            High Protein
          </Badge>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80 whitespace-nowrap"
          >
            Vegetarian
          </Badge>
        </div>

        {/* Recipe Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
            >
              {/* Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300">
                {recipe.image}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Match Score */}
                <div className="flex items-center justify-between">
                  <Badge className="bg-success text-white">
                    {recipe.matchScore}% Match
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {recipe.difficulty}
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {recipe.name}
                </h3>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {recipe.time}m
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    {recipe.calories} cal
                  </div>
                  <div className="flex items-center gap-1">
                    <ChefHat className="w-4 h-4" />
                    {recipe.protein}g protein
                  </div>
                </div>

                {/* Tags */}
                <div className="flex gap-2 flex-wrap">
                  {recipe.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs border-primary/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* CTA */}
                <Button className="w-full bg-gradient-to-r from-primary to-accent">
                  View Recipe
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredRecipes.length === 0 && (
          <Card className="p-12 text-center">
            <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-foreground mb-2">
              No recipes found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Recipes;
