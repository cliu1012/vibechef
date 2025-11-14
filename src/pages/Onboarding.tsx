import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
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

  const toggleDietary = (option: string) => {
    setPreferences((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(option)
        ? prev.dietary.filter((d) => d !== option)
        : [...prev.dietary, option],
    }));
  };

  const toggleAllergy = (option: string) => {
    setPreferences((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(option)
        ? prev.allergies.filter((a) => a !== option)
        : [...prev.allergies, option],
    }));
  };

  const handleComplete = () => {
    // Store preferences in localStorage for now
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl p-8 shadow-xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of 3
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round((step / 3) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Dietary Preferences */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Set Your Dietary Preferences
              </h2>
              <p className="text-muted-foreground">
                Select any dietary restrictions or preferences (optional)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {dietaryOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleDietary(option)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    preferences.dietary.includes(option)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{option}</span>
                    {preferences.dietary.includes(option) && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="flex-1 bg-gradient-to-r from-primary to-accent"
              >
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Calorie & Macro Goals */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Set Your Nutrition Goals
              </h2>
              <p className="text-muted-foreground">
                Help us suggest meals that fit your nutrition targets (optional)
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="calories" className="text-foreground">
                  Daily Calorie Target
                </Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="e.g., 2000"
                  value={preferences.calorieGoal}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      calorieGoal: e.target.value,
                    }))
                  }
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {["1500", "2000", "2500"].map((cal) => (
                  <Button
                    key={cal}
                    variant="outline"
                    onClick={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        calorieGoal: cal,
                      }))
                    }
                    className={
                      preferences.calorieGoal === cal
                        ? "border-primary bg-primary/5"
                        : ""
                    }
                  >
                    {cal} cal
                  </Button>
                ))}
              </div>

              <div className="pt-4">
                <Label className="text-foreground mb-3 block">
                  Macro Goals (Optional)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="protein" className="text-sm text-muted-foreground">
                      Protein (g)
                    </Label>
                    <Input
                      id="protein"
                      type="number"
                      placeholder="e.g., 150"
                      value={preferences.proteinGoal}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          proteinGoal: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs" className="text-sm text-muted-foreground">
                      Carbs (g)
                    </Label>
                    <Input
                      id="carbs"
                      type="number"
                      placeholder="e.g., 200"
                      value={preferences.carbsGoal}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          carbsGoal: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fat" className="text-sm text-muted-foreground">
                      Fat (g)
                    </Label>
                    <Input
                      id="fat"
                      type="number"
                      placeholder="e.g., 65"
                      value={preferences.fatGoal}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          fatGoal: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fiber" className="text-sm text-muted-foreground">
                      Fiber (g)
                    </Label>
                    <Input
                      id="fiber"
                      type="number"
                      placeholder="e.g., 30"
                      value={preferences.fiberGoal}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          fiberGoal: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 bg-gradient-to-r from-primary to-accent"
              >
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Allergies */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Any Food Allergies?
              </h2>
              <p className="text-muted-foreground">
                We'll make sure to exclude these from your meal suggestions (optional)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {allergyOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleAllergy(option)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    preferences.allergies.includes(option)
                      ? "border-destructive bg-destructive/5"
                      : "border-border hover:border-destructive/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{option}</span>
                    {preferences.allergies.includes(option) && (
                      <Check className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>You're all set!</strong> After this step, we'll show you
                personalized meal suggestions based on your preferences.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={handleComplete}
                className="flex-1 bg-gradient-to-r from-primary to-accent shadow-lg hover:shadow-xl"
                size="lg"
              >
                Complete Setup
                <Check className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Onboarding;
