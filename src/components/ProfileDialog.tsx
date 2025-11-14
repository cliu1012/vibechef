import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, LogOut, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ProfileDialog = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customAllergy, setCustomAllergy] = useState("");
  const [profile, setProfile] = useState({
    dietary: [] as string[],
    calorieGoal: "",
    proteinGoal: "",
    fiberGoal: "",
    fatGoal: "",
    carbsGoal: "",
    allergies: [] as string[],
  });

  const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Keto",
    "Paleo",
    "Halal",
    "Kosher",
  ];

  const allergyOptions = [
    "Milk",
    "Eggs",
    "Fish",
    "Shellfish",
    "Tree Nuts",
    "Peanuts",
    "Wheat",
    "Soy",
  ];

  useEffect(() => {
    if (open && user) {
      loadProfile();
    }
  }, [open, user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile({
          dietary: data.dietary_restrictions || [],
          calorieGoal: data.daily_calorie_goal?.toString() || "",
          proteinGoal: data.protein_goal_g?.toString() || "",
          fiberGoal: data.fiber_goal_g?.toString() || "",
          fatGoal: data.fat_goal_g?.toString() || "",
          carbsGoal: data.carbs_goal_g?.toString() || "",
          allergies: data.allergies || [],
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    }
  };

  const toggleDietary = (option: string) => {
    setProfile((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(option)
        ? prev.dietary.filter((d) => d !== option)
        : [...prev.dietary, option],
    }));
  };

  const toggleAllergy = (option: string) => {
    setProfile((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(option)
        ? prev.allergies.filter((a) => a !== option)
        : [...prev.allergies, option],
    }));
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !profile.allergies.includes(customAllergy.trim())) {
      setProfile((prev) => ({
        ...prev,
        allergies: [...prev.allergies, customAllergy.trim()],
      }));
      setCustomAllergy("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setProfile((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((a) => a !== allergy),
    }));
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        dietary_restrictions: profile.dietary,
        daily_calorie_goal: profile.calorieGoal
          ? parseInt(profile.calorieGoal)
          : null,
        protein_goal_g: profile.proteinGoal
          ? parseInt(profile.proteinGoal)
          : null,
        fiber_goal_g: profile.fiberGoal ? parseInt(profile.fiberGoal) : null,
        fat_goal_g: profile.fatGoal ? parseInt(profile.fatGoal) : null,
        carbs_goal_g: profile.carbsGoal ? parseInt(profile.carbsGoal) : null,
        allergies: profile.allergies,
      });

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setOpen(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <User className="w-4 h-4 mr-2" />
          My Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="signout">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Dietary Preferences */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Dietary Preferences
              </Label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((option) => (
                  <Badge
                    key={option}
                    variant={
                      profile.dietary.includes(option) ? "default" : "outline"
                    }
                    className="cursor-pointer px-4 py-2"
                    onClick={() => toggleDietary(option)}
                  >
                    {profile.dietary.includes(option) && (
                      <span className="mr-1">✓</span>
                    )}
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Nutrition Goals */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Nutrition Goals</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calories">Daily Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="2000"
                    value={profile.calorieGoal}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        calorieGoal: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    placeholder="50"
                    value={profile.proteinGoal}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        proteinGoal: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    placeholder="250"
                    value={profile.carbsGoal}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        carbsGoal: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    placeholder="70"
                    value={profile.fatGoal}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        fatGoal: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="fiber">Fiber (g)</Label>
                  <Input
                    id="fiber"
                    type="number"
                    placeholder="25"
                    value={profile.fiberGoal}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        fiberGoal: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Allergies</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {allergyOptions.map((option) => (
                  <Badge
                    key={option}
                    variant={
                      profile.allergies.includes(option) ? "default" : "outline"
                    }
                    className="cursor-pointer px-4 py-2"
                    onClick={() => toggleAllergy(option)}
                  >
                    {profile.allergies.includes(option) && (
                      <span className="mr-1">✓</span>
                    )}
                    {option}
                  </Badge>
                ))}
              </div>

              {/* Custom allergies */}
              {profile.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.allergies
                    .filter((a) => !allergyOptions.includes(a))
                    .map((allergy) => (
                      <Badge key={allergy} variant="secondary" className="px-3 py-1.5">
                        {allergy}
                        <X
                          className="w-3 h-3 ml-2 cursor-pointer"
                          onClick={() => removeAllergy(allergy)}
                        />
                      </Badge>
                    ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom allergy"
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomAllergy();
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addCustomAllergy}
                  disabled={!customAllergy.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Favorite Meals - Placeholder */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Favorite Meals</Label>
              <p className="text-sm text-muted-foreground">
                Coming soon - Track meals you've rated highly
              </p>
            </div>

            {/* Favorite Cuisines - Placeholder */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Favorite Cuisines</Label>
              <p className="text-sm text-muted-foreground">
                Coming soon - Your preferred cuisines
              </p>
            </div>

            <Button onClick={saveProfile} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Subscription Plan</h3>
              <p className="text-muted-foreground mb-4">
                Manage your subscription and billing
              </p>
              <p className="text-sm text-muted-foreground">
                Coming soon - Subscription management features
              </p>
            </div>
          </TabsContent>

          {/* Sign Out Tab */}
          <TabsContent value="signout" className="space-y-6">
            <div className="text-center py-8">
              <LogOut className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Sign Out</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to sign out?
              </p>
              <Button
                variant="destructive"
                onClick={() => {
                  signOut();
                  setOpen(false);
                }}
                className="w-full max-w-xs"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
