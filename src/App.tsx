import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useOnboardingFlow } from "./hooks/useOnboardingFlow";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Inventory from "./pages/Inventory";
import InventorySetup from "./pages/InventorySetup";
import Recipes from "./pages/Recipes";
import GroceryList from "./pages/GroceryList";
import ImportRecipe from "./pages/ImportRecipe";
import ImportCSVRecipes from "./pages/ImportCSVRecipes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const ProtectedRouteWithOnboarding = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { checking } = useOnboardingFlow();

  if (authLoading || checking) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRouteWithOnboarding>
                <Home />
              </ProtectedRouteWithOnboarding>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRouteWithOnboarding>
                <Inventory />
              </ProtectedRouteWithOnboarding>
            }
          />
          <Route
            path="/inventory-setup"
            element={
              <ProtectedRoute>
                <InventorySetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRouteWithOnboarding>
                <Recipes />
              </ProtectedRouteWithOnboarding>
            }
          />
          <Route
            path="/grocery-list"
            element={
              <ProtectedRouteWithOnboarding>
                <GroceryList />
              </ProtectedRouteWithOnboarding>
            }
          />
          <Route
            path="/import-recipe"
            element={
              <ProtectedRouteWithOnboarding>
                <ImportRecipe />
              </ProtectedRouteWithOnboarding>
            }
          />
          <Route
            path="/import-csv-recipes"
            element={
              <ProtectedRouteWithOnboarding>
                <ImportCSVRecipes />
              </ProtectedRouteWithOnboarding>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
