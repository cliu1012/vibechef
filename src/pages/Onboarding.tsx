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
    timePreference: "",
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

  const timeOptions = ["10 min", "20 min", "30 min", "45+ min"];

  const toggleDietary = (option: string) => {
    setPreferences((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(option)
        ? prev.dietary.filter((d) => d !== option)
        : [...prev.dietary, option],
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

        {/* Step 2: Calorie Goals */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Set Your Daily Calorie Goal
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

        {/* Step 3: Time Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                How Much Time Do You Have?
              </h2>
              <p className="text-muted-foreground">
                We'll prioritize recipes that fit your schedule
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {timeOptions.map((time) => (
                <button
                  key={time}
                  onClick={() =>
                    setPreferences((prev) => ({ ...prev, timePreference: time }))
                  }
                  className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                    preferences.timePreference === time
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg font-semibold text-foreground">
                    {time}
                  </span>
                </button>
              ))}
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>You're almost ready!</strong> After this step, we'll show you
                personalized meal suggestions.
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
